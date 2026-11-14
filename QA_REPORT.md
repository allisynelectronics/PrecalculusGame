# MATHVERSE — Production Hardening Audit: Final Report

**Scope:** independent security, correctness, reliability, and quality audit against
baseline commit `af1b834` (the state of `main` when this audit began), performed
entirely on branch `hardening/production-audit`. **Nothing in this report has been
merged to `main` or published as a release** — that is a decision for the project
owner, made after reviewing this report and the branch's diff.

**How to read this report:** every claim below names the commit that made it true and
the concrete evidence (a test, a measurement, a reproduction) behind it. Where
something was not done, or could not be fully verified, that is stated as plainly as
what was. Nothing here is a projection of what *should* be true — see each item's
"Evidence" line before trusting the summary.

---

## 1. Baseline

- Baseline commit: `af1b834` (local HEAD confirmed identical to the GitHub remote at
  audit start).
- `hardening/production-audit` branched from there; all audit work is additive commits
  on top, listed in [CHANGELOG.md](./CHANGELOG.md).
- Starting checks (typecheck, lint, `npm run verify`, production build, `npm audit`)
  all ran clean at baseline — recorded at the time, not reconstructed after the fact.
- One real environment limitation hit and documented, not hidden: `npm ci` fails in
  this specific local dev environment because the project lives inside a OneDrive-
  synced folder, which locks native binaries during OneDrive's sync and conflicts with
  `npm ci`'s delete-then-reinstall approach. A failed `npm ci` attempt left
  `node_modules/typescript` partially deleted; repaired with a non-destructive
  `npm install`. **This does not affect CI** — GitHub Actions runners are ephemeral
  and not OneDrive-synced, so `.github/workflows/ci.yml` correctly uses `npm ci`.

## 2. Security audit

See [SECURITY.md](./SECURITY.md) for the full threat model. Summary of what was found
and fixed, all against the real exported grading functions, not a prototype:

- **mathjs is not a safe sandbox on its own.** Hands-on exploit testing (not just
  reading docs) confirmed: `kron(ones(1000,1000), ones(1000,1000))` hangs 20+ seconds;
  `size(1:1e9)` takes 4.5s; `createUnit()` and inline variable/function assignment
  (`x=5`, `f(x)=x^2`) both succeed when they shouldn't be reachable from a student
  answer box at all.
- **Fix:** centralized every mathjs `parse()`/`evaluate()` call behind one hardened
  entry point (`safeEvaluate()`/`parseIfSafe()` in `src/lib/mathCheck.ts`) — length cap,
  AST node-count cap, node-type blocklist, function allowlist, both `parse()` and
  `.traverse()` wrapped in try/catch independently (traversal alone can stack-overflow
  on a deeply-nested-but-short expression, separately from parsing or evaluating it).
  **Evidence:** commit `48f9142`; regression suite
  `src/lib/mathCheck.security.test.ts`, 49 tests, 14 previously-confirmed exploit
  payloads run against the real `checkNumeric`/`checkExpressionEquivalence`/
  `checkComplex` functions, all rejected within 2 seconds, no hangs.
- **XSS:** `src/components/Math.tsx`'s KaTeX error-fallback path fed unescaped text
  into `dangerouslySetInnerHTML` — only the happy path was escaped before this audit.
  Fixed; `trust: false` made explicit on both render call sites. **Evidence:** commit
  `48f9142`.
- **No `eval()` or `Function()` anywhere in this codebase**, confirmed by grep across
  `src/` — the explicit instruction to never use them was never at risk of being
  violated; this is a statement of fact, not a claim of restraint under temptation.
- **Secret scan:** working tree and full git history scanned for common credential
  patterns. One match in history (an `AKIA`-prefixed string in
  `mathverse-single-file.html` at commit `af1b834`) traced to base64-embedded KaTeX
  font binary data coincidentally matching the pattern — confirmed not a real AWS key
  by locating the exact file and commit, not dismissed on assumption. No genuine
  secrets found. **Evidence:** commit `86af355`.
- **Dependency audit:** `npm audit` — 0 vulnerabilities, both at baseline and now.
  Removed `react-router-dom` (installed, never imported anywhere in `src/` — confirmed
  via grep). **Evidence:** commit `86af355`.

## 3. Mathematical correctness — independent re-verification

**The governing constraint, honored:** `scripts/verifyProblems.ts` (pre-existing)
checks `gradeAnswer(p, p.answer)` — the stored answer against *itself*. That is a
syntax-validity check, not evidence of correctness, and was never treated as such in
this audit.

