import { BOSSES } from '../data/bosses';
import { TOPICS } from '../data/topics';
import { WORLDS } from '../data/worlds';
import { getOverallAccuracy, useGameStore } from '../store/gameStore';
import { MASTERY_NAMES } from '../types';

const MASTERY_COLOR: Record<number, string> = {
  1: 'bg-gray-500',
  2: 'bg-rose-500',
  3: 'bg-amber-500',
  4: 'bg-cyan-500',
  5: 'bg-emerald-500',
};

export function Dashboard() {
  const { character, level, xp, coins, stars, mastery, attempts, defeatedBosses, unlockedWorldIds } =
    useGameStore();
  const { independent, withHint } = getOverallAccuracy(attempts);

  const activeWorlds = WORLDS.filter((w) => !w.locked && unlockedWorldIds.includes(w.id));
  const allActiveTopics = TOPICS.filter((t) => activeWorlds.some((w) => w.id === t.worldId));
  const masteredCount = allActiveTopics.filter((t) => (mastery[t.id]?.level ?? 1) >= 4).length;
  const calculusReadiness =
    allActiveTopics.length === 0 ? 0 : Math.round((masteredCount / allActiveTopics.length) * 100);

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl text-amber-200 mb-1 text-center">
          {character?.name ?? 'Hero'}'s Dashboard
        </h1>
        <p className="text-purple-300 text-center mb-6">Track your journey toward Calculus readiness.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Level" value={level} />
          <StatCard label="XP" value={xp} />
          <StatCard label="Coins" value={coins} icon="🪙" />
          <StatCard label="Stars" value={stars} icon="⭐" />
          <StatCard label="Questions Solved" value={attempts.length} />
          <StatCard label="Independent Accuracy" value={`${independent}%`} />
          <StatCard label="Accuracy w/ Hints" value={`${withHint}%`} />
          <StatCard label="Calculus Readiness" value={`${calculusReadiness}%`} />
        </div>

        {activeWorlds.map((world) => {
          const worldTopics = TOPICS.filter((t) => t.worldId === world.id);
          const boss = BOSSES[world.id];
          return (
            <div key={world.id} className="bg-black/40 border border-purple-400/30 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-amber-200">{world.name} Mastery</h2>
                {boss && (
                  <span className={defeatedBosses.includes(boss.id) ? 'text-emerald-400 text-xs' : 'text-purple-400 text-xs'}>
                    {boss.icon} {defeatedBosses.includes(boss.id) ? `${boss.name} Defeated` : `${boss.name}: Not yet defeated`}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {worldTopics.map((t) => {
                  const m = mastery[t.id];
                  const lvl = m?.level ?? 1;
                  return (
                    <div key={t.id}>
                      <div className="flex justify-between text-xs text-purple-300 mb-1">
                        <span>{t.name}</span>
                        <span>{MASTERY_NAMES[lvl]}</span>
                      </div>
                      <div className="h-2 bg-purple-950 rounded-full overflow-hidden">
                        <div className={`h-2 ${MASTERY_COLOR[lvl]} transition-all`} style={{ width: `${(lvl / 5) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <div className="bg-black/40 border border-purple-400/20 rounded-xl p-3 text-center">
      <div className="text-xl font-bold text-amber-200">{icon} {value}</div>
      <div className="text-[10px] text-purple-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}
