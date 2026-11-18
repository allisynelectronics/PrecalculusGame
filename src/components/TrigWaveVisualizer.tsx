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

// Fixed visible x-range in units of pi: [-0.5pi, 4.5pi] — enough to show several full
// periods of the narrowest period this tool allows, with room on both sides.
const X_MIN = -0.5 * Math.PI;
const X_MAX = 4.5 * Math.PI;
const Y_RANGE = 5; // visible y in [-5, 5], generous enough for amplitude up to 3 + shift up to 2

function xToPx(x: number) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function yToPx(y: number) {
  return PAD_T + PLOT_H / 2 - (y / Y_RANGE) * (PLOT_H / 2);
}

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

/** Formats a multiple of pi as a readable fraction, e.g. 1.5708 -> "\pi/2". */
function piLabel(x: number): string {
  if (Math.abs(x) < 1e-9) return '0';
  const k = x / Math.PI;
  const sign = k < 0 ? '-' : '';
  const ak = Math.abs(k);
  // Try small-denominator fractions (halves, quarters, thirds, sixths) for clean labels.
  for (const denom of [1, 2, 3, 4, 6]) {
    const numer = ak * denom;
    if (Math.abs(numer - Math.round(numer)) < 1e-6) {
      const n = Math.round(numer);
      if (n === 0) return '0';
      const coeff = n === denom ? '' : n === 1 ? '' : String(n);
      const pi = denom === 1 && n === 1 ? '\\pi' : '\\pi';
      return denom === 1 ? `${sign}${coeff || ''}${pi}` : `${sign}${coeff}${pi}/${denom}`;
    }
  }
  return `${fmt(x)}`;
}

/** Plain-text pi label for raw SVG <text> elements, which can't run KaTeX — unlike
 *  piLabel() above (meant to be wrapped in $...$ and passed through MathText). */
function piLabelPlain(x: number): string {
  return piLabel(x).replace(/\\pi/g, 'π');
}

type FnKind = 'sin' | 'cos';

