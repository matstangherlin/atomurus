# Equívocos comuns e recapitulação — rascunhos para revisão docente (prompt 28)

Tudo o que está listado aqui é **rascunho**: foi escrito a partir de afirmações que **já estavam no
próprio artigo** (nenhum fato novo), mas precisa da leitura de um professor antes de ser
considerado revisado. A estrutura é conferida por `node tools/test-articles-structure.mjs`
(`npm run test:articles`): as duas seções existem nos 8 artigos × 2 idiomas, a numeração `§` é
sequencial, a recapitulação é a última seção antes da conclusão e as âncoras existem.

## «Equívocos comuns» novos (2 por artigo, PT e EN, ≤ 70 palavras cada)

| Artigo | Equívoco | De onde vem a correção (no próprio artigo) | Seção |
|---|---|---|---|
| `what-is-isomerism` | «Isômeros têm as mesmas propriedades, porque têm a mesma fórmula.» | etanol × éter dimetílico (C₂H₆O); cis/trans-2-buteno com propriedades diferentes; mesma fórmula ⇒ mesma massa molar | § 08 (a antiga § 08, perguntas frequentes, virou § 09) |
| `what-is-isomerism` | «Isomeria é só trocar um grupo de posição.» | 1-propanol × 2-propanol; isomeria de cadeia e de função; estereoisomeria com conectividade idêntica | § 08 |
| `what-is-the-periodic-table` | «A tabela é ordenada pela massa atômica.» | ordem por número atômico; Newlands ordenava por massa; Moseley (1913). O exemplo telúrio (Z = 52, 127,6 u) antes do iodo (Z = 53, 126,90 u) vem dos **dados da própria tabela do site** (`elements-data.js`) | § 12 (perguntas frequentes virou § 13) |
| `what-is-the-periodic-table` | «Todo elemento de um grupo reage exatamente do mesmo jeito.» | mesmo número de elétrons de valência ⇒ reações parecidas; sódio e potássio com a água; raio cresce e energia de ionização cai descendo o grupo | § 12 |
| `bhopal-disaster` | «Foi um acidente inevitável, ou o erro de uma pessoa só.» | § 06 do artigo: «não foi um acidente "natural"», cadeia de falhas, refrigeração desligada, lavador de gases e torre de queima fora de operação, cortes de equipe e manutenção | § 10 |
| `bhopal-disaster` | «Água só dilui um produto químico; não pode piorar um vazamento.» | § 02 do artigo: MIC + água é exotérmica, reação descontrolada, calor vaporizou mais MIC e aumentou a pressão | § 10 |

**Bhopal (tema sensível):** as duas correções repetem o que o artigo já afirma, sem números, nomes
ou responsabilidades novas. Se a revisão preferir não ter a seção nesse artigo, basta retirá-la e
acrescentar `bhopal-disaster` a uma lista de exceções no teste — a decisão é do dono/professor.

## «O que você precisa lembrar» / «Key takeaways» (os 8 artigos)

3–5 itens por artigo, cada um parafraseando uma afirmação do próprio artigo, inseridos antes do
bloco final de conclusão (`art-callout`) como a última seção numerada:

| Artigo | Itens | Seção |
|---|---:|---|
| `what-is-an-atom` | 5 | § 12 |
| `what-are-isotopes` | 5 | § 11 |
| `what-is-chemical-bonding` | 5 | § 13 |
| `what-is-radioactivity` | 5 | § 13 |
| `chernobyl-disaster` | 5 | § 13 |
| `what-is-isomerism` | 5 | § 10 |
| `what-is-the-periodic-table` | 5 | § 14 |
| `bhopal-disaster` | 5 | § 11 |

O sumário lateral dos artigos é montado no navegador a partir dos `<h2>` (`initArticle`), então as
seções novas aparecem nele sem mudança de código; nenhum link do site apontava para as âncoras
`#sec-N` renumeradas.

## Para o revisor

1. Ler as seções novas em PT e EN lado a lado (paridade conferida pelo teste: mesma quantidade de
   itens e razão de palavras PT/EN entre 0,9 e 1,3).
2. Conferir se a escolha dos equívocos é a mais útil para a turma.
3. Registrar a revisão (quem e quando) — o prompt 13 cuida dos campos de autor/revisor/data.
