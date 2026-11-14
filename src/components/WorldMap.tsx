import { WORLDS } from '../data/worlds';
import { useGameStore } from '../store/gameStore';

export function WorldMap() {
  const enterWorld = useGameStore((s) => s.enterWorld);
  const unlockedWorldIds = useGameStore((s) => s.unlockedWorldIds);

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl text-amber-200 mb-1 text-center">The Mathverse</h1>
        <p className="text-purple-300 text-center mb-8">
          Thirteen worlds stand between you and the Calculus Gateway.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WORLDS.map((w, i) => {
            const isUnlocked = unlockedWorldIds.includes(w.id) && !w.locked;
            const underDevelopment = w.locked;
            const awaitingBoss = !underDevelopment && !isUnlocked;
            // Find the nearest earlier world that actually has content (i.e. skip any
            // still-"Under Development" worlds), since that's whose boss truly unlocks this one.
            const prevWorld = [...WORLDS.slice(0, i)].reverse().find((pw) => !pw.locked);
            return (
              <button
                key={w.id}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && enterWorld(w.id)}
                className={`relative rounded-2xl p-5 text-left overflow-hidden border border-white/10 group disabled:cursor-not-allowed ${awaitingBoss ? 'opacity-60' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${w.colorFrom}, ${w.colorTo})`,
                }}
              >
                <div className="text-xs uppercase tracking-wider text-white/60">World {w.index}</div>
                <div className="font-display text-xl text-white mt-1">{w.name}</div>
                <div className="text-sm text-white/80 mt-1 italic">{w.tagline}</div>
                <div className="mt-3 text-xs text-white/60">Boss: {w.boss}</div>
                {!underDevelopment && w.partial && (
                  <div className="mt-1 inline-block text-[10px] text-amber-200/90 bg-black/30 rounded-full px-2 py-0.5">
                    ⚒️ Core curriculum — more topics coming
                  </div>
                )}
                {awaitingBoss && (
                  <div className="mt-2 text-[10px] text-white/70 bg-black/40 rounded-full px-2 py-0.5 inline-block">
                    🔒 Defeat {prevWorld?.boss ?? 'the previous boss'} to unlock
                  </div>
                )}

                {underDevelopment && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-white/80 text-sm font-semibold border border-white/30 rounded-full px-3 py-1">
                      🔒 Under Development
                    </span>
                  </div>
                )}
                {!underDevelopment && isUnlocked && (
                  <div className="absolute bottom-3 right-3 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
