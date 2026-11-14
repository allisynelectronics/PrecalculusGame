# Testing

This project has four distinct test layers. Each one answers a different question —
read this before assuming a passing suite means more than it actually checked.

## 1. Problem-bank self-consistency — `npm run verify`

Runs `scripts/verifyProblems.ts`, `scripts/verifyRejects.ts`, and
`scripts/verifyLatexInput.ts`.

**What it checks:** that every stored answer in the 441-problem bank parses and
validates against the grading logic for its own answer type, that a curated set of
*wrong* answers is correctly rejected (not vacuously accepted), and that a set of
LaTeX-formatted inputs normalize and grade correctly.

**What it does NOT check:** whether the stored answer is actually the *correct* answer
to the problem as stated. `verifyProblems.ts` compares each stored answer against
itself — that's a syntax/parseability check, not a correctness check. Treat a clean
`npm run verify` run as "the data is well-formed," not "the math is right."

## 2. Independent mathematical re-verification — `npm run verify:independent`

Runs `scripts/independentVerify.ts`, which cross-checks stored answers against two
sources that are genuinely distinct from the answer field itself:

- **Prompt-direct evaluation:** for self-contained "Evaluate:"/"Simplify:" prompts
  with no free variables, it extracts the literal expression from the prompt text and
  evaluates it independently, then compares that to the stored answer.
- **Worked-solution cross-check:** for problems with a `worked` solution array, it
  extracts the final worked line and compares it to the stored answer.

As of this audit: 405 checks run across 245 of the 441 problems (the rest use natural-
language phrasing — "Solve for x," "Find the vertex of," word problems — that can't be
safely auto-extracted without risking a false "verified"; those are reported as
`UNVERIFIABLE`, not silently skipped or guessed at). This surfaced and led to fixing a
real bug (7 "Factor completely" problems whose stored answer was the unfactored
original) — see `QA_REPORT.md` for the full account, including the substantial manual
re-derivation that covered the problems this script can't reach, and what remains
unverified by any automated method.

## 3. Unit tests — `npm test` / `npm run test:coverage`

Vitest, covering `src/lib/mathCheck.ts` and `src/store/gameStore.ts` (chosen as the
two most critical modules: the answer-grading engine and the save-state reducers/
validators). As of this audit: 92.37% statements / 90.79% branches / 97.05% functions
/ 97.8% lines across both files combined, from genuinely-assertive tests (not coverage
padding — every test ties to a real correctness property). A few single-digit-percent
gaps are left deliberately undocumented-as-fixed because closing them would mean
writing a test that exists only to move the number (e.g. mocking `localStorage` to
throw on `removeItem`, which would test the mock, not the code) — see the commit that
added this coverage for the specific lines and reasoning.

`src/lib/mathCheck.security.test.ts` is a separate, focused suite: 14 previously-
confirmed exploit payloads (resource-exhaustion, prototype-pollution attempts, inline
assignment, etc.) run against the real exported grading functions, asserting they're
rejected and return within 2 seconds — i.e., no hang, no crash, no silent acceptance.

## 4. End-to-end tests — `npm run test:e2e`

Playwright, against the **production build** (`vite build` + `vite preview`), not the
dev server — `playwright.config.ts`'s `webServer` runs the real build command. Three
real browser engines: Chromium, Firefox, WebKit.

**Honest scope of "three browsers":** this is genuine multi-engine coverage via
Playwright's bundled browser binaries, but it is *not* a claim of testing actual Safari
(Playwright's WebKit build tracks upstream WebKit, not Apple's shipped Safari) or any
physical device. No real iOS/Android hardware, no OS-level behavior (touch input,
autofill, Safari-specific quirks) is exercised.

**Mobile viewports are not tested at all.** The HUD overflows and is unusable below
roughly 480px wide — confirmed by direct DOM measurement during this audit. This is an
explicit, acknowledged out-of-scope limitation (confirmed with the project owner), not
an oversight; `playwright.config.ts` only configures desktop browser projects.

Four spec files:

- `e2e/full-journey.spec.ts` — title screen through character creation, the
  diagnostic, the world map, rolling the board, resolving a shrine, and solving a real
  problem end-to-end (it reads the actual rendered problem back out of KaTeX's own
  `<annotation>` element and submits that problem's real stored answer — this proves
  the full submit → grade → reward pipeline against production data, not a stub),
  plus the dashboard and the compendium's A-Z rail.
- `e2e/adversarial.spec.ts` — rapid double-clicking (dice roll and a shrine reward,
  both via synchronous in-page `dispatchEvent` calls rather than two separately-
  awaited Playwright `.click()`s, to actually simulate a near-simultaneous double-click
  rather than two clicks a full render cycle apart), refresh-mid-session persistence,
  a corrupted (invalid-JSON) save file, and two tabs sharing `localStorage`.
- `e2e/accessibility.spec.ts` — axe-core against every major screen, tagged
  `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa`. This is automated coverage of a
  well-defined, concrete subset of accessibility issues (contrast, missing labels/
  roles, ARIA misuse, target size) — **not** a substitute for manual testing with an
  actual screen reader or keyboard-only navigation, neither of which this suite does.
  A clean run is not a claim of full WCAG 2.2 AA conformance.
- `e2e/performance.spec.ts` — real navigation-timing metrics and transferred byte
  counts from the production build. **Not** a Lighthouse audit (no Core Web Vitals
  field data, no throttling simulation, no scoring) — numbers are recorded as evidence,
  with only generous sanity-bound assertions, not tuned performance thresholds.

## A debugging lesson worth repeating

While verifying the reward-idempotency fixes, an E2E run against a *stale* `vite
preview` process (left running from earlier manual debugging, serving a build from
before any of that session's fixes) produced a false failure that looked exactly like
the fix not working. It was confirmed as stale by checking the actual built bundle's
mtime and diffing against what was currently on disk, not by assumption. If an E2E
result looks wrong, check what the server is actually serving before trusting either
the pass or the failure.

## Running everything locally

```bash
npm run typecheck
npm run lint
npm run verify
npm run verify:independent
npm test
npm run test:e2e
```

CI (`.github/workflows/ci.yml`) runs all of the above except `verify:independent`
(which is exploratory/evidence-gathering, not a pass/fail gate — several of its checks
are expected to come back `UNVERIFIABLE` by design) on every push to `main` and every
pull request.
