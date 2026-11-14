import type { Problem } from '../types';
import { checkComplex, checkEquationLine, checkExpressionEquivalence, checkExpressionEquivalence2, checkInterval, checkNumeric, checkSolutionSet } from './mathCheck';

export function gradeAnswer(problem: Problem, studentInput: string): boolean {
  if (!studentInput || !studentInput.trim()) return false;
  switch (problem.answerType) {
    case 'numeric':
      return checkNumeric(studentInput, problem.answer);
    case 'expression':
      return checkExpressionEquivalence(studentInput, problem.answer, problem.variable ?? 'x');
    case 'expressionTwoVar':
      return checkExpressionEquivalence2(studentInput, problem.answer, problem.variable ?? 'x', 'h');
    case 'solutionSet':
      return checkSolutionSet(studentInput, problem.answer);
    case 'interval':
      return checkInterval(studentInput, problem.answer);
    case 'complex':
      return checkComplex(studentInput, problem.answer);
    case 'multipleChoice':
      return studentInput === problem.answer;
    case 'equationRepair': {
      // studentInput encodes "<lineIndex>::<correctedLine>"
      const [idxStr, corrected] = studentInput.split('::');
      const idx = Number(idxStr);
      if (idx !== problem.repairBadLineIndex) return false;
      if (!corrected) return true; // identifying the line alone is accepted
      return checkEquationLine(corrected, problem.repairCorrectLine ?? '', problem.variable ?? 'x');
    }
    default:
      return false;
  }
}

export function checkIntervalAnswer(studentInput: string, correct: string): boolean {
  return checkInterval(studentInput, correct);
}
