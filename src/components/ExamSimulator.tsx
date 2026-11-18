import { useCallback, useEffect, useRef, useState } from 'react';
import { getProblemsByTopic, getRandomProblem } from '../data/problems';
import { getTopic, TOPICS } from '../data/topics';
import { gradeAnswer } from '../lib/grade';
import { useGameStore } from '../store/gameStore';
import type { Difficulty, Problem } from '../types';
import { AnswerInput } from './AnswerInput';
import { MathText } from './Math';

type Length = 10 | 20 | 30;
const LENGTH_OPTIONS: Array<{ value: Length; label: string; blurb: string }> = [
  { value: 10, label: 'Quick', blurb: '10 questions · 15 min' },
  { value: 20, label: 'Standard', blurb: '20 questions · 30 min' },
  { value: 30, label: 'Full', blurb: '30 questions · 45 min' },
];
const SECONDS_PER_QUESTION = 90;

type Outcome = 'correct' | 'incorrect' | 'skipped';
interface QuestionResult {
  topicId: string;
  outcome: Outcome;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Builds the sequence of topics the exam will draw from: unlocked worlds only (it
 *  should cover what the player has actually studied so far, not content they haven't
 *  reached yet), repeatedly shuffled so topics are spread out rather than clustered. */
function buildTopicPlan(unlockedWorldIds: string[], count: number): string[] {
  const viable = TOPICS.filter(
    (t) => unlockedWorldIds.includes(t.worldId) && getProblemsByTopic(t.id).some((p) => p.answerType !== 'identityProof'),
  ).map((t) => t.id);
  const pool = viable.length > 0 ? viable : TOPICS.map((t) => t.id);
  const plan: string[] = [];
  while (plan.length < count) plan.push(...shuffle(pool));
  return plan.slice(0, count);
}

function difficultyFor(mastery: ReturnType<typeof useGameStore.getState>['mastery'], topicId: string): Difficulty {
  const level = mastery[topicId]?.level;
  if (level === undefined) return 'intermediate';
  return level <= 2 ? 'beginner' : level === 3 ? 'intermediate' : 'advanced';
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ExamSimulator() {
  const { mastery, unlockedWorldIds, recordAttempt, grantReward, recordExamResult, lastExamResult, setScreen } =
    useGameStore();

  const [stage, setStage] = useState<'setup' | 'running' | 'results'>('setup');
  const [length, setLength] = useState<Length>(10);
  const [topicPlan, setTopicPlan] = useState<string[]>([]);
  const [usedProblemIds, setUsedProblemIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect' | 'skipped'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [reward, setReward] = useState({ xp: 0, coins: 0, stars: 0 });

  const submittedRef = useRef(false);
  const finishedRef = useRef(false);

  // Countdown timer — only ticks while a question is actively being shown (not during
  // the brief transient feedback between questions, and not once the exam is over).
  useEffect(() => {
    if (stage !== 'running') return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [stage]);

  const finishExam = useCallback(
    (finalResults: QuestionResult[]) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const correctCount = finalResults.filter((r) => r.outcome === 'correct').length;
      const pct = topicPlan.length === 0 ? 0 : Math.round((correctCount / topicPlan.length) * 100);
      const r = {
        xp: correctCount * 8,
        coins: correctCount * 4,
        stars: pct >= 90 ? 5 : pct >= 75 ? 3 : pct >= 50 ? 1 : 0,
      };
      setReward(r);
      grantReward(r.xp, r.coins, r.stars);
      recordExamResult(correctCount, topicPlan.length);
      setResults(finalResults);
      setStage('results');
    },
    [topicPlan.length, grantReward, recordExamResult],
  );

  // Time running out ends the exam immediately, scoring whatever was reached.
  useEffect(() => {
    if (stage === 'running' && timeLeft <= 0) finishExam(results);
  }, [timeLeft, stage, results, finishExam]);

  // Defensive fallback: if the topic pool was ever exhausted (shouldn't happen — every
  // unlocked topic has at least one eligible problem), end the exam cleanly instead of
  // leaving a blank screen. Must run as an effect, not during render, since it's a state
  // update.
  useEffect(() => {
    if (stage === 'running' && problem === null) finishExam(results);
  }, [stage, problem, results, finishExam]);

  const startExam = (len: Length) => {
    const plan = buildTopicPlan(unlockedWorldIds, len);
    const firstProblem = getRandomProblem(plan[0], [], difficultyFor(mastery, plan[0]), { excludeIdentityProof: true });
    setLength(len);
    setTopicPlan(plan);
    setUsedProblemIds(firstProblem ? [firstProblem.id] : []);
    setIndex(0);
    setProblem(firstProblem ?? null);
    setResults([]);
    setStatus('idle');
    setTimeLeft(len * SECONDS_PER_QUESTION);
    finishedRef.current = false;
    submittedRef.current = false;
    setStage('running');
  };

  const advance = (nextResults: QuestionResult[]) => {
    const nextIndex = index + 1;
    if (nextIndex >= topicPlan.length) {
      finishExam(nextResults);
      return;
    }
    const nextTopic = topicPlan[nextIndex];
    const nextProblem = getRandomProblem(nextTopic, usedProblemIds, difficultyFor(mastery, nextTopic), {
      excludeIdentityProof: true,
    });
    setUsedProblemIds((ids) => (nextProblem ? [...ids, nextProblem.id] : ids));
    setIndex(nextIndex);
    setProblem(nextProblem ?? null);
    setStatus('idle');
    submittedRef.current = false;
  };

  const handleSubmit = (value: string) => {
    if (submittedRef.current || !problem) return;
    submittedRef.current = true;
    const correct = gradeAnswer(problem, value);
    recordAttempt({ problemId: problem.id, topicId: problem.topicId, correct, usedHint: false, timestamp: Date.now() });
    setStatus(correct ? 'correct' : 'incorrect');
    const nextResults = [...results, { topicId: problem.topicId, outcome: (correct ? 'correct' : 'incorrect') as Outcome }];
    setResults(nextResults);
    setTimeout(() => advance(nextResults), 700);
  };

  const handleSkip = () => {
    if (submittedRef.current || !problem) return;
    submittedRef.current = true;
    setStatus('skipped');
    const nextResults = [...results, { topicId: problem.topicId, outcome: 'skipped' as Outcome }];
    setResults(nextResults);
    setTimeout(() => advance(nextResults), 500);
  };

  const endEarly = () => finishExam(results);

  if (stage === 'setup') {
    return (
      <div className="min-h-screen pt-20 pb-10 px-6 flex items-center justify-center bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
        <div className="max-w-lg w-full">
          <div className="flex items-center justify-between mb-1 gap-2">
            <h1 className="font-display text-3xl text-amber-200">📝 Exam Simulator</h1>
            <button
              onClick={() => setScreen('worldmap')}
              className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm shrink-0"
            >
              ← Back to Map
            </button>
          </div>
          <p className="text-purple-300 mb-6">
            A timed, mixed-topic test covering everything you've unlocked so far — no hints, one answer per
            question. Built for test-day calibration, not for learning something new.
          </p>

          {lastExamResult && (
            <div className="bg-black/30 border border-purple-400/20 rounded-xl px-4 py-3 text-purple-300 text-sm mb-6">
              Last exam: {lastExamResult.correct}/{lastExamResult.total} (
              {Math.round((lastExamResult.correct / lastExamResult.total) * 100)}%)
            </div>
          )}

          <p className="text-xs text-purple-400 uppercase mb-2">Choose a length</p>
          <div className="space-y-2 mb-6">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLength(opt.value)}
                aria-pressed={length === opt.value}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left ${
                  length === opt.value
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'
                }`}
              >
                {/* A real space (not just visual flex spacing) between these two spans,
                    so the button's content-derived accessible name reads sensibly
                    instead of running the two text nodes together with no separator. */}
                <span className="font-semibold">{opt.label}</span>{' '}
                <span className="text-xs">{opt.blurb}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => startExam(length)}
            className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'results') {
    const correctCount = results.filter((r) => r.outcome === 'correct').length;
    const incorrectCount = results.filter((r) => r.outcome === 'incorrect').length;
    const skippedCount = results.filter((r) => r.outcome === 'skipped').length;
    const unansweredCount = topicPlan.length - results.length;
    const pct = topicPlan.length === 0 ? 0 : Math.round((correctCount / topicPlan.length) * 100);

    const byTopic = new Map<string, { correct: number; total: number }>();
    for (const r of results) {
      const entry = byTopic.get(r.topicId) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (r.outcome === 'correct') entry.correct += 1;
      byTopic.set(r.topicId, entry);
    }

    return (
      <div className="min-h-screen pt-20 pb-10 px-6 flex items-center justify-center bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
        <div className="max-w-lg w-full bg-black/40 border border-amber-400/40 rounded-2xl p-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-1">{pct >= 70 ? '🏅' : '📝'}</div>
            <h1 className="font-display text-2xl text-amber-200">
              {correctCount}/{topicPlan.length} ({pct}%)
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-3 py-2 text-emerald-200">
              ✅ Correct: {correctCount}
            </div>
            <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg px-3 py-2 text-rose-200">
              ❌ Incorrect: {incorrectCount}
            </div>
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg px-3 py-2 text-purple-200">
              ⏭️ Skipped: {skippedCount}
            </div>
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2 text-amber-200">
              ⏱️ Unanswered: {unansweredCount}
            </div>
          </div>

          <p className="text-center text-purple-300 text-sm mb-4">
            +{reward.xp} XP · +{reward.coins} 🪙{reward.stars > 0 && ` · +${reward.stars} ⭐`}
          </p>

          {byTopic.size > 0 && (
            <div className="mb-6">
              <p className="text-xs text-purple-400 uppercase mb-2">By topic</p>
              <div className="space-y-1">
                {[...byTopic.entries()].map(([topicId, s]) => (
                  <div key={topicId} className="flex items-center justify-between text-sm bg-black/30 rounded-lg px-3 py-1.5">
                    <span className="text-purple-100 truncate pr-2">{getTopic(topicId)?.name ?? topicId}</span>
                    <span className="shrink-0 text-purple-400">
                      {s.correct}/{s.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStage('setup')}
              className="flex-1 px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20"
            >
              Retake
            </button>
            <button
              onClick={() => setScreen('worldmap')}
              className="flex-1 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
            >
              Back to Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  // stage === 'running' — a null problem here is handled by the effect above.
  if (!problem) return null;

  const topic = getTopic(problem.topicId);
  const lowOnTime = timeLeft <= 60;

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 flex items-center justify-center bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-xl w-full">
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-purple-400" role="status" aria-live="polite">
            Question {index + 1} of {topicPlan.length}
          </span>
          {/* Deliberately not a live region: a per-second countdown would announce every
              tick, which is disruptive rather than helpful for screen reader users. The
              remaining time is still visually readable at any point. */}
          <span className={`font-mono font-semibold ${lowOnTime ? 'text-rose-400 animate-pulse' : 'text-purple-200'}`}>
            ⏱ {formatClock(timeLeft)}
          </span>
        </div>
        <div className="h-1.5 bg-black/50 rounded-full overflow-hidden mb-4">
          <div
            className="h-1.5 bg-gradient-to-r from-amber-500 to-fuchsia-500 transition-all"
            style={{ width: `${(index / topicPlan.length) * 100}%` }}
          />
        </div>

        <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase tracking-wide text-purple-400">{topic?.name ?? ''}</span>
            <span className="text-xs text-purple-400 capitalize">{problem.difficulty}</span>
          </div>

          <div className="text-lg text-purple-100 mb-4">
            <MathText text={problem.prompt} />
          </div>

          {status === 'idle' && (
            <>
              <AnswerInput key={problem.id} problem={problem} onSubmit={handleSubmit} />
              <button
                onClick={handleSkip}
                className="mt-3 text-xs px-3 py-1.5 rounded-full border border-purple-400/40 text-purple-300 hover:bg-purple-500/20"
              >
                ⏭️ Skip
              </button>
            </>
          )}

          {status !== 'idle' && (
            <div className="text-center py-4 animate-pop" role="status" aria-live="polite">
              <div className="text-3xl mb-1">{status === 'correct' ? '✅' : status === 'incorrect' ? '❌' : '⏭️'}</div>
              <p
                className={
                  status === 'correct' ? 'text-emerald-300 font-semibold' : status === 'incorrect' ? 'text-rose-300 font-semibold' : 'text-purple-300 font-semibold'
                }
              >
                {status === 'correct' ? 'Correct' : status === 'incorrect' ? 'Incorrect' : 'Skipped'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={endEarly}
          className="mt-4 mx-auto block text-xs px-3 py-1.5 rounded-full border border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
        >
          ⏹ End Exam Early
        </button>
      </div>
    </div>
  );
}
