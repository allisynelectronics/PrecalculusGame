import { useMemo, useState } from 'react';
import { getTopic, TOPICS } from '../data/topics';
import { WORLDS } from '../data/worlds';
import { useGameStore } from '../store/gameStore';
import { MASTERY_NAMES, type MasteryLevel } from '../types';

const MASTERY_COLOR: Record<MasteryLevel, string> = {
  1: 'bg-gray-500',
  2: 'bg-rose-500',
  3: 'bg-amber-500',
  4: 'bg-cyan-500',
  5: 'bg-emerald-500',
};

export function FreePractice() {
  const { mastery, lastPracticeTopicId, startProblem, setScreen } = useGameStore();

  const lastTopic = lastPracticeTopicId ? getTopic(lastPracticeTopicId) : undefined;
  const lastWorld = lastTopic ? WORLDS.find((w) => w.id === lastTopic.worldId) : undefined;

  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(lastTopic?.worldId ?? null);

  // Surfaces the topics most worth practicing right now: lowest mastery level first,
  // then lowest accuracy — only among topics the player has actually attempted, since
  // "never tried" isn't the same signal as "struggling with."
  const weakestTopics = useMemo(() => {
    return TOPICS.filter((t) => mastery[t.id])
      .map((t) => {
        const m = mastery[t.id];
        return { topic: t, level: m.level, accuracy: m.attempts === 0 ? 0 : m.correct / m.attempts };
      })
      .filter((x) => x.level < 5)
      .sort((a, b) => a.level - b.level || a.accuracy - b.accuracy)
      .slice(0, 5);
  }, [mastery]);

  const selectedWorld = WORLDS.find((w) => w.id === selectedWorldId);
  const worldTopics = selectedWorldId ? TOPICS.filter((t) => t.worldId === selectedWorldId) : [];

  const practice = (topicId: string) => startProblem(topicId, 'freepractice');

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-1 gap-2">
          <h1 className="font-display text-3xl text-amber-200">🎯 Free Practice</h1>
          <button
            onClick={() => setScreen('worldmap')}
            className="px-4 py-2 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/20 text-sm shrink-0"
          >
            ← Back to Map
          </button>
        </div>
        <p className="text-purple-300 mb-6">
          Pick any topic from any world and practice it directly — no dice required. Progress and rewards still count.
        </p>

        {lastTopic && (
          <div className="bg-black/40 border border-amber-400/30 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-purple-400 uppercase">Keep practicing</p>
              <p className="text-amber-200 font-semibold truncate">{lastTopic.name}</p>
              {lastWorld && <p className="text-xs text-purple-400">{lastWorld.name}</p>}
            </div>
            <button
              onClick={() => practice(lastTopic.id)}
              className="shrink-0 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold text-sm"
            >
              Practice again
            </button>
          </div>
        )}

        {weakestTopics.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-lg text-amber-200 mb-2">⚠️ Needs Practice</h2>
            <div className="space-y-2">
              {weakestTopics.map(({ topic, level }) => {
                const world = WORLDS.find((w) => w.id === topic.worldId);
                return (
                  <button
                    key={topic.id}
                    onClick={() => practice(topic.id)}
                    className="w-full flex items-center justify-between bg-black/40 border border-purple-400/30 rounded-xl px-4 py-2.5 hover:bg-purple-500/10 text-left"
                  >
                    <div className="min-w-0">
                      <span className="text-purple-100 text-sm">{topic.name}</span>
                      <span className="text-purple-500 text-xs ml-2">{world?.name}</span>
                    </div>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full text-black font-semibold ${MASTERY_COLOR[level]}`}>
                      {MASTERY_NAMES[level]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="font-display text-lg text-amber-200 mb-2">Choose a World</h2>
        <div className="flex flex-wrap gap-2 mb-5">
          {WORLDS.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWorldId(w.id)}
              className={`px-3 py-1.5 rounded-full border text-sm ${
                selectedWorldId === w.id
                  ? 'bg-purple-500/30 border-amber-400/60 text-amber-200'
                  : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/20'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>

        {selectedWorld ? (
          <div className="bg-black/40 border border-purple-400/30 rounded-2xl p-5">
            <h3 className="font-display text-lg text-amber-200 mb-3">{selectedWorld.name}</h3>
            <div className="space-y-2">
              {worldTopics.map((t) => {
                const m = mastery[t.id];
                const level = m?.level ?? 1;
                return (
                  <div key={t.id} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2 gap-3">
                    <div className="min-w-0">
                      <p className="text-purple-100 text-sm truncate">{t.name}</p>
                      <p className="text-purple-500 text-xs">{m ? MASTERY_NAMES[level] : 'Not yet attempted'}</p>
                    </div>
                    <button
                      onClick={() => practice(t.id)}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold text-xs"
                    >
                      Practice
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-purple-400 text-sm text-center mt-8">Pick a world above to see its topics.</p>
        )}
      </div>
    </div>
  );
}
