import { evaluate, parse } from 'mathjs';

const EPS = 1e-6;

/** Finds the index of the `}` that matches the `{` at openIndex. */
function findMatchingBrace(str: string, openIndex: number): number {
  let depth = 1;
  let i = openIndex + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') depth--;
    i++;
  }
  return i - 1;
}

/**
 * Converts common LaTeX math input (as a student might type or paste from a
 * textbook/LMS like Pearson) into mathjs-parseable syntax: \frac{a}{b}, \sqrt{a},
 * \sqrt[n]{a}, x^{a}, \cdot, \times, \div, \pi, \left( \right), etc.
 */
function convertLatex(input: string): string {
  let s = input;

  s = s.replace(/\\left/g, '').replace(/\\right/g, '');

  // \frac{A}{B} -> ((A)/(B)), repeated until none remain (handles nesting).
  for (let guard = 0; guard < 50; guard++) {
    const idx = s.indexOf('\\frac');
    if (idx === -1) break;
    let i = idx + 5;
    if (s[i] !== '{') break;
    const closeA = findMatchingBrace(s, i);
    const A = s.slice(i + 1, closeA);
    const j = closeA + 1;
    if (s[j] !== '{') break;
    const closeB = findMatchingBrace(s, j);
    const B = s.slice(j + 1, closeB);
    s = s.slice(0, idx) + `((${A})/(${B}))` + s.slice(closeB + 1);
  }

  // \sqrt{A} or \sqrt[n]{A} -> sqrt((A)) or nthRoot((A),n), repeated until none remain.
  for (let guard = 0; guard < 50; guard++) {
    const idx = s.indexOf('\\sqrt');
    if (idx === -1) break;
    let i = idx + 5;
    let n = '';
    if (s[i] === '[') {
      const closeBr = s.indexOf(']', i);
      if (closeBr === -1) break;
      n = s.slice(i + 1, closeBr);
      i = closeBr + 1;
    }
    if (s[i] !== '{') break;
    const closeA = findMatchingBrace(s, i);
    const A = s.slice(i + 1, closeA);
    const replacement = n ? `nthRoot((${A}),${n})` : `sqrt((${A}))`;
    s = s.slice(0, idx) + replacement + s.slice(closeA + 1);
  }

  // Exponent braces: ^{A} -> ^(A), repeated until none remain.
  for (let guard = 0; guard < 50; guard++) {
    const idx = s.indexOf('^{');
    if (idx === -1) break;
    const openBrace = idx + 1;
    const close = findMatchingBrace(s, openBrace);
    const A = s.slice(openBrace + 1, close);
    s = s.slice(0, idx) + `^(${A})` + s.slice(close + 1);
  }

  s = s
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pi/g, 'pi')
    .replace(/\\,|\\;|\\!|\\ /g, '')
    .replace(/\\/g, ''); // strip any remaining stray backslashes (e.g. \theta -> theta)

  return s;
}

/** Normalize common calculator/typing shorthand into mathjs-parseable syntax. */
function normalize(raw: string): string {
  const latexConverted = convertLatex(raw.trim());
  return latexConverted
    .trim()
    .replace(/\s+/g, '')
    .replace(/÷/g, '/')
    .replace(/×/g, '*')
    .replace(/√\(/g, 'sqrt(')
    .replace(/√(\d+)/g, 'sqrt($1)')
    .replace(/\bpi\b/gi, 'pi')
    .replace(/\be\^/g, 'e^')
    .replace(/,}/g, '');
}

function tryEvaluateNumeric(expr: string, scope: Record<string, number> = {}): number | null {
  try {
    const v = evaluate(normalize(expr), scope);
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v && typeof v.re === 'number' && Math.abs(v.im) < EPS) return v.re;
    return null;
  } catch {
    return null;
  }
}

