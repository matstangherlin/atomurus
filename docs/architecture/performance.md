# Performance and lifecycle (A1.0)

## Budgets (gated by `tools/test-app-bundle.mjs`)

| Budget | Limit | A1.0 value |
| --- | --- | --- |
| AppShell initial JS (gzip) | ≤ 30 KB | 18.6 KB |
| AppShell CSS | ≤ 48 KB | 28.2 KB |
| Any single feature chunk | ≤ 32 KB | ≤ 5.1 KB |
| Three.js in initial JS | never | lazy (1.1 MB, vendored) |

Raising a budget is a reviewed decision, not a test edit.

## What the shell does not load

The bootstrap (`app-main.js` / `web-main.js`) contains core + shell + router
only. Three.js, every feature (Study, Review, Periodic Table, Molecules, Lab,
Account), element data and Pro Lab code are separate lazy chunks; opening
`#/study/review` imports the Study chunk and nothing else. Tested three ways:
bundle metafile (`test-app-bundle`), static import graph
(`test-viewer-lifecycle`), network requests in the browser (`a1-mobile` lazy
loading tests, including the legacy Home and `/app?section=study`).

## Lifecycle contract

`createScope()` owns everything a feature creates — listeners, timers,
intervals, observers, animation frames, one frame loop, child scopes — and
`dispose()` removes all of it. The feature host disposes the scope on route
leave, so nothing stays mounted invisibly. `createAppLifecycle()` exposes
`onAppPause/onAppResume/onNetworkChange/onRouteEnter/onRouteLeave`.

## Viewer lifecycle (`src/features/viewer/viewer-host.js`)

| Step | Behaviour |
| --- | --- |
| mount | `import()` Three → one `WebGLRenderer` (no antialias on mobile, `low-power`) |
| pixel ratio | `min(devicePixelRatio, 1.5)` on mobile, 2 on desktop — starting values, benchmark in A1.3 |
| background | `onAppPause` stops the loop; resume restarts only if still mounted |
| off-screen | IntersectionObserver pauses the loop |
| unmount | cancel rAF, disconnect observers, remove listeners, dispose geometries/materials/textures, `renderer.dispose()` + `forceContextLoss()`, remove canvas |
| leave during load | Three arrives after the user left → no renderer is created |

Legacy page runtimes (`viewer/runtime/*.js`) keep their page-level lifecycle
(a full navigation reclaims them); they already pause on `visibilitychange`
and off-screen and cap DPR via `paper-lab.js`. Porting them to the viewer host
is A1.3.

## QA procedures

All automated; numbers land in `docs/reports/a1-0-lifecycle-results.json`.

| Procedure | How | Gate |
| --- | --- | --- |
| Viewer open/close ×20 | `e2e/a1-lifecycle.spec.js` | 1 renderer + 1 loop while open, 0 after close, no canvas left, heap growth cycle 5→20 < 2 MB (CDP heap after forced GC) |
| Navigation stress ×10 | Home → Study → Lab → Periodic → Molecule → Study | one nav, constant shell listeners, one mounted feature, no viewer left, heap growth < 2 MB, no page errors |
| Auth stress ×5 | login → refresh → navigate → background → resume → logout | state correct each cycle, no duplicated nav, no errors |
| Background | draws counted on the WebGL context | zero draws while hidden, draws resume on visible |
| Legacy molecule viewer ×20 switches | `setMolecule` over 5 molecules | `renderer.info` geometries flat, heap growth < 3 MB |
| Atomic models, isomerism, Pro Lab | manual: open → switch 20× → `__atomurusPaperStats()` flat | A1.3 automates them on the viewer host |

## Dev instruments

`perf.mark/measure` spans: `bootstrap, auth, study, review, lab,
periodic-table, viewer` (enabled on localhost, `?perf=1`, or
`__ATOMURUS_CONFIG__.dev`). `observeLongTasks()` logs main-thread tasks over
50 ms. `tools/perf-baseline.mjs` records the before/after table in the report.
