import { useRef, useState } from 'react';
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

// On-screen symbol buttons for typing math that isn't on a regular keyboard.
// `insert` is the literal text inserted; `caretBack` moves the cursor back
// that many characters from the end of the inserted text (e.g. to land
// inside "sqrt()" instead of after it).
type SymbolButton = { display: string; insert: string; caretBack?: number };

const DEFAULT_SYMBOLS: SymbolButton[] = [
  { display: 'π', insert: 'pi' },
  { display: '√', insert: 'sqrt()', caretBack: 1 },
  { display: 'x^y', insert: '^' },
  { display: '/', insert: '/' },
];

const SYMBOLS_BY_TYPE: Partial<Record<string, SymbolButton[]>> = {
  numeric: DEFAULT_SYMBOLS,
  expression: DEFAULT_SYMBOLS,
  expressionTwoVar: DEFAULT_SYMBOLS,
  solutionSet: DEFAULT_SYMBOLS,
  interval: [
    { display: 'π', insert: 'pi' },
    { display: '√', insert: 'sqrt()', caretBack: 1 },
    { display: '∞', insert: 'infinity' },
    { display: '/', insert: '/' },
  ],
  complex: [
    { display: 'i', insert: 'i' },
    { display: 'π', insert: 'pi' },
    { display: '√', insert: 'sqrt()', caretBack: 1 },
    { display: '/', insert: '/' },
  ],
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
  const inputRef = useRef<HTMLInputElement>(null);

  const insertSymbol = (sym: SymbolButton) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + sym.insert + value.slice(end);
    setValue(next);
    const caretPos = start + sym.insert.length - (sym.caretBack ?? 0);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caretPos, caretPos);
    });
  };

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

  const symbols = SYMBOLS_BY_TYPE[problem.answerType] ?? DEFAULT_SYMBOLS;

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5" role="group" aria-label="Insert math symbol">
        {symbols.map((sym) => (
          <button
            key={sym.display}
            type="button"
            disabled={disabled}
            onClick={() => insertSymbol(sym)}
            aria-label={`Insert ${sym.display}`}
            className="w-10 h-9 rounded-lg border border-purple-400/40 text-purple-100 font-semibold hover:bg-purple-500/20 disabled:opacity-50"
          >
            {sym.display}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
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
    </div>
  );
}