/** Exact numeric equivalence (handles fractions, radicals, pi, decimals). */
export function checkNumeric(studentAnswer: string, correctAnswer: string): boolean {
  const a = tryEvaluateNumeric(studentAnswer);
  const b = tryEvaluateNumeric(correctAnswer);
  if (a === null || b === null) return false;
  // Problems that ask for a rounded decimal store the already-rounded value as the
  // answer, so this only needs to absorb floating-point noise, not rounding error.
  return Math.abs(a - b) < Math.max(1e-4, Math.abs(b) * 1e-5);
}

/** Checks algebraic-expression equivalence by sampling the variable at several points. */
export function checkExpressionEquivalence(
  studentAnswer: string,
  correctAnswer: string,
  variable = 'x',
): boolean {
  try {
    parse(normalize(studentAnswer));
  } catch {
    return false;
  }
  const samplePoints = [0.3, 1.7, -2.1, 3.3, 5.5, -0.9];
  let comparedAny = false;
  for (const p of samplePoints) {
    const a = tryEvaluateNumeric(studentAnswer, { [variable]: p });
    const b = tryEvaluateNumeric(correctAnswer, { [variable]: p });
    // If the correct answer is undefined at this point (asymptote, etc.) skip it.
    if (b === null) continue;
    comparedAny = true;
    if (a === null) return false;
    if (Math.abs(a - b) > 1e-4) return false;
  }
  // If the stored answer never evaluated at any sample point, we can't vouch for a
  // match — treat it as a content/authoring error rather than vacuously accepting.
  return comparedAny;
}

/** Same idea as checkExpressionEquivalence, but for expressions in two variables
 *  (e.g. difference quotients that are genuinely functions of both x and h). */
export function checkExpressionEquivalence2(
  studentAnswer: string,
  correctAnswer: string,
  var1 = 'x',
  var2 = 'h',
): boolean {
  try {
    parse(normalize(studentAnswer));
  } catch {
    return false;
  }
  const samplePairs: [number, number][] = [
    [0.3, 0.7],
    [1.7, 0.4],
    [-2.1, 0.9],
    [3.3, 1.1],
    [5.5, 0.2],
    [-0.9, 1.3],
  ];
  let comparedAny = false;
  for (const [v1, v2] of samplePairs) {
    const scope = { [var1]: v1, [var2]: v2 };
    const a = tryEvaluateNumeric(studentAnswer, scope);
    const b = tryEvaluateNumeric(correctAnswer, scope);
    if (b === null) continue;
    comparedAny = true;
    if (a === null) return false;
    if (Math.abs(a - b) > 1e-4) return false;
  }
  return comparedAny;
}

