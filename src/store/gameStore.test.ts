import { beforeEach, describe, expect, it, vi } from 'vitest';

// This Node build (v25.6.1 here) defines a global `localStorage` that is NOT a real
// Storage implementation — it has no getItem/setItem/clear, just Object.prototype —
// presumably Node's own experimental webStorage half-enabled without a backing file.
// gameStore.ts's module-level persist() setup reads `localStorage` at import time, so
// replace it with a minimal real implementation before importing the store.
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.has(key) ? this.map.get(key)! : null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, String(value)); }
}
Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});

const { useGameStore } = await import('./gameStore');

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().resetGame();
});

describe('save export/import', () => {
  it('exportSave produces a versioned JSON blob containing current state', () => {
    useGameStore.getState().setCharacter({ name: 'Astra', avatar: '🧙‍♀️', colorClass: 'x' });
    useGameStore.getState().grantReward(50, 20, 2);

    const json = useGameStore.getState().exportSave();
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(1);
    expect(parsed.state.character.name).toBe('Astra');
    expect(parsed.state.xp).toBe(50);
    expect(parsed.state.coins).toBe(20);
    // Action functions must not leak into the exported file.
    expect(parsed.state.exportSave).toBeUndefined();
    expect(parsed.state.setScreen).toBeUndefined();
  });

  it('importSave restores state from a previously exported save', () => {
    useGameStore.getState().setCharacter({ name: 'Orion', avatar: '🧑‍🚀', colorClass: 'x' });
    useGameStore.getState().grantReward(120, 40, 5);
    const json = useGameStore.getState().exportSave();

    useGameStore.getState().resetGame();
    expect(useGameStore.getState().character).toBeNull();

    const result = useGameStore.getState().importSave(json);
    expect(result.ok).toBe(true);
    expect(useGameStore.getState().character?.name).toBe('Orion');
    expect(useGameStore.getState().xp).toBe(120);
    expect(useGameStore.getState().coins).toBe(40);
  });

  it('importSave rejects invalid JSON without touching current state', () => {
    useGameStore.getState().setCharacter({ name: 'Nyx', avatar: '🌙', colorClass: 'x' });

    const result = useGameStore.getState().importSave('{not valid json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not valid JSON/i);
    expect(useGameStore.getState().character?.name).toBe('Nyx'); // unchanged
  });

  it('importSave rejects a well-formed but wrong-shaped file', () => {
    useGameStore.getState().setCharacter({ name: 'Rook', avatar: '🛠️', colorClass: 'x' });

    const result = useGameStore.getState().importSave(JSON.stringify({ hello: 'world' }));
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().character?.name).toBe('Rook'); // unchanged
  });

  it('importSave rejects a save with wrong field types (e.g. xp as a string)', () => {
    const malformed = JSON.stringify({ state: { xp: 'not-a-number', coins: 0 }, version: 1 });
    const result = useGameStore.getState().importSave(malformed);
    expect(result.ok).toBe(false);
  });
});

describe('grantReward', () => {
  it('accumulates xp/coins/stars across multiple grants', () => {
    useGameStore.getState().grantReward(10, 5, 1);
    useGameStore.getState().grantReward(15, 20, 2);
    const s = useGameStore.getState();
    expect(s.xp).toBe(25);
    expect(s.coins).toBe(25);
    expect(s.stars).toBe(3);
  });

  it('computes level as 1 + floor(xp / 100)', () => {
    useGameStore.getState().grantReward(99, 0, 0);
    expect(useGameStore.getState().level).toBe(1);
    useGameStore.getState().grantReward(1, 0, 0); // xp now 100
    expect(useGameStore.getState().level).toBe(2);
    useGameStore.getState().grantReward(150, 0, 0); // xp now 250
    expect(useGameStore.getState().level).toBe(3);
  });
});

