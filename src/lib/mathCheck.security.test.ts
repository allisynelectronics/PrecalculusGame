import { describe, expect, it } from 'vitest';
import {
  checkComplex,
  checkExpressionEquivalence,
  checkExpressionEquivalence2,
  checkNumeric,
} from './mathCheck';

/**
 * Regression suite for the production AST-allowlist hardening in mathCheck.ts.
 * Every payload here was hands-on verified against plain mathjs evaluate() to hang,
 * misbehave, or succeed unexpectedly before the hardening landed. Each must now be
 * rejected (return false) and must return within the per-test timeout — a payload
 * that hangs fails the test by timing out, not by returning the wrong boolean.
 */
describe('mathCheck security hardening — exploit payloads must be rejected', () => {
  const EXPLOIT_PAYLOADS = [
    `import({x:1}, {override:true})`,
    `createUnit('evilUnit', '1 m')`,
    `f(x) = x^2`,
    `x = 5`,
    `kron(ones(1000,1000), ones(1000,1000))`,
    `size(1:1e9)`,
    `resize([1], [1e8], 1)`,
    `(1)["constructor"]`,
    `{a: 1}`,
    `1; 2; 3`,
    `"constructor"["constructor"]("return 1")()`,
    `(function(){}).constructor('return this')()`,
    `factorial(100000)`,
    `2^100000000`,
  ];

  for (const payload of EXPLOIT_PAYLOADS) {
    it(`checkNumeric rejects: ${payload}`, () => {
      expect(checkNumeric(payload, '5')).toBe(false);
    }, 2000);

    it(`checkExpressionEquivalence rejects: ${payload}`, () => {
      expect(checkExpressionEquivalence(payload, 'x+1')).toBe(false);
    }, 2000);

    it(`checkComplex rejects: ${payload}`, () => {
      expect(checkComplex(payload, '3-2i')).toBe(false);
    }, 2000);
  }

  it('rejects an oversized input (length DoS) before parsing', () => {
    const huge = '1+'.repeat(10000) + '1';
    expect(checkNumeric(huge, '1')).toBe(false);
  }, 2000);

  it('rejects a deeply-nested-but-short expression (node-count guard)', () => {
    const deep = '1' + '+1'.repeat(500);
    expect(checkNumeric(deep, '501')).toBe(false);
  }, 2000);

  it('rejects deeply-nested parentheses without crashing or hanging', () => {
    const nested = '('.repeat(2000) + '1' + ')'.repeat(2000);
    expect(checkNumeric(nested, '1')).toBe(false);
  }, 2000);
});

describe('mathCheck security hardening — legitimate answers still work', () => {
  it('checkNumeric accepts equivalent legitimate forms', () => {
    expect(checkNumeric('sqrt(50)', '5*sqrt(2)')).toBe(true);
    expect(checkNumeric('nthRoot(8,3)', '2')).toBe(true);
  });

  it('checkExpressionEquivalence accepts equivalent algebraic forms', () => {
    expect(checkExpressionEquivalence('(x-2)*(x+2)', 'x^2-4')).toBe(true);
    expect(checkExpressionEquivalence('sin(x)*cot(x)', 'cos(x)')).toBe(true);
    expect(checkExpressionEquivalence('log(x)+log(7)', 'log(7*x)')).toBe(true);
    expect(checkExpressionEquivalence('2*atan(x)', '2*atan(x)')).toBe(true);
  });

  it('checkExpressionEquivalence2 accepts a two-variable difference quotient', () => {
    expect(checkExpressionEquivalence2('2*x+h', '2*x+h')).toBe(true);
  });

  it('checkComplex accepts equivalent complex-number forms', () => {
    expect(checkComplex('3-2*i', '3-2i')).toBe(true);
  });
});
