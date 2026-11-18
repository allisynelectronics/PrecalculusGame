import { useGameStore } from '../store/gameStore';

export function HUD() {
  const { character, xp, coins, stars, level, setScreen, screen } = useGameStore();
  if (!character) return null;

  const xpIntoLevel = xp % 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur border-b border-purple-500/30 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{character.avatar}</span>
        <div>
          <div className="font-semibold text-purple-200">{character.name}</div>
          <div className="flex items-center gap-1 w-28">
            <span className="text-[10px] text-purple-400">Lv{level}</span>
            <div className="flex-1 h-1.5 bg-purple-900/60 rounded">
              <div
                className="h-1.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded"
                style={{ width: `${xpIntoLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-4 text-amber-200 flex-wrap justify-end">
        <span className="text-xs sm:text-sm">🪙 {coins}</span>
        <span className="text-xs sm:text-sm">⭐ {stars}</span>
        <span className="text-xs sm:text-sm">✨ {xp} XP</span>
        <button
          onClick={() => setScreen('worldmap')}
          className={`sm:ml-2 px-2 py-1 rounded border border-purple-400/40 hover:bg-purple-500/20 ${screen === 'worldmap' ? 'bg-purple-500/30' : ''}`}
        >
          🗺️<span className="hidden sm:inline"> Map</span>
        </button>
        <button
          onClick={() => setScreen('dashboard')}
          className={`px-2 py-1 rounded border border-purple-400/40 hover:bg-purple-500/20 ${screen === 'dashboard' ? 'bg-purple-500/30' : ''}`}
        >
          📊<span className="hidden sm:inline"> Dashboard</span>
        </button>
        <button
          onClick={() => setScreen('freepractice')}
          className={`px-2 py-1 rounded border border-purple-400/40 hover:bg-purple-500/20 ${screen === 'freepractice' ? 'bg-purple-500/30' : ''}`}
        >
          🎯<span className="hidden sm:inline"> Practice</span>
        </button>
        <button
          onClick={() => setScreen('examsimulator')}
          className={`px-2 py-1 rounded border border-purple-400/40 hover:bg-purple-500/20 ${screen === 'examsimulator' ? 'bg-purple-500/30' : ''}`}
        >
          📝<span className="hidden sm:inline"> Exam</span>
        </button>
        <button
          onClick={() => setScreen('compendium')}
          className={`px-2 py-1 rounded border border-purple-400/40 hover:bg-purple-500/20 ${screen === 'compendium' ? 'bg-purple-500/30' : ''}`}
        >
          📖<span className="hidden sm:inline"> Book</span>
        </button>
      </div>
    </div>
  );
}
