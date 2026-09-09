# Atomurus UI V2 — after shots

Captured **after Prompts 02–14**, from the UI V2 branch. Qualitative comparison lives in [`docs/ui-v2-report.md`](../ui-v2-report.md).

## Method

Same as [`docs/ui-v2-baseline/`](../ui-v2-baseline/):

- Static server: `E2E_PORT=4176 node tools/e2e-serve.mjs` (see `tools/capture-ui-v2.mjs`)
- Playwright Chromium, `en-US`, cookie consent rejected
- Theme via `localStorage.atomurus-theme` (`light` / `dark`)
- Viewport screenshots (not full-page) after `lc-loading` / `auth-checking` release
- Third-party requests (ads, analytics, recaptcha) aborted so shots stay on product chrome

Re-run: `node tools/capture-ui-v2.mjs`

## Combinations

| Folder | Viewport | Theme |
| --- | --- | --- |
| `desktop-light/` | 1280×800 | light |
| `desktop-dark/` | 1280×800 | dark |
| `mobile-light/` | 390×844 | light |
| `mobile-dark/` | 390×844 | dark |

Each folder contains: `home`, `login`, `pricing`, `about`, `periodic-table`, `calculators`, `explore`, `viewer`, `app`, and `ui-gallery`.
