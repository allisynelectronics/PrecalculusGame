import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const SIZE = 460;
const CENTER = SIZE / 2;
const X_RANGE = 6;
const Y_RANGE = 10;
const SCALE_X = (SIZE / 2 - 20) / X_RANGE;
const SCALE_Y = (SIZE / 2 - 20) / Y_RANGE;

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

function toPx(x: number, y: number) {
  return { px: CENTER + x * SCALE_X, py: CENTER - y * SCALE_Y };
}

interface ZeroDef {
  x: number;
  mult: 1 | 2;
}

export function PolynomialGraphExplorer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [sign, setSign] = useState<1 | -1>(1);
  const [zeros, setZeros] = useState<ZeroDef[]>([
    { x: -3, mult: 1 },
    { x: 0, mult: 2 },
    { x: 3, mult: 1 },
  ]);

  const degree = zeros.reduce((sum, z) => sum + z.mult, 0);
  const isEven = degree % 2 === 0;

  function f(x: number): number {
    let v = sign;
    for (const z of zeros) v *= Math.pow(x - z.x, z.mult);
    return v;
  }

  // Scale the function so it fits nicely in view — find the max |value| in range and
  // normalize, since raw high-degree polynomials blow up far faster than the y-range.
  const normalizer = useMemo(() => {
    let maxAbs = 1;
    for (let i = 0; i <= 200; i++) {
      const x = -X_RANGE + (2 * X_RANGE * i) / 200;
      maxAbs = Math.max(maxAbs, Math.abs(f(x)));
    }
    return (Y_RANGE * 0.85) / maxAbs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign, zeros]);

  const pathD = useMemo(() => {
    const steps = 500;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const x = -X_RANGE + (2 * X_RANGE * i) / steps;
      const y = Math.max(-Y_RANGE * 1.2, Math.min(Y_RANGE * 1.2, f(x) * normalizer));
      const { px, py } = toPx(x, y);
      d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign, zeros, normalizer]);

  const equation = useMemo(() => {
    const factors = zeros.map((z) => `(x${z.x >= 0 ? '-' : '+'}${fmt(Math.abs(z.x))})${z.mult > 1 ? `^${z.mult}` : ''}`);
    return `f(x) = ${sign < 0 ? '-' : ''}${factors.join('')}`;
  }, [sign, zeros]);

  const endBehavior = isEven
    ? sign > 0 ? 'Rises left, rises right' : 'Falls left, falls right'
    : sign > 0 ? 'Falls left, rises right' : 'Rises left, falls right';

  const updateZero = (i: number, patch: Partial<ZeroDef>) => {
    setZeros((zs) => zs.map((z, idx) => (idx === i ? { ...z, ...patch } : z)));
  };

  const colors = ['#fbbf24', '#22d3ee', '#4ade80'];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">📈 Polynomial Graph Explorer</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="grid md:grid-cols-[460px_1fr] gap-6">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[460px] mx-auto select-none">
            {[-9, -6, -3, 3, 6, 9].map((g) => (
              <line key={`v${g}`} x1={toPx(g, -Y_RANGE).px} y1={toPx(g, -Y_RANGE).py} x2={toPx(g, Y_RANGE).px} y2={toPx(g, Y_RANGE).py} stroke="#581c87" strokeWidth={1} opacity={0.25} />
            ))}
            {[-8, -4, 4, 8].map((g) => (
              <line key={`h${g}`} x1={toPx(-X_RANGE, g).px} y1={toPx(-X_RANGE, g).py} x2={toPx(X_RANGE, g).px} y2={toPx(X_RANGE, g).py} stroke="#581c87" strokeWidth={1} opacity={0.25} />
            ))}
            <line x1={toPx(-X_RANGE, 0).px} y1={toPx(-X_RANGE, 0).py} x2={toPx(X_RANGE, 0).px} y2={toPx(X_RANGE, 0).py} stroke="#a855f7" strokeWidth={1.5} />
            <line x1={toPx(0, -Y_RANGE).px} y1={toPx(0, -Y_RANGE).py} x2={toPx(0, Y_RANGE).px} y2={toPx(0, Y_RANGE).py} stroke="#a855f7" strokeWidth={1.5} />

            <path d={pathD} fill="none" stroke="#fde68a" strokeWidth={2.5} />

            {zeros.map((z, i) => {
              const { px, py } = toPx(z.x, 0);
              return <circle key={i} cx={px} cy={py} r={7} fill={colors[i]} stroke="#1c1917" strokeWidth={2} />;
            })}
          </svg>

          <div className="space-y-4">
            <button
              onClick={() => setSign((s) => (s === 1 ? -1 : 1))}
              className="w-full px-4 py-2 rounded-full border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/20 text-sm"
            >
              Leading coefficient sign: {sign > 0 ? '+' : '−'} (click to flip)
            </button>

            {zeros.map((z, i) => (
              <div key={i} className="bg-black/40 border border-purple-400/30 rounded-xl p-3 space-y-2" style={{ borderColor: colors[i] + '80' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: colors[i] }}>Zero {i + 1}</span>
                  <div className="flex gap-1">
                    {([1, 2] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => updateZero(i, { mult: m })}
                        className={`px-2 py-0.5 rounded text-[10px] border ${z.mult === m ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-300'}`}
                      >
                        mult. {m}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  aria-label={`Zero ${i + 1} x-position`}
                  type="range"
                  min={-5}
                  max={5}
                  step={0.5}
                  value={z.x}
                  onChange={(e) => updateZero(i, { x: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-purple-400 text-right">x = {fmt(z.x)}</p>
              </div>
            ))}

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 text-center">
              <MathText text={`$${equation}$`} className="text-sm text-amber-100" />
            </div>

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-1 text-sm">
              <Readout label="Degree" value={String(degree)} />
              <Readout label="End behavior" value={endBehavior} />
              <Readout label="Zeros" value={zeros.map((z) => `${fmt(z.x)} (mult. ${z.mult})`).join(', ')} />
              <Readout label="At each zero" value={zeros.every((z) => z.mult === zeros[0].mult) ? (zeros[0].mult === 1 ? 'all cross' : 'all bounce') : 'mixed — check each color'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-purple-500/20 pb-1 gap-3">
      <span className="text-purple-400 shrink-0">{label}</span>
      <span className="text-amber-100 font-mono text-right">{value}</span>
    </div>
  );
}
