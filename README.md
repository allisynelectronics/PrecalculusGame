# MATHVERSE: The Precalculus Quest

> *Master the Math. Conquer the Worlds. Unlock Calculus.*

An RPG-style adventure game that teaches college precalculus for real — you solve actual math problems (graded by a real math engine, not string-matching), not multiple-choice trivia.

## Play it right now

**Option A — one file, zero setup.** Download [`mathverse-single-file.html`](./mathverse-single-file.html) from this repo and open it in any modern browser. That's it — no install, no server, nothing to build. Progress saves to your browser's local storage.

**Option B — run it from source** (for development):

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## What's actually in the game

- **13 themed worlds**, each with its own boss, following the precalculus → calculus curriculum: Foundation Forge (algebra), Polynomial Peaks, Rational Function Rift, Exponential Empire, Trigonometric Kingdom, Trig Graph Galaxy, Identity Citadel, Triangle Expedition, Polar Orbit & Vector Valley, Conic Constellation, Matrix Fortress, Sequence Summit, and the Calculus Gateway.
- **441 hand-written, verified problems** across those worlds — every numeric/algebraic answer was checked by an independent script (not just "does it match itself") before shipping. Run `npm run verify` to see for yourself.
- **A real answer checker**, not string matching: built on [mathjs](https://mathjs.org/), it accepts anything mathematically equivalent — `3x+10` or `10+3x`, `sqrt(5)` or `\sqrt{5}` (LaTeX input works), `1/2` or `0.5`, `(4,infinity)` or unions of intervals, vectors as `3+4i`, two-variable difference quotients, etc.
- **A real learning loop**, not just quiz-and-grade: Discover → Watch → Solve, with Hint / Explain the Rule / Break It Down / Show a Similar Example / I'm Lost on every problem, and a full worked solution after repeated misses.
- **Two genuinely interactive labs**: a drag-to-explore **Unit Circle Explorer** (with a quiz mode that hides values) and an **Identity Locks** step-by-step trig-identity proof builder — not "true/false", an actual multi-step transformation ladder.
- An adventure board (dice movement, 8 space types), 4-phase boss fights, XP/coins/stars, a mastery dashboard, and a searchable formula compendium ("The Book of Mathematics").

## Honest scope

This is the **first two build milestones** of a much larger spec (see `MASTER_PROMPT.md` if you want the original brief). Every world listed above is genuinely playable with real, verified content — but each world covers a curated *subset* of its full textbook curriculum (marked "⚒️ Core curriculum — more topics coming" on the map), not the entire topic list from the original design document. Not yet built: the exam simulator, course-material (PDF) upload/ingestion, and a few of the other interactive labs the spec calls for (Wave Constructor, polar/matrix explorers). Progression between worlds is sequential — you unlock the next world by beating the current one's boss.

## Scripts

```bash
npm run dev           # start the dev server
npm run build          # production build (dist/)
npm run build:single   # single self-contained HTML file (dist-single/index.html)
npm run verify          # run the full answer-checker regression suite (441 problems + reject tests + LaTeX input tests)
npm run lint            # oxlint
```

## Tech

React 19 + TypeScript + Vite, Zustand for state (persisted to `localStorage`), Tailwind CSS v4, KaTeX for math typesetting, mathjs for answer grading. No backend — everything runs client-side.

## Project structure

```
src/
  components/     # screens and UI (board, problem view, boss battle, labs, etc.)
  data/
    problems/     # one file per world — the actual problem banks
    topics.ts, worlds.ts, bosses.ts, formulas.ts, board.ts
  lib/            # grade.ts (dispatch) + mathCheck.ts (the actual math-equivalence logic)
  store/          # zustand game state
scripts/          # verifyProblems.ts, verifyRejects.ts, verifyLatexInput.ts
```