describe('movePlayer', () => {
  it('tracks board position independently per world', () => {
    useGameStore.getState().enterWorld('foundation-forge');
    useGameStore.getState().movePlayer(4);
    useGameStore.getState().enterWorld('polynomial-peaks');
    useGameStore.getState().movePlayer(2);
    const s = useGameStore.getState();
    expect(s.boardPositions['foundation-forge']).toBe(4);
    expect(s.boardPositions['polynomial-peaks']).toBe(2);
  });
});

describe('markTopicSeen', () => {
  it('is idempotent — marking the same topic twice does not duplicate it', () => {
    useGameStore.getState().markTopicSeen('order-of-operations');
    useGameStore.getState().markTopicSeen('order-of-operations');
    const seen = useGameStore.getState().seenTopics.filter((t) => t === 'order-of-operations');
    expect(seen).toHaveLength(1);
  });
});

describe('defeatBoss', () => {
  it('is idempotent and unlocks the next world exactly once', () => {
    useGameStore.getState().defeatBoss('algebra-golem', 'polynomial-peaks');
    useGameStore.getState().defeatBoss('algebra-golem', 'polynomial-peaks');
    const s = useGameStore.getState();
    expect(s.defeatedBosses.filter((b) => b === 'algebra-golem')).toHaveLength(1);
    expect(s.unlockedWorldIds.filter((w) => w === 'polynomial-peaks')).toHaveLength(1);
  });
});

describe('mastery progression algorithm (recordAttempt)', () => {
  const attempt = (topicId: string, correct: boolean) =>
    useGameStore.getState().recordAttempt({ problemId: 'p', topicId, correct, usedHint: false, timestamp: 0 });

  it('starts a new topic at level 1 with no attempts', () => {
    expect(useGameStore.getState().mastery['new-topic']).toBeUndefined();
  });

  it('promotes level 1 -> 2 on the first correct answer', () => {
    attempt('t', true);
    expect(useGameStore.getState().mastery.t.level).toBe(2);
    expect(useGameStore.getState().mastery.t.correctStreak).toBe(1);
  });

  it('promotes to level 3 at a 2-answer correct streak, and holds at 3 streaks', () => {
    attempt('t', true); // streak 1 -> level 2
    attempt('t', true); // streak 2 -> level 3
    expect(useGameStore.getState().mastery.t.level).toBe(3);
    attempt('t', true); // streak 3 -> still level 3 (3 is a max(level,3), not advanced further)
    expect(useGameStore.getState().mastery.t.level).toBe(3);
  });

  it('promotes to level 4 at a 4-answer correct streak', () => {
    for (let i = 0; i < 4; i++) attempt('t', true);
    expect(useGameStore.getState().mastery.t.correctStreak).toBe(4);
    expect(useGameStore.getState().mastery.t.level).toBe(4);
  });

  it('promotes to level 5 ("Mastered") at a 6-answer correct streak', () => {
    for (let i = 0; i < 6; i++) attempt('t', true);
    expect(useGameStore.getState().mastery.t.correctStreak).toBe(6);
    expect(useGameStore.getState().mastery.t.level).toBe(5);
  });

  it('resets the streak (but not below floor level 2) on a wrong answer', () => {
    for (let i = 0; i < 6; i++) attempt('t', true); // level 5, streak 6
    attempt('t', false); // wrong: streak resets to 0, level decays by exactly one step
    const s1 = useGameStore.getState().mastery.t;
    expect(s1.correctStreak).toBe(0);
    expect(s1.level).toBe(4);
  });

  it('decays level one step per consecutive wrong answer down to a floor of 2, never to 1', () => {
    for (let i = 0; i < 6; i++) attempt('t', true); // level 5
    attempt('t', false); // -> 4
    attempt('t', false); // -> 3
    attempt('t', false); // -> 2
    attempt('t', false); // floor: stays at 2, does not drop to 1
    expect(useGameStore.getState().mastery.t.level).toBe(2);
  });

  it('tracks attempts and correct counts independently of the level/streak logic', () => {
    attempt('t', true);
    attempt('t', false);
    attempt('t', true);
    const s = useGameStore.getState().mastery.t;
    expect(s.attempts).toBe(3);
    expect(s.correct).toBe(2);
  });

  it('tracks mastery independently per topic', () => {
    attempt('alpha', true);
    attempt('alpha', true);
    attempt('beta', true);
    expect(useGameStore.getState().mastery.alpha.level).toBe(3);
    expect(useGameStore.getState().mastery.beta.level).toBe(2);
  });
});

