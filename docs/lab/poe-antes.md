# POE no Lab — linha de base (prompt 27, commit 1)

**POE = Predizer · Observar · Explicar.** Antes do passo em que algo observável acontece, o aluno
escolhe o que espera; depois do resultado, o Lab mostra «o que você previu × o que aconteceu» e uma
explicação curta. Só serve para POE o que o motor **simula de verdade** e de forma estável: se o
resultado «certo» não sai da simulação, a pergunta ensinaria algo que a tela não mostra.

## Como foi medido

Cada um dos 11 guias foi percorrido só pelo motor (`assets/lab/virtual-lab.js`, sem DOM), com o
mesmo andador do `tools/lab-guide-audit.mjs` (os passos feitos como o plano manda). Depois de cada
passo foram lidos volume, temperatura, pH, conteúdo, `crystals`, `fizz`, `refluxMin` e o produto
nomeado de cada recipiente. Valores abaixo são os da simulação (virtual).

## O que cada guia mostra

| Guia | O que é observável e confiável no motor atual | Serve para POE? |
|---|---|---|
| `distillation` | Depois de destilar a 80 °C, o coletor recebe 24 mL de etanol + 2,1 mL de água (≈ 92 % em volume) e o balão fica com 57,9 mL de água + 16 mL de etanol. O motor nunca passa do azeótropo. | **Sim** — «sai etanol puro?» é um equívoco clássico, e a resposta vem do coletor. |
| `ethanol` | Ao fermentar a 28 °C, a sacarose cai de 25 g para 10 g, aparecem 10,2 mL de etanol e `fizz` (CO₂). Acima de 40 °C o motor recusa. | **Sim** — o açúcar «some»? A simulação mostra que ele vira etanol + CO₂. |
| `sugar` | O filtro retém a fibra (8 g no funil) e deixa passar o caldo; ao evaporar a 70 °C o volume cai de 90 para 49,5 mL e surgem cristais. | Possível (onde vai o açúcar no filtro) — fica para uma segunda leva. |
| `reflux` | Com o condensador em pé e sem coletor, 10 min a 80 °C mantêm o volume: 80 mL → 80 mL (`refluxMin` = 10). | **Sim** — «ferver faz o volume cair» é o equívoco; o motor segura o volume. |
| `petroleum` | Só a fração leve passa a 70 °C (18 mL no coletor; a média fica toda no balão). | Possível, mas o guia é conceitual (frações virtuais); deixado de fora. |
| `solution` | 10 g de NaCl em 60 mL: produto «solução salina», **volume continua 60 mL**. Na realidade o volume sobe um pouco (≈ 3 mL). | **Não** — perguntar sobre o volume ensinaria a simplificação do motor. |
| `fragrance` | Só o nome da família olfativa muda; nada evolui com o tempo (evaporação das notas não é simulada). | **Não** — não há resultado a observar. |
| `diamond` | Conceitual: 10 g de carbono num béquer e uma ida à página de alótropos. Nada é simulado (pressão, temperatura). | **Não**. |
| `ph` | 6 g de ácido cítrico em 50 mL de água: pH **1,7**. Depois de 7,3 g de bicarbonato: pH **7,0** e efervescência (CO₂ sai, sistema aberto). Modelo do prompt 07/22. | **Sim** — direção do pH ao adicionar a base, lida do medidor. |
| `crystal` | 20 g de sacarose em 60 mL, aquecida a 45 °C: **nenhum cristal** (`crystals` = falso); o produto continua «solução de açúcar». O motor só cristaliza quando se evapora a água. | **Sim** — «aquecer faz cristalizar?» é o equívoco que o guia já quer derrubar (concentrada ≠ saturada). |
| `sunscreen` | O produto passa a «protetor solar»; a separação da emulsão sem emulsificante é dita no texto, mas **não é simulada**. | **Não** — o que o texto promete a tela não mostra. |

## Escolha: 5 guias

`ph`, `ethanol`, `crystal`, `distillation`, `reflux`.

- Os cinco têm um resultado numérico ou de estado que **o motor calcula** (pH, massa de açúcar,
  volume de etanol, pureza do destilado, volume do balão, presença de cristais), então a
  alternativa «certa» é decidida por uma função que lê a simulação, não por gabarito fixo.
- Cada um ataca um equívoco comum de ensino médio: a base «não muda» o pH; o açúcar «some» na
  fermentação; aquecer «faz cristalizar»; destilar «dá etanol puro»; ferver «sempre perde volume».
- Ficaram de fora `solution`, `fragrance`, `diamond` e `sunscreen` (o motor não sustenta a
  observação) e `sugar`/`petroleum` (sustentam, mas cinco já é o teto do prompt; ficam como
  candidatos — ver `docs/lab/poe-ideias.md`).

A lista final é decisão do dono/professor (revisão pedagógica).
