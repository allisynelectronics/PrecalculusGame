export type MasteryLevel = 1 | 2 | 3 | 4 | 5;
export const MASTERY_NAMES: Record<MasteryLevel, string> = {
  1: 'New',
  2: 'Learning',
  3: 'Developing',
  4: 'Proficient',
  5: 'Mastered',
};

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type AnswerType =
  | 'numeric'       // single number, possibly exact (fraction/radical) via mathjs equivalence
  | 'expression'    // algebraic expression, checked by sampling a variable
  | 'expressionTwoVar' // algebraic expression in two variables (x and h), e.g. difference quotients
  | 'solutionSet'   // comma separated list of numeric solutions, order independent
  | 'interval'       // interval notation, e.g. "(4,infinity)" or "[-2,5)"
  | 'complex'        // complex number in a+bi form
  | 'multipleChoice'
  | 'equationRepair' // player identifies the bad step (index) + corrected value
  | 'identityProof'; // multi-stage "Identity Locks" transformation ladder

export interface ProofStage {
  instruction: string;
  hint: string;
  targetExpr: string; // mathjs-evaluable form, variable x
  targetDisplay: string; // KaTeX source (no $ delimiters)
}

export interface ChoiceOption {
  id: string;
  label: string; // KaTeX source
}

export interface Problem {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  prompt: string; // KaTeX-flavored text, inline math wrapped in $...$
  answerType: AnswerType;
  /** For numeric/expression/solutionSet: accepted answer(s) as math strings */
  answer: string;
  /** For expression answers: the variable name used for sampling equivalence */
  variable?: string;
  choices?: ChoiceOption[];
  hints: string[]; // progressively more specific
  explanation: string; // "Explain the Rule"
  steps?: string[]; // "Break It Down"
  similarExampleId?: string; // "Show a Similar Example" -> fully worked problem id
  worked?: string[]; // fully worked solution steps (used for Watch stage / similar example)
  // Equation Repair specific
  repairLines?: string[]; // the broken worked solution, line by line
  repairBadLineIndex?: number;
  repairCorrectLine?: string;

  // Identity Proof ("Identity Locks") specific
  startExpr?: string; // mathjs form of the starting (LHS) expression, variable x
  startDisplay?: string; // KaTeX form of the starting expression
  rhsDisplay?: string; // KaTeX form of the identity's right-hand side (the goal)
  rhsExpr?: string; // mathjs form of the right-hand side, for self-verification
  proofStages?: ProofStage[];
}

export interface Topic {
  id: string;
  worldId: string;
  name: string;
  description: string;
  prerequisite?: string;
}

export interface World {
  id: string;
  index: number;
  name: string;
  tagline: string;
  theme: string;
  boss: string;
  colorFrom: string;
  colorTo: string;
  accent: string;
  locked: boolean; // true = under development, shown greyed on map
  partial?: boolean; // true = playable but curriculum not yet complete
}

export type SpaceType =
  | 'start'
  | 'challenge'
  | 'treasure'
  | 'shrine'
  | 'portal'
  | 'mystery'
  | 'training'
  | 'knowledge'
  | 'boss';

export interface BoardSpace {
  index: number;
  type: SpaceType;
  topicId?: string;
}

export interface Character {
  name: string;
  avatar: string; // emoji/icon id
  colorClass: string;
}

export interface BossPhase {
  name: string;
  topicIds: string[];
  questionsRequired: number;
}

export interface BossDef {
  id: string;
  worldId: string;
  name: string;
  tagline: string;
  icon: string;
  phases: BossPhase[];
}

export type Screen =
  | 'title'
  | 'character'
  | 'diagnostic'
  | 'worldmap'
  | 'board'
  | 'problem'
  | 'boss'
  | 'dashboard'
  | 'compendium'
  | 'unitcircle'
  | 'trigwave'
  | 'obliquetriangle'
  | 'vectorlab'
  | 'polargrapher'
  | 'rationalgrapher'
  | 'polynomialgrapher'
  | 'explographer'
  | 'conicexplorer'
  | 'trigequation'
  | 'pascalstriangle'
  | 'sequenceexplorer';

export interface AttemptRecord {
  problemId: string;
  topicId: string;
  correct: boolean;
  usedHint: boolean;
  timestamp: number;
}
