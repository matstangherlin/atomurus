# Contraste — antes → depois (prompt 23)

> **Aprovação do dono:** estas mudanças alteram levemente a aparência (texto terciário um pouco mais escuro no tema claro e mais claro no escuro; número, camadas, massa e nome dentro das células da tabela mais nítidos). Aprove este antes/depois antes de publicar. Para reverter só o contraste: `git revert` do commit «a11y(contrast)».

Medido por `node tools/check-contrast.mjs` (razão WCAG 2.x, sem dependências), que lê os tokens direto dos CSS nos temas claro (`:root`) e escuro (`[data-theme="dark"]`). Mínimo: 4,5:1 para texto normal (todo o texto abaixo é pequeno).

## O que mudou

- `periodic-table.css`: `--text-3` (texto terciário) — só a luminosidade, mesmo matiz e saturação, até o mínimo de 4,5:1 no fundo mais exigente.
- `periodic-table.css`: novo token `--el-meta-opacity` (claro .82, escuro .88) para o texto pequeno dentro das células (número atômico, camadas, massa, nome, estado). Antes cada um tinha a sua opacidade (.58 nas camadas, .65–.75 nos outros). A cor de cada categoria (`--c-*-t` sobre `--c-*`) **não mudou**; só quanto dela aparece. O valor é o menor que passa em todas as categorias (claro: gases nobres pedem .81; escuro: metais alcalinos pedem .87).
- `atomurus-lab-console.css`: `.el-z` e `.el-name` usam o mesmo token (eram .65), com `.82` de reserva.

Não mudou: cores de marca (`--accent`, `--lc-green`), paleta das categorias de elementos, fundos, `--text-1`, `--text-2` (já passava: ≥ 6,3:1 no claro, ≥ 5,35:1 no escuro) e os tokens do lab console (`--lc-ink-*`, já ajustados em 2026-05).

## Pares alterados

O «antes» das células usa .58 (a opacidade mais fraca, `.el-shells`).

| Tema | Token (texto) | Fundo | Antes | Depois | Razão antes | Razão depois |
|---|---|---|---|---|---|---|
| claro | `--text-3` | `--bg` #F0EDE6 | #9A948C | #716B64 | 2.57:1 | 4.50:1 |
| claro | `--text-3` | `--surface` #FDFBF9 | #9A948C | #716B64 | 2.92:1 | 5.11:1 |
| claro | `--text-3` | `--surface-2` #F6F3EE | #9A948C | #716B64 | 2.71:1 | 4.75:1 |
| claro | `--c-nonmetal-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-nonmetal` #C8EBC8 | #1A4E1A × .58 | #1A4E1A × 0.82 | 2.84:1 | 4.89:1 |
| claro | `--c-noble-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-noble` #FFF0B0 | #6A4800 × .58 | #6A4800 × 0.82 | 2.75:1 | 4.67:1 |
| claro | `--c-alkali-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-alkali` #FFCACA | #7A1010 × .58 | #7A1010 × 0.82 | 3.12:1 | 5.36:1 |
| claro | `--c-alkaline-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-alkaline` #FFE0B0 | #6A3800 × .58 | #6A3800 × 0.82 | 2.86:1 | 4.93:1 |
| claro | `--c-metalloid-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-metalloid` #DDD8FF | #2E1E78 × .58 | #2E1E78 × 0.82 | 3.35:1 | 6.27:1 |
| claro | `--c-polyatomic-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-polyatomic` #C8E8F8 | #0C4060 × .58 | #0C4060 × 0.82 | 3.03:1 | 5.43:1 |
| claro | `--c-posttrans-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-posttrans` #D8EACC | #284A0A × .58 | #284A0A × 0.82 | 2.91:1 | 5.11:1 |
| claro | `--c-transition-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-transition` #E4E0D4 | #38321C × .58 | #38321C × 0.82 | 3.21:1 | 5.98:1 |
| claro | `--c-lanthanide-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-lanthanide` #F0D4E8 | #5C004A × .58 | #5C004A × 0.82 | 3.65:1 | 6.79:1 |
| claro | `--c-actinide-t` a .58 → 0.82 (número, camadas, massa, nome) | `--c-actinide` #ECD0DA | #5E1228 × .58 | #5E1228 × 0.82 | 3.35:1 | 6.13:1 |
| escuro | `--text-3` | `--bg` #0E0D0C | #52504A | #838076 | 2.41:1 | 4.91:1 |
| escuro | `--text-3` | `--surface` #151412 | #52504A | #838076 | 2.29:1 | 4.67:1 |
| escuro | `--text-3` | `--surface-2` #191816 | #52504A | #838076 | 2.21:1 | 4.51:1 |
| escuro | `--c-nonmetal-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-nonmetal` #162A16 | #72C072 × .58 | #72C072 × 0.88 | 3.30:1 | 5.68:1 |
| escuro | `--c-noble-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-noble` #28220A | #C8A028 × .58 | #C8A028 × 0.88 | 3.11:1 | 5.31:1 |
| escuro | `--c-alkali-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-alkali` #280C0C | #D87070 × .58 | #D87070 × 0.88 | 2.71:1 | 4.64:1 |
| escuro | `--c-alkaline-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-alkaline` #281800 | #D8A050 × .58 | #D8A050 × 0.88 | 3.38:1 | 6.04:1 |
| escuro | `--c-metalloid-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-metalloid` #140E28 | #9E90E8 × .58 | #9E90E8 × 0.88 | 3.06:1 | 5.49:1 |
| escuro | `--c-polyatomic-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-polyatomic` #081A28 | #60B8E0 × .58 | #60B8E0 × 0.88 | 3.52:1 | 6.42:1 |
| escuro | `--c-posttrans-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-posttrans` #101C0A | #7EC060 × .58 | #7EC060 × 0.88 | 3.56:1 | 6.51:1 |
| escuro | `--c-transition-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-transition` #1C1A14 | #A8A080 × .58 | #A8A080 × 0.88 | 3.10:1 | 5.43:1 |
| escuro | `--c-lanthanide-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-lanthanide` #22081C | #C87CB8 × .58 | #C87CB8 × 0.88 | 2.89:1 | 5.11:1 |
| escuro | `--c-actinide-t` a .58 → 0.88 (número, camadas, massa, nome) | `--c-actinide` #220A10 | #C87888 × .58 | #C87888 × 0.88 | 2.74:1 | 4.75:1 |

Todos os pares alterados ficam ≥ 4,5:1 nos dois temas. `node tools/check-contrast.mjs`: 98/98 pares passam (antes: 72/98).

## axe (opcional, fora do repositório)

`color-contrast` na `/periodic-table` (EN e PT, 1280 px e 390 px): 109–120 nós → **0**, nos temas claro e escuro.

## Observação

Na página publicada, `atomurus-lab-console.css` (carregado depois, de forma assíncrona) já sobrescrevia `--text-3` com `#5F5953` / `#B8B2AA`. Os 2,57–2,75:1 da auditoria vêm do `--text-3` de `periodic-table.css`, que vale até esse arquivo carregar e nas páginas que não o carregam; agora os dois passam.
