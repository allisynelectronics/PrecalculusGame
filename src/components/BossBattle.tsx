import { useMemo, useState } from 'react';
import { getBossForWorld } from '../data/bosses';
import { getRandomProblem } from '../data/problems';
import { WORLDS } from '../data/worlds';
import { gradeAnswer } from '../lib/grade';
import { useGameStore } from '../store/gameStore';
import type { Problem } from '../types';
import { AnswerInput } from './AnswerInput';
import { MathText } from './Math';

export function BossBattle() {
  const { currentWorldId, recordAttempt, grantReward, defeatBoss, setScreen } = useGameStore();

  const boss = getBossForWorld(currentWorldId)!;
  const totalQuestions = useMemo(
    () => boss.phases.reduce((sum, p) => sum + p.questionsRequired, 0),
    [boss],
  );
  const nextWorld = useMemo(() => {
    const idx = WORLDS.findIndex((w) => w.id === currentWorldId);
    // Skip over any still-"Under Development" worlds so progression doesn't stall
    // on a world that has no content yet (e.g. World 5 before World 6 is built).
    return WORLDS.slice(idx + 1).find((w) => !w.locked);
  }, [currentWorldId]);

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [bossHealth, setBossHealth] = useState(totalQuestions);
  const [heroHearts, setHeroHearts] = useState(3);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const [victory, setVictory] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [usedIds, setUsedIds] = useState<string[]>([]);

  const phase = boss.phases[phaseIndex];

  function rollProblem(pIdx: number, exclude: string[]): Problem {
    const ph = boss.phases[pIdx];
    const topic = ph.topicIds[Math.floor(Math.random() * ph.topicIds.length)];
    const diff = pIdx === boss.phases.length - 1 ? 'advanced' : 'intermediate';
    return (
      getRandomProblem(topic, exclude, diff, { excludeIdentityProof: true }) ??
      getRandomProblem(topic, [], undefined, { excludeIdentityProof: true })!
    );
  }

  const [problem, setProblem] = useState<Problem>(() => rollProblem(0, []));

  const nextQuestion = (pIdx: number, exclude: string[]) => {
    setProblem(rollProblem(pIdx, exclude));
    setStatus('idle');
    setHintShown(false);
  };

  const handleSubmit = (value: string) => {
    const correct = gradeAnswer(problem, value);
    recordAttempt({ problemId: problem.id, topicId: problem.topicId, correct, usedHint: hintShown, timestamp: Date.now() });

    if (correct) {
      setStatus('correct');
      const newHealth = bossHealth - 1;
      setBossHealth(newHealth);
      const newProgress = phaseProgress + 1;

      setTimeout(() => {
        const exclude = [...usedIds, problem.id];
        setUsedIds(exclude);

        if (newHealth <= 0) {
          setVictory(true);
          defeatBoss(boss.id, nextWorld ? nextWorld.id : boss.worldId);
          grantReward(150, 150, 10);
          return;
        }
        if (newProgress >= phase.questionsRequired) {
          const nextPhase = phaseIndex + 1;
          setPhaseIndex(nextPhase);
          setPhaseProgress(0);
          nextQuestion(nextPhase, exclude);
        } else {
          setPhaseProgress(newProgress);
          nextQuestion(phaseIndex, exclude);
        }
      }, 1100);
    } else {
      setStatus('wrong');
      setHeroHearts((h) => Math.max(0, h - 1));
    }
  };

  const retrySamePhase = () => {
    setHeroHearts(3);
    setStatus('idle');
    nextQuestion(phaseIndex, usedIds);
  };

  const healthPct = Math.round((bossHealth / totalQuestions) * 100);

  if (victory) {
    const isFinalBoss = boss.id === 'guardian-of-calculus';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1033] to-[#0b0a14] px-6 text-center">
        <div className="text-6xl mb-4 animate-pop">{isFinalBoss ? '🌌' : '🏆'}</div>
        <h1 className="font-display text-3xl text-amber-200 mb-2">
          {isFinalBoss ? 'The Gateway Opens — Calculus Ready!' : `${boss.name} Falls!`}
        </h1>
        <p className="text-purple-300 mb-6 max-w-md">
          {isFinalBoss ? (
            <>
              You've demonstrated mastery across algebra, trigonometry, exponentials and logs, and the
              foundations of limits and derivatives. This is what being <em>Calculus Ready</em> actually
              means — not finishing every board, but proving it under pressure. +150 XP, +150 🪙, +10 ⭐
            </>
          ) : (
            <>
              You've proven mastery over this world's core skills. +150 XP, +150 🪙, +10 ⭐
              {nextWorld && !nextWorld.locked && ` ${nextWorld.name} is now unlocked!`}
            </>
          )}
        </p>
        <button
          onClick={() => setScreen('worldmap')}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Return to the Mathverse Map
        </button>
      </div>
    );
  }

  if (heroHearts <= 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1033] to-[#0b0a14] px-6 text-center">
        <div className="text-6xl mb-4">💥</div>
        <h1 className="font-display text-2xl text-rose-300 mb-2">{boss.name} Overpowers You!</h1>
        <p className="text-purple-300 mb-6">No progress lost — catch your breath and try this phase again.</p>
        <button
          onClick={retrySamePhase}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 flex flex-col items-center bg-gradient-to-b from-[#2a1a40] to-[#0b0a14]">
      <div className="w-full max-w-xl">
        <div className="text-center mb-2">
          <div className="text-6xl">{boss.icon}</div>
          <h1 className="font-display text-2xl text-rose-200">{boss.name}</h1>
          <p className="text-xs text-purple-400 italic">{phase.name}</p>
        </div>

        <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-rose-500/40 mb-1">
          <div
            className="h-3 bg-gradient-to-r from-rose-500 to-red-700 transition-all"
            style={{ width: `${healthPct}%` }}
          />
        </div>
        <p className="text-center text-xs text-rose-300 mb-4">Boss Health: {bossHealth}/{totalQuestions}</p>

        <div className="flex justify-center gap-1 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < heroHearts ? 'text-rose-400' : 'text-rose-900'}>♥</span>
          ))}
        </div>

        <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-6">
          <div className="text-lg text-purple-100 mb-4">
            <MathText text={problem.prompt} />
          </div>

          {status !== 'correct' && (
            <>
              <AnswerInput key={problem.id} problem={problem} onSubmit={handleSubmit} />
              {status === 'wrong' && (
                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-400/30 text-sm text-rose-200 animate-shake">
                  The boss strikes back! <MathText text={problem.hints[0]} />
                </div>
              )}
              <button
                onClick={() => setHintShown(true)}
                className="mt-3 text-xs px-3 py-1.5 rounded-full border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/20"
              >
                💡 Hint
              </button>
              {hintShown && (
                <div className="mt-2 text-xs text-cyan-200">
                  <MathText text={problem.hints[problem.hints.length - 1]} />
                </div>
              )}
            </>
          )}

          {status === 'correct' && (
            <div className="text-center py-2 animate-pop">
              <div className="text-3xl mb-1">💥</div>
              <p className="text-emerald-300 font-semibold">A direct hit!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
