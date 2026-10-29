# Trilhas 2 e 3 — Soluções e Ácido-base; artigo «Equilíbrio químico» (prompt 33)

Infraestrutura, rascunho e passos de publicação: os mesmos do prompt 32
(`docs/content/trilha-estequiometria-fontes.md`). Tudo abaixo está em **rascunho**
(`noindex,nofollow`, faixa de rascunho, fora do `sitemap.xml` e dos menus, sem anúncios).

## O que existe

| Peça | Arquivos | Observação |
|---|---|---|
| Trilha **Soluções** | `content/trilhas/solucoes.json` → `trilhas/solucoes(.pt).html` | 7 etapas (≈ 125 min) + 1 extra opcional (Lab «crescimento de cristal», com POE) |
| Trilha **Ácido-base** | `content/trilhas/acido-base.json` → `trilhas/acido-base(.pt).html` | 8 etapas (≈ 125 min) + 2 extras opcionais (exercícios de tampão; artigo de equilíbrio) |
| Artigo «Soluções e concentração» | `explore/solutions-and-concentration(.pt).html` | 3 exemplos calculados (preparo, concentração, diluição) |
| Artigo «Ácidos, bases e pH» | `explore/acids-bases-and-ph(.pt).html` | 4 exemplos (ácido forte, base forte, ácido fraco, tampão); não havia artigo equivalente em `explore/` |
| Artigo «Equilíbrio químico» | `explore/chemical-equilibrium(.pt).html` | 3 exemplos (tabela de equilíbrio, Q × K, íon comum) |
| Ficha F4 «Preparando uma solução» | `content/fichas/F4.json` → `fichas/F4(-gabarito)(.pt).html` | gabarito calculado pelo motor (prompt 28) |
| Exercícios | `content/exercises/solution-prep.json`, `buffer.json` | 10 + 10, ver `docs/content/exercicios.md` |
| Motores novos | `computeSolutionMass`, `computeBufferRatio` em `assets/calc-core.js` | o motor de pH e as constantes **não** mudaram |
| Calculadora | `calculators(.pt).html?ph=weakAcid` / `?ph=buffer` | abre a calculadora de pH no modo pedido (etapas 5 e 6 de Ácido-base) |

Nenhum caminho principal exige conta ou recurso Pro. Os exemplos não são digitados: os blocos
`<!-- calc:… -->` são preenchidos por `tools/build-trails.mjs` com os motores, e
`tools/test-trail-examples.mjs` recalcula todos de forma independente (aritmética própria, massas de
`elements-data.js`, a calculadora científica `sci-core`), inclusive os números citados na prosa
(«cerca de 75 vezes menos H⁺», «1,3 % ionizado», «mais de 98 %», Ka = 1,754 × 10⁻⁵).

## Fontes

Só conceitos estabelecidos; nenhuma história. Nenhuma página abaixo foi aberta nesta sessão (rede
restrita): o revisor confere cada uma antes de publicar.

