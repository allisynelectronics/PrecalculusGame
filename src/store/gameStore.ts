import { create } from 'zustand';
import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { AttemptRecord, Character, Difficulty, MasteryLevel, Screen, SpaceType } from '../types';

const SAVE_KEY = 'mathverse-save';
const SCHEMA_VERSION = 1;

export interface TopicMastery {
  level: MasteryLevel;
  correctStreak: number;
  attempts: number;
  correct: number;
  lastReviewedAt: number | null; // ms epoch of the most recent attempt (correct or not)
  nextReviewAt: number | null; // ms epoch this topic is next due for spaced-repetition review
}

interface GameState {
  screen: Screen;
  character: Character | null;
  xp: number;
  coins: number;
  stars: number;
  level: number;
  currentWorldId: string;
  boardPositions: Record<string, number>;
  diagnosticDone: boolean;
  seenTopics: string[]; // topics whose Discover/Watch stage has been shown
  mastery: Record<string, TopicMastery>;
  attempts: AttemptRecord[];
  unlockedWorldIds: string[];
  defeatedBosses: string[];
  activeProblemId: string | null;
  activeSpaceIndex: number | null;
  pendingTopicId: string | null; // topic queued for the problem screen
  pendingSpaceType: SpaceType | null;
  pendingDifficulty: Difficulty | null; // explicit difficulty override for the queued problem, if any
  returnScreen: Screen; // where to go back to after a problem/lesson
  lastReward: { xp: number; coins: number; stars: number } | null;
  lastPracticeTopicId: string | null; // last topic opened from Free Practice, for "practice again"
  practiceDifficulty: Difficulty | 'auto'; // Free Practice's persisted difficulty preference

  setScreen: (s: Screen) => void;
  setCharacter: (c: Character) => void;
  enterWorld: (worldId: string) => void;
  movePlayer: (spaces: number) => void;
  markTopicSeen: (topicId: string) => void;
  recordAttempt: (a: AttemptRecord) => void;
  grantReward: (xp: number, coins: number, stars: number) => void;
  startProblem: (topicId: string, returnScreen: Screen, spaceType?: SpaceType, difficulty?: Difficulty) => void;
  clearProblem: () => void;
  setPracticeDifficulty: (d: Difficulty | 'auto') => void;
  completeDiagnostic: (results: Record<string, boolean>) => void;
  defeatBoss: (bossId: string, worldId: string) => void;
  resetGame: () => void;
  exportSave: () => string;
  importSave: (json: string) => { ok: true } | { ok: false; error: string };
}

/** The subset of persisted fields a save file actually carries (everything except the
 *  store's action functions). Used for export/import and for validating anything we're
 *  about to accept as a save, whether from localStorage or a user-supplied file. */
type PersistedFields = Omit<
  GameState,
  | 'setScreen'
  | 'setCharacter'
  | 'enterWorld'
  | 'movePlayer'
  | 'markTopicSeen'
  | 'recordAttempt'
  | 'grantReward'
  | 'startProblem'
  | 'clearProblem'
  | 'completeDiagnostic'
  | 'defeatBoss'
  | 'resetGame'
  | 'exportSave'
  | 'importSave'
>;

const ACTION_KEYS = [
  'setScreen', 'setCharacter', 'enterWorld', 'movePlayer', 'markTopicSeen',
  'recordAttempt', 'grantReward', 'startProblem', 'clearProblem', 'setPracticeDifficulty',
  'completeDiagnostic', 'defeatBoss', 'resetGame', 'exportSave', 'importSave',
] as const satisfies readonly (keyof GameState)[];

/** Strips the store's action functions, leaving only the persistable data fields. */
function stripActions(state: GameState): PersistedFields {
  const fields = { ...state };
  for (const key of ACTION_KEYS) delete fields[key];
  return fields;
}

// Every genuine save (from a fresh game or an export) always has these fields set —
// an object missing any of them isn't a save at all, just something shaped enough by
// coincidence to slip past per-field type checks that only fire when a field exists.
// NOTE for future schema versions: this check runs at the storage layer, BEFORE
// persist's own `migrate` gets a chance to run, so if a future version renames or
// drops one of these fields, a genuinely-valid OLDER save could be rejected here
// before migration ever sees it. Revisit this list (or move the check after
// migration) when SCHEMA_VERSION actually changes for the first time.
const REQUIRED_SAVE_FIELDS = ['screen', 'xp', 'coins', 'stars', 'level', 'mastery', 'attempts'] as const;

/** Spot-checks the fields most likely to crash downstream code if malformed (wrong
 *  type, wrong shape) rather than trying to fully validate the whole save schema. A
 *  save that fails this is rejected outright rather than partially trusted. */
