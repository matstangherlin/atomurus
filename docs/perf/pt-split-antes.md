# Divisão do periodic-table.js — ANTES (prompt 24)

Medido com `node tools/perf-baseline.mjs --set pt --root ../../../tmp/claude-0/-home-user-atomurus/b46ed518-2ddc-5604-b996-ba86f508b972/scratchpad/wt-ci --label before --out docs/perf/pt-split-before.json` — Chromium headless, 390×844 @2x (mobile), mediana de 3 execuções, terceiros bloqueados (anúncios, analytics, fontes do Google, jsdelivr — o Chart.js não carrega aqui, igual antes e depois), servidor local `tools/e2e-serve.mjs` **sem compressão** (os KB são os bytes dos arquivos; com brotli na Netlify os números absolutos são menores). Números de laboratório desta máquina: compare antes × depois, não leia como dado de campo. Medido em 2026-10-28.

Checkout medido: o commit `5e78b55` (branch antes da divisão, com os prompts anteriores já aplicados), para isolar o efeito desta mudança.

| Página | JS (KB) | CSS (KB) | Total (KB) | Requisições | Long tasks | Long tasks (ms) | Script (ms) | FCP (ms) | load (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Home (`/`) | 215.7 | 322.7 | 761.1 | 55 | 0 | 0 | 101 | 332 | 512 |
| Calculators (`/calculators.html`) | 272.9 | 330.5 | 1005 | 59 | 0 | 0 | 142 | 336 | 627 |
| Periodic Table (`/periodic-table.html`) | 657 | 454 | 1394.5 | 59 | 2 | 120 | 114 | 276 | 571 |
| PT · Heatmap (`/periodic-table/heatmap.html`) | 662.3 | 454 | 1409.5 | 59 | 1 | 72 | 123 | 312 | 577 |
| PT · Trends (`/periodic-table/trends.html`) | 654.1 | 454 | 1376.2 | 57 | 1 | 57 | 111 | 296 | 499 |
| PT · Compare (`/periodic-table/compare.html`) | 669.7 | 454 | 1392.3 | 58 | 1 | 54 | 102 | 292 | 450 |
| PT · Isotopes (`/periodic-table/isotopes.html`) | 742.1 | 454 | 1503.4 | 62 | 2 | 167 | 151 | 312 | 596 |

Dados brutos: `pt-split-before.json`.
