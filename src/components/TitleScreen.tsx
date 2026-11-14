import { useGameStore } from '../store/gameStore';

export function TitleScreen() {
  const { character, setScreen, diagnosticDone } = useGameStore();

  const handleStart = () => {
    if (!character) setScreen('character');
    else if (!diagnosticDone) setScreen('diagnostic');
    else setScreen('worldmap');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0b0a14] via-[#1a1033] to-[#0b0a14] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-300 animate-glow"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 10) * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 animate-float">
        <div className="text-7xl mb-4">🧮✨</div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300">
          MATHVERSE
        </h1>
        <h2 className="text-xl md:text-2xl mt-2 text-purple-200 tracking-widest">
          THE PRECALCULUS QUEST
        </h2>
        <p className="mt-4 text-purple-300/80 italic">
          Master the Math. Conquer the Worlds. Unlock Calculus.
        </p>
      </div>

      <button
        onClick={handleStart}
        className="relative z-10 mt-12 px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold text-lg shadow-lg shadow-fuchsia-500/30 hover:scale-105 transition-transform"
      >
        {character ? (diagnosticDone ? 'Enter the Mathverse' : 'Begin Diagnostic') : 'Begin Your Quest'}
      </button>

      {character && (
        <button
          onClick={() => {
            if (confirm('Reset all progress? This cannot be undone.')) {
              useGameStore.getState().resetGame();
            }
          }}
          className="relative z-10 mt-4 text-xs text-purple-400/60 hover:text-purple-300 underline"
        >
          Reset progress
        </button>
      )}
    </div>
  );
}
