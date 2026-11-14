import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AttemptRecord, Character, MasteryLevel, Screen, SpaceType } from '../types';

interface TopicMastery {
  level: MasteryLevel;
  correctStreak: number;
  attempts: number;
  correct: number;
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
  returnScreen: Screen; // where to go back to after a problem/lesson
  lastReward: { xp: number; coins: number; stars: number } | null;

  setScreen: (s: Screen) => void;
  setCharacter: (c: Character) => void;
  enterWorld: (worldId: string) => void;
  movePlayer: (spaces: number) => void;
  markTopicSeen: (topicId: string) => void;
  recordAttempt: (a: AttemptRecord) => void;
  grantReward: (xp: number, coins: number, stars: number) => void;
  startProblem: (topicId: string, returnScreen: Screen, spaceType?: SpaceType) => void;
  clearProblem: () => void;
  completeDiagnostic: (results: Record<string, boolean>) => void;
  defeatBoss: (bossId: string, worldId: string) => void;
  resetGame: () => void;
}

const XP_PER_LEVEL = 100;

function initMastery(): Record<string, TopicMastery> {
  return {};
}

function updateMastery(m: TopicMastery | undefined, correct: boolean): TopicMastery {
  const base: TopicMastery = m ?? { level: 1, correctStreak: 0, attempts: 0, correct: 0 };
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
  return { level, correctStreak, attempts, correct: correctCount };
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
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
      returnScreen: 'board',
      lastReward: null,

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

      startProblem: (topicId, returnScreen, spaceType) =>
        set({ pendingTopicId: topicId, screen: 'problem', returnScreen, pendingSpaceType: spaceType ?? 'challenge' }),

      clearProblem: () => set({ pendingTopicId: null, activeProblemId: null, pendingSpaceType: null }),

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
          returnScreen: 'board',
          lastReward: null,
        }),
    }),
    { name: 'mathverse-save' },
  ),
);

export function getOverallAccuracy(attempts: AttemptRecord[]): { independent: number; withHint: number } {
  const noHint = attempts.filter((a) => !a.usedHint);
  const withHint = attempts.filter((a) => a.usedHint);
  const pct = (arr: AttemptRecord[]) =>
    arr.length === 0 ? 0 : Math.round((arr.filter((a) => a.correct).length / arr.length) * 100);
  return { independent: pct(noHint), withHint: pct(withHint) };
}
