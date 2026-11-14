import { useRef, useState } from 'react';
import {
  decimalTrigValues,
  exactTrigValues,
  isStandardAngle,
  normalizeDeg,
  quadrantOf,
  radianLabel,
  referenceAngleDeg,
  STANDARD_ANGLES,
} from '../lib/unitCircle';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 160;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function UnitCircleExplorer() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [angleDeg, setAngleDeg] = useState(30);
  const [quizMode, setQuizMode] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const angle = normalizeDeg(angleDeg);
  const rad = toRad(angle);
  const px = CENTER + RADIUS * Math.cos(rad);
  const py = CENTER - RADIUS * Math.sin(rad);
  const standard = isStandardAngle(angle);
  const exact = exactTrigValues(angle);
  const decimal = decimalTrigValues(angle);
  const vals = exact ?? decimal;
  const quadrant = quadrantOf(angle);
  const refAngle = referenceAngleDeg(angle);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const dx = x - CENTER;
    const dy = CENTER - y;
    let a = (Math.atan2(dy, dx) * 180) / Math.PI;
    a = normalizeDeg(Math.round(a));
    setAngleDeg(a);
  };

  const arcPath = () => {
    const steps = 24;
    const r = 28;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = (angle * i) / steps;
      const x = CENTER + r * Math.cos(toRad(t));
      const y = CENTER - r * Math.sin(toRad(t));
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">🔵 Unit Circle Explorer</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="grid md:grid-cols-[420px_1fr] gap-6">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full max-w-[420px] mx-auto touch-none select-none"
            onPointerDown={(e) => {
              setDragging(true);
              (e.target as Element).setPointerCapture(e.pointerId);
              updateFromPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (dragging) updateFromPointer(e.clientX, e.clientY);
            }}
            onPointerUp={() => setDragging(false)}
          >
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="rgba(192,132,252,0.05)" stroke="#a855f7" strokeWidth={2} />
            <line x1={CENTER - RADIUS - 20} y1={CENTER} x2={CENTER + RADIUS + 20} y2={CENTER} stroke="#6b21a8" strokeWidth={1} />
            <line x1={CENTER} y1={CENTER - RADIUS - 20} x2={CENTER} y2={CENTER + RADIUS + 20} stroke="#6b21a8" strokeWidth={1} />
            {STANDARD_ANGLES.map((a) => {
              const x = CENTER + RADIUS * Math.cos(toRad(a));
              const y = CENTER - RADIUS * Math.sin(toRad(a));
              return <circle key={a} cx={x} cy={y} r={3} fill="#c084fc" opacity={0.5} />;
            })}
            <path d={arcPath()} fill="none" stroke="#fbbf24" strokeWidth={2} />
            <line x1={CENTER} y1={CENTER} x2={px} y2={py} stroke="#fbbf24" strokeWidth={2.5} />
            <circle cx={px} cy={py} r={9} fill="#fbbf24" stroke="#78350f" strokeWidth={2} className="cursor-grab active:cursor-grabbing" />
            {!(quizMode && !revealed) && (
              <text x={px + (px > CENTER ? 12 : -12)} y={py + (py > CENTER ? 18 : -10)} fill="#fde68a" fontSize={13} textAnchor={px > CENTER ? 'start' : 'end'}>
                ({decimal.cos}, {decimal.sin})
              </text>
            )}
          </svg>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {STANDARD_ANGLES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAngleDeg(a)}
                  className={`px-2 py-1 rounded text-xs border ${
                    angle === a ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'
                  }`}
                >
                  {a}°
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setQuizMode((q) => !q);
                setRevealed(false);
              }}
              className="px-4 py-2 rounded-full border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/20 text-sm"
            >
              {quizMode ? '🙈 Quiz Mode: ON' : '👁️ Quiz Mode: OFF'}
            </button>

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5">
              {quizMode && !revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
                >
                  Reveal values
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Readout label="Angle" value={`${angle}°`} />
                  <Readout label="Radians" valueNode={<MathText text={`$${radianLabel(angle)}$`} />} />
                  <Readout label="Reference angle" value={`${refAngle}°`} />
                  <Readout label="Quadrant" value={quadrant === 'axis' ? 'On axis' : quadrant} />
                  <Readout label="x = cos θ" valueNode={<MathText text={`$${vals.cos}$`} />} />
                  <Readout label="y = sin θ" valueNode={<MathText text={`$${vals.sin}$`} />} />
                  <Readout label="tan θ" valueNode={<MathText text={`$${vals.tan}$`} />} />
                  <Readout label="cot θ" valueNode={<MathText text={`$${vals.cot}$`} />} />
                  <Readout label="sec θ" valueNode={<MathText text={`$${vals.sec}$`} />} />
                  <Readout label="csc θ" valueNode={<MathText text={`$${vals.csc}$`} />} />
                </div>
              )}
              {!standard && (
                <p className="text-[11px] text-purple-400 mt-3">
                  Decimal approximation shown — drag to one of the 16 marked points for exact values.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value, valueNode }: { label: string; value?: string; valueNode?: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-purple-500/20 pb-1">
      <span className="text-purple-400">{label}</span>
      <span className="text-amber-100 font-mono">{valueNode ?? value}</span>
    </div>
  );
}
