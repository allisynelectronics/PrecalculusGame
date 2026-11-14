# Security

MATHVERSE is a client-side-only application with no backend, no accounts, and no
server-side state. That shapes the threat model below: the main risks are things that
happen *in the player's own browser*, not server compromise or data breaches, because
there is no server and nothing to breach.

## Threat model

**In scope — things this project treats as real security issues:**

- Cross-site scripting (XSS) via content rendered into the DOM (problem prompts,
  worked solutions, KaTeX rendering, student answer echoing).
- Denial-of-service against the player's own tab (an expression that hangs or crashes
  the browser) via crafted input to the answer-grading engine.
- Any path by which typed answer text reaches `eval()`, `Function()`, or an
  unrestricted expression evaluator.
- Supply-chain issues in dependencies (known-vulnerable packages, unpinned CI actions).
- Secrets accidentally committed to the repository or its history.

**Out of scope — acknowledged, not "fixed," because the architecture doesn't support
otherwise:**

- **Client-side tampering.** Because the game runs entirely in the player's own
  browser with their own full control over it, a player can open devtools and edit
  their `localStorage` save directly — change their XP, unlock worlds, mark bosses
  defeated, whatever they want. **This is not prevented, and no code in this
  repository claims to prevent it.** There is no server to validate state against, so
  there is nothing to make this "tamper-proof" with. If this software is ever used in
  a context where a player's progress needs to be trustworthy to a third party (a
  teacher, a grade book), that requires a server-side component this project does not
  have, and self-reported client state should not be trusted for that purpose.
- Multi-tab / multi-device sync conflicts: the last tab to write to `localStorage`
  wins. There's no conflict resolution because there's no server to arbitrate.

## The answer-grading engine (`src/lib/mathCheck.ts`)

Student-typed answers are evaluated as math expressions, which is the one place in
this app where untrusted input reaches a general-purpose evaluator ([mathjs](https://mathjs.org/)).
Plain `mathjs.evaluate()` is **not** a safe sandbox for untrusted input on its own — it
allows inline variable/function assignment (`x=5`, `f(x)=x^2`), `createUnit()`, and
expensive matrix/range operations that can hang a browser tab for many seconds.

All evaluation in this codebase goes through a single hardened entry point
(`safeEvaluate()` / `parseIfSafe()` in `mathCheck.ts`) before anything is ever passed to
mathjs's evaluator:

1. **Length cap** (300 characters) checked before any parsing — the longest legitimate
   stored answer in the entire 441-problem bank is 47 characters, so this is ~6x
   headroom for any real student input.
2. **AST node-count cap** (150 nodes) — an independent guard against short-but-deeply-
   nested expressions that a length cap alone wouldn't catch.
3. **Node-type blocklist** — `AssignmentNode`, `FunctionAssignmentNode`, `RangeNode`,
   `BlockNode`, `ObjectNode`, `AccessorNode`, and `IndexNode` are rejected outright, so
   assignment, ranges, object/array literals, and property/index access are never
   reachable from student input.
4. **Function allowlist** — every `FunctionNode` call is checked against an explicit
   allowlist of trig/root/log functions actually used across the real problem bank
   (with a modest margin for legitimate alternate-form answers). `createUnit`,
   `import`, matrix constructors, and everything else not on the list is rejected.
5. Both the `parse()` call and the subsequent AST `.traverse()` walk are wrapped in
   try/catch **independently** — a deeply-nested-but-structurally-simple expression
   can throw an uncaught `RangeError` ("Maximum call stack size exceeded") during
   traversal alone, not just during parsing, so a single outer try/catch wouldn't be
   enough.

This is deliberately an **allowlist**, not a blocklist: only pre-approved shapes are
accepted, rather than trying to enumerate every dangerous one.

See `src/lib/mathCheck.security.test.ts` for the regression suite that exercises this
against 14 previously-confirmed exploit payloads, run against the real exported
grading functions (not a prototype), plus length/node-count/deep-nesting guard tests.

## Rendering (`src/components/Math.tsx`)

Math content is rendered via `katex.renderToString()` into `dangerouslySetInnerHTML`.
`trust: false` is set explicitly on both call sites (KaTeX's own default, made
explicit for clarity rather than relying on an unstated default). Both the happy-path
rendering and the error-fallback path (when KaTeX fails to parse something) HTML-escape
their output before it reaches `dangerouslySetInnerHTML` — an earlier version of this
code only escaped the happy path, leaving the fallback branch of a parse failure as an
unescaped injection point; this is now fixed.

## Save data integrity

See [PRIVACY.md](./PRIVACY.md) for what's stored and where. On the security side: the
save file loaded from `localStorage` is validated (required fields present, correct
types) before it's trusted, rather than assumed to be well-formed. A save that fails
validation is not silently coerced into something that might crash the app elsewhere —
it's quarantined under a `-corrupted-backup` key and the player starts fresh with a
visible notice, rather than the corrupted value being blindly merged into live state.

## Reporting a vulnerability

This is a personal/educational project without a dedicated security contact or bug
bounty program. If you find a real security issue, please open a GitHub issue marked
clearly as a security report, or contact the repository owner directly rather than
disclosing exploit details publicly before there's been a chance to address it.

## Dependencies

`npm audit` is run as part of CI (`.github/workflows/ci.yml`) and reported 0
vulnerabilities as of this audit. Dependabot (`.github/dependabot.yml`) watches both
npm packages and GitHub Actions for updates on a weekly schedule — it opens PRs, it
does not auto-merge them; every dependency bump still has to pass CI and be reviewed
like any other change.
