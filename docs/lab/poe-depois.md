# POE no Lab — depois (prompt 27)

Cinco guias têm um exercício POE (escolha em [`poe-antes.md`](poe-antes.md)). Em cada um, a
alternativa que conta como certa é a que **a simulação produz**: `measure()` lê o recipiente no
momento da previsão e de novo quando o passo observado termina, e `expected(depois, antes)` devolve
a alternativa. Se o motor mudar, a resposta muda junto.

## Valores simulados

Gerado por `node tools/test-lab-poe.mjs --report` (guias percorridos só pelo motor, passos feitos
como o plano manda):

| Guia | Pergunta (PT) | Antes da previsão → depois do passo (simulado) | Alternativa que a simulação dá |
|---|---|---|---|
| `distillation` | A cerca de 80 °C, o que vai se juntar no balão coletor? | 24 mL de etanol + 2,1 mL de água ≈ 92% de etanol em volume | Quase só etanol, com um pouco de água |
| `ethanol` | A levedura está aquecida e tem açúcar. O que acontece no frasco durante a fermentação? | sacarose 25 → 10 g, etanol 0 → 10,2 mL | Formam-se bolhas e parte do açúcar vira etanol |
| `reflux` | A mistura vai ferver por 10 minutos com o condensador na vertical e sem coletor. O que acontece com o volume no balão? | 80 mL → 80 mL | Fica praticamente igual |
| `ph` | Você vai adicionar bicarbonato à solução de ácido cítrico. O que acontece com o pH? | pH 1,7 → 7 | Sobe, em direção a 7 |
| `crystal` | Você vai aquecer 20 g de sacarose dissolvidos em 60 mL de água. Vão aparecer cristais? | 20 g de sacarose em 60 mL de água a 45 °C, sem cristais | Não: tudo continua dissolvido |

No navegador o passo de aquecimento do guia «Crescimento de cristal» oferece «Aquecer +20 °C», então
a leitura fica em cerca de 42 °C (o andador do motor usa 45 °C); a resposta é a mesma.

## Onde o cartão aparece

| Guia | Previsão antes do passo | Comparação depois de |
|---|---|---|
| `ph` | `base` (adicionar bicarbonato) | `measure` (leitura do pH) |
| `ethanol` | `brew` (fermentar) | `brew` |
| `crystal` | `heat` (aquecer) | `observe` («Observei») |
| `distillation` | `run` (destilar) | `run` («Observei») |
| `reflux` | `hold` (refluxar) | `hold` |

## Comportamento

- **Opcional e sem nota:** «Pular» sempre presente; as ações do passo continuam disponíveis abaixo
  do cartão — agir antes de prever só deixa o exercício sem resposta (estado `missed`).
- **Explicação também no acerto:** `POE_EXPLAIN_ON_CORRECT = true` (decisão do dono, constante em
  `assets/lab/virtual-lab.js`).
- **Privacidade:** a previsão fica em `session.poe`, dentro da bancada já salva em
  `atomurus-lab-v1` (chave registrada em `src/core/storage/storage-policy.js`, só local). Nenhum
  evento de analytics; o e2e confere que nenhuma requisição que não seja GET sai durante o fluxo.
- **Acessibilidade:** alternativas em `role="radiogroup"` (setas escolhem, Espaço marca, Enter
  confirma); o foco vai ao cartão quando ele abre; a comparação é anunciada numa região
  `aria-live="polite"` que sobrevive às re-renderizações do guia; teclas dentro do cartão não chegam
  aos atalhos da bancada (setas movem vidraria, Delete remove, Espaço arrasta).

## Resumo da sessão

No fim do guia, se houve previsão: «Sua previsão bateu com o resultado» (ou «Suas previsões: N de M
batem com o resultado. Veja onde pensar de novo.»), a lista «Você previu · Aconteceu» e o botão
**Copiar resumo**, que põe na área de transferência um texto simples (título do guia, pergunta,
previsto, acontecido com os valores simulados, ideia-chave e a contagem) para o caderno ou o AVA.
Nada é enviado; uma previsão pulada não entra no resumo.

## Acessibilidade conferida

axe-core 4.x (só na pasta temporária, sem entrar no `package.json`) sobre o painel do guia com o
cartão de previsão aberto e depois com a comparação e o resumo: **0 violações** WCAG 2 A/AA, nos
temas claro e escuro.

## Testes

| Teste | O que cobre |
|---|---|
| `tools/test-virtual-lab.mjs` | mecanismo num exercício sintético; os 11 guias percorrem os mesmos passos com e sem POE (prever, pular, ignorar) |
| `tools/test-lab-poe.mjs` (em `test:ux`) | forma do conteúdo (PT/EN, ≤ 60 palavras, «Não tenho certeza»), cada guia percorrido com cada alternativa, valores químicos, `expected()` em estados alternativos |
| `e2e/lab-poe.spec.js` (`npm run test:lab-poe`) | teclado, mouse, pular, agir antes de prever, atalhos bloqueados, os 5 guias × PT/EN × prever/pular, resumo e «Copiar resumo» (sem requisições) |
