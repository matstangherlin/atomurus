# Lab virtual — mecânica dos guias, ANTES (prompt 20, A07)

Medido em `c55c359` (main), só com o motor (`assets/lab/virtual-lab.js` importado no Node, sem DOM):

```bash
node tools/lab-guide-audit.mjs
```

O script percorre os 11 guias de `CREATIONS` de três maneiras:

- **Correto** — cada passo como o plano manda (quantidades de `step.amounts`).
- **Sem cumprir o objetivo** — a ação de cada passo é feita, mas com 1 g / 1 mL em vez da quantidade pedida e lendo o volume quando o passo pede pH.
- **Bancada usada** — o béquer A ainda tem 60 mL de água + 10 g de NaCl e o erlenmeyer B tem a mistura do Desafio de pH (já medida). O guia é iniciado por cima disso.

Os números de passo são os que o painel mostraria («Passo N de M»); N = M + 1 significa que o painel já abre em «Prática concluída».

| Guia | Passos | Correto conclui? | Sem cumprir o objetivo conclui? | Para no passo | Bancada usada: abre no passo (sem limpar) | Ao iniciar o guia: abre no passo | Resíduo fica na bancada? | `learningObjectives` | Passos sem `why` |
|---|---|---|---|---|---|---|---|---|---|
| distillation | 8 | sim | sim | — | 1 | 1 | sim | sim | 1 |
| ethanol | 5 | sim | não | 2 | 2 | 2 | sim | sim | 1 |
| sugar | 5 | sim | sim | — | 1 | 1 | sim | sim | 3 |
| reflux | 7 | sim | sim | — | 1 | 1 | sim | sim | 4 |
| petroleum | 5 | sim | sim | — | 1 | 1 | sim | sim | 2 |
| solution | 4 | sim | sim | — | 5 | 5 | sim | sim | 1 |
| fragrance | 4 | sim | sim | — | 1 | 1 | sim | sim | 1 |
| diamond | 2 | sim | sim | — | 1 | 1 | sim | não | 1 |
| ph | 3 | sim | não | 2 | 4 | 4 | sim | não | 1 |
| crystal | 3 | sim | sim | — | 1 | 1 | sim | não | 2 |
| sunscreen | 4 | sim | sim | — | 1 | 1 | sim | não | 2 |

## Leitura

- **«Prática concluída» sem verificar o resultado:** 9 de 11 guias concluem com 1 g/1 mL no lugar das quantidades pedidas. O motor verifica só a *presença* de cada material (`need`), não a massa, o volume ou o pH; o passo «Meça o pH» aceita qualquer medição (inclusive de volume).
- **As duas exceções não são verificação de verdade:** no Desafio de pH o `checkPh` (prompt 07) barra o passo 2; na fermentação o guia *regride* para o passo 2 porque a fermentação consome todo o 1 g de sacarose e o passo «Adicione sacarose» deixa de ser verdadeiro (o progresso é recalculado a cada ação, não registrado).
- **Bancada suja contamina:** com a bancada usada, «Preparar uma solução» abre já em «Prática concluída» (passo 5 de 4) e o Desafio de pH também (4 de 3). Nenhum guia oferece limpar a bancada; o resíduo continua lá.
- **Passos de equipamento pré-cumpridos:** toda sessão nasce com béquer A, erlenmeyer B e proveta C. Por isso «Coloque um béquer» (solução) e «Coloque um erlenmeyer» (fermentação) já aparecem feitos — isso é esperado e não muda.
- **`learningObjectives` ausentes:** diamante, pH, cristais e protetor solar.
- **Passos sem `why`:** 18 no total; a dica 1 desses passos é só o verbo da ação («Adicione o material para avançar neste passo»), que repete o enunciado.

## Outros achados reproduzidos (fora da tabela)

| Achado | Reprodução no motor | Resultado antes |
|---|---|---|
| Chips «+ Água 50 mL» passam do limite | béquer 250 mL; `addToContainer(…, 'water', 50)` × 6 | o 6º clique é **recusado inteiro** (`reason: 'full'`) em vez de completar até 250 mL; com 230 mL no béquer, +50 mL também é recusado |
| «+ Beaker» sem limite | `addVessel(session, 'beaker')` × 9 | 9 béqueres criados sem pergunta; o teto é `MAX_VESSELS = 120` |
| Citrus accord com volume 0 | `addReady(session, 'accord_ready', 'beaker-a')` | 18 g de material, **0 mL** (as notas de fragrância não têm `state`, então nenhuma conta como líquido) |
| Densidade 1 g/mL para tudo | `containerMass` soma mL e g | 20 mL água + 15 mL óleo + 8 g ZnO = 43 «g» (óleo vegetal ≈ 0,91 g/mL dá ≈ 41,7 g) |
| Fermentação | `ferment` com sacarose | equação mostrada é a da **glicose** (C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂); 15 g de sacarose viram «7,7 mL» (fator 0,51 da glicose, e em mL em vez de g) |
| Cristais | `crystallise` com 20 g de sacarose em 60 mL a 70 °C | «a solução ficou supersaturada» depois de evaporar só 27 mL (20 g em 33 mL ≈ 60 g/100 mL, longe de ≈ 200 g/100 mL) |
| Protetor solar | guia `sunscreen` | água + óleo + ZnO viram «emulsão» sem emulsificante e sem explicação |
| Destilação | `distill` | um clique faz tudo; pureza fixa ≈ 95 % (5/95 de água arrastada), sem perfil de temperatura |
| Busca «HCl 1 mol/L 100 mL» | `searchCatalog('HCl 1 mol/L 100 mL')` | «not available in the current Lab catalog»; não existe ácido diluído nem aviso de segurança |

## Procedimento manual (DOM)

O motor cobre a lógica; o painel foi conferido no navegador (Playwright + `node tools/e2e-serve.mjs`, PT, usuário free) em `/app?section=lab&mode=bench`:

1. Selecionar o béquer A, abrir «Materiais», adicionar 50 mL de água e 10 g de NaCl.
2. Pesquisar «preparar uma solução» na barra do Lab (inicia o guia).
3. Resultado antes: o painel abre em **«Passo 3 de 4 — Adicione 10 g de cloreto de sódio e agite.»**, sem pergunta sobre a bancada; os passos «Coloque um béquer» e «Adicione 60 mL de água» aparecem feitos com 50 mL (quantidade errada). Se o béquer já tivesse sido agitado, abriria em «Prática concluída» (linha *solution* da tabela).
