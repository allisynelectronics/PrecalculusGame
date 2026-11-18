import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const ROWS = 3;
const COLS = 4; // 3 variables + 1 augmented column

type Matrix = number[][];

const PRESET: Matrix = [
  [1, 1, 1, 6],
  [2, -1, 1, 2],
  [1, 2, -1, 1],
];

function fmt(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : r.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function cloneMatrix(m: Matrix): Matrix {
  return m.map((row) => [...row]);
}

type OpKind = 'swap' | 'scale' | 'addmultiple';

export function MatrixRowOperationSimulator() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [matrix, setMatrix] = useState<Matrix>(() => cloneMatrix(PRESET));
  const [history, setHistory] = useState<string[]>([]);

  const [opKind, setOpKind] = useState<OpKind>('addmultiple');
  const [rowA, setRowA] = useState(0);
  const [rowB, setRowB] = useState(1);
  const [scalar, setScalar] = useState(-2);

  const editCell = (r: number, c: number, value: number) => {
    setMatrix((m) => {
      const next = cloneMatrix(m);
      next[r][c] = value;
      return next;
    });
  };

  const applyOp = () => {
    setMatrix((m) => {
      const next = cloneMatrix(m);
      if (opKind === 'swap') {
        [next[rowA], next[rowB]] = [next[rowB], next[rowA]];
        setHistory((h) => [...h, `R${rowA + 1} ↔ R${rowB + 1}`]);
      } else if (opKind === 'scale') {
        next[rowA] = next[rowA].map((v) => v * scalar);
        setHistory((h) => [...h, `R${rowA + 1} → ${fmt(scalar)}·R${rowA + 1}`]);
      } else {
        next[rowB] = next[rowB].map((v, c) => v + scalar * next[rowA][c]);
        setHistory((h) => [...h, `R${rowB + 1} → R${rowB + 1} + (${fmt(scalar)})·R${rowA + 1}`]);
      }
      return next;
    });
  };

  const resetMatrix = () => {
    setMatrix(cloneMatrix(PRESET));
    setHistory([]);
  };

  const rowOptions = Array.from({ length: ROWS }, (_, i) => i);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🧮 Matrix Row-Operation Simulator</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5">
            <p className="text-xs text-purple-400 uppercase mb-3">Augmented matrix (edit any cell)</p>
            <div className="inline-flex flex-col border-2 border-amber-400/50 rounded-lg overflow-hidden">
              {Array.from({ length: ROWS }).map((_, r) => (
                <div key={r} className="flex flex-row">
                  {Array.from({ length: COLS }).map((_, c) => (
                    <input
                      key={c}
                      aria-label={`Row ${r + 1}, column ${c + 1}`}
                      type="number"
                      value={matrix[r][c]}
                      onChange={(e) => editCell(r, c, Number(e.target.value))}
                      className={`w-16 h-12 text-center bg-black/40 text-amber-100 font-mono border-r border-b border-purple-500/20 focus:outline-none focus:bg-purple-500/20 ${
                        c === COLS - 1 ? 'border-l-2 border-l-amber-400/50' : ''
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={resetMatrix}
              className="mt-4 block px-4 py-1.5 rounded-full border border-rose-400/40 text-rose-200 hover:bg-rose-500/20 text-sm"
            >
              Reset to original system
            </button>

            <div className="mt-4">
              <p className="text-xs text-purple-400 uppercase mb-2">Operation history</p>
              {history.length === 0 ? (
                <p className="text-xs text-purple-500 italic">No operations yet.</p>
              ) : (
                <ol className="text-sm text-amber-100 font-mono space-y-1 list-decimal list-inside">
                  {history.map((h, i) => <li key={i}>{h}</li>)}
                </ol>
              )}
            </div>
          </div>

          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col gap-1">
              {(['addmultiple', 'swap', 'scale'] as OpKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setOpKind(k)}
                  aria-pressed={opKind === k}
                  className={`px-3 py-1.5 rounded-lg text-xs text-left border ${opKind === k ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'}`}
                >
                  {k === 'addmultiple' && 'Add a multiple of one row to another'}
                  {k === 'swap' && 'Swap two rows'}
                  {k === 'scale' && 'Scale a row by a constant'}
                </button>
              ))}
            </div>

            {opKind === 'swap' && (
              <>
                <RowSelect label="Row A" value={rowA} options={rowOptions} onChange={setRowA} />
                <RowSelect label="Row B" value={rowB} options={rowOptions} onChange={setRowB} />
                <button onClick={applyOp} className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold text-sm">
                  Swap R{rowA + 1} ↔ R{rowB + 1}
                </button>
              </>
            )}
            {opKind === 'scale' && (
              <>
                <RowSelect label="Row" value={rowA} options={rowOptions} onChange={setRowA} />
                <ScalarInput label="Scalar" value={scalar} onChange={setScalar} />
                <button onClick={applyOp} className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold text-sm">
                  Scale R{rowA + 1} by {fmt(scalar)}
                </button>
              </>
            )}
            {opKind === 'addmultiple' && (
              <>
                <RowSelect label="Source row (unchanged)" value={rowA} options={rowOptions} onChange={setRowA} />
                <RowSelect label="Target row (gets modified)" value={rowB} options={rowOptions} onChange={setRowB} />
                <ScalarInput label="Multiple" value={scalar} onChange={setScalar} />
                <button onClick={applyOp} className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold text-sm">
                  R{rowB + 1} → R{rowB + 1} + ({fmt(scalar)})R{rowA + 1}
                </button>
              </>
            )}

            <p className="text-[11px] text-purple-400 pt-2 border-t border-purple-500/20">
              Goal: use these three elementary row operations to reduce the matrix to row-echelon
              form, then read off the solution by back-substitution. None of these operations
              change the solution set of the underlying system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RowSelect({ label, value, options, onChange }: { label: string; value: number; options: number[]; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-purple-300 mb-1">{label}</div>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>Row {o + 1}</option>
        ))}
      </select>
    </label>
  );
}

function ScalarInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-purple-300 mb-1">{label}</div>
      <input
        aria-label={label}
        type="number"
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100 text-sm"
      />
    </label>
  );
}
