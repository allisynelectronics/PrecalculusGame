import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MathText } from './Math';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

type CaseKind = 'SAS' | 'SSS' | 'ASA' | 'SSA';

interface Solution {
  a: number; b: number; c: number; // sides opposite A, B, C
  A: number; B: number; C: number; // angles in degrees
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

/** Solves SAS: sides a, b with included angle C (degrees). */
function solveSAS(a: number, b: number, C: number): Solution[] {
  const Crad = C * D2R;
  const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(Crad));
  // Law of Sines for the smaller of a/b (avoids the ambiguous-angle risk when solving
  // for the larger side's angle from an acute triangle).
  const Arad = Math.asin((a * Math.sin(Crad)) / c);
  const A = Arad * R2D;
  const B = 180 - A - C;
  return [{ a, b, c, A, B, C }];
}

/** Solves SSS: three sides. */
function solveSSS(a: number, b: number, c: number): Solution[] | null {
  if (a + b <= c || a + c <= b || b + c <= a) return null; // triangle inequality fails
  const A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * R2D;
  const B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * R2D;
  const C = 180 - A - B;
  return [{ a, b, c, A, B, C }];
}

/** Solves ASA/AAS: angles A, B (degrees) and the side c opposite C = 180-A-B. */
function solveASA(A: number, B: number, c: number): Solution[] | null {
  const C = 180 - A - B;
  if (C <= 0) return null;
  const Crad = C * D2R;
  const a = (c * Math.sin(A * D2R)) / Math.sin(Crad);
  const b = (c * Math.sin(B * D2R)) / Math.sin(Crad);
  return [{ a, b, c, A, B, C }];
}

/** Solves SSA (the ambiguous case): sides a, b with non-included angle A (degrees)
 *  opposite side a. Returns 0, 1, or 2 valid triangles. */
function solveSSA(a: number, b: number, A: number): Solution[] {
  const Arad = A * D2R;
  const sinB = (b * Math.sin(Arad)) / a;
  if (sinB > 1 + 1e-9) return []; // no triangle
  const results: Solution[] = [];
  const B1 = Math.asin(Math.min(1, sinB)) * R2D;
  const B2 = 180 - B1;
  for (const B of sinB >= 1 - 1e-9 ? [90] : [B1, B2]) {
    const C = 180 - A - B;
    if (C <= 0) continue;
    const c = (a * Math.sin(C * D2R)) / Math.sin(Arad);
    results.push({ a, b, c, A, B, C });
    if (sinB >= 1 - 1e-9) break; // right-angle case: exactly one triangle
  }
  // De-duplicate the case B1 === B2 (90 degrees handled above) and avoid listing the
  // same triangle twice when B1 and B2 coincide for other floating-point reasons.
  if (results.length === 2 && Math.abs(results[0].B - results[1].B) < 1e-6) return [results[0]];
  return results;
}

/** Vertex coordinates placing side c (between A and B) along the x-axis, for drawing. */
function triangleVertices(sol: Solution) {
  const Avert = { x: 0, y: 0 };
  const Bvert = { x: sol.c, y: 0 };
  const Cvert = { x: sol.b * Math.cos(sol.A * D2R), y: sol.b * Math.sin(sol.A * D2R) };
  return { A: Avert, B: Bvert, C: Cvert };
}

