# Atomurus UI V2 — Calculators

**Scope:** Prompt 08. Calculators use UI V2 tokens. Chemistry parsers, keypad math, `data-target` tabs, molar/scientific DOM ids, and `lab-tool-gate.js` are unchanged.

## Hub

`calculators.html` (and `calculators.pt.html`) load `assets/ui/index.css` and [`assets/layouts/calculators.css`](../assets/layouts/calculators.css). Tool-shell sidebar/topbar layout stays in the page `<style>` (same pattern as Explore). Keep:

- `data-target` tabs (`molar`, `scientific`, `unit`, `ideal`, `dilute`, `ph`, `stoich`, `thermo`)
- `#mm-input`, `#mm-result-body`, `#mm-result-meta`, `.calc-btn-run`, `.scc-device`, `.scc-brand`
- Lab gates injected at runtime (`#lab-tool-gate-scientific`, …)

Compute is dual-classed `.calc-btn-run.ui-btn.ui-btn-accent` (green science action, not ink). Inputs/selects are `.ui-input` / `.ui-select`. Result panels are `.ui-card`. Active instrument tabs stay **green**. The scientific device stays **paper**, not a black console.

## What this step does not do

- Periodic table, viewer, config, `/app`
- Changing formula parsers, keypad JS, or gate copy
- Removing `public-shell.css` / hoist / lab-console

## Tests

- `test:ui-v2` / `validate` — calculators must load UI V2 + `calculators.css`; molar/scientific tabs stay
- `e2e/public-chrome.spec.js` — H2O → 18.02 g·mol; scientific device paper; keypad `.is-on` green; `.scc-brand` Atomurus
