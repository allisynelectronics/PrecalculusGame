import { useMemo, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const SIZE = 460;
const CENTER = SIZE / 2;
const MAX_R_UNITS = 6;
const SCALE = (SIZE / 2 - 20) / MAX_R_UNITS;

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

function polarToPx(r: number, thetaRad: number) {
  return { px: CENTER + r * SCALE * Math.cos(thetaRad), py: CENTER - r * SCALE * Math.sin(thetaRad) };
}

type CurveFamily = 'circle' | 'cardioid' | 'limacon' | 'rose' | 'lemniscate';

const FAMILY_LABEL: Record<CurveFamily, string> = {
  circle: 'Circle: r = a',
  cardioid: 'Cardioid: r = a(1 ± cosθ)',
  limacon: 'Limaçon: r = a ± b·cosθ',
  rose: 'Rose: r = a·cos(kθ)',
  lemniscate: 'Lemniscate: r² = a²cos(2θ)',
};

export function PolarGrapher() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [mode, setMode] = useState<'curve' | 'point'>('curve');

  // Curve-plotting state
  const [family, setFamily] = useState<CurveFamily>('cardioid');
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [k, setK] = useState(3);
  const [negative, setNegative] = useState(false);

  // Point-exploring state
  const [r, setR] = useState(3);
  const [thetaDeg, setThetaDeg] = useState(45);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const equation = useMemo(() => {
    const sign = negative ? '-' : '+';
    switch (family) {
      case 'circle': return `r = ${fmt(a)}`;
      case 'cardioid': return `r = ${fmt(a)}(1 ${sign} \\cos\\theta)`;
      case 'limacon': return `r = ${fmt(a)} ${sign} ${fmt(b)}\\cos\\theta`;
      case 'rose': return `r = ${fmt(a)}\\cos(${fmt(k)}\\theta)`;
      case 'lemniscate': return `r^2 = ${fmt(a * a)}\\cos(2\\theta)`;
    }
  }, [family, a, b, k, negative]);

  const curvePath = useMemo(() => {
    const steps = 720;
    let d = '';
    let started = false;
    for (let i = 0; i <= steps; i++) {
      const theta = (4 * Math.PI * i) / steps; // 0..4pi covers odd-k roses and lemniscates fully too
      let rv: number;
      const sign = negative ? -1 : 1;
      if (family === 'circle') rv = a;
      else if (family === 'cardioid') rv = a * (1 + sign * Math.cos(theta));
      else if (family === 'limacon') rv = a + sign * b * Math.cos(theta);
      else if (family === 'rose') rv = a * Math.cos(k * theta);
      else {
        const v = a * a * Math.cos(2 * theta);
        if (v < 0) { started = false; continue; }
        rv = Math.sqrt(v);
      }
      const { px, py } = polarToPx(rv, theta);
      d += !started ? `M ${px} ${py}` : ` L ${px} ${py}`;
      started = true;
    }
    return d;
  }, [family, a, b, k, negative]);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const dx = (x - CENTER) / SCALE;
    const dy = (CENTER - y) / SCALE;
    const rr = Math.min(MAX_R_UNITS, Math.sqrt(dx * dx + dy * dy));
    let th = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (th < 0) th += 360;
    setR(Math.round(rr * 4) / 4);
    setThetaDeg(Math.round(th));
  };

  const thetaRad = (thetaDeg * Math.PI) / 180;
  const pointPx = polarToPx(r, thetaRad);
  const rectX = r * Math.cos(thetaRad);
  const rectY = r * Math.sin(thetaRad);

  const circles = [1, 2, 3, 4, 5, 6];
  const spokes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🌀 Polar Grapher</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('curve')}
            className={`px-4 py-1.5 rounded-full text-sm border ${mode === 'curve' ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'}`}
          >
            Plot a Curve
          </button>
          <button
            onClick={() => setMode('point')}
            className={`px-4 py-1.5 rounded-full text-sm border ${mode === 'point' ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'}`}
          >
            Explore a Point
          </button>
        </div>

        <div className="grid md:grid-cols-[460px_1fr] gap-6">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full max-w-[460px] mx-auto touch-none select-none"
            onPointerDown={(e) => {
              if (mode !== 'point') return;
              setDragging(true);
              (e.target as Element).setPointerCapture(e.pointerId);
              updateFromPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => mode === 'point' && dragging && updateFromPointer(e.clientX, e.clientY)}
            onPointerUp={() => setDragging(false)}
          >
            {circles.map((c) => (
              <circle key={c} cx={CENTER} cy={CENTER} r={c * SCALE} fill="none" stroke="#581c87" strokeWidth={1} opacity={0.35} />
            ))}
            {spokes.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const { px, py } = polarToPx(MAX_R_UNITS, rad);
              return <line key={deg} x1={CENTER} y1={CENTER} x2={px} y2={py} stroke="#581c87" strokeWidth={1} opacity={0.25} />;
            })}
            <line x1={0} y1={CENTER} x2={SIZE} y2={CENTER} stroke="#a855f7" strokeWidth={1.5} />
            <line x1={CENTER} y1={0} x2={CENTER} y2={SIZE} stroke="#a855f7" strokeWidth={1.5} />

            {mode === 'curve' && <path d={curvePath} fill="none" stroke="#fbbf24" strokeWidth={2.5} />}

            {mode === 'point' && (
              <>
                <line x1={CENTER} y1={CENTER} x2={pointPx.px} y2={pointPx.py} stroke="#22d3ee" strokeWidth={2} />
                <circle cx={pointPx.px} cy={pointPx.py} r={9} fill="#22d3ee" stroke="#164e63" strokeWidth={2} className="cursor-grab active:cursor-grabbing" />
              </>
            )}
          </svg>

          {mode === 'curve' ? (
            <div className="space-y-4">
              <select
                aria-label="Polar curve family"
                value={family}
                onChange={(e) => setFamily(e.target.value as CurveFamily)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100"
              >
                {(Object.keys(FAMILY_LABEL) as CurveFamily[]).map((f) => (
                  <option key={f} value={f}>{FAMILY_LABEL[f]}</option>
                ))}
              </select>

              <Slider label="a" value={a} min={0.5} max={4} step={0.5} onChange={setA} />
              {family === 'limacon' && <Slider label="b" value={b} min={0.5} max={4} step={0.5} onChange={setB} />}
              {family === 'rose' && <Slider label="k (petals: k if odd, 2k if even)" value={k} min={2} max={7} step={1} onChange={setK} />}
              {(family === 'cardioid' || family === 'limacon') && (
                <button
                  onClick={() => setNegative((n) => !n)}
                  className="w-full px-4 py-2 rounded-full border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/20 text-sm"
                >
                  Flip sign ({negative ? '−' : '+'})
                </button>
              )}

              <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 text-center">
                <MathText text={`$${equation}$`} className="text-lg text-amber-100" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-purple-400">Drag the cyan point, or use the sliders.</p>
              <Slider label="r" value={r} min={0} max={MAX_R_UNITS} step={0.25} onChange={setR} />
              <Slider label="θ (degrees)" value={thetaDeg} min={0} max={360} step={1} onChange={setThetaDeg} />

              <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-1 text-sm">
                <Readout label="Polar (r, θ)" value={`(${fmt(r)}, ${fmt(thetaDeg)}°)`} />
                <Readout label="Rectangular (x, y)" value={`(${fmt(rectX)}, ${fmt(rectY)})`} />
                <Readout label="x = r cosθ" value={fmt(rectX)} />
                <Readout label="y = r sinθ" value={fmt(rectY)} />
              </div>
            </div>
          )}
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
