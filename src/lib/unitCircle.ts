export const STANDARD_ANGLES = [
  0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330,
];

const RADIAN_LABEL: Record<number, string> = {
  0: '0',
  30: '\\frac{\\pi}{6}',
  45: '\\frac{\\pi}{4}',
  60: '\\frac{\\pi}{3}',
  90: '\\frac{\\pi}{2}',
  120: '\\frac{2\\pi}{3}',
  135: '\\frac{3\\pi}{4}',
  150: '\\frac{5\\pi}{6}',
  180: '\\pi',
  210: '\\frac{7\\pi}{6}',
  225: '\\frac{5\\pi}{4}',
  240: '\\frac{4\\pi}{3}',
  270: '\\frac{3\\pi}{2}',
  300: '\\frac{5\\pi}{3}',
  315: '\\frac{7\\pi}{4}',
  330: '\\frac{11\\pi}{6}',
};

interface RefValues {
  sin: string;
  cos: string;
  tan: string;
  csc: string;
  sec: string;
  cot: string;
}

const REF_TABLE: Record<number, RefValues> = {
  0: { sin: '0', cos: '1', tan: '0', csc: '\\text{undef}', sec: '1', cot: '\\text{undef}' },
  30: { sin: '\\frac{1}{2}', cos: '\\frac{\\sqrt3}{2}', tan: '\\frac{\\sqrt3}{3}', csc: '2', sec: '\\frac{2\\sqrt3}{3}', cot: '\\sqrt3' },
  45: { sin: '\\frac{\\sqrt2}{2}', cos: '\\frac{\\sqrt2}{2}', tan: '1', csc: '\\sqrt2', sec: '\\sqrt2', cot: '1' },
  60: { sin: '\\frac{\\sqrt3}{2}', cos: '\\frac{1}{2}', tan: '\\sqrt3', csc: '\\frac{2\\sqrt3}{3}', sec: '2', cot: '\\frac{\\sqrt3}{3}' },
  90: { sin: '1', cos: '0', tan: '\\text{undef}', csc: '1', sec: '\\text{undef}', cot: '0' },
};

export function normalizeDeg(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

export function quadrantOf(deg: number): string {
  const d = normalizeDeg(deg);
  if (d === 0 || d === 90 || d === 180 || d === 270) return 'axis';
  if (d < 90) return 'I';
  if (d < 180) return 'II';
  if (d < 270) return 'III';
  return 'IV';
}

export function referenceAngleDeg(deg: number): number {
  const d = normalizeDeg(deg);
  if (d <= 90) return d;
  if (d <= 180) return 180 - d;
  if (d <= 270) return d - 180;
  return 360 - d;
}

export function isStandardAngle(deg: number): boolean {
  const d = normalizeDeg(deg);
  return STANDARD_ANGLES.includes(d) || d === 360;
}

export function radianLabel(deg: number): string {
  const d = normalizeDeg(deg);
  return RADIAN_LABEL[d] ?? `${(d * (Math.PI / 180)).toFixed(3)}`;
}

function sign(v: string, negative: boolean): string {
  if (v === '0' || v === '\\text{undef}') return v;
  return negative ? `-${v}` : v;
}

/** Exact trig values at a standard unit-circle angle, as KaTeX strings. Null if not standard. */
export function exactTrigValues(deg: number): RefValues | null {
  const d = normalizeDeg(deg);
  if (!isStandardAngle(d)) return null;
  const ref = referenceAngleDeg(d);
  const base = REF_TABLE[ref];
  const sinNeg = d > 180 && d < 360;
  const cosNeg = d > 90 && d < 270;
  const tanNeg = sinNeg !== cosNeg;
  return {
    sin: sign(base.sin, sinNeg),
    cos: sign(base.cos, cosNeg),
    tan: sign(base.tan, tanNeg),
    csc: sign(base.csc, sinNeg),
    sec: sign(base.sec, cosNeg),
    cot: sign(base.cot, tanNeg),
  };
}

export function decimalTrigValues(deg: number) {
  const rad = (deg * Math.PI) / 180;
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const fmt = (v: number) => (Math.abs(v) < 1e-9 ? '0' : v.toFixed(3));
  const safeDiv = (v: number) => (Math.abs(v) < 1e-9 ? '\\text{undef}' : fmt(1 / v));
  return {
    sin: fmt(s),
    cos: fmt(c),
    tan: Math.abs(c) < 1e-9 ? '\\text{undef}' : fmt(s / c),
    csc: safeDiv(s),
    sec: safeDiv(c),
    cot: Math.abs(s) < 1e-9 ? '\\text{undef}' : fmt(c / s),
  };
}