describe('completeDiagnostic', () => {
  it('seeds mastery for every topic result and moves to the world map', () => {
    useGameStore.getState().completeDiagnostic({ a: true, b: false });
    const s = useGameStore.getState();
    expect(s.diagnosticDone).toBe(true);
    expect(s.screen).toBe('worldmap');
    expect(s.mastery.a.level).toBe(2);
    expect(s.mastery.b.level).toBe(1); // a single wrong answer on a fresh topic stays at the floor
  });
});

describe('setScreen / setCharacter', () => {
  it('setScreen switches the active screen', () => {
    useGameStore.getState().setScreen('dashboard');
    expect(useGameStore.getState().screen).toBe('dashboard');
  });

  it('setCharacter replaces the active character', () => {
    useGameStore.getState().setCharacter({ name: 'Vex', avatar: '🗡️', colorClass: 'x' });
    expect(useGameStore.getState().character?.name).toBe('Vex');
  });
});

describe('startProblem / clearProblem', () => {
  it('startProblem queues a topic and switches to the problem screen', () => {
    useGameStore.getState().startProblem('order-of-operations', 'board', 'treasure');
    const s = useGameStore.getState();
    expect(s.pendingTopicId).toBe('order-of-operations');
    expect(s.screen).toBe('problem');
    expect(s.returnScreen).toBe('board');
    expect(s.pendingSpaceType).toBe('treasure');
  });

  it('startProblem defaults pendingSpaceType to "challenge" when omitted', () => {
    useGameStore.getState().startProblem('order-of-operations', 'board');
    expect(useGameStore.getState().pendingSpaceType).toBe('challenge');
  });

  it('clearProblem resets the pending-problem fields', () => {
    useGameStore.getState().startProblem('order-of-operations', 'board');
    useGameStore.getState().clearProblem();
    const s = useGameStore.getState();
    expect(s.pendingTopicId).toBeNull();
    expect(s.activeProblemId).toBeNull();
    expect(s.pendingSpaceType).toBeNull();
  });
});

describe('getOverallAccuracy', () => {
  it('computes independent vs. hint-assisted accuracy separately', async () => {
    const { getOverallAccuracy } = await import('./gameStore');
    const attempts = [
      { problemId: 'a', topicId: 't', correct: true, usedHint: false, timestamp: 0 },
      { problemId: 'b', topicId: 't', correct: false, usedHint: false, timestamp: 0 },
      { problemId: 'c', topicId: 't', correct: true, usedHint: true, timestamp: 0 },
      { problemId: 'd', topicId: 't', correct: true, usedHint: true, timestamp: 0 },
      { problemId: 'e', topicId: 't', correct: false, usedHint: true, timestamp: 0 },
    ];
    const result = getOverallAccuracy(attempts);
    expect(result.independent).toBe(50); // 1/2 correct, no hint
    expect(result.withHint).toBe(67); // 2/3 correct with hint, rounded
  });

  it('returns 0% (not NaN) for an empty attempt history', async () => {
    const { getOverallAccuracy } = await import('./gameStore');
    expect(getOverallAccuracy([])).toEqual({ independent: 0, withHint: 0 });
  });
});

