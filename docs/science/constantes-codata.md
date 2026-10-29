# Constantes físicas — uma fonte só (prompt 29, B05)

Fonte: `assets/data/physical-constants.json` (cada constante com `source`). Gerador:
`node tools/build-physical-constants.mjs` → `assets/data/physical-constants.js` (navegador e
Node, `window.AtomurusConstants`) e `netlify/lib/physical-constants.mjs` (Netlify Functions);
`--check` falha se alguma cópia estiver desatualizada. Teste: `npm run test:constants`.

| Constante | Valor | Origem |
|---|---|---|
| N_A, k_B, e, h, c | exatos | SI de 2019 (Brochura do SI, 9ª ed.; CODATA 2018) |
| R | N_A·k_B = 8,314 462 618… J·mol⁻¹·K⁻¹ | derivada, exata |
| F | N_A·e = 96 485,332 12… C·mol⁻¹ | derivada, exata |
| 0 °C | 273,15 K | definição do grau Celsius |
| atm, bar | 101 325 Pa; 10⁵ Pa | definição (NIST SP 811, apêndice B.8) |
| Torr | 101 325/760 Pa = 133,322 368… Pa | definição (NIST SP 811) |
| mmHg (convencional) | 13 595,1 kg·m⁻³ × 9,806 65 m·s⁻² × 1 mm = 133,322 387 415 Pa | NIST SP 811 lista 1,333 224 E+02 Pa |
| Kw (25 °C) | 1,0 × 10⁻¹⁴ | valor aproximado já usado pela calculadora de pH |

**Volume molar** não é constante digitada em lugar nenhum: é R·T/P com a condição dita
(273,15 K e 101,325 kPa → 22,414 L/mol; 273,15 K e 100 kPa → 22,711 L/mol — conferido no teste).

## Onde mudou

- `assets/calc-core.js`: R, Kw, 0 °C, atm, bar, mmHg e Torr da fonte. **Torr** valia o mesmo
  número do mmHg (133,322 387 415 Pa); agora é 101 325/760 Pa, como define a NIST (1 atm = 760 Torr
  exatos).
- `assets/sci-core.js`: N_A, R, F, Kw, c, h da fonte (antes: R = 8,314462618 e F = 96485,33212
  digitados, truncados).
- `netlify/lib/chemistry-calc.mjs` (`GAS_R`, conversões de pressão e temperatura) e
  `netlify/lib/chemistry-thermodynamics.mjs` (273,15).
- `calculators.html` / `.pt.html`: o solucionador de gás ideal da página lê
  `window.AtomurusConstants.R` (a página carrega `physical-constants.js` antes dos motores); os
  textos «R = 8,314» viraram «R = 8,3145 J·K⁻¹·mol⁻¹» (5 algarismos; a precisão exibida é decisão
  do dono). Rodapé e descrição da calculadora atualizados em `tools/i18n-dict-source.js`.
- O rodapé continua dizendo «massas atômicas padrão abreviadas (CIAAW)»; nada sobre «IUPAC 2024»
  foi alterado.

## Impacto numérico (antes R = 8,314 e mmHg = 133,322 no motor do servidor)

| Cálculo | Antes | Depois | Variação |
|---|---|---|---|
| V 1 mol 0°C 1 atm (L) | 22.412722427831234 | 22.413969545014137 | 5.56e-3 % |
| V 1 mol 0°C 100 kPa (L) | 22.709690999999996 | 22.71095464148557 | 5.56e-3 % |
| V 1 mol 25°C 1 atm (L) | 24.464042437700463 | 24.465403697038127 | 5.56e-3 % |
| P 2 mol 300 K 10 L (atm) | 4.9231680236861575 | 4.923441964857581 | 5.56e-3 % |
| P 1 mol 273.15 K 22.4 L (mmHg) | 760.433755172761 | 760.4738583639237 | 5.27e-3 % |
| n 760 mmHg 1 L 298 K (mol) | 0.040896781203533135 | 0.04089462453316702 | -5.27e-3 % |
| T 1 atm 1 L 0.05 mol (K) | 243.74548953572287 | 243.73192749408432 | -5.56e-3 % |
| calc-core 1 atm → mmHg | 759.9998917256112 | 759.9998917256112 | 0.00e+0 % |
| calc-core 1 Torr → Pa | 133.322387415 | 133.32236842105263 | -1.42e-5 % |

As respostas mudam na **5ª casa significativa** (0,0056 %): com 4 algarismos significativos, o
padrão exibido, todas continuam iguais (ex.: 22,41 L). **Nenhum teste teve o valor esperado
alterado** e nenhuma tolerância foi aumentada: `test:calc`, `test:sci`, `test:solver`,
`test:pro-lab`, `test:ux`, `test:molecules` e `test:sheets` passaram sem mudança nos esperados.
