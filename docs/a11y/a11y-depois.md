# Acessibilidade — DEPOIS (prompt 23, M09)

Mesmas medições do [antes](a11y-antes.md). Como medir de novo: [README](README.md).

## Resumo

| Check | Antes | Depois |
|---|---|---|
| Campos sem nome (`select`/`input`/`textarea`) | 106 em 16 páginas (28 em cada `/calculators`) | **0** |
| Campos nomeados só por `title` | 4 | **0** |
| Botões cujo `aria-label` não contém o texto visível | 334 (botão PT/EN em todas as páginas; «Account», «Fullscreen», «Add to compare» em PT) | **0** |
| Páginas com `<main>` e sem skip link | 326 de 327 | **0 de 327** |
| `role="dialog"` sem nome utilizável | 10 de 14 | **0 de 14** |
| Pares de tokens de contraste < 4,5:1 (`check-contrast`) | 26 de 98 | **0 de 98** |
| `font-size` < 12 px em `periodic-table.css` (`check-font-sizes`) | 127 (6 dentro das células) | **77** (6 dentro das células) |

### axe-core 4.10.2 (opcional, fora do repositório)

`node tools/a11y-axe.mjs --axe <pasta> --open-modal` — EN e PT, 1280 e 390 px.

| Regra | `/calculators` antes → depois | `/periodic-table` antes → depois |
|---|---|---|
| `select-name` | 1 → **0** | 0 → 0 |
| `aria-required-children` | 1 → **0** | 0 → 0 |
| `aria-dialog-name` | 0 → 0 | 1 → **0** |
| `label-content-name-mismatch` (botão PT/EN) | 1 → **0** | 1 → **0** |
| `label-content-name-mismatch` (células da tabela) | — | 60–63 → 60–63 (fica para o prompt 35, ver abaixo) |
| `color-contrast` | 0 → 0 | 109–122 → **0** (claro e escuro, modal aberto ou fechado) |

`/` (index): `label-content-name-mismatch` 1 → **0**; nenhuma outra violação.

## Detalhe (checagem estática)

| Check | Result |
|---|---|
| Pages checked | 334 |
| Form fields without a name | 0 on 0 pages |
| Fields named only by `title` | 0 |
| Buttons whose `aria-label` does not contain the visible text | 0 on 0 pages |
| Links with the same mismatch (reported, not failed) | 49 |
| Pages with `<main>` and no skip link | 0 of 327 |
| `role="dialog"` without a usable name | 0 of 14 |

### calculators.html

