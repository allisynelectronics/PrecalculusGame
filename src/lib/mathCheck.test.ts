import { describe, expect, it } from 'vitest';
import {
  checkComplex,
  checkEquationLine,
  checkExpressionEquivalence,
  checkExpressionEquivalence2,
  checkInterval,
  checkNumeric,
  checkSolutionSet,
  normalize,
} from './mathCheck';

describe('checkNumeric', () => {
  it('accepts exact integer matches', () => {
    expect(checkNumeric('5', '5')).toBe(true);
  });
  it('accepts equivalent fraction/decimal forms', () => {
    expect(checkNumeric('1/2', '0.5')).toBe(true);
  });
  it('accepts equivalent radical forms', () => {
    expect(checkNumeric('sqrt(4)', '2')).toBe(true);
  });
  it('rejects a genuinely wrong numeric answer', () => {
    expect(checkNumeric('4', '5')).toBe(false);
  });
  it('rejects an unparseable answer rather than throwing', () => {
    expect(checkNumeric('not a number', '5')).toBe(false);
  });
  it('absorbs floating-point noise within tolerance', () => {
    expect(checkNumeric('0.1+0.2', '0.3')).toBe(true);
  });
  it('coerces a numerically-real result that mathjs represents as a Complex value (i*i = -1)', () => {
    expect(checkNumeric('sqrt(-1)*sqrt(-1)', '-1')).toBe(true);
  });
});

describe('checkExpressionEquivalence', () => {
  it('accepts algebraically equivalent expressions', () => {
    expect(checkExpressionEquivalence('(x+1)^2', 'x^2+2*x+1')).toBe(true);
  });
  it('rejects a non-equivalent expression', () => {
    expect(checkExpressionEquivalence('x^2+2*x+2', 'x^2+2*x+1')).toBe(false);
  });
  it('rejects an unparseable student expression', () => {
    expect(checkExpressionEquivalence('this is not math', 'x+1')).toBe(false);
  });
  it('supports a custom variable name', () => {
    expect(checkExpressionEquivalence('t^2', 't*t', 't')).toBe(true);
  });
  it('treats a stored answer that never evaluates as a content error, not a pass', () => {
    // If the "correct" side is undefined at every sample point, there's nothing to
    // genuinely compare against — this must not vacuously return true.
    expect(checkExpressionEquivalence('1/0', '1/0')).toBe(false);
  });
});

describe('checkExpressionEquivalence2 (two-variable)', () => {
  it('accepts equivalent two-variable expressions', () => {
    expect(checkExpressionEquivalence2('2*x+h', '2*x+h')).toBe(true);
  });
  it('rejects non-equivalent two-variable expressions', () => {
    expect(checkExpressionEquivalence2('2*x+h', '2*x+2*h')).toBe(false);
  });
  it('supports custom variable names', () => {
    expect(checkExpressionEquivalence2('a+b', 'b+a', 'a', 'b')).toBe(true);
  });
});

describe('checkSolutionSet', () => {
  it('accepts solutions in a different order', () => {
    expect(checkSolutionSet('3,-3', '-3,3')).toBe(true);
  });
  it('accepts solutions written with "x =" prefixes', () => {
    expect(checkSolutionSet('x=3,x=-3', '3,-3')).toBe(true);
  });
  it('rejects a solution set of the wrong size', () => {
    expect(checkSolutionSet('3', '3,-3')).toBe(false);
  });
  it('rejects a solution set with a wrong value', () => {
    expect(checkSolutionSet('3,4', '3,-3')).toBe(false);
  });
  it('splits on "or" as well as commas', () => {
    expect(checkSolutionSet('3 or -3', '3,-3')).toBe(true);
  });
});

describe('checkComplex', () => {
  it('accepts equivalent complex-number forms', () => {
    expect(checkComplex('3-2*i', '3-2i')).toBe(true);
  });
  it('accepts a purely imaginary answer', () => {
    expect(checkComplex('4i', '4i')).toBe(true);
  });
  it('rejects a wrong imaginary part', () => {
    expect(checkComplex('3+2i', '3-2i')).toBe(false);
  });
  it('rejects a wrong real part', () => {
    expect(checkComplex('4-2i', '3-2i')).toBe(false);
  });
  it('treats a real stored answer as having zero imaginary part', () => {
    expect(checkComplex('5+0i', '5')).toBe(true);
  });
});

describe('checkEquationLine', () => {
  it('accepts equivalent bare expressions', () => {
    expect(checkEquationLine('x+1', 'x+1')).toBe(true);
  });
  it('accepts equivalent full equations', () => {
    expect(checkEquationLine('3*x = 15', '3*x = 15')).toBe(true);
  });
  it('accepts an equation rearranged to the other side', () => {
    expect(checkEquationLine('3*x - 15 = 0', '3*x = 15')).toBe(true);
  });
  it('rejects a genuinely different equation', () => {
    expect(checkEquationLine('3*x = 12', '3*x = 15')).toBe(false);
  });
  it('falls back to numeric comparison when neither side is an equation', () => {
    expect(checkEquationLine('5', '5')).toBe(true);
  });
});

describe('normalize / LaTeX conversion', () => {
  it('converts \\frac{a}{b} to an explicit division', () => {
    expect(normalize('\\frac{1}{2}')).toBe('((1)/(2))');
  });
  it('converts bare \\sqrt{a} (no index) to sqrt(a)', () => {
    expect(normalize('\\sqrt{9}')).toBe('sqrt((9))');
  });
  it('converts indexed \\sqrt[n]{a} to nthRoot(a,n)', () => {
    expect(normalize('\\sqrt[3]{8}')).toBe('nthRoot((8),3)');
  });
  it('converts exponent braces ^{a} to ^(a)', () => {
    expect(normalize('x^{2}')).toBe('x^(2)');
  });
  it('evaluates a full LaTeX nth-root expression end to end', () => {
    expect(checkNumeric('\\sqrt[3]{27}', '3')).toBe(true);
  });
  it('evaluates a full LaTeX exponent-brace expression end to end', () => {
    expect(checkNumeric('2^{3}', '8')).toBe(true);
  });
});

describe('checkInterval', () => {
  it('accepts matching open intervals', () => {
    expect(checkInterval('(4,infinity)', '(4,infinity)')).toBe(true);
  });
  it('accepts matching half-open intervals with symbolic bounds', () => {
    expect(checkInterval('[-2,pi+2)', '[-2,2+pi)')).toBe(true);
  });
  it('rejects mismatched bracket types (open vs closed)', () => {
    expect(checkInterval('(4,infinity)', '[4,infinity)')).toBe(false);
  });
  it('rejects a numerically different bound', () => {
    expect(checkInterval('(4,infinity)', '(5,infinity)')).toBe(false);
  });
  it('accepts a union of intervals matched in a different order', () => {
    expect(checkInterval('(3,infinity)∪(-infinity,-3)', '(-infinity,-3)∪(3,infinity)')).toBe(true);
  });
  it('accepts "U" as a union separator', () => {
    expect(checkInterval('(-infinity,-3) U (3,infinity)', '(-infinity,-3)∪(3,infinity)')).toBe(true);
  });
  it('rejects a union with the wrong number of pieces', () => {
    expect(checkInterval('(3,infinity)', '(-infinity,-3)∪(3,infinity)')).toBe(false);
  });
});
