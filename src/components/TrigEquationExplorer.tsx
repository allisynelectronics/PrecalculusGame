import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const WIDTH = 720;
const HEIGHT = 360;
const PAD_L = 40;
const PAD_R = 20;
const PAD_T = 20;
const PAD_B = 36;
const PLOT_W = WIDTH - PAD_L - PAD_R;
const PLOT_H = HEIGHT - PAD_T - PAD_B;
const X_MIN = 0;
const X_MAX = 2 * Math.PI;

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

function piLabelPlain(x: number): string {
  if (Math.abs(x) < 1e-9) return '0';
  const k = x / Math.PI;
  for (const denom of [1, 2, 3, 4, 6]) {
    const numer = k * denom;
    if (Math.abs(numer - Math.round(numer)) < 1e-6) {
      const n = Math.round(numer);
      if (n === 0) return '0';
      const coeff = n === denom ? '' : n === 1 ? '' : String(n);
      return denom === 1 ? `${coeff}π` : `${coeff}π/${denom}`;
    }
  }
  return fmt(x);
}

type FnKind = 'sin' | 'cos' | 'tan';

export function TrigEquationExplorer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [fnKind, setFnKind] = useState<FnKind>('sin');
  const [k, setK] = useState(0.5);

  const yRange = fnKind === 'tan' ? 5 : 1.3;
  function xToPx(x: number) {
    return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
  }
  function yToPx(y: number) {
    return PAD_T + PLOT_H / 2 - (y / yRange) * (PLOT_H / 2);
  }

  const fn = (x: number) => (fnKind === 'sin' ? Math.sin(x) : fnKind === 'cos' ? Math.cos(x) : Math.tan(x));

  const pathSegments = useMemo(() => {
    const steps = 800;
    const segments: string[] = [];
    let current = '';
    for (let i = 0; i <= steps; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / steps;
      const y = fn(x);
      if (!Number.isFinite(y) || Math.abs(y) > yRange * 1.5) {
        if (current) segments.push(current);
        current = '';
        continue;
      }
      const px = xToPx(x);
      const py = yToPx(Math.max(-yRange * 1.3, Math.min(yRange * 1.3, y)));
      current += current ? ` L ${px} ${py}` : `M ${px} ${py}`;
    }
    if (current) segments.push(current);
    return segments;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fnKind, yRange]);

  const solutions = useMemo(() => {
    if (fnKind === 'tan') {
      if (!Number.isFinite(k)) return [];
      const base = Math.atan(k);
      const s1 = base < 0 ? base + Math.PI : base;
      const s2 = s1 + Math.PI;
      return [s1, s2].filter((s) => s >= 0 && s < X_MAX);
    }
    if (Math.abs(k) > 1) return [];
    const base = fnKind === 'sin' ? Math.asin(k) : Math.acos(k);
    let s1: number, s2: number;
    if (fnKind === 'sin') {
      s1 = base < 0 ? base + 2 * Math.PI : base;
      s2 = Math.PI - base;
      if (s2 < 0) s2 += 2 * Math.PI;
      if (s2 >= 2 * Math.PI) s2 -= 2 * Math.PI;
    } else {
      s1 = base;
      s2 = 2 * Math.PI - base;
    }
    const raw = [s1, s2].filter((s) => s >= -1e-9 && s < X_MAX + 1e-9).map((s) => Math.max(0, s));
    // De-duplicate when the two solutions coincide (k = ±1 for sin/cos).
    if (raw.length === 2 && Math.abs(raw[0] - raw[1]) < 1e-6) return [raw[0]];
    return raw;
  }, [fnKind, k]);

  const generalSolution = useMemo(() => {
    if (fnKind === 'tan') return `x = \\arctan(${fmt(k)}) + n\\pi`;
    if (fnKind === 'sin') return `x = \\arcsin(${fmt(k)}) + 2n\\pi \\text{ or } x = \\pi - \\arcsin(${fmt(k)}) + 2n\\pi`;
    return `x = \\pm\\arccos(${fmt(k)}) + 2n\\pi`;
  }, [fnKind, k]);

  const noSolution = fnKind !== 'tan' && Math.abs(k) > 1;

  const gridX = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🧩 Trig Equation Solution Explorer</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-4 mb-4">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full select-none">
            {gridX.map((x) => (
              <line key={x} x1={xToPx(x)} y1={PAD_T} x2={xToPx(x)} y2={PAD_T + PLOT_H} stroke="#581c87" strokeWidth={1} opacity={0.3} />
            ))}
            <line x1={PAD_L} y1={yToPx(0)} x2={PAD_L + PLOT_W} y2={yToPx(0)} stroke="#a855f7" strokeWidth={1.5} />
            {gridX.map((x) => (
              <text key={x} x={xToPx(x)} y={yToPx(0) + 16} fill="#c4b5fd" fontSize={11} textAnchor="middle">{piLabelPlain(x)}</text>
            ))}

            {!noSolution && (
              <line x1={PAD_L} y1={yToPx(k)} x2={PAD_L + PLOT_W} y2={yToPx(k)} stroke="#4ade80" strokeWidth={1.5} strokeDasharray="6 4" />
            )}

            {pathSegments.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#fbbf24" strokeWidth={2.5} />
            ))}

            {solutions.map((s, i) => (
              <circle key={i} cx={xToPx(s)} cy={yToPx(k)} r={6} fill="#22d3ee" stroke="#164e63" strokeWidth={2} />
            ))}
          </svg>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-4">
            <div className="flex gap-2">
              {(['sin', 'cos', 'tan'] as FnKind[]).map((fk) => (
                <button
                  key={fk}
                  onClick={() => setFnKind(fk)}
                  className={`flex-1 px-3 py-1.5 rounded-full text-sm border ${fnKind === fk ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'}`}
                >
                  {fk}(x)
                </button>
              ))}
            </div>
            <label className="block">
              <div className="flex justify-between text-xs text-purple-300 mb-1">
                <span>k</span>
                <span className="text-amber-200 font-mono">{fmt(k)}</span>
              </div>
              <input
                aria-label="k value"
                type="range"
                min={fnKind === 'tan' ? -5 : -1.5}
                max={fnKind === 'tan' ? 5 : 1.5}
                step={0.1}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </label>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <MathText text={`$${fnKind}(x) = ${fmt(k)}$`} className="text-lg text-amber-100" />
            </div>
          </div>

          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-2 text-sm">
            {noSolution ? (
              <p className="text-rose-300 text-center">
                No solution — {fnKind}(x) never exceeds 1 in absolute value, but |k| = {fmt(Math.abs(k))}.
              </p>
            ) : (
              <>
                <p className="text-purple-400 uppercase text-xs">Solutions on [0, 2π)</p>
                {solutions.map((s, i) => (
                  <div key={i} className="flex justify-between border-b border-purple-500/20 pb-1">
                    <MathText text={`$x_${i + 1} \\approx$`} className="text-purple-300" />
                    <span className="text-amber-100 font-mono">{fmt(s)} rad ({piLabelPlain(s)})</span>
                  </div>
                ))}
                <p className="text-purple-400 uppercase text-xs pt-2">General solution</p>
                <MathText text={`$${generalSolution}$`} className="text-amber-100 text-sm" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
