# Atomurus UI V2 — visual baseline

Captured **before any UI V2 code changes**, from commit `e933377` (`cursor/ui-v2-b0f3` / hang-fix branch).

## Method

- Static server: `E2E_PORT=4175 node tools/e2e-serve.mjs`
- Playwright Chromium, `en-US`, cookie consent rejected
- Theme via `localStorage.atomurus-theme` (`light` / `dark`)
- Viewport screenshots (not full-page) after `lc-loading` / `ps-boot` release

## Combinations

| Folder | Viewport | Theme |
| --- | --- | --- |
| `desktop-light/` | 1280×800 | light |
| `desktop-dark/` | 1280×800 | dark |
| `mobile-light/` | 390×844 | light |
| `mobile-dark/` | 390×844 | dark |

Each folder contains: `home`, `login`, `pricing`, `about`, `periodic-table`, `calculators`, `explore`, `viewer`, `app`, and (Prompt 02) `ui-gallery`.

See `manifest.json` for per-shot timing and byte sizes.

Playwright also writes opportunistic full-page shots to `test-results/e2e-screenshots/` (gitignored) when `e2e/public-chrome.spec.js` and `e2e/workspace.spec.js` run.
