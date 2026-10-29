# Trilha 1 — Estequiometria: fontes, rascunho e como publicar (prompt 32)

## O que existe (tudo em rascunho)

- **Infraestrutura:** `content/trilhas/<id>.json` → `tools/build-trails.mjs` (`--check`) →
  `trilhas/<id>(.pt).html`; progresso local em `assets/trail-progress.js` (chave
  `atomurus-trail-progress`, registrada em `src/core/storage/storage-policy.js`, apagada junto com a
  conta); chip «Trilha: … — etapa n/N» em `assets/trail-chip.js` (gerado; só lê a URL), carregado
  nas calculadoras, nos dois artigos novos e nas páginas geradas (fichas, exercícios, trilhas).
- **Trilha Estequiometria:** 8 etapas (≈ 145 min) + 1 extra opcional (calculadora de
  estequiometria, Pro). O caminho principal não exige conta nem recurso Pro.
- **Artigos novos:** `explore/what-is-the-mole(.pt).html` e `explore/conservation-of-mass(.pt).html`
  — nível, «Você vai aprender», definição rápida, figura SVG com `role="img"`, exemplos resolvidos
  **gerados pelo motor** (blocos `<!-- calc:… -->`, preenchidos por `tools/build-trails.mjs`),
  «Equívocos comuns», «O que você precisa lembrar». Sem anúncios, `noindex,nofollow`, faixa de
  rascunho, fora do `sitemap.xml` e dos menus (`explore.html` não os lista).

## Fontes

Só definições estabelecidas. Nenhuma página abaixo foi aberta nesta sessão (rede restrita): o
revisor confere cada uma antes de publicar.

| Afirmação | Onde aparece | Fonte |
|---|---|---|
| Mol = unidade SI de quantidade de matéria; 1 mol = exatamente 6,02214076 × 10²³ entidades; Nᴀ exata | artigo do mol §01, definição rápida | BIPM, *The International System of Units (SI)*, 9.ª ed. (2019), definição do mol |
| A revisão do SI entrou em vigor em 20 de maio de 2019; antes, o mol era definido pelos átomos em 12 g de carbono-12 | artigo do mol §01 e equívoco 3 | BIPM, *SI Brochure*, 9.ª ed. (histórico das definições) |
| Massa molar; mesmo número que a massa atômica/molecular relativa | artigo do mol §03 | IUPAC Gold Book (molar mass) |
| Massas atômicas padrão abreviadas (H 1,008; C 12,011; O 15,999…) | todos os exemplos | CIAAW/IUPAC — os valores da calculadora (`ATOMIC_WEIGHTS`) |
| R = Nᴀ·k (exata desde 2019); volume molar = RT/P, condição rotulada | artigo do mol §06 | CODATA 2018 (prompt 29) |
| Conservação da massa em sistema fechado | artigo da conservação §01–§04 | definição de livro-texto (OpenStax *Chemistry 2e*) |
| Associação da lei a Antoine Lavoisier | artigo da conservação §01 (uma frase, sem datas nem citações) | **pendente de fonte**: o revisor confirma ou retira |
| Variação de massa ligada à energia das reações químicas é pequena demais para uma balança | artigo da conservação §02 | **pendente de fonte** (afirmação de livro-texto) |

Os números dos exemplos e da autoavaliação não são digitados: `tools/test-trails.mjs` os recalcula
de forma independente (massas de `elements-data.js` e aritmética direta).

## Medidas

| Página | Palavras do corpo (EN / PT) | Razão PT/EN |
|---|---:|---:|
| O que é o mol | 1 523 / 1 537 | 1,01 |
| Conservação da massa | 1 262 / 1 275 | 1,01 |

A razão fica abaixo da faixa típica do site (1,04–1,10) porque os exemplos resolvidos (números e
expressões iguais nas duas línguas) contam palavras; só na prosa ela é 1,02. As seções, os equívocos
e a recapitulação têm o mesmo conteúdo nas duas línguas (o teste de estrutura compara).

## Decisões do dono

- **Publicar** os artigos e a trilha (e quando).
- **Nome público** do recurso: «Trilha» (padrão no código, `TODO(owner)` em `tools/build-trails.mjs`),
  «Percurso» ou outro.
- **Extra Pro:** a etapa opcional aponta para a calculadora de estequiometria (Pro). Se o prompt 34
  abrir esse recurso, tirar a marca «extra (Pro)» (`pro: true` no JSON).
- Selo/certificado de conclusão: fora do escopo.

## Como publicar (passos do dono, em ordem)

1. Revisão docente dos dois artigos (fontes acima, inclusive as pendentes) e da ordem das etapas.
2. Nos quatro arquivos dos artigos: trocar `<meta name="robots" content="noindex,nofollow">` por
   `index,follow` e remover o parágrafo `<p class="art-draft" role="note">`.
3. Em `content/trilhas/estequiometria.json`: `"status": "published"` e `"reviewedBy": "<nome>"`;
   rodar `node tools/build-trails.mjs`.
4. Acrescentar ao `sitemap.xml` as URLs dos artigos (com `hreflang`, como os demais) e da trilha;
   listar os artigos em `explore.html`/`explore.pt.html`.
5. Ajustar os testes que garantem o rascunho: `tools/test-trails.mjs` (`status: 'draft'`, sitemap,
   menus) e `assertTrails` em `tools/validate-site.js`.
