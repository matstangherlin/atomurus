# Cobertura de CSS por família de página (prompt 24)

Medido com `node tools/coverage-css.mjs` (cobertura de CSS do Chromium via Playwright, 1280 px e 390 px somados, sem terceiros). Uma regra conta como usada quando casou enquanto a página carregava; estados de hover, menus abertos e o que só aparece depois de clicar **não** contam — então estes números são o **mínimo** que cada família usa.

Famílias: home (`/`), ferramenta (`/calculators.html`), viewer (`/viewer/molecules.html`), artigo (`/explore/what-is-an-atom.html`), tabela (`/periodic-table.html`), auth (`/login.html`).

### Stylesheets loaded, % of each used (1280 + 390 px)

| Stylesheet | KB | home | tool | viewer | article | table | auth |
|---|---:|---:|---:|---:|---:|---:|---:|
| atomurus-lab-console.css | 187.7 | 13.7% | 15.3% | 10.9% | 8% | 8.9% | 6.4% |
| periodic-table.css | 127.7 | — | — | — | — | 23.1% | — |
| assets/public-shell.css | 56.3 | 29.7% | 32.7% | 26% | 19.8% | 25% | 18.1% |
| assets/critical-lab.css | 17.6 | 55.7% | 13.8% | 13.8% | 15.9% | 12.9% | 24.4% |
| explore-article.css | 16.5 | — | — | — | 47.9% | — | — |
| assets/layouts/calculators.css | 10.3 | — | 79% | — | — | — | — |
| assets/fonts/fonts.css | 8.5 | 0% | 0% | 0% | 0% | 0% | 0% |
| assets/layouts/shell.css | 8.0 | 69.4% | 65.9% | 65.9% | 65.9% | 65.9% | 42.6% |
| assets/ui/tokens.css | 6.7 | 53.9% | 53.9% | 53.9% | 53.9% | 53.9% | 53.9% |
| assets/layouts/auth.css | 6.6 | — | — | — | — | — | 75.2% |
| assets/layouts/viewer.css | 4.6 | — | — | 71.1% | — | — | — |
| assets/layouts/periodic-table.css | 4.3 | — | — | — | — | 87% | — |
| assets/ui/buttons.css | 3.4 | 22.5% | 27% | 0% | 0% | 0% | 22.4% |
| assets/ui/navigation.css | 3.4 | 0% | 0% | 0% | 0% | 0% | 0% |
| assets/ui/forms.css | 3.3 | 0% | 25% | 0% | 0% | 0% | 33.5% |
| assets/layouts/home.css | 2.5 | 77% | — | — | — | — | — |
| assets/ui/compat.css | 2.0 | 45% | 47.2% | 0% | 0% | 0% | 40.7% |
| assets/layouts/article.css | 1.9 | — | — | — | 92.9% | — | — |
| assets/ui/states.css | 1.8 | 0% | 0% | 0% | 0% | 0% | 49.9% |
| assets/ui/base.css | 1.8 | 0% | 0% | 0% | 0% | 0% | 27.1% |
| assets/ui/typography.css | 1.7 | 0% | 0% | 0% | 0% | 0% | 23.5% |
| assets/ui/dialogs.css | 1.5 | 0% | 0% | 0% | 0% | 0% | 0% |
| assets/ui/badges.css | 1.2 | 29.8% | 47.5% | 0% | 29.8% | 0% | 0% |
| assets/ui/cards.css | 1.1 | 38.7% | 24.4% | 0% | 0% | 0% | 30.9% |
| assets/ui/index.css | 0.9 | 0% | 0% | 0% | 0% | 0% | 0% |
| assets/ui/tables.css | 0.9 | 0% | 0% | 0% | 0% | 0% | 0% |
| assets/ui/utilities.css | 0.7 | 0% | 0% | 0% | 0% | 0% | 0% |

### atomurus-lab-console.css by section (≥ 2 KB), % used per family