function isPlausibleSaveState(s: unknown): s is Partial<PersistedFields> {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
  const o = s as Record<string, unknown>;
  if (!REQUIRED_SAVE_FIELDS.every((f) => f in o)) return false;
  const numberFields = ['xp', 'coins', 'stars', 'level'] as const;
  for (const f of numberFields) {
    if (f in o && typeof o[f] !== 'number') return false;
  }
  const arrayFields = ['seenTopics', 'attempts', 'unlockedWorldIds', 'defeatedBosses'] as const;
  for (const f of arrayFields) {
    if (f in o && !Array.isArray(o[f])) return false;
  }
  const plainObjectFields = ['boardPositions', 'mastery'] as const;
  for (const f of plainObjectFields) {
    if (f in o && (typeof o[f] !== 'object' || o[f] === null || Array.isArray(o[f]))) return false;
  }
  if ('screen' in o && typeof o.screen !== 'string') return false;
  if ('currentWorldId' in o && typeof o.currentWorldId !== 'string') return false;
  if ('character' in o && o.character !== null && typeof o.character !== 'object') return false;
  return true;
}

/** Set (synchronously, at module load, before React renders) if the save in localStorage
 *  could not be loaded and had to be discarded. A UI component reads this once on mount
 *  to tell the player what happened, rather than silently starting them over with no
 *  explanation. The unreadable original is preserved under a "-corrupted-backup" key
 *  instead of being destroyed, in case it's ever worth recovering by hand. */
export let saveRecoveryNotice: string | null = null;

