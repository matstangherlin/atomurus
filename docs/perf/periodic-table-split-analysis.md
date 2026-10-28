# periodic-table.js — análise antes de dividir (prompt 24, M10)

Gerado com `node tools/analyze-pt-split.mjs` (léxico próprio, sem dependências: pula comentários, strings, templates e regex, e acompanha a profundidade de chaves para achar só as declarações de **topo**) e `node tools/coverage-pt.mjs` (cobertura V8 do Playwright nas 5 páginas EN, sem terceiros; o Chart.js é o stub de `e2e/fixtures/chart-stub.js`). Arquivo medido: `periodic-table.js` no início do prompt 24 — 7.489 linhas, 319,5 KB, 314 nomes de topo, script clássico com `defer`.

## 1. Inventário por seção

Seções cortadas pelos comentários-marcadores (`// ════ NOME ════` e, dentro de TABS, `// ─── NOME ───`). «Usa nomes de» = nomes de topo declarados em outra seção e referenciados nesta.

| Section | Lines | KB | Top-level names | Uses names from |
|---|---|---|---|---|
| preamble | 1–6 | 0.5 | 0 | — |
| data | 7–12 | 0.3 | 0 | — |
| i18n-helper | 13–707 | 25.9 | 34 | modal (1) |
| modal | 708–956 | 10.5 | 9 | filter (1), i18n-helper (4), compare (2) |
| export-pdf | 957–1366 | 15.9 | 7 | i18n-helper (3), filter (1) |
| export-png | 1367–1748 | 13.5 | 2 | export-pdf (1), i18n-helper (2), modal (2), compare (1), fullscreen (1) |
| fullscreen | 1749–1777 | 1.1 | 1 | — |
| filter | 1778–1826 | 1.2 | 5 | — |
| search | 1827–2056 | 8.4 | 17 | i18n-helper (1), modal (1) |
| tabs | 2057–2102 | 1.6 | 1 | heatmap (2), compare (1), trends/custom-select (1), isotopes (1) |
| heatmap | 2103–2278 | 6.0 | 8 | search (1), i18n-helper (1) |
| compare | 2279–3096 | 36.9 | 61 | i18n-helper (3), trends/tooltip (2), compare/applications (2), compare/atomic-model (1) |
| compare/applications | 3097–3178 | 3.8 | 3 | compare (3) |
| compare/atomic-model | 3179–3305 | 5.9 | 5 | compare (4) |
| trends | 3306–3591 | 10.8 | 31 | trends/navigator (5), trends/insight (1) |
| trends/insight | 3592–3824 | 17.0 | 5 | — |
| trends/tooltip | 3825–3999 | 9.9 | 12 | trends/insight (2), trends (3), trends/custom-select (1) |
| trends/scope | 4000–4058 | 3.7 | 2 | trends/tooltip (1) |
| trends/custom-select | 4059–4846 | 34.6 | 21 | trends/scope (2), trends (16), trends/insight (4), i18n-helper (1), trends/tooltip (2), trends/navigator (11) |
| trends/navigator | 4847–5401 | 23.8 | 22 | trends (17), trends/insight (4), trends/tooltip (1) |
| trends/export | 5402–5555 | 6.2 | 2 | trends (1), trends/insight (2), i18n-helper (1), trends/tooltip (1) |
| isotopes | 5556–5745 | 8.6 | 6 | i18n-helper (3), isotopes/tooltip (1), isotopes/abundance-chart (1), isotopes/half-life-chart (1), isotopes/insight (1), isotopes/applications (1), isotopes/hero (1), isotopes/atomic-model (1), isotopes/decay-filter (2) |
| isotopes/atomic-model | 5746–5800 | 2.7 | 1 | i18n-helper (2) |
| isotopes/hero | 5801–5896 | 4.7 | 2 | i18n-helper (1) |
| isotopes/insight | 5897–6066 | 7.8 | 6 | i18n-helper (1) |
| isotopes/applications | 6067–6141 | 3.2 | 3 | i18n-helper (1), isotopes/insight (1) |
| isotopes/decay-palette | 6142–6161 | 1.0 | 2 | — |
| isotopes/decay-filter | 6162–6247 | 3.6 | 4 | i18n-helper (1), isotopes (1), isotopes/half-life-chart (1) |
| isotopes/half-life-chart | 6248–6341 | 3.4 | 2 | i18n-helper (2), isotopes/decay-filter (1), isotopes/decay-palette (1), isotopes/tooltip (1) |
| isotopes/abundance-chart | 6342–6429 | 3.2 | 2 | i18n-helper (2), isotopes/tooltip (1) |
| isotopes/tooltip | 6430–6626 | 9.3 | 20 | trends (1), trends/insight (1), i18n-helper (1) |
| navigation | 6627–6719 | 3.2 | 3 | search (1), filter (1) |
| dark-mode | 6720–6756 | 1.5 | 4 | filter (1), i18n-helper (1), fblock-lines (1) |
| element-size | 6757–6779 | 0.9 | 1 | — |
| heatmap-select | 6780–6795 | 0.6 | 1 | heatmap (2) |
| fblock-toggle | 6796–6805 | 0.5 | 1 | — |
| init | 6806–6912 | 4.1 | 1 | dark-mode (1), i18n-helper (2), search (1), element-size (1), heatmap (1), fblock-toggle (1), navigation (2), modal (1), tabs (1) |
| fblock-lines | 6913–7404 | 20.1 | 8 | i18n-helper (3), export-pdf (1) |
| i18n-rerender | 7405–7488 | 3.7 | 0 | i18n-helper (1), filter (1), modal (1), isotopes (1), compare (1), trends/custom-select (1), search (1) |

