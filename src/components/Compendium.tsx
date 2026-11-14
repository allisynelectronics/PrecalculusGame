import { useMemo, useState } from 'react';
import { FORMULAS, type FormulaEntry } from '../data/formulas';
import { MathBlock, MathText } from './Math';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Ignores a leading "The " and any non-letter characters when deciding which letter a name sorts under. */
function sortKey(name: string): string {
  return name.replace(/^the\s+/i, '').trim();
}

function letterOf(name: string): string {
  const first = sortKey(name)[0]?.toUpperCase() ?? '#';
  return /[A-Z]/.test(first) ? first : '#';
}

export function Compendium() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FORMULAS;
    return FORMULAS.filter(
      (f) => f.name.toLowerCase().includes(q) || f.meaning.toLowerCase().includes(q),
    );
  }, [query]);

  const groups = useMemo(() => {
    const byLetter = new Map<string, FormulaEntry[]>();
    for (const f of filtered) {
      const letter = letterOf(f.name);
      if (!byLetter.has(letter)) byLetter.set(letter, []);
      byLetter.get(letter)!.push(f);
    }
    for (const list of byLetter.values()) {
      list.sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)));
    }
    // Sort letter groups themselves (A-Z, with "#" for non-letter-starting names last).
    return new Map(
      [...byLetter.entries()].sort(([a], [b]) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      }),
    );
  }, [filtered]);

  const availableLetters = useMemo(() => new Set(groups.keys()), [groups]);
  const railLetters = [...ALPHABET, '#'];

  const jumpTo = (letter: string) => {
    document.getElementById(`compendium-letter-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 bg-gradient-to-b from-[#0b0a14] to-[#1a1033] scroll-smooth">
      <div className="max-w-2xl mx-auto sm:pr-10">
        <h1 className="font-display text-3xl text-amber-200 mb-1 text-center">📖 The Book of Mathematics</h1>
        <p className="text-purple-300 text-center mb-6">Searchable formulas and worked examples.</p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search formulas (e.g. 'quadratic', 'exponent')"
          className="w-full px-4 py-2 mb-6 rounded-lg bg-black/40 border border-purple-400/40 text-purple-100 focus:outline-none focus:border-amber-400"
        />

        <div className="space-y-6">
          {[...groups.entries()].map(([letter, entries]) => (
            <div key={letter}>
              <h2
                id={`compendium-letter-${letter}`}
                className="font-display text-sm text-fuchsia-300 tracking-widest mb-2 scroll-mt-24"
              >
                {letter}
              </h2>
              <div className="space-y-4">
                {entries.map((f) => (
                  <div key={f.id} className="bg-black/40 border border-purple-400/30 rounded-xl p-4">
                    <h3 className="font-display text-lg text-amber-200 mb-1">{f.name}</h3>
                    <MathBlock tex={f.tex} className="text-purple-100 my-2" />
                    <p className="text-sm text-purple-300 mb-1"><span className="text-purple-500">Meaning: </span>{f.meaning}</p>
                    <p className="text-sm text-purple-300 mb-1"><span className="text-purple-500">When to use: </span>{f.whenToUse}</p>
                    <p className="text-sm text-amber-100"><span className="text-purple-500">Example: </span><MathText text={f.example} /></p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-purple-400">No formulas match "{query}" yet.</p>
          )}
        </div>
      </div>

      <div className="hidden sm:flex fixed right-1 top-1/2 -translate-y-1/2 flex-col items-center gap-[2px] z-30 bg-black/30 rounded-full py-2 px-1">
        {railLetters.map((letter) => {
          const active = availableLetters.has(letter);
          return (
            <button
              key={letter}
              onClick={() => active && jumpTo(letter)}
              disabled={!active}
              className={`text-[9px] leading-none w-4 h-4 flex items-center justify-center rounded-full transition-colors ${
                active
                  ? 'text-purple-200 hover:text-amber-200 hover:bg-purple-500/30 cursor-pointer'
                  : 'text-purple-800 cursor-default'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