/** Splits a multi-solution answer string on commas, "or", and ";" delimiters. */
function splitSolutions(raw: string): string[] {
  return raw
    .split(/,|\bor\b|;/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Order-independent comparison of solution sets, e.g. "x = 3, -3" vs "-3, 3". */
export function checkSolutionSet(studentAnswer: string, correctAnswer: string): boolean {
  const stripVar = (s: string) => s.replace(/^[a-zA-Z]\s*=\s*/, '');
  const studentVals = splitSolutions(studentAnswer)
    .map(stripVar)
    .map((s) => tryEvaluateNumeric(s));
  const correctVals = splitSolutions(correctAnswer)
    .map(stripVar)
    .map((s) => tryEvaluateNumeric(s));

  if (correctVals.some((v) => v === null)) return false;
  if (studentVals.length !== correctVals.length) return false;
  if (studentVals.some((v) => v === null)) return false;

  const used = new Array(correctVals.length).fill(false);
  for (const sv of studentVals as number[]) {
    const idx = (correctVals as number[]).findIndex(
      (cv, i) => !used[i] && Math.abs(cv - sv) < 1e-4,
    );
    if (idx === -1) return false;
    used[idx] = true;
  }
  return true;
}

/** Compares complex numbers written as e.g. "3-2i", "-1+3i", "4i". */
export function checkComplex(studentAnswer: string, correctAnswer: string): boolean {
  try {
    const a = evaluate(normalize(studentAnswer));
    const b = evaluate(normalize(correctAnswer));
    const are = typeof a === 'object' && a !== null && 're' in a ? (a as { re: number }).re : (a as number);
    const aim = typeof a === 'object' && a !== null && 'im' in a ? (a as { im: number }).im : 0;
    const bre = typeof b === 'object' && b !== null && 're' in b ? (b as { re: number }).re : (b as number);
    const bim = typeof b === 'object' && b !== null && 'im' in b ? (b as { im: number }).im : 0;
    if (typeof are !== 'number' || typeof bre !== 'number') return false;
    return Math.abs(are - bre) < 1e-4 && Math.abs(aim - bim) < 1e-4;
  } catch {
    return false;
  }
}

function splitEquation(s: string): [string, string] | null {
  const parts = s.split('=');
  if (parts.length !== 2) return null;
  return [parts[0].trim(), parts[1].trim()];
}

/** Compares two lines that may be bare expressions OR full equations (e.g. "3x = 15"). */
export function checkEquationLine(student: string, correct: string, variable = 'x'): boolean {
  const sParts = splitEquation(student);
  const cParts = splitEquation(correct);
  if (!sParts || !cParts) {
    return checkExpressionEquivalence(student, correct, variable) || checkNumeric(student, correct);
  }
  const sDiff = `(${sParts[0]})-(${sParts[1]})`;
  const cDiff = `(${cParts[0]})-(${cParts[1]})`;
  return checkExpressionEquivalence(sDiff, cDiff, variable);
}

/** Splits a union of intervals on "U"/"∪"/"or". */
function splitUnion(raw: string): string[] {
  return raw
    .split(/∪|\bu\b|\bor\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseBound(raw: string): number | null {
  const t = raw.trim().toLowerCase().replace(/∞/g, 'infinity').replace(/infty/g, 'infinity');
  if (t === 'infinity' || t === '+infinity') return Infinity;
  if (t === '-infinity') return -Infinity;
  return tryEvaluateNumeric(raw);
}

interface ParsedInterval {
  leftBracket: string;
  rightBracket: string;
  lo: number;
  hi: number;
}

function parseSingleInterval(raw: string): ParsedInterval | null {
  const s = raw.trim();
  if (s.length < 3) return null;
  const leftBracket = s[0];
  const rightBracket = s[s.length - 1];
  if (leftBracket !== '(' && leftBracket !== '[') return null;
  if (rightBracket !== ')' && rightBracket !== ']') return null;
  const inner = s.slice(1, -1);
  const commaIdx = inner.indexOf(',');
  if (commaIdx === -1) return null;
  const lo = parseBound(inner.slice(0, commaIdx));
  const hi = parseBound(inner.slice(commaIdx + 1));
  if (lo === null || hi === null) return null;
  return { leftBracket, rightBracket, lo, hi };
}

/** Compares interval notation (or a union of intervals) by numerically evaluating
 *  each endpoint via mathjs, so symbolic bounds like "pi+2" compare correctly
 *  against "2+pi" and not just exact text. */
export function checkInterval(studentAnswer: string, correctAnswer: string): boolean {
  const studentParts = splitUnion(studentAnswer).map(parseSingleInterval);
  const correctParts = splitUnion(correctAnswer).map(parseSingleInterval);
  if (correctParts.length === 0 || correctParts.some((p) => p === null)) return false;
  if (studentParts.length !== correctParts.length || studentParts.some((p) => p === null)) return false;

  const boundsMatch = (a: number, b: number) => (a === b ? true : Math.abs(a - b) < 1e-4);

  const used = new Array(correctParts.length).fill(false);
  for (const sp of studentParts as ParsedInterval[]) {
    const idx = (correctParts as ParsedInterval[]).findIndex(
      (cp, i) =>
        !used[i] &&
        cp.leftBracket === sp.leftBracket &&
        cp.rightBracket === sp.rightBracket &&
        boundsMatch(cp.lo, sp.lo) &&
        boundsMatch(cp.hi, sp.hi),
    );
    if (idx === -1) return false;
    used[idx] = true;
  }
  return true;
}
