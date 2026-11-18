import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const SIZE = 460;
const CENTER = SIZE / 2;
const X_RANGE = 8;
const Y_RANGE = 8;
const SCALE = (SIZE / 2 - 20) / X_RANGE;

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

function toPx(x: number, y: number) {
  return { px: CENTER + x * SCALE, py: CENTER - y * SCALE };
}

type FamilyKind = 'exp' | 'log';

export function ExponentialLogGraphExplorer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [family, setFamily] = useState<FamilyKind>('exp');
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [h, setH] = useState(0);
  const [k, setK] = useState(0);

  function f(x: number): number | null {
    if (family === 'exp') return a * Math.pow(b, x - h) + k;
    const arg = x - h;
    if (arg <= 0) return null;
    return a * (Math.log(arg) / Math.log(b)) + k;
  }

  const pathSegments = useMemo(() => {
    const steps = 800;
    const segments: string[] = [];
    let current = '';
    for (let i = 0; i <= steps; i++) {
      const x = -X_RANGE + (2 * X_RANGE * i) / steps;
      const y = f(x);
      if (y === null || !Number.isFinite(y) || Math.abs(y) > Y_RANGE * 2) {
        if (current) segments.push(current);
        current = '';
        continue;
      }
      const clamped = Math.max(-Y_RANGE * 1.3, Math.min(Y_RANGE * 1.3, y));
      const { px, py } = toPx(x, clamped);
      current += current ? ` L ${px} ${py}` : `M ${px} ${py}`;
    }
    if (current) segments.push(current);
    return segments;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family, a, b, h, k]);

  const equation = family === 'exp'
    ? `y = ${a !== 1 ? fmt(a) : ''}(${fmt(b)})^{x-(${fmt(h)})} ${k >= 0 ? '+' : '-'} ${fmt(Math.abs(k))}`
    : `y = ${a !== 1 ? fmt(a) : ''}\\log_{${fmt(b)}}(x-(${fmt(h)})) ${k >= 0 ? '+' : '-'} ${fmt(Math.abs(k))}`;

  const growthKind = b > 1 ? 'growth' : b > 0 && b < 1 ? 'decay' : 'invalid base (must be > 0, ≠ 1)';

  const gridLines = [-6, -4, -2, 2, 4, 6];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🏙️ Exponential / Log Graph Explorer</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['exp', 'log'] as FamilyKind[]).map((fk) => (
            <button
              key={fk}
              onClick={() => setFamily(fk)}
              aria-pressed={family === fk}
              className={`px-4 py-1.5 rounded-full text-sm border ${family === fk ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'}`}
            >
              {fk === 'exp' ? 'Exponential' : 'Logarithmic'}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-[460px_1fr] gap-6">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[460px] mx-auto select-none">
            {gridLines.map((g) => (
              <g key={g}>
                <line x1={toPx(g, -Y_RANGE).px} y1={toPx(g, -Y_RANGE).py} x2={toPx(g, Y_RANGE).px} y2={toPx(g, Y_RANGE).py} stroke="#581c87" strokeWidth={1} opacity={0.25} />
                <line x1={toPx(-X_RANGE, g).px} y1={toPx(-X_RANGE, g).py} x2={toPx(X_RANGE, g).px} y2={toPx(X_RANGE, g).py} stroke="#581c87" strokeWidth={1} opacity={0.25} />
              </g>
            ))}
            <line x1={toPx(-X_RANGE, 0).px} y1={toPx(-X_RANGE, 0).py} x2={toPx(X_RANGE, 0).px} y2={toPx(X_RANGE, 0).py} stroke="#a855f7" strokeWidth={1.5} />
            <line x1={toPx(0, -Y_RANGE).px} y1={toPx(0, -Y_RANGE).py} x2={toPx(0, Y_RANGE).px} y2={toPx(0, Y_RANGE).py} stroke="#a855f7" strokeWidth={1.5} />

            {family === 'exp' ? (
              <line x1={toPx(-X_RANGE, k).px} y1={toPx(-X_RANGE, k).py} x2={toPx(X_RANGE, k).px} y2={toPx(X_RANGE, k).py} stroke="#fb7185" strokeWidth={1.5} strokeDasharray="6 4" />
            ) : (
              <line x1={toPx(h, -Y_RANGE).px} y1={toPx(h, -Y_RANGE).py} x2={toPx(h, Y_RANGE).px} y2={toPx(h, Y_RANGE).py} stroke="#fb7185" strokeWidth={1.5} strokeDasharray="6 4" />
            )}

            {pathSegments.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#fbbf24" strokeWidth={2.5} />
            ))}
          </svg>

          <div className="space-y-4">
            <Slider label="a (vertical stretch / reflect)" value={a} min={-3} max={3} step={0.5} onChange={setA} />
            <Slider label="b (base)" value={b} min={0.25} max={4} step={0.25} onChange={setB} />
            <Slider label="h (horizontal shift)" value={h} min={-5} max={5} step={0.5} onChange={setH} />
            {family === 'exp' && <Slider label="k (vertical shift)" value={k} min={-5} max={5} step={0.5} onChange={setK} />}
            {family === 'log' && <Slider label="k (vertical shift)" value={k} min={-5} max={5} step={0.5} onChange={setK} />}

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 text-center">
              <MathText text={`$${equation}$`} className="text-sm text-amber-100" />
            </div>

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-1 text-sm">
              {family === 'exp' ? (
                <>
                  <Readout label="Horizontal asymptote" value={`y = ${fmt(k)}`} />
                  <Readout label="Domain" value="all real numbers" />
                  <Readout label="Range" value={a > 0 ? `y > ${fmt(k)}` : `y < ${fmt(k)}`} />
                  <Readout label="y-intercept" value={`(0, ${fmt(f(0) ?? NaN)})`} />
                  <Readout label="Growth or decay" value={growthKind} />
                </>
              ) : (
                <>
                  <Readout label="Vertical asymptote" value={`x = ${fmt(h)}`} />
                  <Readout label="Domain" value={`x > ${fmt(h)}`} />
                  <Readout label="Range" value="all real numbers" />
                  <Readout label="x-intercept" value={`(${fmt(h + 1)}, 0)`} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs text-purple-300 mb-1">
        <span>{label}</span>
        <span className="text-amber-200 font-mono">{fmt(value)}</span>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500"
      />
    </label>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-purple-500/20 pb-1">
      <span className="text-purple-400">{label}</span>
      <span className="text-amber-100 font-mono">{value}</span>
    </div>
  );
}