Agrupando: **núcleo 90,1 KB**, comparar 46,6 KB, tendências 105,9 KB, isótopos 47,5 KB, exportar (PDF + PNG) 29,4 KB.

## 2. Grafo de uso entre grupos

| De → para | Nomes |
|---|---|
| núcleo → comparar | `cmpSelection`, `renderCompare` (no modal: «Comparar», já protegido com `typeof`), `initCompare` (`switchTab`), `renderCompare` (re-render de idioma), `closeCompPicker` (Esc no teclado global) |
| núcleo → tendências | `renderTrendChart` (`switchTab`, re-render de idioma) |
| núcleo → isótopos | `initIsotopes` (`switchTab`), `showIsotopes` (re-render de idioma) |
| núcleo → exportar | `roundRect` — mas veja o risco 1: o `roundRect` que vale hoje é o do núcleo |
| comparar → tendências | `trendChemicalFamilyKey`, `trendChemicalFamilyLabel` |
| isótopos → tendências | `trendEscapeHtml`, `trendLang` |
| exportar → núcleo | `_T`, `currentElement`, `ensureJsPdf`, `formatElementGroup`, … |
| comparar / tendências / isótopos → núcleo | `_T`, `drawBohr`, `bohrPaused`, `drawAtomicModel`, `ensureChartJs`, `ensureChartZoom`, `elName`, `getExtra`, … |

Consequências:

- **Vão para o núcleo** (usados por 2+ grupos): `trendLang`, `trendEscapeHtml`, `trendChemicalFamilyKey`, `trendChemicalFamilyLabel` e o que eles usam (`trendFamilyDef`, `TREND_FAMILY_DEFS`, `trendSelStr`). São ≈ 3 KB.
- **Ficam no núcleo, mesmo estando na seção de PNG**: `overlayClick` (clique no fundo do modal, chamado por `onclick` em todas as páginas) e o `keydown` global (Esc, setas, `/`), que estão no fim da seção «PNG — FULL TABLE».
- **Chamadas do núcleo para módulos** passam a ser protegidas com `typeof … === 'function'` (só onde ainda não são).

### Chamadas a partir do HTML (`onclick=`, `oninput=`, …)

Nas 10 páginas (5 EN + 5 PT; o prompt fala em 12, mas são 10 arquivos):

- **Todas**: `closeModal`, `overlayClick`, `downloadElement` e `downloadTablePDF` (modal e painel de configurações), `handleBohrClick`, `toggleAnimations`, `toggleMass`, `setElSize`, `setFblock`, `setHeatmap`, `setTheme`, `toggleTheme`, `toggleMobileSidebar` → núcleo, exceto `downloadElement` e `downloadTablePDF`, que são do grupo «exportar» e ganham **stubs** no núcleo que carregam o módulo no primeiro clique.
- `periodic-table(.pt).html`: busca com sugestões (`handleSearchInput`, `handleSearchKey`, `updateSearchSuggestions`), filtro (`filterCat`, `clearFilter`), `dlSwitch`, `downloadTable` → núcleo.
- `heatmap(.pt).html`: `applyHeatmap` (núcleo) e também, em painéis ocultos herdados, `openCompPicker`, `clearCompSlot`, `filterCompPicker`, `filterIsoList`, `renderTrendChart`. Esses painéis não aparecem na página do mapa de calor (as abas são links para páginas separadas); sem o módulo, os botões ocultos não fazem nada.
- `trends`, `compare`, `isotopes`: só o que é do próprio módulo + núcleo.

