# Divisão do periodic-table.js — DEPOIS (prompt 24)

Medido com `node tools/perf-baseline.mjs --set pt --root . --label after --out docs/perf/pt-split-after.json` — Chromium headless, 390×844 @2x (mobile), mediana de 3 execuções, terceiros bloqueados (anúncios, analytics, fontes do Google, jsdelivr — o Chart.js não carrega aqui, igual antes e depois), servidor local `tools/e2e-serve.mjs` **sem compressão** (os KB são os bytes dos arquivos; com brotli na Netlify os números absolutos são menores). Números de laboratório desta máquina: compare antes × depois, não leia como dado de campo. Medido em 2026-10-28.

## Resultado

| Página | JS antes → depois (KB) | Δ JS | Long tasks (ms) antes → depois | Requisições antes → depois |
|---|---:|---:|---:|---:|
| Home | 215.7 → 215.7 | +0.0 (+0%) | 0 → 0 | 55 → 55 |
| Calculators | 272.9 → 272.9 | +0.0 (+0%) | 0 → 0 | 59 → 59 |
| Periodic Table | 657 → 434.6 | -222.4 (-34%) | 120 → 76 | 59 → 59 |
| PT · Heatmap | 662.3 → 439.9 | -222.4 (-34%) | 72 → 52 | 59 → 59 |
| PT · Trends | 654.1 → 536 | -118.1 (-18%) | 57 → 0 | 57 → 58 |
| PT · Compare | 669.7 → 494.8 | -174.9 (-26%) | 54 → 0 | 58 → 59 |
| PT · Isotopes | 742.1 → 568 | -174.1 (-23%) | 167 → 71 | 62 → 63 |

- **`/periodic-table`: −222 KB de JS (−34% de todo o JS da página).** Só o `periodic-table.js` caiu de 319,5 KB para 97,1 KB (−70%); o resto do JS da página (i18n, dados dos elementos, chrome) não mudou. A meta proposta (−35% do JS da `/periodic-table`) era sobre o script da tabela; sobre o JS total da página ficou em −34%.
- **Sub-páginas**: todas baixam menos JS que antes (núcleo + o próprio módulo). Tendências, comparar e isótopos têm +1 requisição (o próprio módulo): trocam um arquivo grande por dois menores. O mapa de calor só carrega o núcleo.
- **Exportar** (≈ 28 KB) não é baixado por nenhuma página até o primeiro clique em baixar.
- **Home e calculadoras**: iguais (não carregam `periodic-table.js`; o CSS não foi dividido, ver `css-coverage.md`).
- Long tasks e tempo de script caem na tabela; as variações de FCP/load entre execuções são ruído desta máquina.

## Tamanhos dos arquivos (sem compressão)

| Arquivo | Bytes | Quem carrega |
|---|---:|---|
| `periodic-table.js` (núcleo) | 99.415 | as 10 páginas |
| `assets/pt/pt-compare.js` | 48.385 | `compare(.pt).html` |
| `assets/pt/pt-trends.js` | 106.516 | `trends(.pt).html` |
| `assets/pt/pt-isotopes.js` | 49.315 | `isotopes(.pt).html` |
| `assets/pt/pt-export.js` | 29.094 | sob demanda (primeiro clique em baixar) |
| **Soma** | 332.725 | antes: 327.158 num só arquivo (+5,5 KB de cabeçalhos e stubs) |

Tetos registrados em `pt-split-budget.json` (`npm run test:pt-split` falha acima deles).

## Lighthouse

Não foi rodado de novo aqui (o prompt 18 já tem o «depois» dele, e este ambiente não tem a rede de produção). **Passo manual do dono**: depois do deploy, repetir o Lighthouse mobile da `/periodic-table` e das 4 sub-páginas e comparar com o relatório anterior.

Dados brutos: `pt-split-after.json`.
