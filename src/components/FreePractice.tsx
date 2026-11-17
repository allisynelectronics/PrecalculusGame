import { useState } from 'react';
import { getTopic, TOPICS } from '../data/topics';
import { WORLDS } from '../data/worlds';
import { useGameStore } from '../store/gameStore';
import { MASTERY_NAMES } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDue(nextReviewAt: number | null | undefined, now: number): string {
  if (!nextReviewAt) return 'Due now'; // null/undefined — e.g. mastery saved before this field existed
  const overdueDays = Math.floor((now - nextReviewAt) / DAY_MS);
  if (overdueDays <= 0) return 'Due today';
  if (overdueDays === 1) return 'Overdue by 1 day';
  return `Overdue by ${overdueDays} days`;
}

export function FreePractice() {
  const { mastery, lastPracticeTopicId, startProblem, setScreen } = useGameStore();

  const lastTopic = lastPracticeTopicId ? getTopic(lastPracticeTopicId) : undefined;
  const lastWorld = lastTopic ? WORLDS.find((w) => w.id === lastTopic.worldId) : undefined;

  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(lastTopic?.worldId ?? null);
  // Snapshot "now" once per mount (not on every render) — this screen remounts fresh
  // each time the player returns from a problem, so the due list still stays current
  // across practice rounds without calling the impure Date.now() during render itself.
  const [now] = useState(() => Date.now());

  // The Weakness Workshop: real spaced-repetition review, not just "lowest mastery."
  // Only topics the player has actually attempted enter the schedule at all; a topic
  // becomes due when its stored nextReviewAt has passed (or is missing — treated as
  // due now, e.g. for mastery data saved before this field existed). Most-overdue
  // first, capped to keep the list focused rather than overwhelming.
  const dueTopics = TOPICS.filter((t) => mastery[t.id])
    .map((t) => ({ topic: t, m: mastery[t.id] }))
    .filter(({ m }) => (m.nextReviewAt ?? 0) <= now)
    .sort((a, b) => (a.m.nextReviewAt ?? 0) - (b.m.nextReviewAt ?? 0))
    .slice(0, 8);

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

        <div className="mb-6">
          <h2 className="font-display text-lg text-amber-200 mb-1">🔬 Weakness Workshop</h2>
          <p className="text-purple-400 text-xs mb-2">
            Spaced review: topics you've already practiced, resurfaced on schedule — sooner for weaker topics, later for strong ones.
          </p>

          {dueTopics.length === 0 ? (
            <div className="bg-black/30 border border-purple-400/20 rounded-xl px-4 py-3 text-purple-300 text-sm">
              Nothing due for review right now — nice work! Pick a world below to practice ahead of schedule, or check back later.
            </div>
          ) : (
            <div className="space-y-2">
              {dueTopics.map(({ topic, m }) => {
                const world = WORLDS.find((w) => w.id === topic.worldId);
                const prereq = topic.prerequisite ? getTopic(topic.prerequisite) : undefined;
                const prereqWeak = prereq && (mastery[prereq.id]?.level ?? 1) <= 2;
                return (
                  <div key={topic.id} className="bg-black/40 border border-purple-400/30 rounded-xl overflow-hidden">
                    <button
                      onClick={() => practice(topic.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-500/10 text-left"
                    >
                      <div className="min-w-0">
                        <span className="text-purple-100 text-sm">{topic.name}</span>
                        <span className="text-purple-500 text-xs ml-2">{world?.name}</span>
                      </div>
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/80 text-black font-semibold ml-3">
                        {formatDue(m.nextReviewAt, now)}
                      </span>
                    </button>
                    {prereqWeak && prereq && (
                      <div className="px-4 pb-2 -mt-1 text-xs text-amber-300 flex items-center gap-1 flex-wrap">
                        <span>⚠️ Shaky on the prerequisite —</span>
                        <button
                          onClick={() => practice(prereq.id)}
                          className="underline hover:text-amber-200 font-semibold"
                        >
                          review {prereq.name} first
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
