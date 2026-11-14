import { useState } from 'react';
import { checkExpressionEquivalence } from '../lib/mathCheck';
import type { Problem } from '../types';
import { MathText } from './Math';

export function IdentityProofBuilder({
  problem,
  onSolved,
  onHintUsed,
}: {
  problem: Problem;
  onSolved: () => void;
  onHintUsed: () => void;
}) {
  const stages = problem.proofStages ?? [];
  const [stageIndex, setStageIndex] = useState(0);
  const [lines, setLines] = useState<string[]>([problem.startDisplay ?? '']);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [done, setDone] = useState(false);

  const stage = stages[stageIndex];

  const handleSubmit = () => {
    if (!value.trim()) return;
    const correct = checkExpressionEquivalence(value, stage.targetExpr, 'x');
    if (correct) {
      const nextLines = [...lines, stage.targetDisplay];
      setLines(nextLines);
      setValue('');
      setWrong(false);
      setAttemptCount(0);
      setShowHint(false);
      setShowAnswer(false);
      if (stageIndex + 1 >= stages.length) {
        setDone(true);
        onSolved();
      } else {
        setStageIndex((i) => i + 1);
      }
    } else {
      setWrong(true);
      const next = attemptCount + 1;
      setAttemptCount(next);
      if (next >= 3) setShowAnswer(true);
    }
  };

  const skipStage = () => {
    const nextLines = [...lines, stage.targetDisplay];
    setLines(nextLines);
    setValue('');
    setWrong(false);
    setAttemptCount(0);
    setShowHint(false);
    setShowAnswer(false);
    if (stageIndex + 1 >= stages.length) {
      setDone(true);
      onSolved();
    } else {
      setStageIndex((i) => i + 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-black/40 rounded-xl p-4 space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="text-purple-100">
            <MathText text={`$${line}$`} />
          </div>
        ))}
        {!done && problem.rhsDisplay && (
          <div className="text-purple-500 text-sm pt-2 border-t border-purple-500/20">
            Goal: <MathText text={`$${problem.rhsDisplay}$`} />
          </div>
        )}
      </div>

      {!done && (
        <>
          <p className="text-sm text-purple-300">{stage.instruction}</p>
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Type the next line of the proof"
              className="flex-1 px-4 py-2 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100 focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
            >
              Submit
            </button>
          </div>

          {wrong && !showAnswer && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-400/30 text-sm text-rose-200 animate-shake">
              Not quite — that line isn't equivalent yet. Try again.
            </div>
          )}

          {showAnswer && (
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-400/30 text-sm text-indigo-100">
              <p className="font-semibold mb-1">This line should be:</p>
              <MathText text={`$${stage.targetDisplay}$`} />
              <button
                onClick={skipStage}
                className="mt-3 block px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
              >
                Continue
              </button>
            </div>
          )}

          <button
            onClick={() => {
              onHintUsed();
              setShowHint((v) => !v);
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/20"
          >
            💡 Hint
          </button>
          {showHint && <div className="text-xs text-cyan-200"><MathText text={stage.hint} /></div>}
        </>
      )}
    </div>
  );
}
