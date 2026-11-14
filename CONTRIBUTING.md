# Contributing

This is a personal/educational project, not run with a formal governance process —
but if you're sending a PR, here's what keeps it reviewable.

## Before opening a PR

```bash
npm run typecheck
npm run lint
npm run verify
npm test
npm run test:e2e   # slower — real browser engines; run at least once before a PR
```

All of these run in CI (see `.github/workflows/ci.yml`) and are required to pass.

## If you're touching the answer-grading engine (`src/lib/mathCheck.ts`)

Read [SECURITY.md](./SECURITY.md) first. Every expression that reaches mathjs's
evaluator goes through the single hardened `safeEvaluate()`/`parseIfSafe()` entry
point — do not add a new call site that calls `evaluate()` or `parse()` directly, and
do not use `eval()` or `new Function()` anywhere in this codebase for any reason. If
you add a new accepted function name, add it to `ALLOWED_FUNCTIONS` deliberately and
explain why in the commit message, not just because mathjs happens to support it.

Add exploit-payload regression tests to `src/lib/mathCheck.security.test.ts` for
anything you're hardening against, and functional tests to `src/lib/mathCheck.test.ts`
for anything you're changing the accepted/rejected behavior of.

## If you're adding or editing problems in `src/data/problems/`

- Don't trust `npm run verify` alone as proof the math is correct — it only checks
  that the stored answer is self-consistent, not that it's the right answer to the
  stated problem. See TESTING.md's section on `npm run verify:independent` and
  consider whether your addition is something that script can actually check.
- If the problem has a `worked` solution array, make sure its final step actually
  matches the stored `answer` field — this exact mismatch (an unfactored original
  stored as the answer to a "Factor completely" problem) was a real bug found during
  the production hardening audit; see QA_REPORT.md.

## If you're touching the save schema (`src/store/gameStore.ts`)

The store is schema-versioned (`SCHEMA_VERSION`). If you add, remove, or rename a
persisted field in a way that could break loading an older save:

1. Bump `SCHEMA_VERSION`.
2. Write a real `migrate(persistedState, fromVersion)` transform, not just an identity
   pass-through.
3. Update `isPlausibleSaveState`'s required/typed fields to match the new shape.
4. Note in `isPlausibleSaveState`'s own comment (already there) that this check
   currently runs *before* `migrate()` — a required-field check that's too strict
   could reject a genuinely-valid older save before migration gets a chance to
   transform it. Revisit that ordering if it becomes a real problem.
5. Add a test exercising a save from the *previous* schema version actually migrating
   correctly, not just a fresh save at the new version.

## Commit messages

Explain *why*, not just what — especially for anything touching grading correctness,
security, or save-data handling, where "why" is usually the part a future reader
actually needs (what the risk was, what evidence confirmed the fix, what's still an
open limitation). Several commits in this repo's history from the production-hardening
audit are reasonable examples of the level of detail expected for anything in those
categories.

## Release process

See the "Release process" section of [CHANGELOG.md](./CHANGELOG.md).
