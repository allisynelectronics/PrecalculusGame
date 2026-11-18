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
  "practice again" shortcut for the last-practiced topic. Reuses the existing
  problem-solving UI (hints, explain, break-it-down, mastery tracking, rewards)
  entirely — no duplicated logic.
- Fixed a pre-existing HUD overflow bug on narrow (phone-width) screens, found while
  testing Free Practice.
- Added a real **spaced-repetition Weakness Workshop** inside Free Practice. Each
  mastery record now tracks `lastReviewedAt` and `nextReviewAt`; a correct answer
  schedules the next review using the interval for the *new* mastery level (1 day at
  "Learning" up to 14 days at "Mastered" — longer gaps as mastery grows, the standard
  spaced-repetition shape), while a wrong answer schedules review immediately rather
  than on the usual schedule. The Workshop surfaces only topics that are actually due,
  most-overdue first, and — per the original brief's "routes students to missing
  prerequisites automatically" — flags when a due topic's prerequisite is itself weak
  or unattempted, with a one-click shortcut to review that first.
- Added **difficulty selection in Free Practice**: a persisted Auto/Beginner/
  Intermediate/Advanced picker that overrides the mastery-based auto-pick (and the
  portal/knowledge "always advanced" rule) for every problem practiced until changed,
  so a player can deliberately push into harder material instead of waiting for the
  mastery algorithm to offer it.
- Added the **Exam Simulator**: a timed (90s/question), mixed-topic assessment mode
  with no hints and one answer per question — Quick (10q/15min), Standard (20q/30min),
  or Full (30q/45min) length, drawing topics only from unlocked worlds, difficulty
  per-topic from current mastery. A skip option and an "End Exam Early" option both
  end realistically (unanswered/skipped count against the score, not just wrong
  answers), and the results screen breaks down correct/incorrect/skipped/unanswered
  plus a per-topic score table so a student can see exactly what to review next. Each
  question still updates mastery/spaced-repetition like any other attempt; the last
  exam's score is shown on the setup screen as a point of reference for the next one.
  (identityProof problems are excluded from the exam pool — their multi-stage,
  hint-embedded UI doesn't fit a single-attempt, no-hints format; this is the same
  `excludeIdentityProof` option already used for boss fights.)
- Added **study-habit visibility** to the Dashboard: a 🔥 Study Habits section showing
  the current daily practice streak (counts consecutive days with at least one
  attempt; not broken just because today isn't over yet — it's still "alive" if
  yesterday was practiced), days practiced in the last 7, and topics that first
  reached "Proficient" mastery or higher in the last 7 days. `TopicMastery` gained a
  `masteredAt` timestamp (set once, kept even if the level later decays) to make the
  "mastered this week" trend possible without replaying attempt history.
- Did a **keyboard-only navigation pass** (tabbing through every major screen with no
  mouse) and fixed everything real it turned up — this is NOT the same as real
  screen-reader-user testing (see "Known limitations" below), but it's genuine,
  verified coverage beyond axe-core alone:
  - The browser's default keyboard-focus ring wasn't rendering *visibly* anywhere in
    the app (confirmed via screenshot — `:focus-visible` matched, nothing was
    perceptible against the dark/gradient theme). Fixed with one global, high-contrast
    `:focus-visible` rule in `index.css` rather than patching every button.
  - Added a "Skip to main content" link (visible only once focused) so keyboard users
    don't have to re-tab through the same 5-6-button nav bar on every single screen.
  - Several buttons had no real accessible name at all for a screen reader to announce
    (hero-select cards, world cards, exam-length cards — all multi-line button content
    that wasn't being exposed as a name) or an ambiguous one (every per-topic "Practice"
    button in Free Practice announced as just "Practice," indistinguishable from the
    others in a screen-reader elements list). Fixed with explicit `aria-label`s, or by
    aria-hiding flavor text that was never meant to be the name in the first place.
  - This surfaced a second, non-obvious correctness bar: WCAG 2.5.3 "Label in Name" —
    axe-core caught two of the `aria-label` fixes above because the label didn't
    literally contain the visible text (a colon I'd added wasn't actually in the
    rendered DOM text), which breaks voice-control software that says "click
    <visible label>". Both were corrected and re-verified with axe.
  - Added `aria-pressed`/`aria-current` to every toggle-style button (difficulty/length
    pickers, world pickers, lab-explorer mode selectors, HUD nav) so screen readers can
    tell what's currently selected, not just that a button exists.
  - Added `aria-live="polite"` regions for the correct/incorrect/skipped feedback in
    ProblemView, BossBattle, and the Exam Simulator, and for the Exam Simulator's
    question counter — but deliberately NOT for its per-second countdown timer, since
    announcing every tick would be disruptive rather than helpful.

## Next up — ranked by learning impact

1. **Weakness Workshop refinements.** The review-interval schedule (1/3/7/14 days) is a
   reasonable first cut, not tuned against real usage data. Worth revisiting once there's
   enough attempt history to see whether topics are being resurfaced too early/late in
   practice. The "due" list is also currently capped at 8 topics with no way to see more
   if more are overdue.

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
- The Dashboard's study streak and "days this week" stats are computed from `attempts`,
  which is capped to the most recent 200 records. At normal practice volume this is a
  non-issue, but an extremely heavy practice day (200+ problems) could push older days
  out of the window and undercount a longer streak.
- The keyboard-only pass (above) is real but partial coverage — it's not a substitute
  for an actual screen-reader user (NVDA/JAWS/VoiceOver) going through the app. That
  kind of testing catches things a sighted keyboard-only pass structurally can't: how
  verbose/confusing something actually *sounds*, whether the reading order makes sense,
  and whether the genuinely visual interactive labs (drag-a-slider-watch-a-graph-move —
  Unit Circle Explorer, Vector Simulator, Polar Grapher, etc.) have any usable
  non-visual equivalent at all, which right now they don't. Worth doing with a real
  user if this app is ever shared beyond one person.
