import { useState } from 'react';
import type { Problem } from '../types';
import { MathText } from './Math';

const PLACEHOLDER: Record<string, string> = {
  numeric: 'e.g. 5 or 11/12 or sqrt(5)',
  expression: 'e.g. 3x+10 or x^8',
  expressionTwoVar: 'e.g. 2x+h',
  solutionSet: 'e.g. 3, -3',
  interval: 'e.g. (4,infinity) or [-2,5)',
  complex: 'e.g. 3-2i',
};

export function AnswerInput({
  problem,
  onSubmit,
  disabled,
}: {
  problem: Problem;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [repairLine, setRepairLine] = useState<number | null>(null);
  const [repairFix, setRepairFix] = useState('');

  if (problem.answerType === 'multipleChoice' && problem.choices) {
    return (
      <div className="grid grid-cols-1 gap-2">
        {problem.choices.map((c) => (
          <button
            key={c.id}
            disabled={disabled}
            onClick={() => onSubmit(c.id)}
            className="px-4 py-2 rounded-lg border border-purple-400/40 hover:bg-purple-500/20 text-left disabled:opacity-50"
          >
            <MathText text={c.label} />
          </button>
        ))}
      </div>
    );
  }

  if (problem.answerType === 'equationRepair') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-purple-300">Click the line that first breaks the rules:</p>
        <div className="space-y-1 font-mono text-sm bg-black/40 rounded-lg p-3">
          {problem.repairLines?.map((line, i) => (
            <button
              key={i}
              disabled={disabled}
              onClick={() => setRepairLine(i)}
              className={`block w-full text-left px-2 py-1 rounded ${
                repairLine === i ? 'bg-rose-500/40 border border-rose-300' : 'hover:bg-purple-500/20'
              }`}
            >
              <MathText text={`$${line}$`} />
            </button>
          ))}
        </div>
        {repairLine !== null && (
          <div>
            <p className="text-sm text-purple-300 mb-1">Write the corrected version of that line:</p>
            <input
              value={repairFix}
              onChange={(e) => setRepairFix(e.target.value)}
              placeholder="e.g. 3x = 15"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
        <button
          disabled={disabled || repairLine === null}
          onClick={() => onSubmit(`${repairLine}::${repairFix}`)}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold disabled:opacity-40"
        >
          Repair the Machine
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !disabled && value.trim()) onSubmit(value);
        }}
        disabled={disabled}
        placeholder={PLACEHOLDER[problem.answerType] ?? 'Your answer'}
        className="flex-1 px-4 py-2 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100 focus:outline-none focus:border-amber-400 disabled:opacity-50"
        autoFocus
      />
      <button
        disabled={disabled || !value.trim()}
        onClick={() => onSubmit(value)}
        className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold disabled:opacity-40"
      >
        Submit
      </button>
    </div>
  );
}
