import { useMemo, useState } from 'react';
import { getProblemsByTopic } from '../data/problems/foundationForge';
import { TOPICS } from '../data/topics';
import { gradeAnswer } from '../lib/grade';
import { useGameStore } from '../store/gameStore';
import { AnswerInput } from './AnswerInput';
import { MathText } from './Math';

export function Diagnostic() {
  const completeDiagnostic = useGameStore((s) => s.completeDiagnostic);

  const questions = useMemo(
    () =>
      TOPICS.filter((t) => t.worldId === 'foundation-forge').map((t) => {
        const pool = getProblemsByTopic(t.id).filter((p) => p.difficulty === 'beginner');
        const fallback = getProblemsByTopic(t.id);
        return pool[0] ?? fallback[0];
      }),
    [],
  );

  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const current = questions[index];
  const done = index >= questions.length;

  const handleSubmit = (value: string) => {
    const correct = gradeAnswer(current, value);
    setResults((r) => ({ ...r, [current.topicId]: correct }));
    setFeedback(correct ? 'correct' : 'incorrect');
    setTimeout(() => {
      setFeedback(null);
      setIndex((i) => i + 1);
    }, 900);
  };

  if (done) {
    const correctCount = Object.values(results).filter(Boolean).length;
    return (
      <div className="min-h-screen pt-24 px-6 flex flex-col items-center bg-gradient-to-b from-[#0b0a14] to-[#1a1033] text-center">
        <h1 className="font-display text-3xl text-amber-200 mb-2">Diagnostic Complete</h1>
        <p className="text-purple-300 mb-6">
          You answered {correctCount} of {questions.length} correctly. We'll route your practice to
          match exactly where you are.
        </p>
        <button
          onClick={() => completeDiagnostic(results)}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Enter the Foundation Forge
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 flex flex-col items-center bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
      <div className="w-full max-w-xl">
        <div className="flex justify-between text-xs text-purple-400 mb-2">
          <span>Adaptive Diagnostic</span>
          <span>{index + 1} / {questions.length}</span>
        </div>
        <div className="h-2 bg-purple-900/60 rounded mb-6">
          <div
            className="h-2 bg-gradient-to-r from-amber-400 to-fuchsia-400 rounded transition-all"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>

        <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-6">
          <div className="text-lg text-purple-100 mb-4">
            <MathText text={current.prompt} />
          </div>
          <AnswerInput key={current.id} problem={current} onSubmit={handleSubmit} disabled={feedback !== null} />
          {feedback && (
            <div className={`mt-4 text-sm font-semibold ${feedback === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {feedback === 'correct' ? '✓ Correct' : '✗ Not quite — noted for your practice path.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
