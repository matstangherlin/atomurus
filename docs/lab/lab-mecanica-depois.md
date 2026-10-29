# Lab virtual — mecânica dos guias, DEPOIS (prompt 20, A07)

Mesmo harness do «antes» ([lab-mecanica-antes.md](lab-mecanica-antes.md)), agora com a API nova (`startGuide`, `confirmObserved`). O script mede as duas versões:

```bash
node tools/lab-guide-audit.mjs                                   # este branch
git show main:assets/lab/virtual-lab.js > /tmp/lab-main.js
node tools/lab-guide-audit.mjs --engine /tmp/lab-main.js         # a main, para comparar
```

## Motor (Node)

| Guia | Passos | Correto conclui? | Sem cumprir o objetivo conclui? | Para no passo | Bancada usada, sem limpar: abre no passo | Bancada usada, opção padrão: abre no passo | Resíduo fica na bancada? | `learningObjectives` | Passos sem `why` |
|---|---|---|---|---|---|---|---|---|---|
| distillation | 8 | sim | não | 5 | 1 | 1 | não | sim | 0 |
| ethanol | 5 | sim | não | 2 | 2 | 2 | não | sim | 0 |
| sugar | 5 | sim | não | 1 | 1 | 1 | não | sim | 0 |
| reflux | 7 | sim | não | 4 | 1 | 1 | não | sim | 0 |
| petroleum | 5 | sim | não | 2 | 1 | 1 | não | sim | 0 |
| solution | 4 | sim | não | 2 | 4 | 2 | não | sim | 0 |
| fragrance | 4 | sim | não | 1 | 1 | 1 | não | sim | 0 |
| diamond | 2 | sim | não | 1 | 1 | 1 | não | sim | 0 |
| ph | 3 | sim | não | 1 | 3 | 1 | não | sim | 0 |
| crystal | 3 | sim | não | 1 | 1 | 1 | não | sim | 0 |
| sunscreen | 4 | sim | não | 1 | 1 | 1 | não | sim | 0 |

- **Sem cumprir o objetivo, nenhum guia conclui** (antes: 9 de 11 concluíam). Cada um para no primeiro passo com quantidade errada e mostra o porquê (ex.: «Esperado: 55–65 mL de água; este recipiente tem 1 mL.»).
- **Bancada usada:** a opção padrão do diálogo limpa a bancada; o guia abre no passo 1 (ou 2, quando o passo 1 é «coloque um béquer», que a bancada nova já tem). Com «Continuar mesmo assim» o resíduo pode contar (solução abre no passo 4, pH no 3) e o painel avisa «Iniciado numa bancada usada».
- **Antes**, «Preparar uma solução» e o «Desafio de pH» abriam já concluídos numa bancada usada (5/4 e 4/3). Agora a leitura antiga não vale: o último passo exige uma medição feita *depois* do início do guia.
- **`learningObjectives` nos 11 guias; todos os 50 passos têm `why`.**

## Navegador (Playwright, PT e EN)

Cada guia aberto por `/app?section=lab&mode=guided&creation=<id>`, usuário free, clicando **só** nos botões do painel do passo (e em «Observei» quando o passo espera). É o teste «completes from its panel» de `e2e/lab-guides.spec.js`.

| Guia | EN | PT | Cliques (EN/PT) | Erros de página |
|---|---|---|---|---|
| distillation | concluída | concluída | 10/10 | 0 |
| ethanol | concluída | concluída | 5/5 | 0 |
| sugar | concluída | concluída | 6/6 | 0 |
| reflux | concluída | concluída | 8/8 | 0 |
| petroleum | concluída | concluída | 10/10 | 0 |
| solution | concluída | concluída | 4/4 | 0 |
| fragrance | concluída | concluída | 4/4 | 0 |
| diamond | concluída | concluída | 3/3 | 0 |
| ph | concluída | concluída | 5/5 | 0 |
| crystal | concluída | concluída | 5/5 | 0 |
| sunscreen | concluída | concluída | 5/5 | 0 |

Na `main` o guia «Refinar açúcar» parava no passo 3 por esse caminho: colocar o funil o deixa selecionado e «Encaixar funil e filtrar» tentava filtrar o próprio funil. Corrigido (o botão do guia filtra o recipiente com o caldo, e «Aquecer»/«Evaporar» miram o filtrado).

