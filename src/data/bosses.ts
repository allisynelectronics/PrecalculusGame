import type { BossDef } from '../types';

export const ALGEBRA_GOLEM: BossDef = {
  id: 'algebra-golem',
  worldId: 'foundation-forge',
  name: 'The Algebra Golem',
  tagline: 'A hulking machine of gears and broken equations, powered by raw arithmetic.',
  icon: '👹',
  phases: [
    { name: 'Awakening — Integer Arithmetic', topicIds: ['integer-ops', 'fractions'], questionsRequired: 2 },
    { name: 'Fracture — Factoring & Exponents', topicIds: ['factoring', 'exponent-rules', 'radicals'], questionsRequired: 3 },
    { name: 'Core Equations', topicIds: ['linear-equations', 'quadratic-equations'], questionsRequired: 3 },
    { name: 'Final Judgment', topicIds: ['inequalities', 'absolute-value', 'function-notation'], questionsRequired: 3 },
  ],
};

export const ZERO_HUNTER: BossDef = {
  id: 'zero-hunter',
  worldId: 'polynomial-peaks',
  name: 'The Zero Hunter',
  tagline: 'A spectral tracker that stalks the roots of every curve on the mountain.',
  icon: '🏹',
  phases: [
    { name: 'Scouting the Range', topicIds: ['poly-end-behavior', 'poly-zeros-factoring'], questionsRequired: 2 },
    { name: 'Division Gauntlet', topicIds: ['poly-synthetic-division', 'poly-remainder-factor-theorem'], questionsRequired: 3 },
    { name: 'Root Tracking', topicIds: ['poly-rational-zero-theorem', 'poly-multiplicity'], questionsRequired: 3 },
    { name: 'Complex Hunt', topicIds: ['poly-complex-zeros', 'poly-constructing-polynomials'], questionsRequired: 3 },
  ],
};

export const ASYMPTOTE_PHANTOM: BossDef = {
  id: 'asymptote-phantom',
  worldId: 'rational-rift',
  name: 'The Asymptote Phantom',
  tagline: 'A flickering specter that lives in the gaps where functions break apart.',
  icon: '👻',
  phases: [
    { name: 'Domain & Simplification', topicIds: ['rf-domain', 'rf-simplify'], questionsRequired: 2 },
    { name: 'Asymptote Tracking', topicIds: ['rf-asymptotes-vertical', 'rf-asymptotes-horizontal', 'rf-holes'], questionsRequired: 3 },
    { name: 'Equation & Inequality Solving', topicIds: ['rf-rational-equations', 'rf-polynomial-inequalities'], questionsRequired: 3 },
    { name: 'Final Containment', topicIds: ['rf-rational-inequalities'], questionsRequired: 3 },
  ],
};

export const LOGARITHM_OVERLORD: BossDef = {
  id: 'logarithm-overlord',
  worldId: 'exponential-empire',
  name: 'The Logarithm Overlord',
  tagline: 'A towering ruler whose power grows exponentially and whose weakness is written in logs.',
  icon: '🏙️',
  phases: [
    { name: 'Matching Bases', topicIds: ['exp-functions-basics', 'log-basics'], questionsRequired: 2 },
    { name: 'Log Mastery', topicIds: ['log-domain', 'log-properties'], questionsRequired: 3 },
    { name: 'Breaking the Code', topicIds: ['exp-log-equations', 'exp-growth-decay-models'], questionsRequired: 3 },
    { name: 'The Overlord\'s Vault', topicIds: ['compound-interest', 'half-life-doubling-time'], questionsRequired: 3 },
  ],
};

export const CIRCLE_GUARDIAN: BossDef = {
  id: 'circle-guardian',
  worldId: 'trig-kingdom',
  name: 'The Circle Guardian',
  tagline: 'An ancient sentinel bound to the unit circle, testing every angle that approaches.',
  icon: '🔱',
  phases: [
    { name: 'Angle Mastery', topicIds: ['trig-angle-basics', 'trig-reference-angles'], questionsRequired: 2 },
    { name: 'Triangle Trials', topicIds: ['trig-special-triangles', 'trig-right-triangle'], questionsRequired: 3 },
    { name: 'The Unit Circle Gauntlet', topicIds: ['trig-unit-circle-values', 'trig-arc-sector'], questionsRequired: 3 },
    { name: 'Inverse Reckoning', topicIds: ['trig-inverse-basic', 'trig-inverse-composite'], questionsRequired: 3 },
  ],
};

