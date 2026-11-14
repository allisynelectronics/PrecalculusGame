import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const AVATARS: { id: string; emoji: string; title: string; colorClass: string }[] = [
  { id: 'astra', emoji: '🧙‍♀️', title: 'Astra the Equation Mage', colorClass: 'from-fuchsia-500 to-purple-600' },
  { id: 'orion', emoji: '🧑‍🚀', title: 'Orion the Graph Pilot', colorClass: 'from-cyan-500 to-blue-600' },
  { id: 'rook', emoji: '🛠️', title: 'Rook the Forge Engineer', colorClass: 'from-amber-500 to-orange-600' },
  { id: 'vex', emoji: '🗡️', title: 'Vex the Identity Hunter', colorClass: 'from-rose-500 to-red-600' },
  { id: 'nyx', emoji: '🌙', title: 'Nyx the Function Walker', colorClass: 'from-indigo-500 to-violet-700' },
  { id: 'sol', emoji: '☀️', title: 'Sol the Radical Sage', colorClass: 'from-yellow-400 to-amber-600' },
];

export function CharacterCreation() {
  const setCharacter = useGameStore((s) => s.setCharacter);
  const setScreen = useGameStore((s) => s.setScreen);
  const [selected, setSelected] = useState(AVATARS[0].id);
  const [name, setName] = useState('');

  const chosen = AVATARS.find((a) => a.id === selected)!;

  const handleConfirm = () => {
    setCharacter({
      name: name.trim() || chosen.title.split(' the ')[0],
      avatar: chosen.emoji,
      colorClass: chosen.colorClass,
    });
    setScreen('diagnostic');
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 flex flex-col items-center bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
      <h1 className="font-display text-3xl text-amber-200 mb-2">Choose Your Hero</h1>
      <p className="text-purple-300 mb-8">Your mathematical guide awaits on the other side of the Forge gates.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
        {AVATARS.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a.id)}
            className={`rounded-xl p-4 border-2 transition-all bg-gradient-to-br ${a.colorClass} ${
              selected === a.id ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-70'
            }`}
          >
            <div className="text-5xl">{a.emoji}</div>
            <div className="text-xs mt-2 font-semibold text-white">{a.title}</div>
          </button>
        ))}
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`Name your hero (default: ${chosen.title.split(' the ')[0]})`}
        className="mt-8 w-72 px-4 py-2 rounded-lg bg-black/40 border border-purple-400/40 text-center text-purple-100 placeholder:text-purple-500/60 focus:outline-none focus:border-amber-400"
        maxLength={18}
      />

      <button
        onClick={handleConfirm}
        className="mt-6 px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold shadow-lg hover:scale-105 transition-transform"
      >
        Confirm & Take the Diagnostic
      </button>
    </div>
  );
}
