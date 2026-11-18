import { useMemo, useRef, useState } from 'react';
import { getEquationRepairs, getProblemsByTopic, getRandomProblem } from '../data/problems';
import { getTopic } from '../data/topics';
import { gradeAnswer } from '../lib/grade';
import { useGameStore } from '../store/gameStore';
import type { Difficulty, Problem, SpaceType } from '../types';
import { AnswerInput } from './AnswerInput';
import { IdentityProofBuilder } from './IdentityProofBuilder';
import { MathText } from './Math';

const REWARD: Record<SpaceType, { xp: number; coins: number; stars: number }> = {
  start: { xp: 0, coins: 0, stars: 0 },
  challenge: { xp: 10, coins: 5, stars: 0 },
  treasure: { xp: 15, coins: 20, stars: 2 },
  shrine: { xp: 5, coins: 0, stars: 1 },
  portal: { xp: 25, coins: 10, stars: 1 },
  mystery: { xp: 10, coins: 10, stars: 0 },
  training: { xp: 8, coins: 5, stars: 0 },
  knowledge: { xp: 20, coins: 10, stars: 3 },
  boss: { xp: 0, coins: 0, stars: 0 },
};

function pickProblem(
  topicId: string,
  spaceType: SpaceType,
  masteryLevel: number,
  explicitDifficulty?: Difficulty | null,
): Problem {
  if (spaceType === 'training') {
    const repairs = getEquationRepairs().filter((p) => p.topicId === topicId);
    if (repairs.length > 0) return repairs[Math.floor(Math.random() * repairs.length)];
  }
  // An explicit difficulty (e.g. chosen in Free Practice) overrides both the
  // mastery-based auto-pick and the portal/knowledge "always advanced" rule.
  let difficulty: Difficulty =
    explicitDifficulty ?? (masteryLevel <= 2 ? 'beginner' : masteryLevel === 3 ? 'intermediate' : 'advanced');
  if (!explicitDifficulty && (spaceType === 'portal' || spaceType === 'knowledge')) difficulty = 'advanced';
  return getRandomProblem(topicId, [], difficulty) ?? getProblemsByTopic(topicId)[0];
}