- Fields without a name: 0
- Named by `title` only: 0
- Name ≠ visible text: 0
- Skip link: yes (#main-content)
- Dialogs: none

### calculators.pt.html

- Fields without a name: 0
- Named by `title` only: 0
- Name ≠ visible text: 0
- Skip link: yes (#main-content)
- Dialogs: none

### periodic-table.html

- Fields without a name: 0
- Named by `title` only: 0
- Name ≠ visible text: 0
- Skip link: yes (#main-content)
- Dialogs: #modal ok

### periodic-table.pt.html

- Fields without a name: 0
- Named by `title` only: 0
- Name ≠ visible text: 0
- Skip link: yes (#main-content)
- Dialogs: #modal ok

### Links com nome ≠ texto visível (relatados, não reprovam)

| aria-label | Visible text | Pages |
|---|---|---|
| Account | conta | 21 |
| Follow Atomurus on X (Twitter), @atomurusapp | x / twitter | 9 |
| Siga o Atomurus no X (Twitter), @atomurusapp | x / twitter | 9 |
| Open the interactive isotopes explorer on Atomurus to browse the stable and radioactive isotopes of every element, with half-lives and abundances | explore isotopes → | 1 |
| Abrir o explorador interativo de isótopos do Atomurus para navegar pelos isótopos estáveis e radioativos de cada elemento, com meias-vidas e abundâncias | explorar isótopos → | 1 |
| Open the interactive isotopes explorer on Atomurus to see stable and radioactive isotopes, their half-lives and decay modes | explore isotopes → | 1 |
| Abrir o explorador interativo de isótopos do Atomurus para ver isótopos estáveis e radioativos, suas meias-vidas e modos de decaimento | explorar isótopos → | 1 |
| Open the interactive periodic table on Atomurus — click any of the 118 chemical elements to see its atomic number, atomic mass, electron configuration, group, period and properties | view interactive table → | 1 |
| Open the interactive periodic trends tool: see how atomic radius, ionisation energy and electronegativity vary across periods and down groups | open trends → | 1 |
| Open the interactive periodic table to see metals, metalloids and non-metals and click any element | open interactive table → | 1 |
| Abrir a tabela periódica interativa do Atomurus — clique em qualquer um dos 118 elementos químicos para ver seu número atômico, massa atômica, configuração eletrônica, grupo, período e propriedades | ver tabela interativa → | 1 |
| Abrir a ferramenta interativa de tendências periódicas: veja como o raio atômico, a energia de ionização e a eletronegatividade variam ao longo dos períodos e dos grupos | abrir tendências → | 1 |
| Abrir a tabela periódica interativa para ver metais, semimetais e ametais e clicar em qualquer elemento | abrir tabela interativa → | 1 |

Pages with `<main>` and no skip link: 0.

## Teclado (e2e/a11y-keyboard.spec.js)

- Modal do elemento: Enter na célula abre; o foco vai para o botão fechar; 40 × Tab e 6 × Shift+Tab ficam dentro do `#modal`; Esc fecha; o foco volta à célula. Clique no fundo também fecha e devolve o foco. Fechado, o overlay é `aria-hidden="true"` e `inert`.
- Botão de idioma: «PT — Switch language» → depois de trocar, «EN — Trocar idioma»; um `I18N.apply()` posterior não desfaz o nome.
- Skip link em `/`, `/periodic-table`, `/calculators` (EN) e `/calculators.pt.html`: Tab mostra «Skip to content» / «Pular para o conteúdo», Enter leva o foco ao `<main>`.

## Exceções documentadas

- **Skip link**: as 7 páginas `isomerism/*/*.pt.html` não têm `<main>` (são geradas por `tools/generate-isomerism-pt-variants.js` com outra estrutura) e ficam sem skip link. `/app` usa o seu próprio `#ws-skip`.
- **Fonte < 12 px dentro das células da tabela** (`.el-z`, `.el-shells`, `.el-mass`, `.el-name`, `.el-state`, `.el-ph`): a grade tem 18 colunas; cada célula tem ≈ 52–60 px de largura no desktop e, no celular, a grade rola dentro da própria moldura. Com 12 px, o nome («Molybdenum»), a massa com 3 casas e a distribuição eletrônica («2·8·18·32·18·8·2») não cabem; o símbolo continua ≥ 17 px e cada célula tem o `aria-label` completo (número, nome, massa, categoria). Contraste dessas legendas agora ≥ 4,5:1.
- **Os outros 71 `font-size` < 12 px de `periodic-table.css`** são da barra lateral antiga (`.nav-*`, `.user-*`, oculta pelo chrome público), selos e rótulos em caixa alta (`.cmp-*`, `.iso-badge`, `.trend-*`, `.app-tag`) das páginas de comparação, isótopos e tendências, e `sup`/`sub` de notação. Ficam para o prompt 35.

## Pendências para o prompt 35

1. **Células da tabela × `label-content-name-mismatch`** (60–63 por página, regra experimental do axe): o `aria-label` da célula é mais rico que o texto visível, que é uma colagem de abreviações (número, camadas, símbolo, massa, nome cortado). Opções: começar o `aria-label` pelo símbolo e nome («Fe, Iron, …»), ou marcar as legendas de canto com `aria-hidden`. O prompt pediu para não mexer no `aria-label` das células.
2. **Links com nome ≠ texto** (49): o chip «Conta» nas 21 páginas PT geradas (aria-label estático «Account»), «X / Twitter» nos 18 artigos do Explore, e 10 chamadas «→» dos artigos.
3. **`region` e `landmark-unique`** (axe, moderado): logotipo, busca e chip da conta fora de landmarks; na `/calculators`, `#ws-sidebar` repete o papel e o nome de outro landmark.
4. **Rótulos ARIA em inglês fixos na `/calculators`** sem `data-i18n-attr` (ex.: «Calculator mode», «Keypad groups», «Unit converter presets»): nas páginas PT eles são traduzidos à mão, mas o build regenera a página PT a partir da EN e volta a deixá-los em inglês (ver abaixo).
5. **Fontes < 12 px fora da tabela**: `atomurus-lab-console.css` (189), `assets/app-workspace.css` (32), `explore-article.css` (22), `assets/critical-lab.css` (15), `assets/public-shell.css` (12).
6. **Páginas de elemento** (244 arquivos): não foram editadas à mão; receberam só o skip link e o nome do botão de idioma pela passada automática.

## Achados fora do escopo (registrados)

- **O build reverte texto PT revisado à mão.** `build-i18n.js` regenera as 21 páginas `.pt.html` principais a partir da EN e só traduz `data-i18n` de texto simples. Conteúdo traduzido à mão sem chave (ex.: o passo a passo da massa molar, os `aria-label` das fileiras de exemplos) e `data-i18n-html` voltam ao inglês no deploy. Este prompt passou a traduzir também `aria-label`/`title`/`placeholder`/`alt`/`label` com `data-i18n-attr`; o resto precisa de chaves no dicionário ou de tirar a página da lista de geração.
- **Modal em inglês mostra «Antiguidade»** no ano de descoberta do ferro (dado do elemento sem tradução).
- **`periodic-table.html`, seletor de idioma**: o texto de reserva da opção «English» está com a codificação quebrada (`ðŸ‡ºðŸ‡¸`); o i18n.js troca em tempo de execução.

## Passos manuais do dono

1. Testar `/calculators` e `/periodic-table` com NVDA ou VoiceOver.
2. Aprovar o antes/depois de contraste ([contraste.md](contraste.md)).
3. Decidir se `axe-core` entra como devDependency para rodar na CI.