### Outros arquivos que usam nomes deste script

- `tools/test-periodic-search.mjs` recorta `normSearch…handleSearchInput` e `heatmapPropValue…applyHeatmap` do núcleo (continuam lá) e procura a guarda de mojibake `'â€”'`, que está em `cmpHasValue` (comparar) → o teste passa a procurá-la no módulo.
- `tools/test-encoding.mjs` permite essa guarda só em `periodic-table.js` → a permissão passa para o arquivo do módulo de comparação.
- `isotopes-data.js`, `element-applications-data.js`, `isotope-applications-data.js` só citam `showIsotopes`/`renderCompareApplications` em comentários.

## 3. Cobertura real por página

Cada célula: funções que rodaram / funções da seção · % dos bytes da seção executados. Ações: carregar, buscar «Fe», abrir o modal do Fe, e o ato central da página (tabela: modal + busca; heatmap: raio atômico; tendências: gráfico + trocar propriedade; comparar: Fe × Cu; isótopos: carbono). O % de bytes inclui comentários e dados de topo, que contam como «executados» quando o script carrega; o número de funções é o sinal mais claro.

| Section | table | heatmap | trends | compare | isotopes |
|---|---:|---:|---:|---:|---:|
| preamble | 0/0 fn · 100% | 0/0 fn · 100% | 0/0 fn · 100% | 0/0 fn · 100% | 0/0 fn · 100% |
| data | 0/0 fn · 100% | 0/0 fn · 100% | 0/0 fn · 100% | 0/0 fn · 100% | 0/0 fn · 100% |
| i18n-helper | 25/43 fn · 51.4% | 15/42 fn · 40.8% | 19/48 fn · 27.9% | 11/38 fn · 24.7% | 30/56 fn · 50.3% |
| modal | 9/12 fn · 66.2% | 9/12 fn · 66% | 9/12 fn · 66% | 9/12 fn · 66% | 9/12 fn · 66% |
| export-pdf | 0/7 fn · 2% | 0/7 fn · 2% | 0/7 fn · 2% | 0/7 fn · 2% | 0/7 fn · 2% |
| export-png | 1/3 fn · 4.3% | 1/3 fn · 4.6% | 1/3 fn · 4.3% | 1/3 fn · 4.6% | 1/3 fn · 4.3% |
| fullscreen | 0/3 fn · 34.3% | 0/3 fn · 34.3% | 0/3 fn · 34.3% | 0/3 fn · 34.3% | 0/3 fn · 34.3% |
| filter | 0/3 fn · 8.4% | 0/3 fn · 8.4% | 0/3 fn · 8.4% | 0/3 fn · 8.4% | 0/3 fn · 8.4% |
| search | 23/44 fn · 62.1% | 13/37 fn · 44.3% | 4/31 fn · 25.1% | 4/31 fn · 25.1% | 6/31 fn · 28.2% |
| tabs | 0/1 fn · 2.3% | 3/5 fn · 57.5% | 3/5 fn · 53.3% | 3/5 fn · 52% | 3/5 fn · 52.1% |
| heatmap | 0/7 fn · 5.9% | 8/13 fn · 42.7% | 0/7 fn · 5.9% | 0/7 fn · 5.9% | 0/7 fn · 5.9% |
| compare | 0/52 fn · 1.6% | 0/52 fn · 1.6% | 0/52 fn · 1.6% | 17/59 fn · 26.4% | 0/52 fn · 1.6% |
| compare/applications | 0/2 fn · 18.2% | 0/2 fn · 18.2% | 0/2 fn · 18.2% | 0/2 fn · 18.2% | 0/2 fn · 18.2% |
| compare/atomic-model | 0/4 fn · 8.6% | 0/4 fn · 8.6% | 0/4 fn · 8.6% | 0/4 fn · 8.6% | 0/4 fn · 8.6% |
| trends | 0/21 fn · 11.5% | 0/21 fn · 11.5% | 11/23 fn · 31.3% | 0/21 fn · 11.5% | 0/21 fn · 11.5% |
| trends/insight | 0/4 fn · 85.2% | 0/4 fn · 85.2% | 7/8 fn · 94.1% | 0/4 fn · 85.2% | 0/4 fn · 85.2% |
| trends/tooltip | 0/11 fn · 32.1% | 0/11 fn · 32.1% | 2/15 fn · 34.8% | 0/11 fn · 32.1% | 0/11 fn · 32.1% |
| trends/scope | 1/1 fn · 100% | 1/1 fn · 100% | 1/1 fn · 100% | 1/1 fn · 100% | 1/1 fn · 100% |
| trends/custom-select | 0/20 fn · 4.9% | 0/20 fn · 4.9% | 32/64 fn · 58% | 0/20 fn · 4.9% | 0/20 fn · 4.9% |
| trends/navigator | 0/22 fn · 8.8% | 0/22 fn · 8.8% | 21/45 fn · 53.6% | 0/22 fn · 8.8% | 0/22 fn · 8.8% |
| trends/export | 0/2 fn · 6.9% | 0/2 fn · 6.9% | 0/2 fn · 6.9% | 0/2 fn · 6.9% | 0/2 fn · 6.9% |
| isotopes | 0/4 fn · 2.5% | 0/4 fn · 2.5% | 0/4 fn · 2.5% | 0/4 fn · 2.5% | 9/15 fn · 74.4% |
| isotopes/atomic-model | 0/1 fn · 11.4% | 0/1 fn · 11.4% | 0/1 fn · 11.4% | 0/1 fn · 11.4% | 4/6 fn · 74% |
| isotopes/hero | 0/2 fn · 11.6% | 0/2 fn · 11.6% | 0/2 fn · 11.6% | 0/2 fn · 11.6% | 12/13 fn · 91.9% |
| isotopes/insight | 0/6 fn · 13.9% | 0/6 fn · 13.9% | 0/6 fn · 13.9% | 0/6 fn · 13.9% | 6/9 fn · 50.1% |
| isotopes/applications | 0/2 fn · 16% | 0/2 fn · 16% | 0/2 fn · 16% | 0/2 fn · 16% | 7/7 fn · 90.5% |
| isotopes/decay-palette | 0/1 fn · 80.3% | 0/1 fn · 80.3% | 0/1 fn · 80.3% | 0/1 fn · 80.3% | 1/1 fn · 95% |
| isotopes/decay-filter | 0/3 fn · 20.9% | 0/3 fn · 20.9% | 0/3 fn · 20.9% | 0/3 fn · 20.9% | 13/15 fn · 86.6% |
| isotopes/half-life-chart | 0/1 fn · 9.6% | 0/1 fn · 9.6% | 0/1 fn · 9.6% | 0/1 fn · 9.6% | 7/10 fn · 78.6% |
| isotopes/abundance-chart | 0/1 fn · 9.7% | 0/1 fn · 9.7% | 0/1 fn · 9.7% | 0/1 fn · 9.7% | 7/9 fn · 91.4% |
| isotopes/tooltip | 0/16 fn · 15.4% | 0/16 fn · 15.4% | 0/16 fn · 15.4% | 0/16 fn · 15.4% | 8/23 fn · 26.5% |
| navigation | 0/1 fn · 41.4% | 0/1 fn · 41.4% | 0/1 fn · 41.4% | 0/1 fn · 41.4% | 0/1 fn · 41.4% |
| dark-mode | 5/7 fn · 67% | 5/7 fn · 67% | 5/7 fn · 67% | 5/7 fn · 67% | 5/7 fn · 67% |
| element-size | 4/4 fn · 98.2% | 4/4 fn · 98.2% | 4/4 fn · 98.2% | 4/4 fn · 98.2% | 4/4 fn · 98.2% |
| heatmap-select | 0/1 fn · 11.9% | 0/1 fn · 11.9% | 0/1 fn · 11.9% | 0/1 fn · 11.9% | 0/1 fn · 11.9% |
| fblock-toggle | 2/2 fn · 95.4% | 2/2 fn · 95.4% | 1/2 fn · 80% | 1/2 fn · 80% | 1/2 fn · 80% |
| init | 4/8 fn · 63.1% | 4/8 fn · 67.1% | 3/8 fn · 65.9% | 3/8 fn · 65.9% | 3/8 fn · 65.9% |
| fblock-lines | 9/24 fn · 25.9% | 9/24 fn · 25.9% | 3/23 fn · 10.3% | 3/23 fn · 10.3% | 3/23 fn · 10.3% |
| i18n-rerender | 1/2 fn · 17.6% | 1/2 fn · 17.6% | 1/2 fn · 17.6% | 1/2 fn · 17.6% | 1/2 fn · 17.6% |
| **whole file** | **23.4%** | **23.1%** | **30.2%** | **22.4%** | **29.6%** |


