import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const MAX_ROWS = 12;

function buildTriangle(rows: number): number[][] {
  const triangle: number[][] = [];
  for (let n = 0; n <= rows; n++) {
    const row: number[] = [1];
    for (let kk = 1; kk < n; kk++) row.push(triangle[n - 1][kk - 1] + triangle[n - 1][kk]);
    if (n > 0) row.push(1);
    triangle.push(row);
  }
  return triangle;
}

function fmtCoeff(c: number): string {
  return c === 1 ? '' : String(c);
}

export function PascalsTriangleExplorer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [rows, setRows] = useState(8);
  const [highlightRow, setHighlightRow] = useState(4);

  const triangle = useMemo(() => buildTriangle(rows), [rows]);
  const hRow = Math.min(highlightRow, rows);
  const expansionRow = useMemo(() => triangle[hRow] ?? [], [triangle, hRow]);

  const expansion = useMemo(() => {
    const terms = expansionRow.map((c, k) => {
      const xPow = hRow - k;
      const yPow = k;
      const xPart = xPow === 0 ? '' : xPow === 1 ? 'x' : `x^${xPow}`;
      const yPart = yPow === 0 ? '' : yPow === 1 ? 'y' : `y^${yPow}`;
      const coeff = fmtCoeff(c);
      const body = [coeff, xPart, yPart].filter(Boolean).join('') || '1';
      return body;
    });
    return `(x+y)^{${hRow}} = ${terms.join(' + ')}`;
  }, [expansionRow, hRow]);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🔺 Pascal's Triangle & Binomial Theorem</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 mb-4 overflow-x-auto">
          <div className="flex flex-col items-center gap-1 min-w-fit">
            {triangle.map((row, n) => (
              <div key={n} className="flex gap-1">
                {row.map((val, k) => (
                  <button
                    key={k}
                    onClick={() => setHighlightRow(n)}
                    className={`w-9 h-9 flex items-center justify-center rounded-md text-xs font-mono border transition-colors ${
                      n === hRow
                        ? 'bg-amber-500 text-black border-amber-300 font-bold'
                        : 'bg-black/30 border-purple-500/30 text-purple-200 hover:bg-purple-500/20'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-4">
            <label className="block">
              <div className="flex justify-between text-xs text-purple-300 mb-1">
                <span>Rows to show</span>
                <span className="text-amber-200 font-mono">{rows}</span>
              </div>
              <input
                aria-label="Rows to show"
                type="range"
                min={2}
                max={MAX_ROWS}
                step={1}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </label>
            <p className="text-xs text-purple-400">Click any entry in the triangle to highlight its row and see the matching binomial expansion.</p>
          </div>

          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-3">
            <p className="text-xs text-purple-400 uppercase">Row {hRow} = coefficients of (x+y)^{hRow}</p>
            <div className="flex flex-wrap gap-2">
              {expansionRow.map((c, k) => (
                <span key={k} className="px-2 py-1 rounded bg-black/30 border border-amber-400/30 text-amber-200 font-mono text-sm">
                  C({hRow},{k}) = {c}
                </span>
              ))}
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center overflow-x-auto">
              <MathText text={`$${expansion}$`} className="text-sm text-amber-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
