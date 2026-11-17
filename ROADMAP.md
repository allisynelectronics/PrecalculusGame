# MATHVERSE Roadmap

A running list of what's done and what's left, kept so this doesn't only live in chat
history. Priority order below is based on **learning impact for a student actually
using this to study** — not implementation ease. Update this file whenever a tracked
item ships or a new one is identified; don't let it drift out of sync with reality.

## Recently completed (2026-11, this build phase)

- Closed 3 real curriculum gaps found by cross-checking against *Blitzer, Algebra and
  Trigonometry*, 7th ed.: the Functions chapter (transformations, composition,
  inverses, circles), Nonlinear Systems/Systems of Inequalities/Linear Programming,
  and Mathematical Induction/Counting/Probability.
- Deepened every world to at least 6 problems per topic (was 4). 701 problems total.
- Added an on-screen math symbol toolbar (π, √, exponent, /, ∞, i) to the answer input.
- Found and fixed 15 duplicate-problem-ID collisions across the bank (IDs are global,
  not per-file — a silent collision meant one problem could shadow another for any
  ID-based lookup).
- Added **Free Practice mode**: pick any topic from any world directly (bypasses the
  board-unlock gating on purpose — practice access shouldn't be rationed), with a
  "Needs Practice" shortcut that surfaces the player's lowest-mastery topics and a
  "practice again" shortcut for the last-practiced topic. Reuses the existing
  problem-solving UI (hints, explain, break-it-down, mastery tracking, rewards)
  entirely — no duplicated logic.
- Fixed a pre-existing HUD overflow bug on narrow (phone-width) screens, found while
  testing Free Practice.

## Next up — ranked by learning impact

1. **Spaced-repetition "Weakness Workshop".** Free Practice's "Needs Practice" list is
   a first step (lowest mastery level, surfaced on demand) but it's not spaced
   repetition — it doesn't track *when* a topic was last reviewed or resurface it on a
   schedule (e.g. 1 day / 3 days / 7 days / 14 days after the last correct answer).
   Spaced retrieval practice is one of the most evidence-backed interventions in
   learning science; this is the highest-leverage thing left to build. Needs: a
   `lastReviewedAt` timestamp per topic in the mastery record, and a scheduling
   function that ranks "due" topics instead of just sorting by raw mastery level.
2. **Exam Simulator.** A timed, mixed-topic, no-hints assessment mode that mimics real
   test conditions — useful specifically because Free Practice and board play both
   allow infinite retries and hints, which is good for *learning* but doesn't build
   the test-taking calibration (pacing, no safety net) a retake actually needs.
3. **Difficulty selection in Free Practice.** Right now Free Practice auto-picks
   difficulty from the player's current mastery level, same as board play. Letting the
   player explicitly choose beginner/intermediate/advanced would let them deliberately
   push into harder material instead of waiting for the mastery algorithm to offer it.
4. **Study-habit visibility.** A visible daily/weekly practice streak and a "topics
   mastered this week" trend on the Dashboard. Self-monitoring is a well-established
   lever for maintaining a study habit, especially over a semester-long retake.
5. **Manual accessibility pass.** Only axe-core (automated) has been run so far — no
   real screen reader (NVDA/JAWS/VoiceOver) or keyboard-only navigation pass. Automated
   tools catch a real but partial subset of issues.

## Lower priority

- Printable/exportable formula sheet generated from the Compendium.
- Optional per-session timer inside Free Practice (lighter-weight than a full exam
  simulator) for building raw fluency speed on fundamentals.
- Course-material (PDF) upload/ingestion — large scope, speculative payoff compared to
  the items above for this specific use case.
- Further curriculum breadth beyond the Blitzer-gap-closing done this session — every
  world still covers a curated *subset* of the full textbook's topic list, not every
  named sub-topic (see "Honest scope" in README.md).
- Bundle size / code-splitting (currently ~1.7MB; could split by world) — a
  performance nice-to-have, not a learning-outcome lever.

## Known limitations / maintenance notes

- `npm run verify:independent` cross-checks answers against the problem's own
  prompt/worked solution, but it structurally cannot catch "stored the unsimplified
  form as the answer" bugs (the unsimplified and simplified forms are value-equal, so
  it reports a false match). Two real bugs of this exact shape were found and fixed by
  manual inspection this session (radicals, rf-simplify) — a periodic manual spot-check
  of a sample of problems (especially "simplify / factor / condense" prompts) is worth
  doing again later, since this script can't be trusted to catch the whole class.
- All 15 duplicate-problem-ID collisions found this session were fixed, and
  `npm run verify` (`scripts/verifyProblems.ts`) now permanently checks for duplicate
  IDs across the whole bank on every run, so a new collision will be caught
  automatically instead of by chance.
- No mobile-specific QA pass beyond the one HUD fix made in passing while testing Free
  Practice — layout hasn't been systematically checked at phone width across every
  screen.
