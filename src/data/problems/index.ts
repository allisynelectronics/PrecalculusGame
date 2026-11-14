import type { Difficulty, Problem } from '../../types';
import { PROBLEMS as CALCULUS_PROBLEMS } from './calculusGateway';
import { PROBLEMS as CONIC_PROBLEMS } from './conicConstellation';
import { PROBLEMS as EXPONENTIAL_PROBLEMS } from './exponentialEmpire';
import { PROBLEMS as FOUNDATION_PROBLEMS } from './foundationForge';
import { PROBLEMS as IDENTITY_PROBLEMS } from './identityCitadel';
import { PROBLEMS as MATRIX_PROBLEMS } from './matrixFortress';
import { PROBLEMS as POLAR_VECTOR_PROBLEMS } from './polarVectorValley';
import { PROBLEMS as POLYNOMIAL_PROBLEMS } from './polynomialPeaks';
import { PROBLEMS as RATIONAL_PROBLEMS } from './rationalRift';
import { PROBLEMS as SEQUENCE_PROBLEMS } from './sequenceSummit';
import { PROBLEMS as TRIANGLE_PROBLEMS } from './triangleExpedition';
import { PROBLEMS as TRIG_PROBLEMS } from './trigKingdom';
import { PROBLEMS as WAVE_PROBLEMS } from './waveGalaxy';

export const ALL_PROBLEMS: Problem[] = [
  ...FOUNDATION_PROBLEMS,
  ...POLYNOMIAL_PROBLEMS,
  ...RATIONAL_PROBLEMS,
  ...EXPONENTIAL_PROBLEMS,
  ...TRIG_PROBLEMS,
  ...IDENTITY_PROBLEMS,
  ...WAVE_PROBLEMS,
  ...TRIANGLE_PROBLEMS,
  ...POLAR_VECTOR_PROBLEMS,
  ...CONIC_PROBLEMS,
  ...MATRIX_PROBLEMS,
  ...SEQUENCE_PROBLEMS,
  ...CALCULUS_PROBLEMS,
];

export function getProblemsByTopic(topicId: string): Problem[] {
  return ALL_PROBLEMS.filter((p) => p.topicId === topicId && p.answerType !== 'equationRepair');
}

export function getEquationRepairs(): Problem[] {
  return ALL_PROBLEMS.filter((p) => p.answerType === 'equationRepair');
}

export function getProblem(id: string): Problem | undefined {
  return ALL_PROBLEMS.find((p) => p.id === id);
}

export function getRandomProblem(
  topicId: string,
  excludeIds: string[] = [],
  difficulty?: Difficulty,
  options?: { excludeIdentityProof?: boolean },
): Problem | undefined {
  const basePool = options?.excludeIdentityProof
    ? getProblemsByTopic(topicId).filter((p) => p.answerType !== 'identityProof')
    : getProblemsByTopic(topicId);
  let pool = basePool.filter((p) => !excludeIds.includes(p.id));
  if (difficulty) {
    const narrowed = pool.filter((p) => p.difficulty === difficulty);
    if (narrowed.length > 0) pool = narrowed;
  }
  if (pool.length === 0) pool = basePool;
  return pool[Math.floor(Math.random() * pool.length)];
}