Leitura:

- Na `/periodic-table`, **nenhuma** função de comparar (0/52), tendências (0 em 6 seções), isótopos (0 em 10 seções) ou exportar (0/7 no PDF) roda. Só ≈ 23% do arquivo executa.
- Cada sub-página usa o próprio grupo e o núcleo; nenhuma usa outro grupo.
- Exportar não roda em nenhuma página até alguém clicar em «Baixar» → candidato a carregamento sob demanda.
- **Mapa de calor**: 8/13 funções na página dele, 0/7 nas outras; mas o `INIT` do núcleo pinta o mapa de calor salvo no painel de configurações em qualquer página com a tabela, e `heatmap-select` (configurações) chama `applyHeatmap`/`removeHeatmap` em todas. São 6 KB → **fica no núcleo**.

## 4. Proposta final

| Arquivo | Conteúdo | Tamanho (≈) | Quem carrega |
|---|---|---|---|
| `periodic-table.js` (núcleo) | dados/i18n, modal, busca, filtro, tela cheia, abas (`switchTab`), mapa de calor, navegação, tema, tamanho, f-block, INIT, re-render de idioma; helpers compartilhados (`trendLang`, `trendEscapeHtml`, família química); `overlayClick` e o `keydown` global; stubs de exportar | ≈ 95 KB | as 10 páginas |
| `assets/pt/pt-compare.js` | COMPARAR + aplicações + modelo atômico comparado | ≈ 46 KB | `compare(.pt).html` |
| `assets/pt/pt-trends.js` | TENDÊNCIAS (lógica, insight, tooltip, escopo, select, navegador, export PNG das tendências) | ≈ 103 KB | `trends(.pt).html` |
| `assets/pt/pt-isotopes.js` | ISÓTOPOS (lista, modelo, resumo, insight, aplicações, decaimento, gráficos, tooltip) | ≈ 47 KB | `isotopes(.pt).html` |
| `assets/pt/pt-export.js` | PDF do elemento + PNG/PDF da tabela | ≈ 27 KB | sob demanda, no primeiro clique em baixar, em qualquer página |

