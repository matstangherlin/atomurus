# Atomurus UI V2 — Periodic Table chrome

**Scope:** Prompt 10. Table **chrome** uses UI V2 tokens. Cell science, heatmap coloring, compare/isotope math, `periodic-table.js`, and element pages are unchanged.

## What changed

`periodic-table.html` (and `periodic-table.pt.html`) plus the tab satellites (heatmap / trends / compare / isotopes, EN+PT) load `assets/ui/index.css` and [`assets/layouts/periodic-table.css`](../assets/layouts/periodic-table.css) after `public-shell.css`. `periodic-table.css` still owns `.el` cells, the `.ptable` grid, `--el-cell`, and category colors.

Chrome only:

- `.ph-title` Instrument Serif; kickers Inter Tight (not Bloomberg mono)
- `.pt-tab.active` **green text** (not ink fill)
- `.legend-item.active-filter` **green text**
- `#dl-action-btn` **green** science action
- Search `#search-input`, tabs `data-tab`, legend `data-cat`, and download JS stay

Do **not** restyle `.el`, `.ptable`, heatmap cell colors, or the element modal. Element pages under `periodic-table/*.html` (e.g. hydrogenium) stay on the previous CSS until a later remessa.

## DOM / JS contract (do not break)

Keep:

- `#search-input`, `#ptable`, `#dl-action-btn`, `#pt-tabs`, `#legend`
- `.pt-tab`, `.legend-item[data-cat]`, `.el[data-z]`
- `filterCat`, `downloadTable`, `handleSearchInput`, `--el-cell` / `--el-sym-size`
- `periodic-table.js`, `elements-data.js`
- `data-i18n="common.brandTag">chemistry lab`

## What this step does not do

- Viewer family, `/app`
- Restyling 118 element pages
- Changing chemistry, WebGL, or lab gates
- Removing `public-shell.css` / hoist / lab-console (Prompt 13)

## Tests

- `test:ui-v2` / `validate` — table family must load UI V2 + `periodic-table.css` layout; layout CSS must not mention `.el`; hydrogenium must not load UI V2 yet
- `e2e/public-chrome.spec.js` — `.ph-title` Instrument Serif; `#dl-action-btn` green; `.pt-tab.active` green text; legend filter green; `.el[data-z="1"]` visible
