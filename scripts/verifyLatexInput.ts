import { checkExpressionEquivalence, checkNumeric } from '../src/lib/mathCheck';

// Regression tests for LaTeX-style student input (e.g. pasted/typed from Pearson,
// a textbook, or any \frac{}{} / \sqrt{} / ^{} style source) — this must grade the
// same as the equivalent plain mathjs syntax.
const tests: [string, () => boolean][] = [
  ['\\sqrt{50} vs sqrt(50)', () => checkNumeric('\\sqrt{50}', 'sqrt(50)')],
  ['5\\sqrt{2} vs sqrt(50)', () => checkNumeric('5\\sqrt{2}', 'sqrt(50)')],
  ['\\frac{1}{2} vs 0.5', () => checkNumeric('\\frac{1}{2}', '0.5')],
  ['\\frac{\\sqrt{3}}{2} vs sqrt(3)/2', () => checkNumeric('\\frac{\\sqrt{3}}{2}', 'sqrt(3)/2')],
  ['\\sqrt[3]{8} vs 2', () => checkNumeric('\\sqrt[3]{8}', '2')],
  ['x^{10} expr vs x^10', () => checkExpressionEquivalence('x^{10}', 'x^10', 'x')],
  ['x^{2+1} vs x^3', () => checkExpressionEquivalence('x^{2+1}', 'x^3', 'x')],
  ['2\\cdot x vs 2x', () => checkExpressionEquivalence('2\\cdot x', '2*x', 'x')],
  ['\\frac{x+1}{2} vs (x+1)/2', () => checkExpressionEquivalence('\\frac{x+1}{2}', '(x+1)/2', 'x')],
  ['\\sqrt{2+\\sqrt{3}}/2 vs itself (plain)', () => checkNumeric('\\sqrt{2+\\sqrt{3}}/2', 'sqrt(2+sqrt(3))/2')],
  ['\\pi vs pi', () => checkNumeric('2\\pi', '2*pi')],
];

let failures = 0;
for (const [name, fn] of tests) {
  let result: boolean | string;
  try {
    result = fn();
  } catch (e) {
    result = `ERROR: ${e}`;
  }
  if (result !== true) {
    failures++;
    console.log(`FAIL  ${name}  =>`, result);
  }
}

console.log(`\nChecked ${tests.length} LaTeX-input cases, ${failures} failures.`);
process.exit(failures > 0 ? 1 : 0);
