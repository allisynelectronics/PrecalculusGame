# Original Design Brief

This is the full original specification this project was built from. It describes a much
larger game than what's implemented so far — see the "Honest scope" section of
[README.md](./README.md) for what's actually built versus what remains.

---

## MASTER GAME DEVELOPMENT PROMPT — MATHVERSE: THE PRECALCULUS QUEST

**Tagline:** Master the Math. Conquer the Worlds. Unlock Calculus.

### Mission

Build an original, fully interactive, beautifully designed browser-based adventure game that
teaches a college student the complete Algebra, Analytical Trigonometry, and Precalculus
curriculum from foundational skills through advanced topics necessary for Calculus I.

This is NOT a children's math game. This is a sophisticated, rewarding, intellectually engaging
educational adventure designed for an adult college student who wants to genuinely master
mathematics. The game should combine:

- The excitement of a Mario Party-style board game
- The exploration and progression of an RPG
- The visual beauty of a polished indie video game
- The mathematical depth of a college textbook
- The adaptive teaching of an excellent personal tutor
- The satisfaction of unlocking skills, collecting rewards, and defeating increasingly
  challenging bosses

Use entirely original characters, artwork, world designs, music, and game mechanics.

**Critical requirement:** This must be a REAL educational game with genuine problem-solving,
not a quiz website pretending to be a game.

### Part 1 — The Central Game Experience

A massive universe of 13 interconnected mathematical worlds, each representing a major section
of the precalculus curriculum, explored via a colorful interactive game board (dice rolls,
branching paths, hidden areas, portals, treasure, mystery events). The ultimate objective is to
unlock the Calculus Gateway, which requires demonstrating mastery of prerequisite mathematical
skills — not just finishing every board.

### Part 2 — The Complete Mathematical Universe

Thirteen worlds, each with a themed environment and a boss:

0. **The Foundation Forge** (Algebra Golem) — integer ops, fractions, factoring, exponents,
   radicals, linear/quadratic equations, inequalities, absolute value, functions.
1. **Polynomial Peaks** (Zero Hunter) — polynomial functions, zeros, synthetic division,
   Remainder/Factor theorems, Rational Zero Theorem, complex zeros, Descartes' Rule.
2. **Rational Function Rift** (Asymptote Phantom) — domain, asymptotes, holes, rational
   equations/inequalities, partial fractions.
3. **The Exponential Empire** (Logarithm Overlord) — exponential/log functions, properties of
   logs, compound interest, growth/decay models.
4. **The Trigonometric Kingdom** (Circle Guardian) — angles, radians, the unit circle, right
   triangle trig, exact values, inverse trig.
5. **Trig Graph Galaxy** (Wave Commander) — graphs of all six trig functions, transformations,
   trig equations.
6. **The Identity Citadel** (Identity Shapeshifter) — fundamental identities, sum/difference,
   double/half-angle, verifying identities step-by-step ("Identity Locks").
7. **The Triangle Expedition** (Triangle Titan) — Law of Sines/Cosines, the ambiguous case,
   bearings, navigation.
8. **Polar Orbit and Vector Valley** (Vector Sentinel) — polar coordinates, polar graphs,
   vectors, the dot product.
9. **The Conic Constellation** (Conic Architect) — parabolas, ellipses, hyperbolas, parametric
   equations.
10. **Matrix Fortress** (Matrix Master) — systems of equations, matrices, determinants, inverse
    matrices, Cramer's Rule.
11. **The Sequence Summit** (Infinite Guardian) — sequences, series, the Binomial Theorem.
12. **The Calculus Gateway** (Guardian of Calculus) — a final, integrative readiness check
    spanning difference quotients, average rate of change, limits, continuity, and derivative
    intuition.

### Part 3 — The Learning Engine

