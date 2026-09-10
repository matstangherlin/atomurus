# 3D performance audit (Atomurus paper lab)

Date: 2026-09-10  
Engine: **Three.js** (kept). No model redesign, no chemistry changes.

Runtime hook (dev): after a viewer boots, `window.__atomurusPaperStats()` returns `renderer.info` plus canvas CSS size and effective DPR.

## What was wrong

Four paper-lab runtimes (`atomic-viewer`, `molecule-viewer`, `allotrope-viewer`, `isomerism-3d`) plus `explore/viewer/mol-viewer.js` each built **one Mesh + Geometry + Material per atom and per bond**. Removing a group with `scene.remove` did **not** call `geometry.dispose()` / `material.dispose()`, so switching models leaked WebGL resources.

Allotropes (graphite, diamond, C60, graphene, nanotube) were the worst: hundreds of draw calls for repeated carbon spheres and cylinders.

Idle auto-rotate kept a ~30 FPS render loop forever. Large canvases used a flat `min(devicePixelRatio, 1.5)` cap.

## Changes (phases 1–7)

| Phase | Change | Where |
| --- | --- | --- |
| 1 | `disposeObject3D` + `replaceChild` / `setGround`; shared resources marked and skipped | `paper-lab.js` |
| 2 | Cached unit sphere / cylinder / circle; `sharedMat` / `sharedBasic` | all runtimes |
| 3 | `InstancedMesh` atoms + bonds for allotropes (and atomic-viewer allotropes) | `allotrope-viewer.js`, atomic allotropes |
| 4 | Adaptive DPR from canvas area, mobile, cores, quality tier | `createRenderer` / `maxDpr` |
| 5 | Intro spin ~3.2s then idle; render on drag / zoom / change / theme | `introSpin` + existing `need()` |
| 6 | Quality-aware sphere/cylinder segments (`geoSegs`) | `paper-lab.js` |
| 7 | Idle prefetch of Three.js + paper-lab on `/viewer/` pages | `load-three.js` |

## Estimated draw calls (allotropes, 3D, paper look)

Counts are **scene objects that issue draws**, not including lights. Instancing collapses N atoms + M bonds into **2** meshes (plus optional glow instances and 1 ground).

| Structure | BEFORE (approx. meshes) | AFTER (instanced) |
| --- | --- | --- |
| Graphite (~72 C + bonds + glows) | 200–350 | ~4 (C, bonds, glow, ground) |
| Diamond (~50 C + bonds) | 150–250 | ~3–4 |
| C60 (60 + 90 bonds + glows) | 240+ | ~4 |
| Graphene (~54 + bonds) | 150–220 | ~3–4 |
| Nanotube (80 + bonds) | 200–300 | ~3–4 |

Molecule viewer still uses shared **non-instanced** meshes (small N). Switching water → methane → CO₂ no longer grows `renderer.info.memory.geometries` because unit geometries are cached and owned groups are disposed.

## Idle / offscreen

- Offscreen: existing `IntersectionObserver` + `document.hidden` — no RAF.
- On-screen idle after intro: `spinning` false → loop sleeps until pointer / wheel / model change.
- If the user checks Auto rotate, the loop stays active (feature preserved).

## Adaptive DPR (auto)

| Situation | Cap |
| --- | --- |
| Quality `performance` | 1.0 |
| Quality `balanced` | 1.25 |
| Quality `high` | 1.5 |
| Mobile or ≤2 cores | 1.0 |
| Canvas ≥ 1600×900 CSS px | 1.0 |
| Canvas ≥ 1280×800 CSS px | 1.25 |
| Default desktop | min(devicePixelRatio, 1.5) |

## How to measure locally

1. Open `/viewer/allotropes.html` (or `.pt.html`).
2. Open DevTools console: `__atomurusPaperStats()`.
3. Switch Graphite → Diamond → C60 → Graphene → Nanotube many times.
4. `info.memory.geometries` should stay roughly flat (cached unit sphere/cylinder + a few instance geometries), not climb by hundreds.
5. After ~4s without interaction, `busy` is false — no continuous GPU work.

Playwright cannot reliably read GPU memory in this environment; `tools/test-viewer-perf.mjs` locks the architecture. Interaction smoothness is verified in the browser (drag orbit on desktop and a 390 CSS-px viewport).

## Measured on this branch (1280×800, canvas 974×460 CSS px)

`window.__atomurusPaperStats()` after boot and after switching Graphite → Diamond → C60 → Graphene → Nanotube:

| Moment | calls | triangles | geometries | textures |
| --- | ---: | ---: | ---: | ---: |
| Graphite | 8 | 16280 | 4 | 0 |
| Nanotube (after Graphite → Diamond → Nanotube) | 4 | 30000 | 6 | 0 |

Geometries went 4 → 6 because unit sphere caches differ by segment count (graphite 10, diamond 14, nanotube 12). They do **not** keep climbing if you switch the same models again. Draw calls stayed in the single digits.

## What we did not do

- No Babylon.js / raw WebGL / WebGPU migration.
- No change to atom coordinates, bond lengths, or pedagogy.
- Labels, 2D/3D, fullscreen, Share, Open Lab, touch orbit remain.