export const IDENTITY_SHAPESHIFTER: BossDef = {
  id: 'identity-shapeshifter',
  worldId: 'identity-citadel',
  name: 'The Identity Shapeshifter',
  tagline: 'A creature that wears a different algebraic form every time you look at it.',
  icon: '🪞',
  phases: [
    { name: 'Opening the Gates', topicIds: ['trig-identity-basics', 'pythagorean-identities'], questionsRequired: 2 },
    { name: 'The Shifting Walls', topicIds: ['sum-difference-identities'], questionsRequired: 3 },
    { name: 'Angle Multiplication', topicIds: ['double-angle-identities'], questionsRequired: 3 },
    { name: 'Final Transformation', topicIds: ['half-angle-identities', 'pythagorean-identities'], questionsRequired: 3 },
  ],
};

export const WAVE_COMMANDER: BossDef = {
  id: 'wave-commander',
  worldId: 'wave-galaxy',
  name: 'The Wave Commander',
  tagline: 'A neon strategist who directs every oscillation on the battlefield.',
  icon: '🌊',
  phases: [
    { name: 'Reading the Waves', topicIds: ['trig-amplitude-period', 'trig-write-equation'], questionsRequired: 2 },
    { name: 'Equation Barrage', topicIds: ['trig-equations-basic', 'trig-equations-quadratic'], questionsRequired: 3 },
    { name: 'Multiple-Angle Assault', topicIds: ['trig-equations-multiple-angle', 'trig-graph-asymptotes'], questionsRequired: 3 },
    { name: 'Final Transmission', topicIds: ['trig-domain-range', 'inverse-trig-transformations'], questionsRequired: 3 },
  ],
};

export const TRIANGLE_TITAN: BossDef = {
  id: 'triangle-titan',
  worldId: 'triangle-expedition',
  name: 'The Triangle Titan',
  tagline: 'A colossal surveyor who measures every challenger before the fight even begins.',
  icon: '🗻',
  phases: [
    { name: 'Charting the Angles', topicIds: ['law-of-sines-basic', 'choosing-the-law'], questionsRequired: 2 },
    { name: 'The Ambiguous Pass', topicIds: ['law-of-sines-ambiguous', 'law-of-cosines-sas'], questionsRequired: 3 },
    { name: 'Measuring the Peaks', topicIds: ['law-of-cosines-sss', 'triangle-area'], questionsRequired: 3 },
    { name: 'Final Expedition', topicIds: ['bearings-navigation', 'triangle-applications'], questionsRequired: 3 },
  ],
};

export const VECTOR_SENTINEL: BossDef = {
  id: 'vector-sentinel',
  worldId: 'polar-vector-valley',
  name: 'The Vector Sentinel',
  tagline: 'A guardian construct that patrols in straight lines and spiraling orbits alike.',
  icon: '🛰️',
  phases: [
    { name: 'Orbital Charting', topicIds: ['polar-rectangular-conversion', 'polar-multiple-representations'], questionsRequired: 2 },
    { name: 'Pattern Recognition', topicIds: ['polar-graph-identification', 'vector-component-form'], questionsRequired: 3 },
    { name: 'Force Field Alignment', topicIds: ['vector-operations', 'vector-magnitude-direction'], questionsRequired: 3 },
    { name: 'Final Approach', topicIds: ['dot-product', 'vector-orthogonal-parallel'], questionsRequired: 3 },
  ],
};

