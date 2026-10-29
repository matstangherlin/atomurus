# Funções de química e calculadora científica (prompt 22 — M06, M07)

## Calculadora científica (`assets/sci-core.js`)

Um único motor para `calculators.html` e `calculators.pt.html` (`window.AtomurusSci`; em Node, `require('assets/sci-core.js')`). A página entrega o que depende dela: `molarMass(fórmula)` (pelo parser estrito do prompt 08) e o modo angular.

| Regra | Comportamento |
|---|---|
| Precedência | `^` vem antes do sinal: `-2^2 = -(2²) = -4`; `(-2)^2 = 4`; o expoente aceita sinal (`2^-3 = 0,125`); `^` associa à direita (`2^3^2 = 2^9 = 512`, `-2^2^2 = -16`). |
| Logaritmos | `log(x)` = log₁₀ (uso escolar brasileiro); `lg(x)` = log₁₀; `log(x, b)` na base `b`; `ln(x)` natural; `log10(x)` continua válido. |
| Ângulos | `sin`, `cos`, `tan` leem e `asin`, `acos`, `atan` devolvem no modo mostrado no visor: **DEG** (padrão, `DEFAULT_ANGLE_MODE`) ou **RAD**. O controle DEG/RAD fica nos dois visores, com `aria-pressed`, e é lembrado em `localStorage` (`atomurus-sci-angle`, registrado em `src/core/storage/storage-policy.js`). `tan(90°)` é erro; `sin(180°)` dá 0 (não `1,2×10⁻¹⁶`). |
| `round` | Meio para longe do zero: `round(2.5) = 3`, `round(-2.5) = -3`. `round(x, n)` mantém `n` casas (0–12): `round(1.005, 2) = 1,01`. |
| `0^0` | `1`, por convenção (é o que `Math.pow` dá e o que se usa em combinatória). **Decisão do dono** se a escola preferir «indeterminado». |
| Fatorial | `5! = 120`; erro para negativos, não inteiros e acima de 170. |
| Multiplicação implícita | `2(3)` e `2pi` **não** existem (dão «símbolo inesperado»); não foi introduzida. |
| Decimal | O resultado aparece com vírgula em PT (`0,125`); a **entrada** usa ponto, porque a vírgula separa argumentos (`log(8, 2)`). A ajuda abaixo do campo diz isso. O valor copiado mantém o ponto. |

### Erros

Todo erro do motor traz um `code`; a página o traduz pelo dicionário (`calc.sciErr*`):

| `code` | PT | EN | Exemplo |
|---|---|---|---|
| `div0` | Divisão por zero | Division by zero | `1/0`, `0/0` |
| `domain` | Fora do domínio da função {fn} | Outside the domain of {fn} | `sqrt(-1)`, `asin(2)`, `log(0)` |
| `incomplete` | Expressão incompleta | Incomplete expression | `1+`, `((1)` |
| `syntax` | Símbolo inesperado: “{token}” | Unexpected “{token}” | `2 $ 3`, `1 2` |
| `unknownFn` | Função desconhecida: {name}() | Unknown function: {name}() | `foo(1)` |
| `unknownConst` | Nome desconhecido: {name} | Unknown name: {name} | `bar` |
| `arity` | {fn} recebe {n} argumento(s) | {fn} takes {n} argument(s) | `dilution(1,2)` |
| `factorial` | O fatorial precisa de um número inteiro de 0 a 170 | … | `(-1)!` |
| `notNumber` | Aqui é preciso um número | A number is needed here | `"x"` |
| `overflow` | O resultado é grande demais para mostrar | … | `10^400` |
| `unavailable` | {fn} não está disponível aqui | … | `molarMass` sem parser |

## pH de espécies fracas e tampão (`assets/calc-core.js`)

Tudo a 25 °C, solução ideal (sem coeficientes de atividade), Kw = 1,0 × 10⁻¹⁴. O modo «ácido/base forte» do prompt 09 não mudou.

### Ácido fraco HA (concentração C)

Balanço de cargas, resolvido por bisseção em log[H⁺], **sem** a aproximação `x = √(Ka·C)`:

  [H⁺] = [A⁻] + [OH⁻],  [A⁻] = C·Ka / (Ka + [H⁺]),  [OH⁻] = Kw / [H⁺]

O atalho `√(Ka·C)` aparece ao lado, com a diferença. Ácido acético 0,100 mol/L (pKa 4,756) → **pH 2,88**, α = 1,3 %. Muito diluído (1 × 10⁻⁷ mol/L) → **pH 6,79**: a água conta, e o resultado fica abaixo de 7 sem chegar a 6,5.

### Base fraca B

  [OH⁻] = [BH⁺] + [H⁺],  [BH⁺] = C·Kb / (Kb + [OH⁻])

Amônia 0,100 mol/L (pKb 4,75) → **pH 11,12** (com Kb = 1,8 × 10⁻⁵, 11,13).

### Tampão HA / A⁻ (sal de sódio)

Resposta mostrada: **Henderson–Hasselbalch**, pH = pKa + log([A⁻]/[HA]). Conferência pelo balanço de cargas exato [H⁺] + [Na⁺] = [A⁻] + [OH⁻] e capacidade tamponante β = 2,303 (Kw/[H⁺] + [H⁺] + C·Ka·[H⁺]/(Ka + [H⁺])²).

Avisos: razão [A⁻]/[HA] fora de 0,1–10; alguma concentração abaixo de 1 mmol/L; Henderson–Hasselbalch a mais de 0,02 do exato. Acético/acetato 0,10/0,10 → pH 4,76 = pKa, β ≈ 0,115 mol/(L·pH).

### Polipróticos

Só o primeiro pKa é usado, com aviso «aproximação». Curvas de titulação e polipróticos completos ficam para o prompt 36.

## Constantes (`ACID_BASE_CONSTANTS`)

| Espécie | Constante a 25 °C | Fonte |
|---|---|---|
| Ácido acético | pKa 4,756 | CRC Handbook, 84ª ed. (2004), via [OpenStax, Introductory Chemistry, Apêndice B](https://opentextbc.ca/introductorychemistry/back-matter/appendix-selected-acid-dissociation-constants-at-25c/) |
| Ácido fórmico | pKa 3,75 | idem |
| Ácido benzoico | pKa 4,204 | idem |
| Ácido fluorídrico | pKa 3,20 | idem |
| Ácido carbônico | pKa 6,35; 10,33 | idem |
| Ácido fosfórico | pKa 2,16; 7,21 | idem |
| Amônia | pKb 4,75 | idem; McQuarrie, Apêndice E (CRC, 87ª ed.) |
| Metilamina | pKb 3,34 | idem |
| Piridina | pKb 8,77 | McQuarrie, Apêndice E (CRC, 87ª ed.) |

Os valores foram conferidos por busca nas tabelas secundárias citadas (o CRC em si não estava acessível). **Fora da tabela até confirmação de docente:** ácido lático (3,85 ou 3,86, conforme a edição), ácido hipocloroso (7,40 ou 7,53, conforme a edição), terceiro pKa do fosfórico (12,32, sem confirmação direta).

## Passos manuais do dono

1. Revisão de docente das constantes e do texto dos passos (`calc.phStep*` em `tools/i18n-dict-source.js`).
2. Decidir o modo angular padrão (graus hoje) e a convenção de `0^0`.
