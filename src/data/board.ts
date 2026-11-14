import type { BoardSpace, SpaceType } from '../types';
import { TOPICS } from './topics';

// Hand-tuned space pattern: topic challenge spaces interleaved with
// treasure / shrine / portal / mystery / training / knowledge spaces.
const PATTERN: SpaceType[] = [
  'start',
  'shrine',
  'challenge',
  'challenge',
  'treasure',
  'challenge',
  'training',
  'challenge',
  'mystery',
  'challenge',
  'portal',
  'challenge',
  'knowledge',
  'challenge',
  'treasure',
  'challenge',
  'shrine',
  'challenge',
  'mystery',
  'challenge',
  'knowledge',
  'challenge',
  'training',
  'boss',
];

export function buildBoardForWorld(worldId: string): BoardSpace[] {
  const topicOrder = TOPICS.filter((t) => t.worldId === worldId).map((t) => t.id);
  let topicCursor = 0;
  return PATTERN.map((type, index) => {
    if (type === 'start' || type === 'boss' || topicOrder.length === 0) {
      return { index, type };
    }
    const topicId = topicOrder[topicCursor % topicOrder.length];
    topicCursor += 1;
    return { index, type, topicId };
  });
}