Estimativa: a `/periodic-table` cai de 319,5 KB para ≈ 95 KB de `periodic-table*.js` sem compressão (≈ −70%); cada sub-página baixa o núcleo + o seu módulo (≈ 95 + 46…103 KB), menos que hoje. A meta do prompt (−35% de JS na `/periodic-table`) fica coberta com folga; o número real vem do `perf-baseline` (`docs/perf/pt-split-depois.md`).

## 5. Riscos

1. **`roundRect` declarado duas vezes** (L1294, seção PDF, «caminho + preencher»; L7259, f-block, «só caminho»). Num script clássico vale a **última** declaração, então hoje o PDF do elemento usa a versão sem preenchimento (o fundo das etiquetas e da caixa de destaque do PDF não é pintado — bug latente). Se o módulo de exportar carregasse depois do núcleo com a sua cópia, ela passaria a valer e **mudaria** o PNG da tabela (L7186) e o PDF. Decisão: a cópia da L1294, que hoje nunca vale, **não** vai para o módulo; o comportamento fica idêntico. O bug latente do PDF fica registrado para correção separada.
2. **Ordem de execução.** O `INIT` do núcleo roda ao carregar e, nas sub-páginas, chama `switchTab(<aba>)`, que chama `initCompare`/`initIsotopes` e agenda `renderTrendChart` — funções que agora chegam num script **depois** do núcleo. Solução: o roteamento da sub-página roda no `DOMContentLoaded` (que só dispara depois de todos os scripts `defer`, inclusive os módulos), com reserva no `load` e proteção contra rodar duas vezes; as chamadas ganham `typeof`.
3. **Símbolos de topo compartilhados** (`let`/`const` entre scripts clássicos vivem no mesmo escopo léxico global): duplicar um nome em dois arquivos é erro de sintaxe no segundo. `tools/test-pt-split.mjs` garante nome único.
4. **Referência no momento de carregar.** `TREND_SCOPE` (módulo de tendências) usa `TREND_FAMILY_DEFS` ao carregar; como esse vai para o núcleo, que roda antes, funciona. O módulo não pode ser carregado antes do núcleo.
5. **Página de comparação pública** (`body[data-compare-canonical="pro-lab"]`): os seletores ficam ocultos e `renderCompare()` retorna cedo; o módulo ainda monta a grade do seletor. Comportamento mantido; registrado porque ≈ 46 KB baixados ali hoje quase não aparecem.
6. **Sem terceiros nos testes**: Chart.js vem de `cdn.jsdelivr.net`, bloqueado no ambiente de teste; o e2e usa um stub que registra os gráficos criados. Um teste com o Chart.js real precisa de rede (passo manual do dono).
