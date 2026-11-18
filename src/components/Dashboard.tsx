import { useRef, useState } from 'react';
import { BOSSES } from '../data/bosses';
import { TOPICS } from '../data/topics';
import { WORLDS } from '../data/worlds';
import { getDaysPracticedThisWeek, getOverallAccuracy, getStudyStreak, getTopicsMasteredThisWeek, useGameStore } from '../store/gameStore';
import { MASTERY_NAMES } from '../types';

const MASTERY_COLOR: Record<number, string> = {
  1: 'bg-gray-500',
  2: 'bg-rose-500',
  3: 'bg-amber-500',
  4: 'bg-cyan-500',
  5: 'bg-emerald-500',
};

export function Dashboard() {
  const { character, level, xp, coins, stars, mastery, attempts, defeatedBosses, unlockedWorldIds, exportSave, importSave } =
    useGameStore();
  const { independent, withHint } = getOverallAccuracy(attempts);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  // Snapshot "now" once per mount rather than calling Date.now() during render.
  const [now] = useState(() => Date.now());
  const streak = getStudyStreak(attempts, now);
  const daysThisWeek = getDaysPracticedThisWeek(attempts, now);
  const masteredThisWeek = getTopicsMasteredThisWeek(mastery, now);

  const activeWorlds = WORLDS.filter((w) => !w.locked && unlockedWorldIds.includes(w.id));
  const allActiveTopics = TOPICS.filter((t) => activeWorlds.some((w) => w.id === t.worldId));
  const masteredCount = allActiveTopics.filter((t) => (mastery[t.id]?.level ?? 1) >= 4).length;
  const calculusReadiness =
    allActiveTopics.length === 0 ? 0 : Math.round((masteredCount / allActiveTopics.length) * 100);

  const handleExport = () => {
    const json = exportSave();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const datestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `mathverse-save-${datestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const result = importSave(text);
    if (result.ok) {
      setImportMessage({ kind: 'ok', text: 'Progress imported — reloading...' });
      setTimeout(() => window.location.reload(), 900);
    } else {
      setImportMessage({ kind: 'error', text: result.error });
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl text-amber-200 mb-1 text-center">
          {character?.name ?? 'Hero'}'s Dashboard
        </h1>
        <p className="text-purple-300 text-center mb-4">Track your journey toward Calculus readiness.</p>

        <div className="flex items-center justify-center gap-3 mb-6 text-sm">
          <button
            onClick={handleExport}
            className="px-4 py-1.5 rounded-full border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/20"
          >
            ⬇️ Export Progress
          </button>
          <button
            onClick={() => {
              setImportMessage(null);
              fileInputRef.current?.click();
            }}
            className="px-4 py-1.5 rounded-full border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/20"
          >
            ⬆️ Import Progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importMessage && (
          <p className={`text-center text-sm mb-4 ${importMessage.kind === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {importMessage.text}
          </p>
        )}

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

        <div className="bg-black/40 border border-amber-400/30 rounded-2xl p-5 mb-6">
          <h2 className="font-display text-lg text-amber-200 mb-3">🔥 Study Habits</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Current Streak" value={`${streak.currentStreakDays}d`} icon="🔥" />
            <StatCard label="Days This Week" value={`${daysThisWeek}/7`} icon="📅" />
            <StatCard label="Mastered This Week" value={masteredThisWeek} icon="📈" />
          </div>
          {streak.currentStreakDays > 0 && !streak.practicedToday && (
            <p className="text-xs text-amber-300 mt-3 text-center">
              Practice today to keep your {streak.currentStreakDays}-day streak alive!
            </p>
          )}
          {streak.currentStreakDays === 0 && (
            <p className="text-xs text-purple-400 mt-3 text-center">Solve a problem today to start a streak.</p>
          )}
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