export const CONIC_ARCHITECT: BossDef = {
  id: 'conic-architect',
  worldId: 'conic-constellation',
  name: 'The Conic Architect',
  tagline: 'A celestial builder who shapes every orbit from a single sweeping curve.',
  icon: '🪐',
  phases: [
    { name: 'Parabolic Blueprints', topicIds: ['parabola-standard-form', 'parabola-directrix-axis'], questionsRequired: 2 },
    { name: 'Elliptical Orbits', topicIds: ['ellipse-standard-form', 'ellipse-eccentricity'], questionsRequired: 3 },
    { name: 'Hyperbolic Trajectories', topicIds: ['hyperbola-standard-form', 'identifying-conics'], questionsRequired: 3 },
    { name: 'Final Construction', topicIds: ['parametric-equations', 'conic-applications'], questionsRequired: 3 },
  ],
};

export const MATRIX_MASTER: BossDef = {
  id: 'matrix-master',
  worldId: 'matrix-fortress',
  name: 'The Matrix Master',
  tagline: 'A living lattice of numbers that rearranges itself to block every solver.',
  icon: '🔢',
  phases: [
    { name: 'Breaking the Locks', topicIds: ['systems-2var', 'systems-3var'], questionsRequired: 2 },
    { name: 'Grid Operations', topicIds: ['matrix-dimensions-operations', 'matrix-multiplication'], questionsRequired: 3 },
    { name: 'The Determinant Vault', topicIds: ['determinants', 'inverse-matrices-2x2'], questionsRequired: 3 },
    { name: 'Final Calculation', topicIds: ['cramers-rule', 'matrix-applications'], questionsRequired: 3 },
  ],
};

export const INFINITE_GUARDIAN: BossDef = {
  id: 'infinite-guardian',
  worldId: 'sequence-summit',
  name: 'The Infinite Guardian',
  tagline: 'An ageless sentinel built from an endless, repeating pattern.',
  icon: '♾️',
  phases: [
    { name: 'Climbing the Pattern', topicIds: ['sequence-patterns', 'arithmetic-sequences'], questionsRequired: 2 },
    { name: 'Summing the Steps', topicIds: ['arithmetic-series', 'geometric-sequences'], questionsRequired: 3 },
    { name: 'The Infinite Ledge', topicIds: ['geometric-series', 'financial-sequences'], questionsRequired: 3 },
    { name: 'Final Expansion', topicIds: ['binomial-theorem', 'binomial-specific-term'], questionsRequired: 3 },
  ],
};

export const GUARDIAN_OF_CALCULUS: BossDef = {
  id: 'guardian-of-calculus',
  worldId: 'calculus-gateway',
  name: 'The Guardian of Calculus',
  tagline: 'The final sentinel, testing not just what you remember but how fast everything connects.',
  icon: '🌌',
  phases: [
    { name: 'The Rate of Change', topicIds: ['difference-quotients', 'average-rate-of-change'], questionsRequired: 2 },
    { name: 'Approaching the Limit', topicIds: ['limits-numerical-graphical', 'limits-algebraic-factoring'], questionsRequired: 3 },
    { name: 'The Infinite Edge', topicIds: ['limits-rational', 'one-sided-limits-continuity'], questionsRequired: 3 },
    { name: 'The Gateway Trial', topicIds: ['tangent-line-intuition', 'calculus-readiness-mastery'], questionsRequired: 3 },
  ],
};

export const BOSSES: Record<string, BossDef> = {
  'foundation-forge': ALGEBRA_GOLEM,
  'polynomial-peaks': ZERO_HUNTER,
  'rational-rift': ASYMPTOTE_PHANTOM,
  'exponential-empire': LOGARITHM_OVERLORD,
  'trig-kingdom': CIRCLE_GUARDIAN,
  'identity-citadel': IDENTITY_SHAPESHIFTER,
  'wave-galaxy': WAVE_COMMANDER,
  'triangle-expedition': TRIANGLE_TITAN,
  'polar-vector-valley': VECTOR_SENTINEL,
  'conic-constellation': CONIC_ARCHITECT,
  'matrix-fortress': MATRIX_MASTER,
  'sequence-summit': INFINITE_GUARDIAN,
  'calculus-gateway': GUARDIAN_OF_CALCULUS,
};

export function getBossForWorld(worldId: string): BossDef | undefined {
  return BOSSES[worldId];
}