| Section | KB | home | tool | viewer | article | table | auth |
|---|---:|---:|---:|---:|---:|---:|---:|
| LAB CONSOLE — override layer (Bloomberg/Mathematica feel) | 2.3 | 55.6% | 55.6% | 55.6% | 55.6% | 55.6% | 55.6% |
| SIDEBAR | 4.8 | 5.2% | 33.1% | 33.1% | 33.1% | 33.1% | 5.2% |
| LAB CONSOLE — Hi-Fi extensions (v2) | 2.2 | 46.1% | 18.4% | 2% | 18.4% | 2% | 16.4% |
| LANDING PAGE (no sidebar — topnav + grid) | 5.6 | 47% | 6.4% | 6.4% | 9.9% | 6.4% | 30.2% |
| HERO | 5.5 | 72.4% | 0% | 0% | 0% | 0% | 0% |
| MODULE CARDS | 4.0 | 86% | 0% | 0% | 0% | 0% | 0% |
| FOOTER | 3.1 | 90.5% | 0% | 0% | 47.3% | 0% | 75.4% |
| CALCULATORS UI | 7.3 | 0% | 85.6% | 0% | 0% | 0% | 0% |
| DOC PAGES — about, privacy, terms, contact | 9.4 | 0% | 0% | 0% | 0% | 0% | 18% |
| ELEMENT PAGES — periodic-table/[name].html | 5.3 | 0% | 0% | 0% | 0% | 0% | 0% |
| VIEWER CHROME — Lab Console refinements (apply to atomic-models / | 11.2 | 0% | 6.5% | 48.2% | 0% | 6.5% | 0% |
| SETTINGS PANEL — Lab Console refinements (config.html) | 7.0 | 0% | 0% | 0% | 0% | 0% | 0% |
| MOBILE DRAWER MENU — injected by atomurus-mobile-nav.js | 3.8 | 0.9% | 0% | 0% | 0% | 0% | 0.9% |
| GLOBAL MOBILE LAYOUT — applies to every page | 5.4 | 11.5% | 38.7% | 63.1% | 33.6% | 38.7% | 7.9% |
| LANDING — mobile refinements | 4.4 | 76.9% | 4% | 4% | 10.9% | 4% | 30.8% |
| ELEMENT PAGE — nuclide notation + rich content sections | 2.8 | 0% | 0% | 0% | 0% | 0% | 0% |
| SHARE BUTTON — hover dropdown (same pattern as topnav "Visualizador") | 28.0 | 13.3% | 27.7% | 13.7% | 13.7% | 13.7% | 0% |
| PREMIUM CALCULATOR INSTRUMENT — a self-contained warm-dark device | 32.4 | 0% | 11.4% | 0% | 0% | 0% | 0% |
| ISOMERISM — interactive 3D comparator panel | 4.9 | 0% | 0% | 0% | 0% | 0% | 0% |
| ISOMERISM — Isomer Explorer (formula → isomer types) | 3.1 | 0% | 0% | 0% | 0% | 0% | 0% |
| ISOMERISM — base component styles | 5.7 | 0% | 0% | 0% | 0% | 0% | 0% |
| ISOMERISM — minimalist UI/UX pass (scoped to isomerism pages) | 7.9 | 0% | 0% | 0% | 0% | 0% | 0% |

## Leitura

- `atomurus-lab-console.css` (187,7 KB, carregado de forma assíncrona por ≈ 327 páginas) usa de 6% a 15% por família no carregamento. A maior parte é usada por **poucas** famílias, mas boa parte também só aparece com interação.
- Blocos grandes usados por uma família só:
  - **«PREMIUM CALCULATOR INSTRUMENT»** (L5055–6379, 32,4 KB): só a `/calculators` (11% no carregamento; o resto é o modo calculadora científica, que abre com um clique). As classes aparecem fora das calculadoras só em scripts que agem na própria página da calculadora (`assets/lab-tool-gate.js`, `study-save.js`) e em `.big` (genérica). Depois do bloco, no mesmo arquivo, só `.active` é estilizada de novo.
  - **«ISOMERISM» (4 blocos, L6379–7210, 21,6 KB)**: 0% nas 6 famílias medidas; servem às páginas de isomeria. Mas as classes também aparecem em `explore/`, `viewer/`, `periodic-table/heatmap*.html`, e **regras posteriores do mesmo arquivo** voltam a estilizar `iso-3d-*`, `iso-lab*`, `iso-callout*`, `iso-section-*`, `mol-card`, `iso-page`: mover o bloco para outro arquivo muda a ordem da cascata nessas regras.
  - «ELEMENT PAGES» + «ELEMENT PAGE — nuclide notation» (8,1 KB): só as 244 páginas de elemento, que o prompt manda não tocar.
  - «SETTINGS PANEL» (7,0 KB) e «DOC PAGES» (9,4 KB): uma ou duas páginas cada.
- `assets/critical-lab.css` (gerado de `atomurus-lab-console.css` por marcadores de texto) não depende de nenhum desses blocos.

## Decisão: **não dividido** neste prompt

O ganho possível é real, mas pequeno depois da compressão, e a decisão de quão agressiva é a divisão é do dono:

| Opção | O que move | Economia para as outras páginas (sem compressão) | Risco |
|---|---|---|---|
| A — nada (atual) | — | 0 | nenhum |
| B — só a calculadora | «PREMIUM CALCULATOR INSTRUMENT» → `assets/css/lab-console-calculator.css`, carregado (assíncrono, mesmo padrão) só por `calculators(.pt).html` | ≈ 32 KB em ≈ 325 páginas (≈ 17% do arquivo) | baixo: só `.active` é reestilizada depois; precisa de comparação visual das 8 abas da calculadora nos 2 temas |
| C — B + isomeria | também os 4 blocos «ISOMERISM» → `lab-console-isomerism.css` nas páginas de isomeria | ≈ 54 KB (≈ 29%) | médio: regras posteriores dependem da ordem; as classes aparecem em explore/viewer; precisa mover junto as regras posteriores e testar as páginas de isomeria, explore e viewer |
| D — família a família | também páginas de doc, configurações e elemento | ≈ 70 KB+ | alto: toca as 244 páginas de elemento (fora do escopo deste prompt) |

Recomendação: **B** quando o dono aprovar, com capturas antes/depois da `/calculators` em claro/escuro e 1280/390. Em qualquer opção, provar que `assets/critical-lab.css` sai idêntico (`node tools/build-critical-css.js` num worktree + `git diff --exit-code assets/critical-lab.css`).

Observação: rodando `tools/build-critical-css.js` hoje (sem nenhuma mudança deste prompt), `assets/critical-lab.css` já **difere** do que está no repositório (tokens `--purple*` e o `backdrop-filter` da barra do topo). O build da Netlify regenera o arquivo, então a produção já usa a versão regenerada; o arquivo versionado está atrasado. Registrado para correção separada.
