import { useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const SIZE = 460;
const CENTER = SIZE / 2;
const SCALE = 30; // px per unit
const GRID_UNITS = 7;

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

function toPx(x: number, y: number) {
  return { px: CENTER + x * SCALE, py: CENTER - y * SCALE };
}

function magnitude(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}
function directionDeg(x: number, y: number) {
  let a = (Math.atan2(y, x) * 180) / Math.PI;
  if (a < 0) a += 360;
  return a;
}

type DraggingWhich = 'u' | 'v' | null;

export function VectorSimulator() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [u, setU] = useState({ x: 4, y: 2 });
  const [v, setV] = useState({ x: 1, y: 3 });
  const [showSum, setShowSum] = useState(true);
  const [dragging, setDragging] = useState<DraggingWhich>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const updateFromPointer = (which: DraggingWhich, clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg || !which) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const ux = Math.round(((x - CENTER) / SCALE) * 4) / 4; // snap to quarter-units
    const uy = Math.round(((CENTER - y) / SCALE) * 4) / 4;
    if (which === 'u') setU({ x: ux, y: uy });
    else setV({ x: ux, y: uy });
  };

  const magU = magnitude(u.x, u.y);
  const magV = magnitude(v.x, v.y);
  const dirU = directionDeg(u.x, u.y);
  const dirV = directionDeg(v.x, v.y);
  const dot = u.x * v.x + u.y * v.y;
  const angleBetween = magU > 0 && magV > 0 ? (Math.acos(Math.max(-1, Math.min(1, dot / (magU * magV)))) * 180) / Math.PI : 0;
  const sum = { x: u.x + v.x, y: u.y + v.y };

  const uTip = toPx(u.x, u.y);
  const vTip = toPx(v.x, v.y);
  const sumTip = toPx(sum.x, sum.y);
  const origin = toPx(0, 0);

  const gridLines = [];
  for (let i = -GRID_UNITS; i <= GRID_UNITS; i++) gridLines.push(i);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">➡️ Vector Simulator</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="grid md:grid-cols-[460px_1fr] gap-6">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full max-w-[460px] mx-auto touch-none select-none"
            onPointerMove={(e) => dragging && updateFromPointer(dragging, e.clientX, e.clientY)}
            onPointerUp={() => setDragging(null)}
          >
            <defs>
              <marker id="arrow-u" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#fbbf24" />
              </marker>
              <marker id="arrow-v" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#22d3ee" />
              </marker>
              <marker id="arrow-sum" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#4ade80" />
              </marker>
            </defs>

            {gridLines.map((i) => (
              <g key={i}>
                <line x1={toPx(i, -GRID_UNITS).px} y1={toPx(i, -GRID_UNITS).py} x2={toPx(i, GRID_UNITS).px} y2={toPx(i, GRID_UNITS).py} stroke="#581c87" strokeWidth={1} opacity={0.25} />
                <line x1={toPx(-GRID_UNITS, i).px} y1={toPx(-GRID_UNITS, i).py} x2={toPx(GRID_UNITS, i).px} y2={toPx(GRID_UNITS, i).py} stroke="#581c87" strokeWidth={1} opacity={0.25} />
              </g>
            ))}
            <line x1={toPx(-GRID_UNITS, 0).px} y1={toPx(-GRID_UNITS, 0).py} x2={toPx(GRID_UNITS, 0).px} y2={toPx(GRID_UNITS, 0).py} stroke="#a855f7" strokeWidth={1.5} />
            <line x1={toPx(0, -GRID_UNITS).px} y1={toPx(0, -GRID_UNITS).py} x2={toPx(0, GRID_UNITS).px} y2={toPx(0, GRID_UNITS).py} stroke="#a855f7" strokeWidth={1.5} />

            {showSum && (
              <>
                {/* parallelogram construction lines */}
                <line x1={uTip.px} y1={uTip.py} x2={sumTip.px} y2={sumTip.py} stroke="#22d3ee" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
                <line x1={vTip.px} y1={vTip.py} x2={sumTip.px} y2={sumTip.py} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
                <line x1={origin.px} y1={origin.py} x2={sumTip.px} y2={sumTip.py} stroke="#4ade80" strokeWidth={2.5} markerEnd="url(#arrow-sum)" />
              </>
            )}

            <line x1={origin.px} y1={origin.py} x2={uTip.px} y2={uTip.py} stroke="#fbbf24" strokeWidth={2.5} markerEnd="url(#arrow-u)" />
            <circle
              cx={uTip.px}
              cy={uTip.py}
              r={10}
              fill="#fbbf24"
              opacity={0.01}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                setDragging('u');
                (e.target as Element).setPointerCapture(e.pointerId);
              }}
            />
            <circle cx={uTip.px} cy={uTip.py} r={6} fill="#fbbf24" stroke="#78350f" strokeWidth={1.5} className="pointer-events-none" />

            <line x1={origin.px} y1={origin.py} x2={vTip.px} y2={vTip.py} stroke="#22d3ee" strokeWidth={2.5} markerEnd="url(#arrow-v)" />
            <circle
              cx={vTip.px}
              cy={vTip.py}
              r={10}
              fill="#22d3ee"
              opacity={0.01}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                setDragging('v');
                (e.target as Element).setPointerCapture(e.pointerId);
              }}
            />
            <circle cx={vTip.px} cy={vTip.py} r={6} fill="#22d3ee" stroke="#164e63" strokeWidth={1.5} className="pointer-events-none" />
          </svg>

          <div className="space-y-4">
            <p className="text-xs text-purple-400">Drag the amber (u) or cyan (v) arrowhead to change each vector.</p>

            <button
              onClick={() => setShowSum((s) => !s)}
              className="w-full px-4 py-2 rounded-full border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/20 text-sm"
            >
              {showSum ? '✅ Showing u + v' : '➕ Show u + v'}
            </button>

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-1 text-sm">
              <p className="text-amber-300 font-semibold mb-1">u</p>
              <Readout label="Component form" valueNode={<MathText text={`$\\langle ${fmt(u.x)}, ${fmt(u.y)} \\rangle$`} />} />
              <Readout label="Magnitude |u|" value={fmt(magU)} />
              <Readout label="Direction angle" valueNode={<MathText text={`$${fmt(dirU)}^\\circ$`} />} />
            </div>

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-1 text-sm">
              <p className="text-cyan-300 font-semibold mb-1">v</p>
              <Readout label="Component form" valueNode={<MathText text={`$\\langle ${fmt(v.x)}, ${fmt(v.y)} \\rangle$`} />} />
              <Readout label="Magnitude |v|" value={fmt(magV)} />
              <Readout label="Direction angle" valueNode={<MathText text={`$${fmt(dirV)}^\\circ$`} />} />
            </div>

            <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 space-y-1 text-sm">
              <p className="text-purple-200 font-semibold mb-1">u and v together</p>
              {showSum && <Readout label="u + v" valueNode={<MathText text={`$\\langle ${fmt(sum.x)}, ${fmt(sum.y)} \\rangle$`} />} />}
              <Readout label="Dot product u · v" value={fmt(dot)} />
              <Readout label="Angle between u and v" valueNode={<MathText text={`$${fmt(angleBetween)}^\\circ$`} />} />
              <Readout
                label="Relationship"
                value={
                  Math.abs(dot) < 0.05 ? 'Orthogonal (u · v ≈ 0)' :
                  Math.abs(magU * magV - Math.abs(dot)) < 0.05 ? 'Parallel' : '—'
                }
              />
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
