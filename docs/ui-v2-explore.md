# Atomurus UI V2 — Explore

**Scope:** Prompt 07. Explore hub and articles use UI V2 tokens. Chemistry copy, URLs, search/filter JS, and auth/Stripe are unchanged.

## Hub

`explore.html` loads `assets/ui/index.css` and [`assets/layouts/explore.css`](../assets/layouts/explore.css). Hub layout no longer lives in a 400-line page `<style>`. Keep:

- `#ex-search`, `#ex-search-input`, `#ex-articles`, `#ex-cat-pills`, `.ex-title`, `.ex-pill`, `.ex-card`
- Search + category filter in the page script
- Article hrefs under `/explore/`

Cards are dual-classed `.ex-card.ui-card`. Active pills stay **green** (not ink). Editorial category tints on `.ex-el` are unchanged.

## Articles

Every `explore/*.html` (and `explore/viewer/methyl-isocyanate.html`) loads UI V2 plus [`assets/layouts/article.css`](../assets/layouts/article.css) after `explore-article.css`. Kickers/badges/nav align with the hub. Prose measure stays: dek `60ch`, body `760px`. Do not rewrite article science.

## What this step does not do

- Calculators, periodic table, viewer, `/app`
- Removing `public-shell.css` / hoist
- Changing Explore URLs or article HTML bodies

## Tests

- `test:ui-v2` / `validate` — Explore hub must load UI V2 + `explore.css`; must not keep `.ex-card` in a page style block
- `e2e/public-chrome.spec.js` — `.ex-title` Instrument Serif, active `.ex-pill` green, article `.art-title` serif, search “bhopal” filters to one card
- Search `normalize()` must keep ASCII `[\u0300-\u036f]` escapes so the hub script parses in Chromium
