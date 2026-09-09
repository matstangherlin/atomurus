# Atomurus UI V2 — product copy and i18n

**Scope:** Prompt 14. Source HTML and published i18n JSON match the live product. Visual regression is Prompt 15.

## What changed

- `lang-pt-pending` no longer hides `[data-i18n]` on any page (Home already did this). Portuguese still sets `lang="pt-BR"`; English fallbacks stay visible until `i18n.js` applies. Theme-icon swap CSS stays.
- Viewer `.ph-kicker` fallbacks match the dictionary (`visualization` / `visualização`) instead of Bloomberg `§ 02 · Visualization`.
- Settings privacy-row fallback matches `config.pagePrivacyDesc` (accounts exist). Scientific calculator brand is `Atomurus`, not `ATOMURUS`.
- Runtime loads `assets/i18n/*.json` only. Stale compiled `assets/i18n/*.js` chunks are gone — they still claimed no accounts, `§` kickers, and `build v1.11`.

`polishCopy()` in `public-workspace.js` stays as a runtime belt for leftover kicker marks.

## What this step does not do

- Mass-deleting remaining public-shell `!important` or `.lc-*` HTML (Prompt 13 remainder)
- Visual regression screenshots / final report (Prompt 15)
- Changing URLs, canonicals, or hreflang
- Rewriting legal processors / first-party cookies (human legal review)

## Tests

- `test:ui-v2` / `validate` — no `lang-pt-pending` hide; no `.ph-kicker` `§`; config must not say “No accounts”; i18n directory is JSON-only
- `e2e/ui-v2.spec.js` — PT pages paint without `html.lang-pt-pending`; Viewer kickers and Settings privacy copy
- `e2e/public-chrome.spec.js` — Viewer `.ph-kicker` still has no `§`