export function ObliqueTriangleSolver() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [kind, setKind] = useState<CaseKind>('SAS');
  const [v1, setV1] = useState(8);
  const [v2, setV2] = useState(6);
  const [v3, setV3] = useState(50);

  const solutions = useMemo(() => {
    try {
      if (kind === 'SAS') return solveSAS(v1, v2, v3);
      if (kind === 'SSS') return solveSSS(v1, v2, v3) ?? [];
      if (kind === 'ASA') return solveASA(v1, v2, v3) ?? [];
      return solveSSA(v1, v2, v3);
    } catch {
      return [];
    }
  }, [kind, v1, v2, v3]);

  const labels: Record<CaseKind, [string, string, string]> = {
    SAS: ['Side a', 'Side b', 'Included angle C (°)'],
    SSS: ['Side a', 'Side b', 'Side c'],
    ASA: ['Angle A (°)', 'Angle B (°)', 'Side c (opposite C)'],
    SSA: ['Side a (opposite A)', 'Side b', 'Angle A (°)'],
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-amber-200">📐 Oblique Triangle Solver</h1>
          <button
            onClick={() => setScreen('board')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm"
          >
            ← Back to Board
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(['SAS', 'SSS', 'ASA', 'SSA'] as CaseKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-4 py-1.5 rounded-full text-sm border ${
                kind === k ? 'bg-amber-500 text-black border-amber-300' : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'
              }`}
            >
              {k === 'SAS' && 'SAS (Law of Cosines)'}
              {k === 'SSS' && 'SSS (Law of Cosines)'}
              {k === 'ASA' && 'ASA/AAS (Law of Sines)'}
              {k === 'SSA' && 'SSA — Ambiguous Case'}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4 bg-black/40 border border-purple-400/30 rounded-2xl p-5">
          <NumberField label={labels[kind][0]} value={v1} onChange={setV1} />
          <NumberField label={labels[kind][1]} value={v2} onChange={setV2} />
          <NumberField label={labels[kind][2]} value={v3} onChange={setV3} />
        </div>

        {solutions.length === 0 && (
          <div className="bg-rose-500/10 border border-rose-400/30 rounded-2xl p-5 text-rose-200 text-center">
            No valid triangle exists for these values.
            {kind === 'SSS' && ' (The triangle inequality isn’t satisfied — one side is too long relative to the other two.)'}
            {kind === 'SSA' && ' (Side a is too short to reach back to the opposite side — try a larger side a, a smaller side b, or a smaller angle A.)'}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {solutions.map((sol, i) => (
            <TriangleCard key={i} sol={sol} label={solutions.length > 1 ? `Triangle ${i + 1} of 2` : undefined} />
          ))}
        </div>

        {kind === 'SSA' && solutions.length === 2 && (
          <p className="text-center text-sm text-fuchsia-300 mt-4">
            This is the ambiguous case in action: the same given information (two sides and a
            non-included angle) produces two genuinely different triangles. Notice angle B and B'
            are supplementary (B + B' = 180°).
          </p>
        )}
      </div>
    </div>
  );
}

function TriangleCard({ sol, label }: { sol: Solution; label?: string }) {
  const { A: Av, B: Bv, C: Cv } = triangleVertices(sol);
  const pts = [Av, Bv, Cv];
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const pad = Math.max(w, h) * 0.25;
  const viewW = w + pad * 2;
  const viewH = h + pad * 2;
  const tx = (p: { x: number; y: number }) => ({ x: p.x - minX + pad, y: viewH - (p.y - minY + pad) });
  const [av, bv, cv] = pts.map(tx);

  return (
    <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5">
      {label && <p className="text-xs text-fuchsia-300 uppercase mb-2 text-center">{label}</p>}
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full max-h-[220px] mx-auto">
        <polygon
          points={`${av.x},${av.y} ${bv.x},${bv.y} ${cv.x},${cv.y}`}
          fill="rgba(251,191,36,0.08)"
          stroke="#fbbf24"
          strokeWidth={Math.max(w, h) * 0.015}
        />
        <text x={av.x} y={av.y + (av.y > viewH / 2 ? 14 : -6)} fill="#c4b5fd" fontSize={viewH * 0.06} textAnchor="middle">A</text>
        <text x={bv.x} y={bv.y + (bv.y > viewH / 2 ? 14 : -6)} fill="#c4b5fd" fontSize={viewH * 0.06} textAnchor="middle">B</text>
        <text x={cv.x} y={cv.y + (cv.y > viewH / 2 ? 14 : -6)} fill="#c4b5fd" fontSize={viewH * 0.06} textAnchor="middle">C</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mt-2">
        <Readout label="a (opp. A)" value={fmt(sol.a)} />
        <Readout label="Angle A" valueNode={<MathText text={`$${fmt(sol.A)}^\\circ$`} />} />
        <Readout label="b (opp. B)" value={fmt(sol.b)} />
        <Readout label="Angle B" valueNode={<MathText text={`$${fmt(sol.B)}^\\circ$`} />} />
        <Readout label="c (opp. C)" value={fmt(sol.c)} />
        <Readout label="Angle C" valueNode={<MathText text={`$${fmt(sol.C)}^\\circ$`} />} />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-purple-300 mb-1">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100 focus:outline-none focus:border-amber-400"
      />
    </label>
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