const validatingStorage: PersistStorage<PersistedFields> = {
  getItem: (name) => {
    let raw: string | null;
    try {
      raw = localStorage.getItem(name);
    } catch {
      return null; // localStorage unavailable (private mode, disabled, etc.)
    }
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as StorageValue<PersistedFields>;
      if (!parsed || typeof parsed !== 'object' || !isPlausibleSaveState(parsed.state)) {
        throw new Error('save file has an unexpected shape');
      }
      return parsed;
    } catch {
      saveRecoveryNotice =
        'Your saved progress could not be loaded (the save file was corrupted or in an unexpected format), so a new game was started. The unreadable save was kept as a backup rather than deleted.';
      try {
        localStorage.setItem(`${name}-corrupted-backup`, raw);
        localStorage.removeItem(name);
      } catch {
        // best-effort only — if this also fails there's nothing more we can safely do
      }
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // localStorage unavailable or full — progress for this session just won't persist
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

const XP_PER_LEVEL = 100;

function initMastery(): Record<string, TopicMastery> {
  return {};
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Spaced-repetition review interval per mastery level, in days. Higher mastery means a
// longer gap before the topic is due again — the standard spaced-repetition shape.
// Level 1 ("New") has no interval: a topic only enters the review schedule once it's
// been attempted at least once (see TopicMastery.nextReviewAt).
const REVIEW_INTERVAL_DAYS: Record<MasteryLevel, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

function updateMastery(m: TopicMastery | undefined, correct: boolean): TopicMastery {
  const base: TopicMastery = m ?? { level: 1, correctStreak: 0, attempts: 0, correct: 0, lastReviewedAt: null, nextReviewAt: null };
  const attempts = base.attempts + 1;
  const correctCount = base.correct + (correct ? 1 : 0);
  const correctStreak = correct ? base.correctStreak + 1 : 0;
  let level: MasteryLevel = base.level;
  if (correct) {
    if (correctStreak >= 6) level = 5;
    else if (correctStreak >= 4) level = 4;
    else if (correctStreak >= 2) level = Math.max(level, 3) as MasteryLevel;
    else level = Math.max(level, 2) as MasteryLevel;
  } else if (level > 2) {
    level = (level - 1) as MasteryLevel;
  }
  const now = Date.now();
  // A correct answer schedules the next review using the NEW level's interval. A wrong
  // answer schedules review immediately — a miss means this needs reinforcement now,
  // not on the usual schedule.
  const nextReviewAt = correct ? now + REVIEW_INTERVAL_DAYS[level] * MS_PER_DAY : now;
  return { level, correctStreak, attempts, correct: correctCount, lastReviewedAt: now, nextReviewAt };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      character: null,
      xp: 0,
      coins: 0,
      stars: 0,
      level: 1,
      currentWorldId: 'foundation-forge',
      boardPositions: {},
      diagnosticDone: false,
      seenTopics: [],
      mastery: initMastery(),
      attempts: [],
      unlockedWorldIds: ['foundation-forge'],
      defeatedBosses: [],
      activeProblemId: null,
      activeSpaceIndex: null,
      pendingTopicId: null,
      pendingSpaceType: null,
      pendingDifficulty: null,
      returnScreen: 'board',
      lastReward: null,
      lastPracticeTopicId: null,
      practiceDifficulty: 'auto',

      setScreen: (s) => set({ screen: s }),
      setCharacter: (c) => set({ character: c }),

      enterWorld: (worldId) => set({ currentWorldId: worldId, screen: 'board' }),

      movePlayer: (spaces) =>
        set((state) => ({
          boardPositions: {
            ...state.boardPositions,
            [state.currentWorldId]: (state.boardPositions[state.currentWorldId] ?? 0) + spaces,
          },
        })),

      markTopicSeen: (topicId) =>
        set((state) => ({
          seenTopics: state.seenTopics.includes(topicId)
            ? state.seenTopics
            : [...state.seenTopics, topicId],
        })),

      recordAttempt: (a) =>
        set((state) => ({
          attempts: [...state.attempts.slice(-199), a],
          mastery: {
            ...state.mastery,
            [a.topicId]: updateMastery(state.mastery[a.topicId], a.correct),
          },
        })),

      grantReward: (xp, coins, stars) =>
        set((state) => {
          const newXp = state.xp + xp;
          const newLevel = 1 + Math.floor(newXp / XP_PER_LEVEL);
          return {
            xp: newXp,
            coins: state.coins + coins,
            stars: state.stars + stars,
            level: newLevel,
            lastReward: { xp, coins, stars },
          };
        }),

      startProblem: (topicId, returnScreen, spaceType, difficulty) =>
        set({
          pendingTopicId: topicId,
          screen: 'problem',
          returnScreen,
          pendingSpaceType: spaceType ?? 'challenge',
          pendingDifficulty: difficulty ?? null,
          ...(returnScreen === 'freepractice' ? { lastPracticeTopicId: topicId } : {}),
        }),

      clearProblem: () => set({ pendingTopicId: null, activeProblemId: null, pendingSpaceType: null, pendingDifficulty: null }),

      setPracticeDifficulty: (d) => set({ practiceDifficulty: d }),

      completeDiagnostic: (results) =>
        set((state) => {
          const mastery = { ...state.mastery };
          for (const [topicId, correct] of Object.entries(results)) {
            mastery[topicId] = updateMastery(mastery[topicId], correct);
          }
          return { diagnosticDone: true, mastery, screen: 'worldmap' };
        }),

      defeatBoss: (bossId, worldId) =>
        set((state) => ({
          defeatedBosses: state.defeatedBosses.includes(bossId)
            ? state.defeatedBosses
            : [...state.defeatedBosses, bossId],
          unlockedWorldIds: state.unlockedWorldIds.includes(worldId)
            ? state.unlockedWorldIds
            : [...state.unlockedWorldIds, worldId],
        })),

      resetGame: () =>
        set({
          screen: 'title',
          character: null,
          xp: 0,
          coins: 0,
          stars: 0,
          level: 1,
          currentWorldId: 'foundation-forge',
          boardPositions: {},
          diagnosticDone: false,
          seenTopics: [],
          mastery: initMastery(),
          attempts: [],
          unlockedWorldIds: ['foundation-forge'],
          defeatedBosses: [],
          activeProblemId: null,
          activeSpaceIndex: null,
          pendingTopicId: null,
          pendingSpaceType: null,
          pendingDifficulty: null,
          returnScreen: 'board',
          lastReward: null,
          lastPracticeTopicId: null,
          practiceDifficulty: 'auto',
        }),

      exportSave: () => JSON.stringify({ state: stripActions(get() as GameState), version: SCHEMA_VERSION }, null, 2),

      importSave: (json) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(json);
        } catch {
          return { ok: false, error: 'That file is not valid JSON.' };
        }
        const candidate = (parsed as { state?: unknown })?.state ?? parsed;
        if (!isPlausibleSaveState(candidate)) {
          return { ok: false, error: "That file doesn't look like a MATHVERSE save." };
        }
        set(candidate as Partial<GameState>);
        return { ok: true };
      },
    }),
    {
      name: SAVE_KEY,
      version: SCHEMA_VERSION,
      storage: validatingStorage,
      // Identity migration for now — this is the hook future schema changes use to
      // transform an older save's shape instead of discarding it. No prior version
      // exists yet, so there's nothing to actually transform.
      migrate: (persistedState) => persistedState as GameState,
      partialize: stripActions,
    },
  ),
);

export function getOverallAccuracy(attempts: AttemptRecord[]): { independent: number; withHint: number } {
  const noHint = attempts.filter((a) => !a.usedHint);
  const withHint = attempts.filter((a) => a.usedHint);
  const pct = (arr: AttemptRecord[]) =>
    arr.length === 0 ? 0 : Math.round((arr.filter((a) => a.correct).length / arr.length) * 100);
  return { independent: pct(noHint), withHint: pct(withHint) };
}