| Afirmação / valor | Onde aparece | Fonte |
|---|---|---|
| pKa do ácido acético = 4,756 a 25 °C (Ka = 1,754 × 10⁻⁵) | ácido-base §04 e §05; equilíbrio §03–§06; exercícios de tampão; revisão da trilha | CRC *Handbook of Chemistry and Physics*, 84.ª ed. (2004), via OpenStax *Introductory Chemistry*, Apêndice B — a tabela `ACID_BASE_CONSTANTS` do prompt 22 (só constantes com fonte) |
| Kw = 1,0 × 10⁻¹⁴ a 25 °C; pH + pOH = 14 a 25 °C | ácido-base §01, §02 | valor de livro-texto usado pelo motor (`KW` em `calc-core.js`, prompt 09) |
| Kw aumenta com a temperatura; a água pura quente é neutra com pH < 7 | ácido-base, equívoco «pH 7 é sempre neutro»; revisão da trilha | OpenStax *Chemistry 2e*, cap. 14 (afirmação **qualitativa**, sem valores de Kw em outras temperaturas) |
| Ácido/base forte ioniza totalmente; força ≠ concentração | ácido-base §03, equívoco | OpenStax *Chemistry 2e*, cap. 14 |
| Henderson–Hasselbalch; faixa útil do tampão ≈ pKa ± 1 (razão 0,1–10) | ácido-base §05; exercícios de tampão | OpenStax *Chemistry 2e*, cap. 14; mesma faixa do motor (`BUFFER_RATIO_MIN/MAX`, prompt 22) |
| C = n ÷ V; preparo em balão volumétrico; C₁V₁ = C₂V₂ | soluções §02–§05 | OpenStax *Chemistry 2e*, cap. 3; IUPAC Gold Book (*amount concentration*) |
| Equilíbrio dinâmico; K e Q; K muda só com a temperatura; Le Chatelier (concentração, pressão, temperatura); catalisador não desloca | equilíbrio §01–§06 e equívocos | OpenStax *Chemistry 2e*, cap. 13 |
| 2 NO₂ ⇌ N₂O₄: NO₂ castanho, N₂O₄ incolor; formação exotérmica (o tubo escurece ao aquecer) | equilíbrio §01, §06 | OpenStax *Chemistry 2e*, cap. 13 (exemplo clássico) — **o revisor confirma** |
| Massas atômicas (Na, Cl, O, H) | soluções, ficha F4, exercícios | CIAAW/IUPAC, abreviadas (`ATOMIC_WEIGHTS`) |

Não entraram (sem fonte confirmada nesta sessão): valores de Kw em outras temperaturas, constantes
de equilíbrio de outras reações (inclusive a do NO₂/N₂O₄), ácido lático e hipocloroso (já excluídos
no prompt 22).

## Medidas

| Página | Palavras do corpo, EN / PT (com exemplos) | Razão PT/EN (total · só prosa) |
|---|---:|---:|
| Soluções e concentração | 1 308 / 1 303 | 1,00 · 1,00 |
| Ácidos, bases e pH | 1 289 / 1 348 | 1,05 · 1,05 |
| Equilíbrio químico | 1 533 / 1 594 | 1,04 · 1,05 |

Todas dentro de 1.200–1.800 palavras (o teste de trilhas confere). Em «Soluções», a prosa PT ficou do
mesmo tamanho da EN (1,00), abaixo da faixa típica do site; as seções, equívocos e recapitulação
têm o mesmo conteúdo (o teste de estrutura compara).

## Decisões do dono

- **Nome público e ordem das trilhas.** Hoje: «Trilha» (`TODO(owner)` em `tools/build-trails.mjs`) e
  ordem alfabética dos arquivos (acido-base, estequiometria, solucoes) — nenhuma página lista as
  trilhas, então a ordem ainda não aparece para o aluno. Opções: (a) ordem didática
  Estequiometria → Soluções → Ácido-base; (b) outra definida pelo professor.
- **«Equilíbrio» como etapa ou artigo isolado.** Padrão implementado: **etapa extra opcional** da
  trilha Ácido-base (não muda o caminho principal nem a contagem). Opções: (a) manter assim;
  (b) etapa principal entre «Lab» e «pH fraco» (a trilha passa a 9 etapas: tirar outra, o limite é 8);
  (c) artigo isolado — apagar o passo `extra-equilibrio` de `content/trilhas/acido-base.json`.
- **Fontes de Ka/Kb** que entram nos exercícios e artigos (hoje só ácido acético nos artigos;
  os exercícios de tampão usam a tabela do prompt 22).
- **Publicação** (mesmos passos do prompt 32) e **licença** (`[licença: definir]`).

## Pendências

- **POE no preparo de solução:** o guia do Lab «Preparar uma solução» não tem «prever, observar,
  explicar»; a trilha Soluções usa o guia como está e oferece o POE de saturação (cristal) como
  extra. Criar um POE para o preparo é decisão de conteúdo (pergunta e resposta esperada).
- **Ficha F5 «Tampão em 50 minutos»** (opcional no prompt): não feita.
- Revisão docente de tudo acima, inclusive a terminologia «tabela de equilíbrio (início, reage,
  equilíbrio)» usada em PT para a tabela ICE.
