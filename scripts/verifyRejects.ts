import { ALL_PROBLEMS } from '../src/data/problems';
import { gradeAnswer } from '../src/lib/grade';
import { checkExpressionEquivalence } from '../src/lib/mathCheck';

let unexpectedPasses = 0;

for (const p of ALL_PROBLEMS) {
  if (p.answerType === 'identityProof') {
    for (const stage of p.proofStages ?? []) {
      const ok = checkExpressionEquivalence(`(${stage.targetExpr}) + 999999`, stage.targetExpr, 'x');
      if (ok) {
        unexpectedPasses++;
        console.log(`UNEXPECTED PASS (identityProof) ${p.id}: wrong stage input graded correct`);
      }
    }
    continue;
  }
  let wrongInput: string | null = null;
  switch (p.answerType) {
    case 'numeric':
      wrongInput = '999999';
      break;
    case 'expression':
    case 'expressionTwoVar':
      wrongInput = `(${p.answer}) + 999999`;
      break;
    case 'solutionSet':
      wrongInput = '999999';
      break;
    case 'interval':
      wrongInput = '(999999,1000000)';
      break;
    case 'complex':
      wrongInput = '999999+999999i';
      break;
    case 'multipleChoice':
      wrongInput = p.choices?.find((c) => c.id !== p.answer)?.id ?? null;
      break;
    case 'equationRepair':
      wrongInput = `${(p.repairBadLineIndex ?? 0) + 1}::garbage`;
      break;
  }
  if (wrongInput === null) continue;
  const ok = gradeAnswer(p, wrongInput);
  if (ok) {
    unexpectedPasses++;
    console.log(`UNEXPECTED PASS ${p.id} [${p.answerType}]: wrong input "${wrongInput}" graded correct`);
  }
}

console.log(`\nChecked ${ALL_PROBLEMS.length} problems, ${unexpectedPasses} unexpected passes.`);
process.exit(unexpectedPasses > 0 ? 1 : 0);