## Critérios do prompt × evidência

| Critério | Evidência |
|---|---|
| 1. Completar os passos sem cumprir o objetivo não conclui; há feedback | tabela acima (coluna «Sem cumprir o objetivo»); `tools/test-lab-mechanics.mjs` («each of the guides explains the first wrong amount») |
| 2. Bancada suja → confirmação; padrão limpa; Desfazer restaura | `e2e/lab-guides.spec.js` (1º e 2º testes); `startGuide`/`cleanBench` no teste unitário |
| 3. «+ Água 50 mL» × 5 para em 250 mL com mensagem | e2e «water chips stop at the beaker capacity»; unitário «Capacity» (230 mL + 50 mL → completa até 250 mL) |
| 4. 7º béquer pede confirmação; `MAX_VESSELS` = 120 | e2e e unitário «Soft limit» |
| 5. Citrus accord ≠ 0 mL; fermentação com sacarose e rendimento; cristais não «saturado» | unitário «Density and volume» e «Guides that taught something wrong» |
| 6. `learningObjectives` nos 11; `why` em todos os passos | tabela acima; unitário «Every step explains itself» |
| 7. Testes novos; `test:ux`, `test:lab-access`, `test:pro-lab`, `validate` | ver resposta final do prompt 20 |
| 8. PT/EN em sincronia | todas as strings novas passam por `copy(en, pt)`/`line(…)` ou objetos `{ en, pt }`; o unitário exige `en` e `pt` em `why`, `feedback`, `errors` e `explain` |

## Cálculos mostrados nos guias

**Fermentação (sacarose).** C₁₂H₂₂O₁₁ + H₂O → 2 C₆H₁₂O₆ → 4 C₂H₅OH + 4 CO₂. O guia põe 25 g de sacarose; um clique em «Fermentar» consome 60 % (15 g).

- n(sacarose) = 15 g ÷ 342,30 g/mol = 0,04382 mol
- etanol = 4 × 0,04382 mol × 46,07 g/mol = **8,08 g** → ÷ 0,789 g/mL = **10,2 mL**
- CO₂ = 4 × 0,04382 × 44,01 = **7,71 g** (sai como gás)
- água da hidrólise = 0,04382 × 18,02 = 0,79 g
- balanço: 15 + 0,79 = 15,79 g = 8,08 + 7,71 g ✔

O prompt citava «≈ 7,9 g»; a conta dá 8,1 g (7,7 g seria o valor com glicose: 15 ÷ 180,16 × 2 × 46,07). Ficou o valor calculado.

**Cristais.** Solubilidade da sacarose ≈ 200 g por 100 mL de água a 20 °C (CRC: 203,9 g/100 g de água). 60 mL dissolvem ≈ 120 g, então 20 g em 60 mL é solução concentrada, não saturada. «Evaporar» agora retira água até *passar* da saturação (fica com 90 % da água que dissolveria o açúcar a 20 °C) antes de dizer que há cristais: 20 g → ficam 9 mL de água.

**Destilação.** Pureza do destilado ≈ 92 % em volume (8 mL de água arrastada a cada 92 mL de etanol), dentro da faixa 90–93 % pedida; azeótropo citado como ≈ 95,6 % de etanol em massa. Perfil de temperatura da cabeça desenhado em SVG simples: 22 °C → 78 °C (patamar enquanto o etanol passa) → sobe para 100 °C quando ele acaba (tracejado).

**HCl 1 mol/L.** Solução preparada, densidade ≈ 1,016 g/mL (≈ 3,6 % m/m, CRC); pH pelo ramo de ácido forte que o modelo já tinha (10 mL → pH 0; + 90 mL de água → pH 1).

## Pendências para revisão docente

- Quantidades e textos novos dos guias de fermentação, cristais e destilação (passos manuais do dono).
- A pureza de 92 % para uma destilação simples de 40 % v/v é a meta da auditoria; a composição real do primeiro destilado depende do equilíbrio líquido–vapor e pode ser menor. Confirmar com o professor.
- Densidades de limoneno (0,84) e linalol (0,86) estão marcadas `densityEstimate: true`; frações de petróleo, caldo de cana e indicador continuam com 1 g/mL («densidade não verificada»).
- O caldo de cana não tem teor de sacarose citado; a fermentação e a cristalização dele seguem conceituais (dito no caderno).
