# Acessibilidade — ANTES (prompt 23)

Gerado por `node tools/a11y-static.mjs` (sem dependências).

| Check | Result |
|---|---|
| Pages checked | 334 |
| Form fields without a name | 106 on 16 pages |
| Fields named only by `title` | 4 |
| Buttons whose `aria-label` does not contain the visible text | 334 on 327 pages |
| Links with the same mismatch (reported, not failed) | 49 |
| Pages with `<main>` and no skip link | 326 of 327 |
| `role="dialog"` without a usable name | 10 of 14 |

### calculators.html

- Fields without a name: `select#mm-amount-unit`, `select#uc-cat`, `input#uc-value[type=number]`, `select#uc-from`, `select#uc-to`, `select#ig-solve`, `input#ig-P[type=number]`, `select#ig-P-u`, `input#ig-V[type=number]`, `select#ig-V-u`, `input#ig-n[type=number]`, `input#ig-T[type=number]`, `select#ig-T-u`, `select#dl-solve`, `input#dl-C1[type=number]`, `input#dl-V1[type=number]`, `input#dl-C2[type=number]`, `input#dl-V2[type=number]`, `select#ph-mode`, `input#ph-H[type=number]`, `input#ph-OH[type=number]`, `input#ph-pH[type=number]`, `input#ph-pOH[type=number]`, `input#tm-dh[type=number]`, `input#tm-ds[type=number]`, `select#tm-sub`, `input#tm-mass[type=number]`, `input#tm-dt[type=number]`
- Named by `title` only: 0
- Name ≠ visible text: «Switch language» vs «pt»
- Skip link: no
- Dialogs: none

### calculators.pt.html

- Fields without a name: `select#mm-amount-unit`, `select#uc-cat`, `input#uc-value[type=number]`, `select#uc-from`, `select#uc-to`, `select#ig-solve`, `input#ig-P[type=number]`, `select#ig-P-u`, `input#ig-V[type=number]`, `select#ig-V-u`, `input#ig-n[type=number]`, `input#ig-T[type=number]`, `select#ig-T-u`, `select#dl-solve`, `input#dl-C1[type=number]`, `input#dl-V1[type=number]`, `input#dl-C2[type=number]`, `input#dl-V2[type=number]`, `select#ph-mode`, `input#ph-H[type=number]`, `input#ph-OH[type=number]`, `input#ph-pH[type=number]`, `input#ph-pOH[type=number]`, `input#tm-dh[type=number]`, `input#tm-ds[type=number]`, `select#tm-sub`, `input#tm-mass[type=number]`, `input#tm-dt[type=number]`
- Named by `title` only: 0
- Name ≠ visible text: «Switch language» vs «pt»
- Skip link: no
- Dialogs: none

### periodic-table.html

- Fields without a name: `input#search-input[type=text]`, `select#heatmap-select`, `select#lang-select`
- Named by `title` only: 0
- Name ≠ visible text: «Switch language» vs «pt»
- Skip link: no
- Dialogs: #modal — aria-labelledby → #m-nm is empty until script fills it

### periodic-table.pt.html

- Fields without a name: `input#search-input[type=text]`, `select#heatmap-select`, `select#lang-select`
- Named by `title` only: 0
- Name ≠ visible text: «Switch language» vs «pt»; «Fullscreen» vs «tela cheia»; «Add to compare» vs «comparar»
- Skip link: no
- Dialogs: #modal — aria-labelledby → #m-nm is empty until script fills it

### Name ≠ visible text, all pages

| aria-label | Visible text | Pages |
|---|---|---|
| Switch language | pt | 317 |
| Account | conta | 21 |
| Mudar idioma | en | 10 |
| Follow Atomurus on X (Twitter), @atomurusapp | x / twitter | 9 |
| Siga o Atomurus no X (Twitter), @atomurusapp | x / twitter | 9 |
| Add to compare | comparar | 5 |
| Fullscreen | tela cheia | 2 |
| Open the interactive isotopes explorer on Atomurus to browse the stable and radioactive isotopes of every element, with half-lives and abundances | explore isotopes → | 1 |
| Abrir o explorador interativo de isótopos do Atomurus para navegar pelos isótopos estáveis e radioativos de cada elemento, com meias-vidas e abundâncias | explorar isótopos → | 1 |
| Open the interactive isotopes explorer on Atomurus to see stable and radioactive isotopes, their half-lives and decay modes | explore isotopes → | 1 |
| Abrir o explorador interativo de isótopos do Atomurus para ver isótopos estáveis e radioativos, suas meias-vidas e modos de decaimento | explorar isótopos → | 1 |
| Open the interactive periodic table on Atomurus — click any of the 118 chemical elements to see its atomic number, atomic mass, electron configuration, group, period and properties | view interactive table → | 1 |
| Open the interactive periodic trends tool: see how atomic radius, ionisation energy and electronegativity vary across periods and down groups | open trends → | 1 |
| Open the interactive periodic table to see metals, metalloids and non-metals and click any element | open interactive table → | 1 |
| Abrir a tabela periódica interativa do Atomurus — clique em qualquer um dos 118 elementos químicos para ver seu número atômico, massa atômica, configuração eletrônica, grupo, período e propriedades | ver tabela interativa → | 1 |

Pages with `<main>` and no skip link: 326 (first 10: 404.html, about.html, about.pt.html, account.html, calculators.html, calculators.pt.html, config.html, config.pt.html, contact.html, contact.pt.html).
### axe-core 4.10.2 (opcional, rodado fora do repositório)

Comando: `node tools/a11y-axe.mjs --axe <pasta-com-axe-core> --open-modal` (Chromium do Playwright, 1280 px e 390 px; `label-content-name-mismatch` é regra experimental do axe e é ligada pelo script). Os números são de nós por página.

| Página | 1280 px | 390 px |
|---|---|---|
| `/index.html` | label-content-name-mismatch 1 | label-content-name-mismatch 1 |
| `/calculators.html` e `.pt.html` | aria-required-children 1 (`.calc-menu`), select-name 1 (`#mm-amount-unit`), label-content-name-mismatch 1 (botão PT/EN), landmark-unique 1, region 2 | iguais (region 1) |
| `/periodic-table.html` e `.pt.html` | aria-dialog-name 1 (`#modal`), color-contrast 109, label-content-name-mismatch 61 (botão PT/EN + 60 células), region 3 | color-contrast 120, label-content-name-mismatch 64 |
| `/periodic-table` com o modal aberto | color-contrast 111, label-content-name-mismatch 61 | color-contrast 122 |

Observações:

- O axe só olha o que está visível: os campos das abas fechadas da `/calculators` não aparecem nele, mas a checagem estática acima pega todos (28 por página).
- As células da tabela (`div[role=button]` com `aria-label` descritivo) também caem em `label-content-name-mismatch`. O `aria-label` delas é mais rico que o texto visível (número, camadas, símbolo, massa, nome abreviado) e o prompt pede para não removê-lo: fica para o prompt 35.
- `region` e `landmark-unique` não fazem parte do M09; ficam registrados para o prompt 35.
