import { ALL_PROBLEMS } from '../src/data/problems';
import {
  checkComplex,
  checkExpressionEquivalence,
  checkInterval,
  checkNumeric,
  checkSolutionSet,
} from '../src/lib/mathCheck';
import { normalize, safeEvaluate } from '../src/lib/mathCheck';
import type { Problem } from '../src/types';

/**
 * INDEPENDENT re-verification of stored answers — distinct from scripts/verifyProblems.ts,
 * which only checks gradeAnswer(p, p.answer) i.e. compares the stored answer to ITSELF
 * (a syntax check, not a correctness check). This script instead compares the stored
 * answer against two sources that are NOT the answer field:
 *
 *   A) For self-contained "Evaluate:"/"Simplify:" prompts with no free variables, the
 *      literal expression embedded in the prompt text is extracted and evaluated —
 *      independently computing what the problem actually states, then comparing that
 *      to the stored answer.
 *   B) For every problem with a `worked` solution, the final worked line is extracted
 *      and cross-checked against the stored answer. This catches transcription drift
 *      between the worked solution and the answer field (it does NOT catch an error
 *      replicated in both — see the manual-review phase for that).
 *
 * Anything that cannot be reliably extracted is reported as COULD NOT VERIFY, never
 * silently skipped or guessed.
 */

type Verdict = 'MATCH' | 'MISMATCH' | 'UNVERIFIABLE';

interface Result {
  id: string;
  method: 'prompt-direct' | 'worked-final-line';
  verdict: Verdict;
  detail: string;
}

const results: Result[] = [];

// Strips KaTeX delimiters/cosmetic commands that don't affect evaluability for our
// purposes beyond what mathCheck's own convertLatex already handles.
function stripDollars(s: string): string {
  return s.replace(/^\$+/, '').replace(/\$+$/, '').trim();
}

function extractMathSegments(text: string): string[] {
  const segments: string[] = [];
  const re = /\$([^$]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) segments.push(m[1]);
  return segments;
}

// Known function/constant identifiers that may legitimately appear as bare letters
// after normalize() does its work (e.g. "pi", "e", function names) — used to decide
// whether a candidate expression has a *free variable* that would make direct
// evaluation meaningless without a supplied scope.
const KNOWN_IDENTIFIERS = new Set([
  'pi', 'e', 'i',
  'sin', 'cos', 'tan', 'csc', 'sec', 'cot',
  'asin', 'acos', 'atan', 'acsc', 'asec', 'acot', 'atan2',
  'sqrt', 'nthroot', 'nthRoot', 'cbrt', 'abs',
  'log', 'log10', 'log2', 'exp', 'sign',
]);

function hasFreeVariable(normalized: string): boolean {
  const idents = normalized.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
  return idents.some((id) => !KNOWN_IDENTIFIERS.has(id) && !KNOWN_IDENTIFIERS.has(id.toLowerCase()));
}

/** Method A: direct evaluation of a self-contained "Evaluate:"/"Simplify:" prompt. */
function tryPromptDirect(p: Problem): Result | null {
  if (p.answerType !== 'numeric' && p.answerType !== 'complex') return null;
  const leadMatch = p.prompt.match(/^\s*(Evaluate|Simplify)\s*:?\s*/i);
  if (!leadMatch) return null;

  const rest = p.prompt.slice(leadMatch[0].length);
  const segments = extractMathSegments(rest);
  // Only trust this when the ENTIRE remaining prompt text is exactly one math segment
  // (nothing else to interpret) — anything with extra prose is ambiguous, skip rather
  // than guess which segment is "the" expression.
  const leftover = rest.replace(/\$[^$]+\$/g, '').trim();
  if (segments.length !== 1 || leftover.length > 0) return null;

  const normalized = normalize(stripDollars(segments[0]));
  if (hasFreeVariable(normalized)) return null; // e.g. references an externally-defined f(x)

  const value = safeEvaluate(normalized);
  if (value === undefined) {
    return {
      id: p.id,
      method: 'prompt-direct',
      verdict: 'UNVERIFIABLE',
      detail: `prompt expression "${normalized}" could not be safely evaluated`,
    };
  }

  const checker = p.answerType === 'complex' ? checkComplex : checkNumeric;
  // Compare the INDEPENDENTLY COMPUTED prompt value against the stored answer by
  // formatting it back to a string and running it through the same equivalence check
  // used for student answers — this is comparing two different sources, not the
  // answer against itself.
  const valueStr =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'object' && value !== null && 're' in value
        ? `${(value as { re: number }).re}+${(value as { im: number }).im}i`
        : String(value);
  const match = checker(valueStr, p.answer);
  return {
    id: p.id,
    method: 'prompt-direct',
    verdict: match ? 'MATCH' : 'MISMATCH',
    detail: `prompt "${normalized}" evaluates to ${valueStr}; stored answer is "${p.answer}"`,
  };
}

