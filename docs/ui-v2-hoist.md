# Atomurus UI V2 — hoist removal

**Scope:** Prompt 13 (first cut). `public-workspace.js` no longer rebuilds the document. `#ps-shell` already exists in source HTML. Lab-console, remaining public-shell `!important`, and `.lc-*` markup stay.

## What changed

- `hoistToolShell`, `hoistLandingShell`, and `buildPublicSidebar` are gone.
- Runtime still runs `enhanceExistingShell` (active nav, search/CTA/Study fallbacks), `loadLabGate`, and `polishCopy`.
- `html.ps-boot` (2.5s `visibility: hidden`) is gone. Migrated pages already have `data-ps-chrome`; the hide existed so unmigrated aside+main trees would not flash.
- `/app` still early-returns. `public-shell.css` still hides Bloomberg tickers against lab-console.

323 HTML files that load `public-workspace.js` already emit `#ps-shell`. The two `explore/viewer/methyl-isocyanate` pages keep their compact 3D article chrome (no `lc-topnav` / tool sidebar); hoist never matched them.

## What this step does not do

- Deleting `public-workspace.js` or `public-shell.css`
- Mass-deleting public-shell `!important` that still beats lab-console
- Mass-deleting `.lc-*` from HTML
- Protecting `/app`, restyling element science, or remaining public-shell `!important`

## Tests

- `test:ui-v2` / `validate` — hoist function names must be absent; `enhanceExistingShell` and `lab-tool-gate.js` stay; pages that load the script and have a topnav/tool sidebar must emit `#ps-shell`
- `e2e/public-chrome.spec.js` — `.ps-shell` still in the document on Home / Login / Table / Viewer
