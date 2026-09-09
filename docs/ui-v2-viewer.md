# Atomurus UI V2 — Viewer chrome

**Scope:** Prompt 11. Viewer **toolbars, tabs, headers, and panels** use UI V2 tokens. Canvases, WebGL, `data-pro-lab-tool` gates, and molecule/allotrope catalogs are unchanged. Inline viewer CSS stays in the page (it owns canvas sizing).

## What changed

Hubs and satellites under `viewer/` load `assets/ui/index.css` and [`assets/layouts/viewer.css`](../assets/layouts/viewer.css) after `public-shell.css`:

- `atomic-models.html` + Dalton/Thomson/Rutherford/Bohr/Quantum
- `molecules.html`, `allotropes.html`, `isomerism.html`
- isomerism constitutional/spatial pages (EN+PT)

Chrome only:

- `.ph-title` Instrument Serif; kickers Inter Tight
- `.vz-tab.active` and `.sub-tab.active` **green text** (not ink fill)
- `.viewer-controls` paper, not a black glass HUD
- Molecule/allotrope `.pill.active` stay **green fill** (existing e2e)
- `#viewer3d` / `#viewer2d-full`, `data-pro-lab-tool`, and `lab-tool-gate.js` stay

`explore/viewer/` articles already use article layout CSS and are out of this remessa.

## What this step does not do

- Restyling WebGL, 2D canvas drawing, or embed-mode iframe sizing
- `/app`, element pages
- Removing `public-shell.css` / hoist (Prompt 13)
- Product-truth copy on kickers that still say `§` (Prompt 14)

## Tests

- `test:ui-v2` / `validate` — viewer hubs load UI V2 + `viewer.css`; layout CSS must not mention canvases; `data-pro-lab-tool="atomic"` stays
- `e2e/public-chrome.spec.js` — `.ph-title` Instrument Serif; `.vz-tab.active` green text; `.viewer-controls` not black glass; molecule/allotrope pills green; isomerism `.sub-tab.active` stays
