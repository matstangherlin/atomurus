# Atomurus UI V2 — visual report

**Scope:** Prompt 15. Recapture the Prompt 01 viewport matrix after Prompts 02–14. Compare qualitatively with [`docs/ui-v2-baseline/`](ui-v2-baseline/) and the audit in [`docs/ui-v2-audit.md`](ui-v2-audit.md). Pixelmatch is **not** in CI.

## Method

Same matrix as the baseline:

- 9 product routes + Prompt 02 `ui-gallery`
- `{desktop, mobile} × {light, dark}` → **40 viewport PNGs**
- Chromium, `en-US`, cookie consent rejected, `localStorage.atomurus-theme`
- 1280×800 / 390×844, viewport only (not full-page)
- Wait for `lc-loading` / `auth-checking` / workspace boot; abort third-party (ads, analytics, recaptcha)

Re-run: `node tools/capture-ui-v2.mjs` → [`docs/ui-v2-after/`](ui-v2-after/)

The matrix **always forces theme via localStorage**, so it cannot prove the `/app` HTML default of `data-theme="light"`. That default is locked by `test:ui-v2` / `validate` on `app.html`.

## Intended product-truth (not regressions)

These differences vs baseline are the migration, not bugs:

| Surface | Baseline (hang-fix) | After (Prompts 02–14) |
| --- | --- | --- |
| Home stats | 118 / 40+ / **5 Calculators** / ∞ Curiosity | **118 / 47 / 8 Calculators / 8 Articles** from the catalog |
| Home modules | LAB TOOLS · “Four tools. One chemistry lab.” | **Four pillars** · “Explore, visualize, solve and study.” |
| Home preview | `PERIODIC.TBL · LIVE` HUD | “Periodic table” without Bloomberg HUD |
| Login | `AUTH.ACCESS`, HttpOnly cookie, managed authentication, `SECURE ACCOUNT FLOW`, green Sign in | Chemistry workspace copy; Sign in / Study / Pro trial; **ink** Sign in; Open lab stays |
| Viewer kicker | Bloomberg `§` in HTML (later hidden or replaced) | **visualization** — no `§` |
| Pricing / About kickers | Console document chrome | Product kickers without `§` |
| `/app` | Guest Study overview (capture already forced light) | Same guest workspace; **green** Explore Pro; HTML default light is a source contract |
| PT pending | Audit risk: EN capture hid the blank | Pages paint English fallbacks; `lang-pt-pending` hide is gone |

## Route notes (desktop-light unless stated)

**Home.** Cream chrome, Instrument Serif hero, green “Open periodic table”, four catalog tiles, four pillar cards. Dark inverts to ink with a sun toggle. Mobile stacks the same stats 2×2; hamburger + search stay.

**Login.** Two cards: workspace explainer + account form. Sign in is ink (`.ui-btn-primary`); links stay green. Mobile viewport shows the rail card first (Privacy / Terms / Pricing); the form is below the fold — same stacking as baseline, without AUTH.ACCESS. Dark Sign in inverts to cream-on-ink.

**Pricing.** Open Lab / Free account / Pro ladder, 30-day trial pill, BRL·USD and Monthly·Annual. Does not load workspace CSS.

**About.** “Chemistry, *open* to everyone.” Accounts optional; periodic table stays free. No “no accounts” legal voice.

**Periodic Table.** Dense scientific grid unchanged. Chrome matches the public family (cream, Instrument Serif title, green Table tab and Download PNG). Element cells were not restyled.

**Calculators.** Molar Mass open; Advanced Calculations / Reaction Workbench green science CTAs. Viewport crops the lower formula field — expected at 800px.

**Explore.** Eight articles, concept cards, no `§` in the visible kicker. Search + category pills stay.

**Viewer (atomic models).** Kicker `visualization`. Pro gate copy remains. `#viewer3d` was not restyled.

**`/app`.** Guest “Good morning, Atomurus”, green Explore Pro, OPEN TOOL cards. Mobile uses the bottom tab bar. Dark uses the same structure on ink.

**ui-gallery.** Tokens, type, ink Account button. Internal `noindex` page. Lede still says “Production pages are not restyled yet” — leftover copy, not a product regression.

## Audit observations closed

From Prompt 01 §11 / §12:

- Public chrome is one family from Home through tools (Prompt 03 + layouts 04–11).
- Login is no longer a security dashboard.
- Home no longer advertises 5 Calculators.
- `/app` is still the guest instrument; Account vs Open lab vs Study is consistent with the product ladder.
- Portuguese no longer blanks `[data-i18n]` while dictionaries load (Prompt 14). This capture is EN; PT paint is locked in e2e.

## Leftover (not this remessa)

Do **not** treat these as Prompt 15 regressions:

- Remaining `public-shell.css` `!important` vs lab-console (Prompt 13 remainder)
- `.lc-*` markup still in HTML
- `html.lc-loading` FOUC hide (≤4s)
- Theme-toggle **glyph** still differs by chrome family in light mode (moon on Home/login/`/app`; sun on Table/calculators/viewer)
- Gallery lede still claims production pages are unrestyled
- Explore `.ex-kicker .pill` / legal `.h-no` still contain `§` in HTML (CSS-hidden)
- `explore/viewer/methyl-isocyanate` has no `#ps-shell` (compact article chrome)
- 118 element pages and canvases/WebGL stay legacy by design
- Prompts 16–20 (Study entry points, PT VNext, Experiments) have not started

## What this step does not do

- Mass-delete remaining public-shell `!important` or `.lc-*` HTML
- Protect `/app`
- Restyle element science, canvases, or WebGL
- Add pixelmatch / screenshot CI
- Wrap public pages in `.ui-compat` / `.ui-root`
- Mass `npm run build`

## Tests

- `test:ui-v2` / `validate` — `docs/ui-v2-report.md` and `tools/capture-ui-v2.mjs` exist; after-shots are 40 non-empty PNGs
- No Playwright pixel assertion (shots drift with fonts/ads)

`docs/` is ignored in Netlify publish (`.netlifyignore`, scrub, `/docs/*` → 404) so baseline/after PNGs are not a public URL.
