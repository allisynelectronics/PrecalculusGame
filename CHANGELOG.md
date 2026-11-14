# Changelog

Format loosely follows [Keep a Changelog](https://keepachangelog.com/). This project
has not yet made a tagged release — entries below the "Unreleased" heading are real,
committed work on the `hardening/production-audit` branch, **not merged to `main` and
not published**, pending review. See the "Release process" section below for why.

## [Unreleased] — production hardening audit

A full security/correctness/reliability audit against the baseline at commit
`af1b834`. Full narrative and evidence for every item below: [QA_REPORT.md](./QA_REPORT.md).

### Security
- Centralized all mathjs expression evaluation behind a single hardened entry point
  with input-length and AST-node-count caps, a node-type blocklist, and a function
  allowlist — closes confirmed DoS and inline-assignment issues in the answer-grading
  engine. (`48f9142`)
- Fixed an unescaped `dangerouslySetInnerHTML` sink in the KaTeX error-fallback path;
  set `trust: false` explicitly on both render call sites. (`48f9142`)
- Removed the unused `react-router-dom` dependency (reduces supply-chain surface; it
  was never actually imported anywhere). (`86af355`)

### Fixed
- 7 "Factor completely" problems stored the unfactored original expression as their
  answer instead of the factored form — found via independent re-verification, not
  self-comparison. (`40e3c2d`)
- Reward-granting race condition: a rapid double-click/double-submit could grant XP/
  coins/stars twice for one correct answer, in every submit path except the dice-roll
  button (fixed earlier in the underlying game) — `BossBattle`, `ProblemView`,
  `IdentityProofBuilder`, and `AdventureBoard`'s shrine/mystery modals were all
  unguarded. Fixed with a synchronous ref-guard pattern; verified via a real double-
  dispatch repro, not just code review. (`d781d25`)
- The Compendium's A-Z rail buttons were 16×16px, below WCAG 2.2's 24×24px minimum
  target size. (`baa8366`)

### Added
- Save-file schema versioning (`SCHEMA_VERSION`), a validating `localStorage` wrapper
  that detects and quarantines corrupted/malformed saves (to a `-corrupted-backup`
  key, not destroyed) instead of trusting them blindly, a player-facing recovery
  notice, and Export/Import Progress buttons on the Dashboard. (`fefba17`)
- A confirm dialog on `ErrorBoundary`'s "Reset Progress" button (it previously wiped
  localStorage with no confirmation, unlike the equivalent title-screen button). (`fefba17`)
- Playwright E2E suite: full user journeys, adversarial/unusual-behavior tests, an
  automated WCAG 2.2 AA accessibility audit (axe-core), and production-build
  performance metrics — 57 tests across Chromium, Firefox, and WebKit. (`d8de116`,
  `baa8366`, `d94c110`)
- `scripts/independentVerify.ts` — independent mathematical re-verification of stored
  answers against the problem's own prompt/worked solution, as distinct sources from
  the answer field itself (not a self-comparison). (`40e3c2d`)
- GitHub Actions CI (typecheck/lint/verify/unit-tests/build + a separate E2E job),
  every third-party action pinned to a verified commit SHA, and Dependabot for npm +
  GitHub Actions (no auto-merge). (`b26b3c9`)
- Unit test coverage on the two most critical modules (`mathCheck.ts`, `gameStore.ts`)
  raised from 46% to 90.79% branches, all genuinely-assertive tests — including real
  coverage of the save-corruption quarantine path via a forced module reload, not just
  the fix's existence. (`af93940`)

### Known, accepted limitations (not fixed here — see QA_REPORT.md for why)
- Mobile/narrow-viewport layout (HUD overflows under ~480px) is confirmed broken and
  explicitly out of scope per the project owner.
- `checkExpressionEquivalence` is value-equivalence only; it has no concept of
  "must be in factored form," so a factoring-type problem can still be passed by
  retyping the original unfactored expression. The one confirmed data bug of this
  shape was fixed; the underlying checker limitation was not — it would need AST-shape
  detection, a larger change than this audit's "repair confirmed problems" scope.
- No real Safari or physical-device testing (Playwright's WebKit ≠ shipped Safari).
- The production build ships as a single ~1.4MB JS chunk (Vite's own build-time
  warning); code-splitting wasn't attempted here — structural risk this late in an
  audit outweighed the benefit.
- Client-side save data is not, and cannot be, tamper-proof (see SECURITY.md).

## 0.0.0 — Initial build

- `baa2070` — Initial commit: the full game (13 worlds, 441 problems, the board/boss/
  dashboard/compendium UI, the Unit Circle Explorer and Identity Locks labs).
- `af1b834` — Alphabetized Book of Mathematics with an A-Z scroll nav; assorted QA
  fixes from an initial code review pass.

## Release process

This project has not yet cut a tagged release (`package.json` version is `0.0.0`).
When it does:

1. All of the above gets reviewed and, if approved, merged from
   `hardening/production-audit` into `main` — **not automatically**; this is a
   decision for the project owner, not something CI or this audit does on its own.
2. `package.json`'s version is bumped following semver: the security/correctness
   fixes above are backward-compatible from a player's perspective (no save-breaking
   changes — `SCHEMA_VERSION` stays at `1`), so a first tagged release of this scope
   would reasonably be `0.1.0`, not `1.0.0` — this project hasn't claimed API/feature
   stability yet, and `0.x` versions are allowed to do that.
3. A git tag is created for the release commit, and `npm run release` is run fresh
   from that exact commit — never by hand-patching `mathverse-single-file.html`
   separately from the source it's built from.
4. The resulting `mathverse-single-file.html`'s SHA-256 checksum is published
   alongside the release so anyone downloading it can verify they got the exact
   audited build (see QA_REPORT.md for the checksum of the build this audit covers).