export function TrigWaveVisualizer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [fnKind, setFnKind] = useState<FnKind>('sin');
  const [amplitude, setAmplitude] = useState(1);
  const [periodFactor, setPeriodFactor] = useState(1); // period = 2*pi / periodFactor... see below
  const [phaseShift, setPhaseShift] = useState(0); // in units of pi
  const [vertShift, setVertShift] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // periodFactor directly IS the "B" coefficient in y = A*sin(B(x-C))+D.
  const B = periodFactor;
  const A = amplitude;
  const C = phaseShift * Math.PI;
  const D = vertShift;
  const period = (2 * Math.PI) / Math.abs(B);

  const pathD = useMemo(() => {
    const steps = 400;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / steps;
      const y = A * (fnKind === 'sin' ? Math.sin(B * (x - C)) : Math.cos(B * (x - C))) + D;
      const px = xToPx(x);
      const py = yToPx(Math.max(-Y_RANGE, Math.min(Y_RANGE, y)));
      d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
    }
    return d;
  }, [A, B, C, D, fnKind]);

  const equation = `y = ${A !== 1 ? (A === -1 ? '-' : fmt(A)) : ''}\\${fnKind}\\left(${B !== 1 ? fmt(B) : ''}\\left(x ${C >= 0 ? '-' : '+'} ${piLabel(Math.abs(C))}\\right)\\right) ${D >= 0 ? '+' : '-'} ${fmt(Math.abs(D))}`;

  // Gridlines every pi/2.
  const xGridLines: number[] = [];
  for (let k = Math.ceil(X_MIN / (Math.PI / 2)); k * (Math.PI / 2) <= X_MAX; k++) {
    xGridLines.push(k * (Math.PI / 2));
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🌊 Trig Wave Visualizer</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-4 mb-4">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full select-none">
            {/* gridlines */}
            {xGridLines.map((x) => (
              <line key={x} x1={xToPx(x)} y1={PAD_T} x2={xToPx(x)} y2={PAD_T + PLOT_H} stroke="#581c87" strokeWidth={1} opacity={0.4} />
            ))}
            {[-4, -3, -2, -1, 1, 2, 3, 4].map((y) => (
              <line key={y} x1={PAD_L} y1={yToPx(y)} x2={PAD_L + PLOT_W} y2={yToPx(y)} stroke="#581c87" strokeWidth={1} opacity={0.25} />
            ))}
            {/* axes */}
            <line x1={PAD_L} y1={yToPx(0)} x2={PAD_L + PLOT_W} y2={yToPx(0)} stroke="#a855f7" strokeWidth={1.5} />
            <line x1={xToPx(0)} y1={PAD_T} x2={xToPx(0)} y2={PAD_T + PLOT_H} stroke="#a855f7" strokeWidth={1.5} />
            {/* x labels at multiples of pi/2 that land cleanly */}
            {xGridLines.filter((_, i) => i % 2 === 0).map((x) => (
              <text key={x} x={xToPx(x)} y={yToPx(0) + 16} fill="#c4b5fd" fontSize={11} textAnchor="middle">
                {piLabelPlain(x)}
              </text>
            ))}
            {[-4, -2, 2, 4].map((y) => (
              <text key={y} x={PAD_L - 8} y={yToPx(y) + 4} fill="#c4b5fd" fontSize={11} textAnchor="end">
                {y}
              </text>
            ))}
            {/* the curve */}
            <path d={pathD} fill="none" stroke="#fbbf24" strokeWidth={2.5} />
          </svg>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-4">
            <div className="flex gap-2">
              {(['sin', 'cos'] as FnKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFnKind(k)}
                  aria-pressed={fnKind === k}
                  className={`flex-1 px-3 py-1.5 rounded-full text-sm border ${
                    fnKind === k ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'
                  }`}
                >
                  {k}(x)
                </button>
              ))}
            </div>

            <Slider label="Amplitude (A)" value={amplitude} min={-3} max={3} step={0.25} onChange={setAmplitude} />
            <Slider label="B (period = 2π / |B|)" value={periodFactor} min={0.25} max={4} step={0.25} onChange={setPeriodFactor} />
            <Slider label="Phase shift C (in units of π)" value={phaseShift} min={-2} max={2} step={0.25} onChange={setPhaseShift} />
            <Slider label="Vertical shift D" value={vertShift} min={-3} max={3} step={0.5} onChange={setVertShift} />

            <button
              onClick={() => {
                setQuizMode((q) => !q);
                setRevealed(false);
              }}
              className="w-full px-4 py-2 rounded-full border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/20 text-sm"
            >
              {quizMode ? '🙈 Quiz Mode: ON' : '👁️ Quiz Mode: OFF'}
            </button>
          </div>

          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5">
            {quizMode && !revealed ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <p className="text-purple-300 text-sm text-center">
                  Adjust the sliders until you can state the amplitude, period, phase shift, and
                  vertical shift just by looking at the graph — then reveal to check yourself.
                </p>
                <button
                  onClick={() => setRevealed(true)}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
                >
                  Reveal equation & values
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center text-lg text-amber-100 pb-2 border-b border-purple-500/20">
                  <MathText text={`$${equation}$`} />
                </div>
                <Readout label="Amplitude |A|" value={fmt(Math.abs(A))} />
                <Readout label="Period (2π / |B|)" valueNode={<MathText text={`$${piLabel(period)}$`} />} />
                <Readout label="Phase shift" valueNode={<MathText text={`$${C >= 0 ? '' : '-'}${piLabel(Math.abs(C))}$`} />} />
                <Readout label="Vertical shift" value={fmt(D)} />
                <Readout label="Range" value={`[${fmt(D - Math.abs(A))}, ${fmt(D + Math.abs(A))}]`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs text-purple-300 mb-1">
        <span>{label}</span>
        <span className="text-amber-200 font-mono">{fmt(value)}</span>
      </div>
      <input
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

function Readout({ label, value, valueNode }: { label: string; value?: string; valueNode?: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-purple-500/20 pb-1 text-sm">
      <span className="text-purple-400">{label}</span>
      <span className="text-amber-100 font-mono">{valueNode ?? value}</span>
    </div>
  );
}
