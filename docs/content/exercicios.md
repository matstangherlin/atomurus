# Banco de exercícios e «Solução comentada» (prompt 30)

## O que existe

- **Motores com passos** (`assets/calc-core.js`): `computeMolarMass`, `computeIdealGas`,
  `computeDilution` e `computePH` devolvem o resultado **e** `steps[]` — dados numéricos
  `{ id, vars, value?, unit?, answer? }`, sem idioma. As calculadoras passaram a chamar esses
  motores (mesma aritmética, na mesma ordem; nenhum valor mudou).
- **Descrição em palavras** (`assets/worked-steps.js`): transforma `steps[]` em texto e expressão,
  em PT ou EN (vírgula decimal em PT). Só formata números; não calcula nada.
- **Componente** (`assets/worked-solution.js`, `assets/ui/worked-solution.css`, fonte em
  `src/ui/components/worked-solution.css`; ≤ 3 KB cada): `AtomurusWorkedSolution.render(container,
  { steps, answer, locale, labels, open })`. Lista ordenada, botão com `aria-expanded`
  («Mostrar passo a passo» / «Mostrar só o resultado»; nas calculadoras, «Ver solução comentada»),
  impressão com os passos abertos. Passos vazios (cálculo que falhou) ⇒ nada é mostrado.
- **Calculadoras** (`calculators(.pt).html`): massa molar, gases ideais, diluição e pH forte mostram a
  solução depois do cálculo. O pH fraco e o tampão seguem com os passos do prompt 22.
- **Banco** (`content/exercises/<tipo>.json` → `tools/build-exercises.mjs` → `exercises/<tipo>(.pt).html`):
  4 tipos × 10 exercícios, todos **rascunho** (`noindex`, fora do `sitemap.xml`).

## Esquema de um tipo (`content/exercises/<tipo>.json`)

| Campo | Descrição |
|---|---|
| `id`, `type`, `status` (`draft`/`published`), `reviewedBy` | metadados; publicar exige `reviewedBy` |
| `title`, `summary`, `tool` | textos PT/EN e o link para a calculadora |
| `template` | enunciado PT/EN com `{variáveis}`; pode depender de outra variável: `{ "@by": "solve", "V2": {…}, "C2": {…} }` |
| `variables` | sorteio do modo «novo exercício», na ordem listada: `{ "list": […] }`, `{ "min", "max", "step" }`, ou fatores de outra variável `{ "times": "C1", "list": […] }` |
| `engine` | `{ "fn": "calc-core.computeDilution", "args": [ … ] }`; `@x` é a variável `x`, `@counts:formula` a fórmula decomposta, `@weights` a tabela de massas da calculadora |
| `answer` | qual passo é a resposta (`step`) e a unidade — o **valor** vem do motor |
| `commonErrors[]` | `{ id, when?, wrong, message:{pt,en} }`; `wrong` nomeia uma função de `assets/exercises.js` que refaz a conta **com o erro de propósito** (`ignoreSubscripts`, `conversionInverted`, `phSignForgotten`, `pOHasPH`) |
| `exercises[]` | `{ id, level: basico/medio/avancado, vars }` — só os **dados**; resposta e passos são gerados |

Os passos não ficam no JSON: o motor é a única fonte. `tools/build-exercises.mjs --check` valida o
esquema, roda cada exercício nos motores (em `vm`, com os mesmos arquivos do navegador) e confere as
páginas geradas. `tools/test-exercises.mjs` recalcula **independentemente** (parser próprio, massas
de `elements-data.js`, aritmética direta) os 40 exercícios e 150 sorteios por tipo, em PT e EN.

## Páginas

- Lista de 10 exercícios; cada um com «Resposta» e «Solução comentada» em `<details>` (funciona sem
  JavaScript).
- **Novo exercício:** sorteia com semente; o endereço recebe `?seed=` para o professor compartilhar o
  mesmo exercício (casa com o B01 do prompt 26). O sorteio roda os motores no navegador.
- **Impressão:** sem respostas nem soluções; «Imprimir com o gabarito» acrescenta o gabarito numa
  página separada.
- Erros comuns em 3 tipos (massa molar, mol ↔ massa, pH). Um erro que daria o valor certo (NaCl não
  tem índices) não é mostrado.

## Decisões do dono

- **Tipos e quantidade:** proposta = 4 tipos × 10 (massa molar, mol ↔ massa, diluição, pH forte).
  Próximos candidatos: gases ideais (o motor já tem passos), estequiometria, pH fraco/tampão.
- **Exercícios na conta Pro** (salvar progresso, histórico): fora do escopo. Nada é gravado no
  servidor; uma versão Pro precisaria de tabela nova (com `user_id → profiles ON DELETE CASCADE`,
  ver `docs/account/lgpd.md`) e entraria no export de dados.
- **Publicação:** revisão docente dos enunciados e dos níveis; então `status: "published"`,
  `reviewedBy`, e incluir as páginas no `sitemap.xml`. Licença: `[licença: definir]`.

## Pendências de revisão (não alteradas)

- **Duas tabelas de massas atômicas diferem** em 10 elementos: `elements-data.js` (tabela
  periódica) × `ATOMIC_WEIGHTS` (calculadora): Si 28,086/28,085 · Ar 39,948/39,95 · Tc 97/98 ·
  Yb 173,04/173,05 · Lu 174,9668/174,97 · Hf 178,486/178,49 · Lr 266/262 · Hs 271/270 · Rg 282/281 ·
  Mc 290/289. Os exercícios usam só elementos em que as duas concordam (o teste garante). Unificar
  exige revisão por professor com a fonte (CIAAW/IUPAC).
- **Gases ideais recusam 0 °C e temperaturas negativas em °C/°F** (`validateIdeal` confere T > 0
  antes de converter para kelvin). Comportamento anterior a este prompt, mantido; correção sugerida:
  validar `toK(T, Tu) > 0`.