export function ProblemView() {
  const {
    pendingTopicId,
    pendingSpaceType,
    pendingDifficulty,
    returnScreen,
    mastery,
    seenTopics,
    markTopicSeen,
    recordAttempt,
    grantReward,
    movePlayer,
    clearProblem,
    setScreen,
  } = useGameStore();

  const topicId = pendingTopicId!;
  const spaceType = pendingSpaceType ?? 'challenge';
  const topic = getTopic(topicId)!;
  const isFirstEncounter = !seenTopics.includes(topicId);

  const [stage, setStage] = useState<'discover' | 'solve'>(isFirstEncounter ? 'discover' : 'solve');
  const [problem] = useState<Problem>(() =>
    pickProblem(topicId, spaceType, mastery[topicId]?.level ?? 1, pendingDifficulty),
  );
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const [attemptCount, setAttemptCount] = useState(0);
  const [usedHelp, setUsedHelp] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [showExplain, setShowExplain] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const [showFullSolution, setShowFullSolution] = useState(false);

  // Guards against a rapid double-submit granting the reward twice for one correct
  // answer — 'correct' only hides the input once React re-renders, which isn't
  // synchronous with the click, so a ref closes the gap in between.
  const submittedRef = useRef(false);

  const similarExample = useMemo(() => {
    const pool = getProblemsByTopic(topicId).filter((p) => p.id !== problem.id && p.worked);
    if (pool.length === 0) return undefined;
    // Deterministic pick (not Math.random) so this stays pure during render — the same
    // problem always offers the same "similar example" rather than a new one each render.
    const hash = [...problem.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
    return pool[hash % pool.length];
  }, [topicId, problem.id]);

  const example = getProblemsByTopic(topicId).find((p) => p.worked) ?? getProblemsByTopic(topicId)[0];

  const finishAndReturn = () => {
    clearProblem();
    setScreen(returnScreen);
  };

  const handleIdentitySolved = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    recordAttempt({
      problemId: problem.id,
      topicId: problem.topicId,
      correct: true,
      usedHint: usedHelp,
      timestamp: Date.now(),
    });
    setStatus('correct');
    const r = REWARD[spaceType];
    grantReward(r.xp, r.coins, r.stars);
    if (spaceType === 'portal') movePlayer(3);
  };

  const handleSubmit = (value: string) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const correct = gradeAnswer(problem, value);
    const nextAttemptCount = attemptCount + 1;
    setAttemptCount(nextAttemptCount);

    recordAttempt({
      problemId: problem.id,
      topicId: problem.topicId,
      correct,
      usedHint: usedHelp,
      timestamp: Date.now(),
    });

    if (correct) {
      setStatus('correct');
      const r = REWARD[spaceType];
      grantReward(r.xp, r.coins, r.stars);
      if (spaceType === 'portal') movePlayer(3);
    } else {
      submittedRef.current = false; // let the player retry right away
      setStatus('wrong');
      if (nextAttemptCount >= 3) setShowFullSolution(true);
    }
  };

  if (stage === 'discover') {
    return (
      <div className="min-h-screen pt-20 pb-10 px-6 flex items-center justify-center bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
        <div className="max-w-lg w-full bg-black/40 border border-amber-400/40 rounded-2xl p-6">
          <div className="text-4xl text-center mb-2">💡</div>
          <h2 className="font-display text-xl text-amber-200 mb-1 text-center">Discover: {topic.name}</h2>
          <p className="text-purple-300 text-sm text-center mb-4">{topic.description}</p>

          {example && (
            <div className="bg-black/40 rounded-xl p-4 mb-4">
              <p className="text-xs text-purple-400 uppercase mb-2">Watch: Worked Example</p>
              <p className="text-purple-100 mb-2"><MathText text={example.prompt} /></p>
              <div className="space-y-1 text-sm text-amber-100">
                {(example.worked ?? example.steps ?? []).map((line, i) => (
                  <div key={i}><MathText text={line} /></div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              markTopicSeen(topicId);
              setStage('solve');
            }}
            className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
          >
            I'm ready to try one myself
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 flex items-center justify-center bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-xl w-full bg-black/40 border border-purple-400/30 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wide text-purple-400">{topic.name}</span>
          <span className="text-xs text-purple-400 capitalize">{problem.difficulty}</span>
        </div>

        <div className="text-lg text-purple-100 mb-4">
          <MathText text={problem.prompt} />
        </div>

        {status !== 'correct' && problem.answerType === 'identityProof' && (
          <IdentityProofBuilder
            key={problem.id}
            problem={problem}
            onSolved={handleIdentitySolved}
            onHintUsed={() => setUsedHelp(true)}
          />
        )}

        {status !== 'correct' && problem.answerType !== 'identityProof' && (
          <>
            <AnswerInput key={problem.id} problem={problem} onSubmit={handleSubmit} disabled={showFullSolution} />

            {status === 'wrong' && !showFullSolution && (
              <div role="status" aria-live="polite" className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-400/30 text-sm text-rose-200 animate-shake">
                Not quite. <MathText text={problem.hints[Math.min(hintsShown, problem.hints.length - 1)] ?? 'Try breaking the problem into smaller steps.'} />
              </div>
            )}

            {showFullSolution && (
              <div className="mt-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-400/30 text-sm text-indigo-100">
                <p className="font-semibold mb-1">Guided Solution</p>
                <div className="space-y-1">
                  {(problem.worked ?? problem.steps ?? [problem.explanation]).map((line, i) => (
                    <div key={i}><MathText text={line} /></div>
                  ))}
                </div>
                <button
                  onClick={finishAndReturn}
                  className="mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Learning helper buttons */}
            <div className="flex flex-wrap gap-2 mt-4 text-xs">
              <button
                onClick={() => {
                  setUsedHelp(true);
                  setHintsShown((h) => Math.min(h + 1, problem.hints.length - 1));
                }}
                className="px-3 py-1.5 rounded-full border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/20"
              >
                💡 Hint
              </button>
              <button
                onClick={() => {
                  setUsedHelp(true);
                  setShowExplain((v) => !v);
                }}
                className="px-3 py-1.5 rounded-full border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/20"
              >
                📐 Explain the Rule
              </button>
              <button
                onClick={() => {
                  setUsedHelp(true);
                  setShowBreakdown((v) => !v);
                }}
                className="px-3 py-1.5 rounded-full border border-amber-400/40 text-amber-200 hover:bg-amber-500/20"
              >
                🧩 Break It Down
              </button>
              {similarExample && (
                <button
                  onClick={() => {
                    setUsedHelp(true);
                    setShowSimilar((v) => !v);
                  }}
                  className="px-3 py-1.5 rounded-full border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/20"
                >
                  👀 Show a Similar Example
                </button>
              )}
              <button
                onClick={() => {
                  setUsedHelp(true);
                  setStage('discover');
                }}
                className="px-3 py-1.5 rounded-full border border-rose-400/40 text-rose-200 hover:bg-rose-500/20"
              >
                🆘 I'm Lost
              </button>
            </div>

            {showExplain && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-sm text-emerald-100">
                <MathText text={problem.explanation} />
              </div>
            )}
            {showBreakdown && problem.steps && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-400/30 text-sm text-amber-100 space-y-1">
                {problem.steps.map((s, i) => (
                  <div key={i}>{i + 1}. <MathText text={s} /></div>
                ))}
              </div>
            )}
            {showSimilar && similarExample && (
              <div className="mt-3 p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-400/30 text-sm text-fuchsia-100 space-y-1">
                <p className="mb-1"><MathText text={similarExample.prompt} /></p>
                {(similarExample.worked ?? []).map((line, i) => (
                  <div key={i}><MathText text={line} /></div>
                ))}
              </div>
            )}
          </>
        )}

        {status === 'correct' && (
          <div role="status" aria-live="polite" className="text-center py-4 animate-pop">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-emerald-300 font-semibold mb-1">Correct!</p>
            <p className="text-sm text-purple-300 mb-4">
              +{REWARD[spaceType].xp} XP · +{REWARD[spaceType].coins} 🪙
              {REWARD[spaceType].stars > 0 && ` · +${REWARD[spaceType].stars} ⭐`}
              {spaceType === 'portal' && ' · Shortcut! +3 spaces'}
            </p>
            <button
              onClick={finishAndReturn}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
