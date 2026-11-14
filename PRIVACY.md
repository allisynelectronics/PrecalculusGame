# Privacy

## Short version

MATHVERSE collects nothing, sends nothing anywhere, and has no server. Everything
lives in your own browser's `localStorage`, under one key (`mathverse-save`), until
you clear it.

## What's stored, exactly

A single `localStorage` entry (`mathverse-save`) holding:

- Your chosen character name, avatar, and color
- XP, coins, stars, level
- Which worlds are unlocked and which bosses are defeated
- Per-topic mastery level and streak data
- A rolling history of up to 200 recent problem attempts (problem ID, topic ID,
  correct/incorrect, whether a hint was used, and a timestamp) — used only to compute
  your own accuracy stats on the Dashboard
- Your current position on each world's board, and a few UI-navigation fields
  (current screen, which problem is pending, etc.)

That's the entire schema (`src/store/gameStore.ts`). There is no field for your real
name, email address, school, or any other personally-identifying information — the
character "name" is whatever freeform text you type into the character-creation
screen, used only to display in the HUD, never transmitted anywhere.

## What is NOT collected

- No analytics, no tracking pixels, no third-party scripts of any kind
- No remote logging or error reporting (errors are only `console.error`'d locally)
- No calls to any external AI service, API, or server — all math evaluation and
  grading happens entirely client-side
- No cookies
- No student performance data is collected, aggregated, or transmitted anywhere —
  your attempt history never leaves your own browser

## Where your data goes

Nowhere. This is a fully static, client-side-only application (see the "Tech" section
of [README.md](./README.md)). There is no backend to send data to. Opening the single-
file HTML build (`mathverse-single-file.html`) works entirely offline after the
initial download, which is a direct consequence of having nothing to talk to over the
network in the first place.

## How to see, export, or delete your data

- **See it directly:** your browser's devtools → Application/Storage →
  Local Storage → the site's origin → `mathverse-save`. It's plain JSON.
- **Export it:** the Dashboard screen has an "Export Progress" button that downloads
  your current save as a JSON file.
- **Import it elsewhere:** the Dashboard's "Import Progress" button reads a
  previously-exported JSON file back in (after validating it actually looks like a
  real save) — useful for moving progress between browsers or devices by hand.
- **Delete it:** the title screen's "Reset progress" link (after confirmation) clears
  the save entirely, or you can clear it yourself via your browser's site-data
  settings. Uninstalling/clearing site data for this origin removes everything.

## Browser storage limitations, honestly stated

`localStorage` is per-browser, per-device, per-origin. It is not synced across
devices, is not backed up anywhere by this application, and can be cleared by the
browser itself (low storage, private browsing mode, "clear browsing data," etc.)
without warning. If you care about not losing progress, use the Export feature
periodically. This is a real, user-facing limitation — not something this document is
trying to minimize.
