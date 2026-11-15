import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const SIZE = 460;
const CENTER = SIZE / 2;
const RANGE = 8;
const SCALE = (SIZE / 2 - 20) / RANGE;

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

function toPx(x: number, y: number) {
  return { px: CENTER + x * SCALE, py: CENTER - y * SCALE };
}

type ConicKind = 'parabola' | 'ellipse' | 'hyperbola';

export function ConicSectionExplorer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [kind, setKind] = useState<ConicKind>('parabola');
  const [h, setH] = useState(0);
  const [k, setK] = useState(0);
  const [p, setP] = useState(1); // parabola focal distance
  const [a, setA] = useState(3); // ellipse/hyperbola semi-axis
  const [b, setB] = useState(2); // ellipse/hyperbola semi-axis
  const [horizontal, setHorizontal] = useState(true); // hyperbola orientation

  const gridLines = [-6, -4, -2, 2, 4, 6];

  const pathD = useMemo(() => {
    if (kind === 'parabola') {
      const steps = 200;
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const x = h - RANGE + (2 * RANGE * i) / steps;
        const y = k + (x - h) * (x - h) / (4 * p);
        if (Math.abs(y - k) > RANGE * 1.5) continue;
        const { px, py } = toPx(x, y);
        d += d ? ` L ${px} ${py}` : `M ${px} ${py}`;
      }
      return d;
    }
    if (kind === 'ellipse') {
      const steps = 200;
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const t = (2 * Math.PI * i) / steps;
        const x = h + a * Math.cos(t);
        const y = k + b * Math.sin(t);
        const { px, py } = toPx(x, y);
        d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
      }
      return d + ' Z';
    }
    // hyperbola: two branches via cosh/sinh parametrization
    const steps = 150;
    const tMax = 2.2;
    const branch = (sign: 1 | -1) => {
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const t = -tMax + (2 * tMax * i) / steps;
        const x = horizontal ? h + sign * a * Math.cosh(t) : h + b * Math.sinh(t);
        const y = horizontal ? k + b * Math.sinh(t) : k + sign * a * Math.cosh(t);
        const { px, py } = toPx(x, y);
        d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
      }
      return d;
    };
    return branch(1) + ' ' + branch(-1);
  }, [kind, h, k, p, a, b, horizontal]);

  const info = useMemo(() => {
    if (kind === 'parabola') {
      return {
        vertex: [h, k] as [number, number],
        focus: [h, k + p] as [number, number],
        directrix: `y = ${fmt(k - p)}`,
        equation: `(x-(${fmt(h)}))^2 = ${fmt(4 * p)}(y-(${fmt(k)}))`,
      };
    }
    if (kind === 'ellipse') {
      const majorIsX = a >= b;
      const c = Math.sqrt(Math.abs(a * a - b * b));
      const foci: [number, number][] = majorIsX ? [[h - c, k], [h + c, k]] : [[h, k - c], [h, k + c]];
      const vertices: [number, number][] = majorIsX ? [[h - a, k], [h + a, k]] : [[h, k - b], [h, k + b]];
      const e = c / Math.max(a, b);
      return { foci, vertices, eccentricity: e, equation: `\\dfrac{(x-(${fmt(h)}))^2}{${fmt(a * a)}} + \\dfrac{(y-(${fmt(k)}))^2}{${fmt(b * b)}} = 1` };
    }
    const c = Math.sqrt(a * a + b * b);
    const foci: [number, number][] = horizontal ? [[h - c, k], [h + c, k]] : [[h, k - c], [h, k + c]];
    const vertices: [number, number][] = horizontal ? [[h - a, k], [h + a, k]] : [[h, k - a], [h, k + a]];
    const slope = horizontal ? b / a : a / b;
    return {
      foci, vertices,
      asymptotes: [`y-(${fmt(k)}) = ${fmt(slope)}(x-(${fmt(h)}))`, `y-(${fmt(k)}) = -${fmt(slope)}(x-(${fmt(h)}))`],
      equation: horizontal
        ? `\\dfrac{(x-(${fmt(h)}))^2}{${fmt(a * a)}} - \\dfrac{(y-(${fmt(k)}))^2}{${fmt(b * b)}} = 1`
        : `\\dfrac{(y-(${fmt(k)}))^2}{${fmt(a * a)}} - \\dfrac{(x-(${fmt(h)}))^2}{${fmt(b * b)}} = 1`,
    };
  }, [kind, h, k, p, a, b, horizontal]);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🔭 Conic Section Explorer</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['parabola', 'ellipse', 'hyperbola'] as ConicKind[]).map((kd) => (
            <button
              key={kd}
              onClick={() => setKind(kd)}
              className={`px-4 py-1.5 rounded-full text-sm border capitalize ${kind === kd ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'}`}
            >
              {kd}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-[460px_1fr] gap-6">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[460px] mx-auto select-none">
            {gridLines.map((g) => (
              <g key={g}>
                <line x1={toPx(g, -RANGE).px} y1={toPx(g, -RANGE).py} x2={toPx(g, RANGE).px} y2={toPx(g, RANGE).py} stroke="#581c87" strokeWidth={1} opacity={0.25} />
                <line x1={toPx(-RANGE, g).px} y1={toPx(-RANGE, g).py} x2={toPx(RANGE, g).px} y2={toPx(RANGE, g).py} stroke="#581c87" strokeWidth={1} opacity={0.25} />
              </g>
            ))}
            <line x1={toPx(-RANGE, 0).px} y1={toPx(-RANGE, 0).py} x2={toPx(RANGE, 0).px} y2={toPx(RANGE, 0).py} stroke="#a855f7" strokeWidth={1.5} />
            <line x1={toPx(0, -RANGE).px} y1={toPx(0, -RANGE).py} x2={toPx(0, RANGE).px} y2={toPx(0, RANGE).py} stroke="#a855f7" strokeWidth={1.5} />

            {kind === 'parabola' && (
              <line x1={toPx(h - RANGE, k - p).px} y1={toPx(h - RANGE, k - p).py} x2={toPx(h + RANGE, k - p).px} y2={toPx(h + RANGE, k - p).py} stroke="#fb7185" strokeWidth={1.5} strokeDasharray="6 4" />
            )}
            {kind === 'hyperbola' && info.asymptotes && (
              <>
                <line x1={toPx(h - RANGE, horizontal ? k - (b / a) * RANGE : k - (a / b) * RANGE).px} y1={toPx(h - RANGE, horizontal ? k - (b / a) * RANGE : k - (a / b) * RANGE).py} x2={toPx(h + RANGE, horizontal ? k + (b / a) * RANGE : k + (a / b) * RANGE).px} y2={toPx(h + RANGE, horizontal ? k + (b / a) * RANGE : k + (a / b) * RANGE).py} stroke="#4ade80" strokeWidth={1} strokeDasharray="4 4" />
                <line x1={toPx(h - RANGE, horizontal ? k + (b / a) * RANGE : k + (a / b) * RANGE).px} y1={toPx(h - RANGE, horizontal ? k + (b / a) * RANGE : k + (a / b) * RANGE).py} x2={toPx(h + RANGE, horizontal ? k - (b / a) * RANGE : k - (a / b) * RANGE).px} y2={toPx(h + RANGE, horizontal ? k - (b / a) * RANGE : k - (a / b) * RANGE).py} stroke="#4ade80" strokeWidth={1} strokeDasharray="4 4" />
              </>
            )}

            <path d={pathD} fill="none" stroke="#fbbf24" strokeWidth={2.5} />

            {kind === 'parabola' && (
              <circle cx={toPx(...info.focus!).px} cy={toPx(...info.focus!).py} r={5} fill="#22d3ee" />
            )}
            {(kind === 'ellipse' || kind === 'hyperbola') && info.foci!.map((f, i) => (
              <circle key={i} cx={toPx(...f).px} cy={toPx(...f).py} r={5} fill="#22d3ee" />
            ))}
          </svg>

          <div className="space-y-4">
            <Slider label="Center/vertex h" value={h} min={-4} max={4} step={0.5} onChange={setH} />
            <Slider label="Center/vertex k" value={k} min={-4} max={4} step={0.5} onChange={setK} />
            {kind === 'parabola' && <Slider label="p (focal distance)" value={p} min={-2} max={2} step={0.25} onChange={(v) => setP(v === 0 ? 0.25 : v)} />}
            {kind !== 'parabola' && (
              <>
                <Slider label="a" value={a} min={1} max={5} step={0.5} onChange={setA} />
                <Slider label="b" value={b} min={1} max={5} step={0.5} onChange={setB} />
              </>
            )}
            {kind === 'hyperbola' && (
              <button
                onClick={() => setHorizontal((v) => !v)}
                className="w-full px-4 py-2 rounded-full border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/20 text-sm"
              >
                Transverse axis: {horizontal ? 'Horizontal' : 'Vertical'} (click to flip)
              </button>
            )}

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 text-center">
              <MathText text={`$${info.equation}$`} className="text-sm text-amber-100" />
            </div>

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-1 text-sm">
              {kind === 'parabola' && (
                <>
                  <Readout label="Vertex" value={`(${fmt(info.vertex![0])}, ${fmt(info.vertex![1])})`} />
                  <Readout label="Focus" value={`(${fmt(info.focus![0])}, ${fmt(info.focus![1])})`} />
                  <Readout label="Directrix" value={info.directrix!} />
                </>
              )}
              {kind === 'ellipse' && (
                <>
                  <Readout label="Vertices" value={info.vertices!.map((v) => `(${fmt(v[0])}, ${fmt(v[1])})`).join(', ')} />
                  <Readout label="Foci" value={info.foci!.map((v) => `(${fmt(v[0])}, ${fmt(v[1])})`).join(', ')} />
                  <Readout label="Eccentricity" value={fmt(info.eccentricity!)} />
                </>
              )}
              {kind === 'hyperbola' && (
                <>
                  <Readout label="Vertices" value={info.vertices!.map((v) => `(${fmt(v[0])}, ${fmt(v[1])})`).join(', ')} />
                  <Readout label="Foci" value={info.foci!.map((v) => `(${fmt(v[0])}, ${fmt(v[1])})`).join(', ')} />
                  <Readout label="Asymptote slope" value={`±${fmt(horizontal ? b / a : a / b)}`} />
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
      <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-500" />
    </label>
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
