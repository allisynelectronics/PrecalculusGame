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

type Mode = 'va' | 'hole' | 'ha' | 'slant';

export function RationalGraphExplorer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [mode, setMode] = useState<Mode>('va');

  const [a, setA] = useState(2); // VA mode: pole
  const [holeA, setHoleA] = useState(2); // hole mode: canceled factor location
  const [holeB, setHoleB] = useState(-3); // hole mode: remaining zero
  const [k, setK] = useState(2); // HA mode: leading coeff ratio
  const [haC, setHaC] = useState(1); // HA mode: numerator zero
  const [haD, setHaD] = useState(-2); // HA mode: pole
  const [slantN, setSlantN] = useState(4); // slant mode: x^2 - n
  const [slantD, setSlantD] = useState(1); // slant mode: pole

  function f(x: number): number | null {
    switch (mode) {
      case 'va':
        return 1 / (x - a);
      case 'hole': {
        if (Math.abs(x - holeA) < 1e-9) return null; // the hole itself — undefined
        return x - holeB; // simplified form of ((x-holeA)(x-holeB))/(x-holeA)
      }
      case 'ha':
        return (k * (x - haC)) / (x - haD);
      case 'slant':
        return (x * x - slantN) / (x - slantD);
    }
  }

  const info = useMemo(() => {
    switch (mode) {
      case 'va':
        return { va: [a], ha: 0, slant: null as string | null, holes: [] as { x: number; y: number }[] };
      case 'hole':
        return { va: [] as number[], ha: null as number | null, slant: null as string | null, holes: [{ x: holeA, y: holeA - holeB }] };
      case 'ha':
        return { va: [haD], ha: k, slant: null as string | null, holes: [] as { x: number; y: number }[] };
      case 'slant': {
        // (x^2 - n)/(x - d) = (x + d) + (d^2 - n)/(x - d)
        const remainder = slantD * slantD - slantN;
        return {
          va: [slantD],
          ha: null as number | null,
          slant: Math.abs(remainder) < 1e-9 ? null : `y = x ${slantD >= 0 ? '+' : '-'} ${fmt(Math.abs(slantD))}`,
          holes: [] as { x: number; y: number }[],
        };
      }
    }
  }, [mode, a, holeA, holeB, k, haD, slantN, slantD]);

  const pathSegments = useMemo(() => {
    const steps = 1000;
    const segments: string[] = [];
    let current = '';
    let lastPy: number | null = null;
    for (let i = 0; i <= steps; i++) {
      const x = -X_RANGE + (2 * X_RANGE * i) / steps;
      const nearAsymptote = info.va.some((v) => Math.abs(x - v) < 0.03);
      const y = nearAsymptote ? null : f(x);
      if (y === null || !Number.isFinite(y) || Math.abs(y) > Y_RANGE * 1.5) {
        if (current) segments.push(current);
        current = '';
        lastPy = null;
        continue;
      }
      const { px, py } = toPx(x, Math.max(-Y_RANGE * 1.3, Math.min(Y_RANGE * 1.3, y)));
      // Break the segment if the line would jump a huge vertical distance in one step
      // (crossing an asymptote between samples) rather than drawing a near-vertical streak.
      if (lastPy !== null && Math.abs(py - lastPy) > SIZE * 0.5) {
        if (current) segments.push(current);
        current = `M ${px} ${py}`;
      } else {
        current += current ? ` L ${px} ${py}` : `M ${px} ${py}`;
      }
      lastPy = py;
    }
    if (current) segments.push(current);
    return segments;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, a, holeA, holeB, k, haC, haD, slantN, slantD, info.va]);

  const equation = useMemo(() => {
    switch (mode) {
      case 'va': return `f(x) = \\dfrac{1}{x-(${fmt(a)})}`;
      case 'hole': return `f(x) = \\dfrac{(x-(${fmt(holeA)}))(x-(${fmt(holeB)}))}{x-(${fmt(holeA)})}`;
      case 'ha': return `f(x) = \\dfrac{${fmt(k)}(x-(${fmt(haC)}))}{x-(${fmt(haD)})}`;
      case 'slant': return `f(x) = \\dfrac{x^2-${fmt(slantN)}}{x-(${fmt(slantD)})}`;
    }
  }, [mode, a, holeA, holeB, k, haC, haD, slantN, slantD]);

  const gridLines = [-8, -6, -4, -2, 2, 4, 6, 8];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">📉 Rational Function Graph Explorer</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ['va', 'Vertical Asymptote'],
            ['hole', 'Hole'],
            ['ha', 'Horizontal Asymptote'],
            ['slant', 'Slant Asymptote'],
          ] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full text-sm border ${mode === m ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'}`}
            >
              {label}
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

            {info.va.map((v) => (
              <line key={v} x1={toPx(v, -Y_RANGE).px} y1={toPx(v, -Y_RANGE).py} x2={toPx(v, Y_RANGE).px} y2={toPx(v, Y_RANGE).py} stroke="#fb7185" strokeWidth={1.5} strokeDasharray="6 4" />
            ))}
            {info.ha !== null && info.ha !== undefined && (
              <line x1={toPx(-X_RANGE, info.ha).px} y1={toPx(-X_RANGE, info.ha).py} x2={toPx(X_RANGE, info.ha).px} y2={toPx(X_RANGE, info.ha).py} stroke="#4ade80" strokeWidth={1.5} strokeDasharray="6 4" />
            )}
            {mode === 'slant' && info.slant && (() => {
              // y = x + slantD
              const y1 = -X_RANGE + slantD;
              const y2 = X_RANGE + slantD;
              const p1 = toPx(-X_RANGE, y1);
              const p2 = toPx(X_RANGE, y2);
              return <line x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#4ade80" strokeWidth={1.5} strokeDasharray="6 4" />;
            })()}

            {pathSegments.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#fbbf24" strokeWidth={2.5} />
            ))}

            {info.holes.map((h, i) => {
              const { px, py } = toPx(h.x, h.y);
              return <circle key={i} cx={px} cy={py} r={6} fill="#0b0a14" stroke="#fbbf24" strokeWidth={2.5} />;
            })}
          </svg>

          <div className="space-y-4">
            {mode === 'va' && <Slider label="Pole location a" value={a} min={-5} max={5} step={0.5} onChange={setA} />}
            {mode === 'hole' && (
              <>
                <Slider label="Canceled factor (hole location)" value={holeA} min={-5} max={5} step={0.5} onChange={setHoleA} />
                <Slider label="Remaining zero" value={holeB} min={-5} max={5} step={0.5} onChange={setHoleB} />
              </>
            )}
            {mode === 'ha' && (
              <>
                <Slider label="Leading-coefficient ratio k" value={k} min={0.5} max={3} step={0.5} onChange={setK} />
                <Slider label="Numerator zero c" value={haC} min={-5} max={5} step={0.5} onChange={setHaC} />
                <Slider label="Pole d" value={haD} min={-5} max={5} step={0.5} onChange={setHaD} />
              </>
            )}
            {mode === 'slant' && (
              <>
                <Slider label="n (numerator = x² − n)" value={slantN} min={-5} max={9} step={1} onChange={setSlantN} />
                <Slider label="Pole d" value={slantD} min={-4} max={4} step={0.5} onChange={setSlantD} />
              </>
            )}

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 text-center">
              <MathText text={`$${equation}$`} className="text-base text-amber-100" />
            </div>

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-1 text-sm">
              <Readout label="Vertical asymptote(s)" value={info.va.length ? info.va.map(fmt).map((v) => `x = ${v}`).join(', ') : 'none'} />
              <Readout label="Horizontal asymptote" value={info.ha !== null && info.ha !== undefined ? `y = ${fmt(info.ha)}` : 'none'} />
              {mode === 'slant' && <Readout label="Slant asymptote" value={info.slant ?? 'none (degenerates to the line itself)'} />}
              <Readout label="Hole(s)" value={info.holes.length ? info.holes.map((h) => `(${fmt(h.x)}, ${fmt(h.y)})`).join(', ') : 'none'} />
            </div>

            <p className="text-xs text-purple-400">
              {mode === 'va' && 'The denominator’s zero has no matching factor in the numerator, so the function shoots to ±∞ there instead of being removable.'}
              {mode === 'hole' && 'The canceled factor makes this point undefined, but the simplified function is perfectly well-behaved everywhere else — a removable discontinuity, not an asymptote.'}
              {mode === 'ha' && 'Numerator and denominator have the same degree, so as x→±∞, f(x) approaches the ratio of their leading coefficients.'}
              {mode === 'slant' && 'The numerator’s degree is exactly one more than the denominator’s, so there’s no horizontal asymptote — instead f(x) approaches a slanted line as x→±∞.'}
            </p>
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-500" />
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
