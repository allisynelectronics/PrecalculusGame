import { ALL_PROBLEMS } from '../src/data/problems';
import { gradeAnswer } from '../src/lib/grade';
import { checkExpressionEquivalence } from '../src/lib/mathCheck';

let failures = 0;

for (const p of ALL_PROBLEMS) {
  if (p.answerType === 'identityProof') {
    if (!p.startExpr || !p.rhsExpr || !p.proofStages || p.proofStages.length === 0) {
      failures++;
      console.log(`FAIL (identityProof) ${p.id}: missing startExpr/rhsExpr/proofStages`);
      continue;
    }
    // Every stage's target must be equivalent to the starting expression AND the RHS,
    // and each stage's target must self-validate (equivalent to itself, sanity check).
    let chainOk = true;
    const checkpoints = [p.startExpr, ...p.proofStages.map((s) => s.targetExpr)];
    for (let i = 1; i < checkpoints.length; i++) {
      if (!checkExpressionEquivalence(checkpoints[i], checkpoints[0], 'x')) {
        chainOk = false;
        console.log(`FAIL (identityProof) ${p.id}: stage ${i} not equivalent to starting expression`);
      }
    }
    if (!checkExpressionEquivalence(p.rhsExpr, p.startExpr, 'x')) {
      chainOk = false;
      console.log(`FAIL (identityProof) ${p.id}: rhsExpr not equivalent to startExpr`);
    }
    if (!chainOk) failures++;
    continue;
  }
  if (p.answerType === 'equationRepair') {
    const ok = gradeAnswer(p, `${p.repairBadLineIndex}::${p.repairCorrectLine}`);
    if (!ok) {
      failures++;
      console.log(`FAIL (equationRepair) ${p.id}: self-check failed`);
    }
    continue;
  }
  if (p.answerType === 'multipleChoice') {
    const ok = gradeAnswer(p, p.answer);
    if (!ok) {
      failures++;
      console.log(`FAIL (mc) ${p.id}: self-check failed`);
    }
    continue;
  }
  const ok = gradeAnswer(p, p.answer);
  if (!ok) {
    failures++;
    console.log(`FAIL ${p.id} [${p.answerType}]: answer "${p.answer}" did not self-validate`);
  }
}

console.log(`\nChecked ${ALL_PROBLEMS.length} problems, ${failures} failures.`);
process.exit(failures > 0 ? 1 : 0);