describe('importSave shape validation — remaining field-type branches', () => {
  const baseValid = {
    screen: 'worldmap', xp: 0, coins: 0, stars: 0, level: 1, mastery: {}, attempts: [],
  };

  it('rejects a save where an array field is not an array', () => {
    const result = useGameStore.getState().importSave(JSON.stringify({ state: { ...baseValid, attempts: 'not-an-array' } }));
    expect(result.ok).toBe(false);
  });

  it('rejects a save where a plain-object field is actually an array', () => {
    const result = useGameStore.getState().importSave(JSON.stringify({ state: { ...baseValid, mastery: [] } }));
    expect(result.ok).toBe(false);
  });

  it('rejects a save where a plain-object field is null', () => {
    const result = useGameStore.getState().importSave(JSON.stringify({ state: { ...baseValid, mastery: null } }));
    expect(result.ok).toBe(false);
  });

  it('rejects a save where "screen" is not a string', () => {
    const result = useGameStore.getState().importSave(JSON.stringify({ state: { ...baseValid, screen: 123 } }));
    expect(result.ok).toBe(false);
  });

  it('rejects a save where "character" is neither null nor an object', () => {
    const result = useGameStore.getState().importSave(JSON.stringify({ state: { ...baseValid, character: 'Astra' } }));
    expect(result.ok).toBe(false);
  });

  it('accepts a save where "character" is explicitly null', () => {
    const result = useGameStore.getState().importSave(JSON.stringify({ state: { ...baseValid, character: null } }));
    expect(result.ok).toBe(true);
  });
});

describe('corrupted localStorage recovery', () => {
  it('a malformed save under the storage key does not crash store creation', () => {
    // The store module is already loaded (import-time side effects already ran for this
    // test file), so this specifically covers that writing garbage to the key and then
    // reading it back through the same validating storage path used at load time does
    // not throw — exercised indirectly since the module's validatingStorage.getItem is
    // not itself exported; resetGame()/localStorage.clear() in beforeEach establish a
    // clean baseline, and this asserts the app-level invariant that garbage in this key
    // is simply inert from the store's perspective once past initial load.
    localStorage.setItem('mathverse-save', '{not valid json!!!');
    expect(() => JSON.parse(localStorage.getItem('mathverse-save')!)).toThrow();
    // The live store (already hydrated from a clean beforeEach state) must remain usable.
    expect(() => useGameStore.getState().resetGame()).not.toThrow();
  });

  it('actually exercises the module-load-time corruption path: quarantines the bad value and sets saveRecoveryNotice', async () => {
    // validatingStorage.getItem only runs during the store's OWN hydration at module
    // import time, which already happened (with a clean store) above — so the only way
    // to genuinely exercise its corruption-detection branch is to seed a corrupted save
    // BEFORE a fresh module instance is created, then force that fresh import.
    localStorage.clear();
    localStorage.setItem('mathverse-save', '{not valid json!!!');

    vi.resetModules();
    const fresh = await import('./gameStore');

    expect(fresh.saveRecoveryNotice).toMatch(/could not be loaded/i);
    expect(localStorage.getItem('mathverse-save')).toBeNull(); // bad value removed...
    expect(localStorage.getItem('mathverse-save-corrupted-backup')).toBe('{not valid json!!!'); // ...but preserved
    // And the fresh store itself must have hydrated to clean defaults, not garbage.
    expect(fresh.useGameStore.getState().character).toBeNull();
    expect(fresh.useGameStore.getState().xp).toBe(0);
  });

  it('quarantines a well-formed JSON save that has the wrong shape, the same way', async () => {
    localStorage.clear();
    localStorage.setItem('mathverse-save', JSON.stringify({ state: { hello: 'world' }, version: 1 }));

    vi.resetModules();
    const fresh = await import('./gameStore');

    expect(fresh.saveRecoveryNotice).toMatch(/could not be loaded/i);
    expect(localStorage.getItem('mathverse-save-corrupted-backup')).toContain('hello');
  });
});