Built `scripts/independentVerify.ts`, which instead compares the stored answer against
two sources that are not the answer field: the literal expression embedded in self-
contained "Evaluate:"/"Simplify:" prompts (evaluated independently), and the final
line of each problem's own `worked` solution array. **Result:** 405 checks across 245
of 441 problems automatically covered; 213 matched, 0 unresolved mismatches, 144
reported `UNVERIFIABLE` (prompts phrased in natural language — "Solve for x," word
problems — that can't be safely auto-extracted without risking a false "verified,"
reported as such rather than guessed).

This surfaced a real, confirmed bug: **7 "Factor completely" problems** (6 in
`foundationForge.ts`, 1 embedded in `calculusGateway.ts`) stored the *unfactored
original* as their answer, not the factored form their own `worked` array showed.
Combined with sample-point equivalence checking, a student could pass any of these by
retyping the original question back. **Fixed** all 7 to store the factored form.
**Evidence:** commit `40e3c2d`; `npm run verify:independent` output recorded in that
commit's message.

**Architectural limitation found and explicitly NOT silently treated as fixed:**
`checkExpressionEquivalence` is value-equivalence only (sample-point based) — it has
no concept of "must be in a specific form." Even after fixing the 7 answers above, a
student retyping the original unfactored expression would *still* be accepted as
equivalent, because it is. Closing this fully would need AST-shape detection (e.g. "is
this expression structurally a product of factors") — a materially larger change than
"repair confirmed problems," not attempted here, and documented in CHANGELOG.md and
TESTING.md rather than left unmentioned.

**Manual re-derivation**, independent of any stored content, solving each problem by
hand from its prompt alone: all 6 `identityProof` trig identities (confirmed true
identities, not just internally-self-consistent stage chains), all 3 `equationRepair`
problems (both the located bad-step index and the stated correction independently
re-derived), and ~50 additional problems spanning arithmetic, fractions, exponents,
radicals/rationalization, rational-expression simplification, log expansion, trig
quotient identities, three different quadratic-solving methods, absolute-value
equations, complex roots, polar-to-rectangular conversion, vector arithmetic,
3-variable linear systems (solved independently, not just checked), difference-
quotient tangent slopes, degree/radian conversion, and asymptote-finding. No further
errors found. **This does not constitute exhaustive coverage of all 441 problems** —
stated plainly rather than implied otherwise; the automated+manual combination
together touches a majority of the bank across every topic area and answer type, which
is the realistic ceiling given the problem data is free-text prompts with no
structured parameter representation to recompute answers from mechanically.

## 4. Grading architecture

Addressed directly in §2/§3 above (the `safeEvaluate` hardening and the
expression-equivalence form-limitation). No further rebuild of the grading
architecture (e.g. symbolic normal-form comparison in place of sample points) was
attempted — sample-point equivalence with 6+ distinct points (including negative and
non-integer values) is a reasonable, long-standing approach for this kind of app, and
replacing it wholesale was judged out of scope for "repair confirmed problems" absent
a specific confirmed defect in the sampling approach itself (the one defect found —
the form-insensitivity issue — is a known, documented, narrower limitation, not a
reason to discard the approach).

## 5–6. Feature testing + unusual player behavior

Playwright E2E suite, 57 tests across real Chromium/Firefox/WebKit engines (via
Playwright's bundled binaries — not a claim of testing actual Safari or physical
devices; see TESTING.md). Covers: title → character creation → diagnostic → world map
→ board → solving a real problem (submits the actual rendered problem's real stored
answer, read back from KaTeX's own `<annotation>` element, not a stub) → dashboard →
compendium A-Z nav.

Adversarial cases, each with a confirmed before/after:

- **Rapid double-click reward exploitation.** The dice-roll race condition was already
  fixed earlier in this app's development. This audit found the *same unguarded
  pattern* present, unfixed, in every other reward-granting handler:
  `BossBattle.handleSubmit` (no `disabled` prop on `AnswerInput` at all),
  `ProblemView.handleSubmit`/`handleIdentitySolved`, `IdentityProofBuilder`'s final-
  stage completion, and `AdventureBoard`'s shrine/mystery modal buttons. **Verified
  empirically**, not just by code review: reproduced the double-grant by dispatching
  two `MouseEvent('click')`s back-to-back in a single page-context script (closer to a
  genuine rapid double-click than two separately-awaited Playwright `.click()` calls,
  which each give React a full render cycle in between) — XP went 5→10 against the
  unfixed build. Fixed with a `useRef` synchronous guard (the same pattern already
  proven for the dice roll); re-ran the identical repro against the fixed build and
  got 5, as expected. **A debugging trap worth recording honestly:** the first E2E run
  against this fix *looked* like it failed, because a stale `vite preview` process
  left running from earlier manual debugging was still serving a build from before
  this fix existed, and Playwright's `reuseExistingServer` silently reused it. Caught
  by checking the actual built bundle's mtime, not by assuming the test result was
  right. **Evidence:** commit `d781d25`; `e2e/adversarial.spec.ts`.
- Refresh mid-session: confirmed `localStorage` persistence survives a reload.
- Corrupted (invalid-JSON) save: confirmed the app does not go permanently blank —
  see §7 for exactly what happens and why (zustand's persist middleware swallows the
  `JSON.parse` error internally; confirmed by reading zustand 5.1.0's actual source,
  not assumed).
- Two tabs sharing `localStorage`: confirmed a second tab picks up the first's saved
  state on reload (no real-time cross-tab sync — last writer wins, documented as a
  limitation in PRIVACY.md and SECURITY.md, not hidden).

**Not tested:** true multi-tab *concurrent* writes (two tabs writing at the same
instant) — `localStorage`'s synchronous same-origin semantics make this a low-value
scenario to simulate and it wasn't attempted.

## 7. Save-file reliability

Before this audit: no schema version field, no validation of what was loaded from
`localStorage` — a corrupted or malformed save could inject bad data straight into the
live store.

Added: `SCHEMA_VERSION` + an identity `migrate` hook (nothing to migrate from yet,
but the mechanism now exists for the first real schema change — see CONTRIBUTING.md
for what's required when that happens, including a noted ordering caveat: the shape
validator currently runs *before* `migrate()`, so a future field rename could reject a
genuinely-valid older save before migration sees it — flagged for whoever changes
`SCHEMA_VERSION` next, not silently left as a trap). A validating `localStorage`
wrapper (`isPlausibleSaveState` — required core fields present, correct types for
every field present) rejects anything that doesn't look like a real save;
`JSON.parse` failures and shape mismatches are both caught, the unreadable original is
preserved under a `-corrupted-backup` key (not destroyed), and a one-time player-facing
banner explains what happened. Export/Import Progress buttons on the Dashboard, going
through the same validator. Added a `confirm()` dialog to `ErrorBoundary`'s "Reset
Progress" button, which previously wiped `localStorage` with zero confirmation.

**Evidence:** commit `fefba17`; `src/store/gameStore.test.ts` includes a test that
forces a fresh module reload (`vi.resetModules()`) against a pre-corrupted
`localStorage` and asserts the actual quarantine behavior end-to-end — not just that
the fix exists, but that it does what it claims, including the specific case of a
well-formed-JSON-but-wrong-shape save being caught the same way as outright-invalid
JSON.

## 8. Game integrity and mastery progression

Reward idempotency: covered in §5–6 above (this was the single largest game-integrity
finding of the audit). Boss/world-unlock correctness (`defeatBoss`) and
`markTopicSeen` were both confirmed idempotent by direct unit test (calling each twice
does not duplicate the underlying array entry). The mastery-progression algorithm
(streak-based promotion to levels 2/3/4/5 on consecutive correct answers, decay by
exactly one level per wrong answer down to a floor of 2 — never back to the initial 1)
was traced by hand against the actual source and then verified by a full unit test
suite matching that trace exactly (`src/store/gameStore.test.ts`, 9 tests specifically
on this algorithm). **Client-side anti-cheat:** explicitly and permanently out of
scope — see SECURITY.md's "Out of scope" section. A player with browser devtools can
edit their own save directly; nothing in this codebase claims otherwise, and nothing
was added that pretends to prevent it.

## 9. Dependency and supply-chain audit

Covered in §2. `npm audit`: 0 vulnerabilities. `react-router-dom` removed as unused.
Secret scan of working tree and full git history: no genuine secrets found (one traced
false positive, documented). `npm outdated` shows three packages with available
updates (`@types/node` 24→26 major, `@vitest/coverage-v8` 4→5 major, `postcss` patch)
— **not applied**, per the explicit instruction not to blindly force dependency
updates mid-audit; left as a known item for a deliberate, separate update pass.

## 10. Browser and device compatibility

Real Chromium, Firefox, and WebKit engines via Playwright, 57 E2E tests passing on
all three. **Explicitly not** a claim of testing actual Safari (Playwright's WebKit
build tracks upstream WebKit, not Apple's shipped browser) or any physical
iOS/Android device — stated this plainly in TESTING.md rather than let "three
browsers" imply more than it covers.

**Mobile/narrow viewports: confirmed broken, explicitly out of scope.** Direct DOM
measurement during this audit confirmed the HUD overflows horizontally below ~480px
wide, making the Dashboard/Book buttons unreachable. Per direction from the project
owner mid-audit ("It does not work in mobile format so please dont even try"), this
was **not fixed** and is documented as an accepted, known limitation (CHANGELOG.md,
TESTING.md, playwright.config.ts's own comments) rather than silently left unmentioned
or attempted against explicit instruction.

## 11. Accessibility (WCAG 2.2 AA)

Automated audit via axe-core (`e2e/accessibility.spec.ts`), tagged
`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa`, run against every major screen
(title, character creation, diagnostic, world map, dashboard, compendium, adventure
board, problem view). **One real, confirmed violation found and fixed:** the
Compendium's A-Z rail buttons were 16×16px with 2px gaps — below WCAG 2.2 SC 2.5.8's
24×24px minimum target size, and the only way to jump to a given letter (no equivalent
larger control exists elsewhere to exempt it). Fixed by sizing the actual clickable
box to 24×24px while keeping the visible glyph small. **Evidence:** commit `baa8366`;
8/8 accessibility tests pass across all three engines after the fix.

**This is automated coverage of a well-defined, concrete subset of accessibility
issues — not a substitute for manual testing with an actual screen reader (NVDA/JAWS/
VoiceOver) or keyboard-only navigation, neither of which was performed.** A clean axe-
core run is not a claim of full WCAG 2.2 AA conformance, and this report does not make
that claim.

## 12. Performance

`e2e/performance.spec.ts` captures real browser navigation-timing metrics and actual
transferred byte counts against the production build. Local, unthrottled result: 348ms
wall-clock page load, 1429KB of JS fetched. **This confirms Vite's own build-time
warning:** the app ships as a single >500kB-after-minification JS chunk (1.4MB raw,
~411KB gzipped). **Not fixed here** — code-splitting a monolithic game SPA this late
in an audit was judged a structural change with its own regression risk, out of
proportion to "repair confirmed problems"; documented as a known finding in
CHANGELOG.md rather than attempted under time pressure. **This is explicitly not a
Lighthouse audit** — no Core Web Vitals field data, no throttling simulation, no
scoring — stated as such in both the test file and TESTING.md.

## 13. Standalone offline build

Built fresh from the current audited source via `npm run release` (never hand-patched
— the explicit instruction against this was honored by construction, since the only
way to update `mathverse-single-file.html` in this workflow is to rebuild it).

**SHA-256 of the distributable as of this report:**
```
c59b72663ef1f0dfcf4fd6edc524f538cc4835a2b6ccc37fdaa932f0b8100947
```
(`mathverse-single-file.html`, 2,970,759 bytes) — computed with `sha256sum` and its
64-hex-character length double-checked programmatically, not eyeballed.

**Verified working fully offline**, not assumed: served the built file locally, loaded
it in a real browser, navigated into a world, and triggered actual KaTeX math
rendering (a worked radical-simplification example, `√50 = 5√2`, rendered correctly
with real glyphs) — then inspected the browser's network request log at each step.
**Result: exactly one network request total, the initial page load itself.** No
request for fonts, scripts, styles, or anything else was made even after triggering
math rendering, confirming the single-file build is genuinely self-contained, not just
believed to be.

## 14. CI/CD

`.github/workflows/ci.yml`: two jobs (typecheck/lint/verify/unit-tests/build, and a
separate Playwright E2E job installing real browser binaries), both running under
`permissions: contents: read` at the workflow level — no job needs to write anything.
Every third-party action is pinned to a commit SHA, each one looked up and verified
against the live GitHub API, not guessed — including catching and correcting my own
mistake in the process: the first draft of the `upload-artifact` SHA had a copy error
(two missing trailing hex characters) that would have pointed at a wrong or
nonexistent commit, caught by re-verifying against the API rather than trusting the
first attempt. `.github/dependabot.yml` covers both npm and GitHub Actions, weekly,
grouped dev-dependency bumps — **no auto-merge configured anywhere**, per the explicit
instruction; every Dependabot PR still has to pass this same CI workflow and be merged
by a human.

## 15. Test coverage

Starting point: 44.57% statements / 46.02% branches across the two most critical
modules (`src/lib/mathCheck.ts`, `src/store/gameStore.ts`) — only the security-exploit
suite and the save export/import suite existed. **Ending point: 92.37% statements /
90.79% branches / 97.05% functions / 97.8% lines**, crossing the requested ≥90% branch
target on the combined critical-module total.

Every added test exercises real, specific behavior with a real assertion — not
coverage padding. This included catching a genuine mistake of my own while writing
them: I initially guessed `normalize('\frac{1}{2}')` produces `"(1)/(2)"`; running the
test revealed the actual (also-correct) output is `"((1)/(2))"` — the test was fixed
to match verified actual behavior, not the guess, and documented inline as a correction
rather than silently adjusted.

Remaining uncovered lines are left as an honest, undocumented-as-fixed gap: a
`traverse()`-exception catch block in `mathCheck.ts` that the 300-character
`MAX_INPUT_LENGTH` cap makes effectively unreachable in practice (writing a test for
it would mean contriving input specifically to defeat the length cap first, which
tests the contrivance, not the code), and two one-line `localStorage.removeItem`
try/catch bodies defensive against quota/security exceptions that would need mocking
the global in a way that tests the mock rather than the code. **Evidence:** commit
`af93940`; see its message for the specific line numbers and reasoning per gap.

## 16. Privacy

[PRIVACY.md](./PRIVACY.md): fully client-side, no analytics/tracking/telemetry/remote
logging/external API calls of any kind (confirmed in §13 above by direct network
inspection, not just by reading the source), no personally-identifying fields in the
save schema, an exact accounting of what's stored and where, and how to see/export/
delete it. No new data collection of any kind was introduced by this audit's changes.

## 17. Documentation

This report, plus [README.md](./README.md) (updated), [SECURITY.md](./SECURITY.md),
[PRIVACY.md](./PRIVACY.md), [TESTING.md](./TESTING.md),
[CONTRIBUTING.md](./CONTRIBUTING.md), and [CHANGELOG.md](./CHANGELOG.md) — all new
except README, all written for this audit.

## 18. Release process

Documented in CHANGELOG.md's "Release process" section: review and merge decision
rests with the project owner, a semver recommendation (`0.1.0`, not `1.0.0` — no
save-breaking changes, `SCHEMA_VERSION` unchanged) with the reasoning for it, the
exact rebuild-never-hand-patch release step, and publishing the SHA-256 checksum
alongside any tagged release. **No version bump, tag, or release was created by this
audit** — `package.json` remains at `0.0.0`, deliberately, pending the owner's review.

## 19. Independent self-review

Performed while writing this report, against the actual diff, not from memory:

- Confirmed `npm run verify` (441/441), `npm test` (128/128 across all three unit
  suites), `npm run test:e2e` (57/57 across three engines), `npm run lint`,
  `npm run typecheck`, and `npm run build` all pass on the current
  `hardening/production-audit` HEAD, not just at some earlier point in the session.
- Re-read every commit message on this branch against its actual diff while compiling
  this report's evidence lines, rather than summarizing from memory of having written
  them.
- Specifically looked for claims in this report that outran their evidence before
  finalizing it — the "three browsers," "WCAG 2.2 AA audit," and "offline build"
  sections above were each rewritten at least once during drafting to remove language
  that implied broader coverage than what was actually tested (e.g. an earlier draft
  of §10 did not yet have the explicit Safari/physical-device caveat; added on review).
- Did not find, on this pass, any staged or committed change that lacks a
  corresponding passing test or manual verification step recorded above.

## 20. What this report does NOT claim

Stated once, plainly, rather than scattered: this application is **not** claimed to be
bug-free, unhackable, fully verified, or "production-ready" in any unqualified sense.
Every fix above closes a *specific, confirmed* issue with recorded evidence; it does
not imply the absence of other issues that were not found. Known, accepted, and
explicitly out-of-scope limitations are listed in CHANGELOG.md's "Known, accepted
limitations" section and are not hidden here or anywhere else in this documentation
set.

---

## Release acceptance — recommendation, not a decision

Everything above is evidence for the project owner's own decision, not a
recommendation to merge or publish framed as settled. The branch's own checks all
pass; the known limitations are documented rather than fixed where fixing them was
judged out of scope or explicitly declined (mobile). Whether that balance is
acceptable for a public release is the project owner's call.