For every major topic: **Discover** (intuitive visual intro) → **Watch** (fully worked example)
→ **Solve Together** (guided) → **Solve Independently** → **Prove Mastery** (spaced repetition,
mixed review). An intelligent feedback system identifies the earliest invalid step, explains the
relevant rule, offers hints progressively, and never just says "Incorrect, try again." Every
problem offers Hint / Explain the Rule / Show Me Visually / Break It Down / Check My Step / Why
Does This Work? / Show a Similar Example / I'm Lost.

### Part 4 — Mathematical Input and Accuracy

Genuine mathematical interaction — numeric answers, fractions, radicals, algebraic/trig
expressions, intervals, vectors, matrices — typeset with KaTeX/MathJax and graded by a real
symbolic math engine that accepts any mathematically equivalent answer, not exact string
matches.

### Part 5 — The Adaptive Mastery System

A 20–30 question adaptive diagnostic maps the player's skills individually (five levels: New →
Learning → Developing → Proficient → Mastered) rather than assuming one overall difficulty.
Includes spaced repetition, mixed-topic review, and a "Weakness Workshop" that routes students to
missing prerequisites automatically.

### Part 6 — Gameplay and Rewards

Challenge / Treasure / Formula Shrine / Portal / Mystery / Boss Gate / Training / Knowledge Trial
spaces. XP, coins, stars, cosmetics, achievements. Multi-phase bosses requiring conceptual
mastery across several related skills, not five random lucky guesses.

### Part 7 — Interactive Mathematical Laboratories

Fifteen reusable interactive tools: polynomial/rational/exponential graph explorers, an
interactive unit circle, a trig wave visualizer, a step-by-step identity proof builder, a trig
equation solution explorer, an oblique triangle solver, polar coordinate/equation plotters, a
vector/dot-product simulator, a conic section explorer, a matrix row-operation simulator, a
sequence/summation explorer, and an interactive Pascal's Triangle.

### Part 8 — Study Modes

Adventure Mode, Free Practice Mode, Guided Lesson Mode, Exam Simulator (timed/untimed,
calculator/no-calculator, worked solutions), and a Calculus Readiness Bootcamp.

### Part 9 — Formula Compendium

A searchable in-game reference, "The Book of Mathematics," covering every formula in the
curriculum with notation, meaning, when to use it, and a worked example.

### Part 10 — Student Dashboard

Current world/level/XP, independent vs. hint-assisted accuracy, topics mastered vs. needing
practice, study streak, calculus readiness, and an interactive skill tree showing prerequisite
relationships.

### Part 11 — Course Materials Upload

Students can upload PDFs, guided notes, or textbook excerpts (the brief references specific
sections from *Blitzer Algebra and Trigonometry*, 6th Edition — 7.1 Law of Sines, 7.2 Law of
Cosines, 7.3 Polar Coordinates, 7.4 Graphs of Polar Equations, 7.6 Vectors, 7.7 The Dot Product).
The game analyzes them, maps topics to the matching worlds, and generates original aligned
practice without reproducing copyrighted material.

### Part 12 — Visual Design

A premium stylized fantasy adventure look — isometric boards, animated equation symbols, smooth
dice animations, glowing treasure, custom boss characters — while keeping mathematical notation
large, legible, and uncluttered.

### Part 13 — Engineering

React, TypeScript, Vite, Tailwind CSS, KaTeX/MathJax, a graphing library, and a symbolic-math
validation layer, with clean separation between game logic, curriculum content, mathematical
validation, teaching/feedback, progression, graphics, and storage. Development proceeds in
staged milestones (first playable → core algebra/trig worlds → everything else), with unfinished
worlds clearly marked as locked/in-development rather than faked.

### Final and Most Important Instruction

> The purpose of MATHVERSE is NOT simply to make the student answer more questions. The purpose
> is to help the student deeply understand *why* mathematics works the way it does, so that they
> can eventually solve difficult college-level precalculus problems on paper without relying on
> the game. A perfect score is not the ultimate achievement. Independent mathematical
> understanding is.
