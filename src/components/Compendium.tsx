import { useMemo, useState } from 'react';
import { FORMULAS } from '../data/formulas';
import { MathBlock, MathText } from './Math';

export function Compendium() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FORMULAS;
    return FORMULAS.filter(
      (f) => f.name.toLowerCase().includes(q) || f.meaning.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 bg-gradient-to-b from-[#0b0a14] to-[#1a1033]">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl text-amber-200 mb-1 text-center">📖 The Book of Mathematics</h1>
        <p className="text-purple-300 text-center mb-6">Searchable formulas and worked examples.</p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search formulas (e.g. 'quadratic', 'exponent')"
          className="w-full px-4 py-2 mb-6 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100 focus:outline-none focus:border-amber-400"
        />

        <div className="space-y-4">
          {filtered.map((f) => (
            <div key={f.id} className="bg-black/40 border border-purple-400/30 rounded-xl p-4">
              <h2 className="font-display text-lg text-amber-200 mb-1">{f.name}</h2>
              <MathBlock tex={f.tex} className="text-purple-100 my-2" />
              <p className="text-sm text-purple-300 mb-1"><span className="text-purple-500">Meaning: </span>{f.meaning}</p>
              <p className="text-sm text-purple-300 mb-1"><span className="text-purple-500">When to use: </span>{f.whenToUse}</p>
              <p className="text-sm text-amber-100"><span className="text-purple-500">Example: </span><MathText text={f.example} /></p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-purple-400">No formulas match "{query}" yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
