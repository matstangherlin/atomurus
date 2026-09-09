# Atomurus UI V2 — Settings

**Scope:** Prompt 09. Settings (`config.html` / `config.pt.html`) use UI V2 tokens. Preference JS, localStorage keys, and i18n keys are unchanged. Periodic table cells, viewer, and `/app` are not restyled here.

## Layout source

`config.html` loads `assets/ui/index.css` and [`assets/layouts/config.css`](../assets/layouts/config.css) after `public-shell.css`. Tool-shell sidebar/topbar layout stays in the page `<style>` (same pattern as Calculators). `periodic-table.css` stays linked as visual convenience; do not drop it in this remessa.

Sections are dual-classed `.settings-section.ui-card`. Selects are `.settings-select.ui-select`. Clear cache is `.ui-btn.ui-btn-secondary` (not a segmented ink button). Active **toggles** stay **green fill**. Active **segmented** controls stay **green text** on a light mix — never ink fill, never `.ui-btn-primary`.

Do not restyle `.toggle-knob` transform. Lab-console keeps `translateY(-50%) translateX(16px) !important`.

## DOM / JS contract (do not break)

Keep:

- `#theme-seg`, `#size-seg`, `#font-seg`, `#toggle-anim`, `#toggle-fblock`, `#toggle-mass`
- `#heatmap-select`, `#lang-select`, `.settings-toggle`, `.seg-btn`
- `toggleSetting`, `setTheme`, `setElSize`, `setFontSize`, `setLanguage`, `clearSiteCache`
- `localStorage` keys `atomurus-theme`, `atomurus-anim`, `atomurus-heatmap`, `atomurus-fblock`, `atomurus-mass`, `atomurus-elsize`, `atomurus-fontsize`, `atomurus-lang`

Privacy-row copy is product-truth (`config.pagePrivacyDesc`). Do not restore “No accounts”.

## What this step does not do

- Periodic table chrome, viewer, `/app`
- Changing auth APIs, cookies, Stripe, `lab-tool-gate.js`
- Removing `public-shell.css` / hoist / lab-console (Prompt 13)
- Wrapping the page in `.ui-compat`

## Tests

- `test:ui-v2` / `validate` — config must load UI V2 + `config.css`; keep `#lang-select` / `.settings-toggle`; must not keep `.settings-section-title` in a page `<style>`
- `e2e/public-chrome.spec.js` — `.ph-title` Instrument Serif; section titles Inter Tight; `.settings-toggle.active` green; `.seg-btn.active` green text, not ink fill
- `e2e/ui-v2.spec.js` — `/config.html` loads `assets/ui/index.css` and `assets/layouts/config.css`; `periodic-table.html` remains the only listed legacy page