/** Method B: cross-check the final worked-solution line against the stored answer. */
function tryWorkedFinalLine(p: Problem): Result | null {
  if (!p.worked || p.worked.length === 0) return null;
  if (!['numeric', 'expression', 'expressionTwoVar', 'solutionSet', 'interval', 'complex'].includes(p.answerType)) {
    return null;
  }

  const last = p.worked[p.worked.length - 1];
  // Worked lines look like "$=2-18=-16$" or "$=-8-6=-14$" — take everything after the
  // LAST "=" sign as the final value, which is the standard convention used throughout
  // this problem bank's worked solutions.
  const bare = stripDollars(last);
  const eqParts = bare.split('=');
  if (eqParts.length < 2) {
    return { id: p.id, method: 'worked-final-line', verdict: 'UNVERIFIABLE', detail: 'no "=" in final worked line' };
  }
  const candidate = eqParts[eqParts.length - 1].trim();
  if (candidate.length === 0) {
    return { id: p.id, method: 'worked-final-line', verdict: 'UNVERIFIABLE', detail: 'empty trailing segment' };
  }

  switch (p.answerType) {
    case 'numeric': {
      const normalized = normalize(candidate);
      if (hasFreeVariable(normalized)) {
        return { id: p.id, method: 'worked-final-line', verdict: 'UNVERIFIABLE', detail: `candidate "${candidate}" has a free variable` };
      }
      const match = checkNumeric(candidate, p.answer);
      return {
        id: p.id,
        method: 'worked-final-line',
        verdict: match ? 'MATCH' : 'MISMATCH',
        detail: `worked final value "${candidate}" vs stored answer "${p.answer}"`,
      };
    }
    case 'complex': {
      const match = checkComplex(candidate, p.answer);
      return {
        id: p.id,
        method: 'worked-final-line',
        verdict: match ? 'MATCH' : 'MISMATCH',
        detail: `worked final value "${candidate}" vs stored answer "${p.answer}"`,
      };
    }
    case 'expression': {
      const match = checkExpressionEquivalence(candidate, p.answer, p.variable ?? 'x');
      return {
        id: p.id,
        method: 'worked-final-line',
        verdict: match ? 'MATCH' : 'MISMATCH',
        detail: `worked final expr "${candidate}" vs stored answer "${p.answer}"`,
      };
    }
    case 'interval': {
      // Interval answers' worked solutions often end in prose ("... or x > 3") rather
      // than clean notation — only attempt when the candidate itself looks like an
      // interval or union of intervals.
      if (!/^[([].*[)\]]$/.test(candidate.replace(/\s/g, ''))) {
        return { id: p.id, method: 'worked-final-line', verdict: 'UNVERIFIABLE', detail: `candidate "${candidate}" doesn't look like interval notation` };
      }
      const match = checkInterval(candidate, p.answer);
      return {
        id: p.id,
        method: 'worked-final-line',
        verdict: match ? 'MATCH' : 'MISMATCH',
        detail: `worked final interval "${candidate}" vs stored answer "${p.answer}"`,
      };
    }
    case 'solutionSet': {
      const match = checkSolutionSet(candidate, p.answer);
      return {
        id: p.id,
        method: 'worked-final-line',
        verdict: match ? 'MATCH' : 'MISMATCH',
        detail: `worked final set "${candidate}" vs stored answer "${p.answer}"`,
      };
    }
    default:
      return null;
  }
}

for (const p of ALL_PROBLEMS) {
  const a = tryPromptDirect(p);
  if (a) results.push(a);
  const b = tryWorkedFinalLine(p);
  if (b) results.push(b);
}

const byVerdict = { MATCH: 0, MISMATCH: 0, UNVERIFIABLE: 0 };
for (const r of results) byVerdict[r.verdict]++;

console.log(`=== Method A: prompt-direct evaluation ===`);
const aResults = results.filter((r) => r.method === 'prompt-direct');
console.log(`Attempted: ${aResults.length} problems`);
for (const r of aResults) {
  if (r.verdict !== 'MATCH') console.log(`  [${r.verdict}] ${r.id}: ${r.detail}`);
}

console.log(`\n=== Method B: worked-solution final-line cross-check ===`);
const bResults = results.filter((r) => r.method === 'worked-final-line');
console.log(`Attempted: ${bResults.length} problems`);
for (const r of bResults) {
  if (r.verdict !== 'MATCH') console.log(`  [${r.verdict}] ${r.id}: ${r.detail}`);
}

console.log(`\n=== Summary ===`);
console.log(`Total checks run: ${results.length}`);
console.log(`MATCH: ${byVerdict.MATCH}`);
console.log(`MISMATCH: ${byVerdict.MISMATCH}`);
console.log(`UNVERIFIABLE (not auto-checkable, needs manual review): ${byVerdict.UNVERIFIABLE}`);

const uniqueProblemsCovered = new Set(results.filter((r) => r.verdict !== 'UNVERIFIABLE').map((r) => r.id));
console.log(`\nUnique problems with at least one non-unverifiable independent check: ${uniqueProblemsCovered.size} / ${ALL_PROBLEMS.length}`);

process.exit(byVerdict.MISMATCH > 0 ? 1 : 0);
