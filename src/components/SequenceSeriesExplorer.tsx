import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const WIDTH = 720;
const HEIGHT = 340;
const PAD_L = 50;
const PAD_R = 20;
const PAD_T = 20;
const PAD_B = 36;
const PLOT_W = WIDTH - PAD_L - PAD_R;
const PLOT_H = HEIGHT - PAD_T - PAD_B;

function fmt(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞';
  const r = Math.round(n * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : r.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

type Kind = 'arithmetic' | 'geometric';

export function SequenceSeriesExplorer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [kind, setKind] = useState<Kind>('arithmetic');
  const [a1, setA1] = useState(2);
  const [step, setStep] = useState(3); // common difference d, or ratio r
  const [n, setN] = useState(8);

  const terms = useMemo(() => {
    const arr: number[] = [];
    for (let i = 1; i <= n; i++) {
      arr.push(kind === 'arithmetic' ? a1 + (i - 1) * step : a1 * Math.pow(step, i - 1));
    }
    return arr;
  }, [kind, a1, step, n]);

  const partialSums = useMemo(() => {
    const arr: number[] = [];
    let running = 0;
    for (const t of terms) {
      running += t;
      arr.push(running);
    }
    return arr;
  }, [terms]);

  const sumFormulaValue = kind === 'arithmetic'
    ? (n / 2) * (2 * a1 + (n - 1) * step)
    : step === 1 ? a1 * n : (a1 * (1 - Math.pow(step, n))) / (1 - step);

  const infiniteSum = kind === 'geometric' && Math.abs(step) < 1 ? a1 / (1 - step) : null;

  const allValues = [...terms, ...partialSums];
  const maxAbs = Math.max(1, ...allValues.map((v) => Math.abs(v)));
  const yScale = (PLOT_H / 2 - 10) / maxAbs;

  function xPos(i: number) {
    return PAD_L + ((i - 0.5) / n) * PLOT_W;
  }
  function yPos(v: number) {
    return PAD_T + PLOT_H / 2 - v * yScale;
  }

  const nthTermFormula = kind === 'arithmetic'
    ? `a_n = ${fmt(a1)} + (n-1)(${fmt(step)})`
    : `a_n = ${fmt(a1)} \\cdot (${fmt(step)})^{n-1}`;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🔢 Sequence & Series Explorer</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['arithmetic', 'geometric'] as Kind[]).map((kd) => (
            <button
              key={kd}
              onClick={() => setKind(kd)}
              aria-pressed={kind === kd}
              className={`px-4 py-1.5 rounded-full text-sm border capitalize ${kind === kd ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'}`}
            >
              {kd}
            </button>
          ))}
        </div>

        <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-4 mb-4">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full select-none">
            <line x1={PAD_L} y1={yPos(0)} x2={PAD_L + PLOT_W} y2={yPos(0)} stroke="#a855f7" strokeWidth={1.5} />
            {terms.map((t, i) => (
              <circle key={`t${i}`} cx={xPos(i + 1)} cy={yPos(t)} r={5} fill="#fbbf24" />
            ))}
            {terms.slice(1).map((t, i) => (
              <line key={`tl${i}`} x1={xPos(i + 1)} y1={yPos(terms[i])} x2={xPos(i + 2)} y2={yPos(t)} stroke="#fbbf24" strokeWidth={1.5} opacity={0.6} />
            ))}
            {partialSums.map((s, i) => (
              <circle key={`s${i}`} cx={xPos(i + 1)} cy={yPos(s)} r={5} fill="#22d3ee" />
            ))}
            {partialSums.slice(1).map((s, i) => (
              <line key={`sl${i}`} x1={xPos(i + 1)} y1={yPos(partialSums[i])} x2={xPos(i + 2)} y2={yPos(s)} stroke="#22d3ee" strokeWidth={1.5} opacity={0.6} />
            ))}
            {terms.map((_, i) => (
              <text key={`x${i}`} x={xPos(i + 1)} y={PAD_T + PLOT_H + 16} fill="#c4b5fd" fontSize={10} textAnchor="middle">{i + 1}</text>
            ))}
          </svg>
          <div className="flex gap-4 justify-center text-xs mt-1">
            <span className="text-amber-300">● terms (aₙ)</span>
            <span className="text-cyan-300">● partial sums (Sₙ)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-4">
            <Slider label="First term a₁" value={a1} min={-5} max={10} step={1} onChange={setA1} />
            <Slider label={kind === 'arithmetic' ? 'Common difference d' : 'Common ratio r'} value={step} min={kind === 'arithmetic' ? -3 : -2} max={kind === 'arithmetic' ? 5 : 2} step={kind === 'arithmetic' ? 1 : 0.25} onChange={setStep} />
            <Slider label="Number of terms n" value={n} min={2} max={12} step={1} onChange={setN} />
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <MathText text={`$${nthTermFormula}$`} className="text-sm text-amber-100" />
            </div>
          </div>

          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-2 text-sm">
            <Readout label={`a${toSub(n)}`} value={fmt(terms[n - 1])} />
            <Readout label={`S${toSub(n)} (sum of first ${n})`} value={fmt(sumFormulaValue)} />
            {kind === 'geometric' && (
              <Readout
                label="Infinite sum S∞"
                value={infiniteSum !== null ? fmt(infiniteSum) : `diverges (|r| = ${fmt(Math.abs(step))} ≥ 1)`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function toSub(n: number): string {
  const subs = '₀₁₂₃₄₅₆₇₈₉';
  return String(n).split('').map((d) => subs[Number(d)]).join('');
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
    <div className="flex justify-between border-b border-purple-500/20 pb-1">
      <span className="text-purple-400">{label}</span>
      <span className="text-amber-100 font-mono">{value}</span>
    </div>
  );
}
