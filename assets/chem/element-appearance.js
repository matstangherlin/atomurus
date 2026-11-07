/* Atomurus — real appearance colour of each element.
   One entry per element (Z = 1…118): the colour of the element itself in its
   standard state at room conditions (25 °C, 1 atm), not the category colour
   of the periodic-table tile.
     hex    representative sRGB colour of the bulk element
     state  'solid' | 'liquid' | 'gas' at 25 °C
     en/pt  short description ("silvery-grey metal", "gás incolor")
     known  false when the colour has never been observed (short-lived
            synthetic elements). Those entries carry a neutral grey and a
            description that says what is predicted, when a prediction is
            widely cited — a prediction is never shown as a fact.
   Allotrope choices: carbon = graphite, phosphorus = white phosphorus,
   sulfur = rhombic (α) sulfur, tin = white (β) tin, arsenic/selenium = grey form.
   Colourless gases carry a near-white tint so the UI can show them pale and
   label them "incolor".
   Works in the browser (window.AtomurusElementAppearance) and in Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtomurusElementAppearance = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var GAS = '#F4F7FA';          // colourless gas (rendered pale)
  var UNKNOWN = '#9E9E9E';      // colour never observed

  function e(z, symbol, hex, state, en, pt, known) {
    return { z: z, symbol: symbol, hex: hex, state: state, en: en, pt: pt, known: known !== false };
  }
  function unknown(z, symbol, predEn, predPt, state) {
    return e(z, symbol, UNKNOWN, state || 'solid',
      predEn ? 'unknown (predicted: ' + predEn + ')' : 'unknown (no reliable prediction)',
      predPt ? 'cor desconhecida (prevista: ' + predPt + ')' : 'cor desconhecida (sem previsão confiável)',
      false);
  }

  var ELEMENTS = [
    e(1, 'H', GAS, 'gas', 'colourless gas', 'gás incolor'),
    e(2, 'He', GAS, 'gas', 'colourless gas', 'gás incolor'),
    e(3, 'Li', '#D8D9D6', 'solid', 'silvery-white metal (tarnishes quickly)', 'metal branco-prateado (escurece rápido no ar)'),
    e(4, 'Be', '#AEB3B7', 'solid', 'steel-grey metal', 'metal cinza-aço'),
    e(5, 'B', '#3A3A3C', 'solid', 'black solid (crystalline boron; amorphous form is brown)', 'sólido preto (boro cristalino; a forma amorfa é marrom)'),
    e(6, 'C', '#2E2E2E', 'solid', 'black-grey solid (graphite)', 'sólido preto-acinzentado (grafite)'),
    e(7, 'N', GAS, 'gas', 'colourless gas', 'gás incolor'),
    e(8, 'O', GAS, 'gas', 'colourless gas (pale blue only as a liquid)', 'gás incolor (azul-pálido apenas quando líquido)'),
    e(9, 'F', '#F3F0B8', 'gas', 'pale yellow gas', 'gás amarelo-pálido'),
    e(10, 'Ne', GAS, 'gas', 'colourless gas (orange-red only in a discharge lamp)', 'gás incolor (vermelho-alaranjado só em lâmpadas de descarga)'),
    e(11, 'Na', '#D6D8D4', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(12, 'Mg', '#C9CDCF', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(13, 'Al', '#CFD4D8', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(14, 'Si', '#4F5A66', 'solid', 'dark blue-grey metallic solid', 'sólido cinza-azulado escuro, de brilho metálico'),
    e(15, 'P', '#F0E8C8', 'solid', 'waxy yellowish-white solid (white phosphorus)', 'sólido ceroso branco-amarelado (fósforo branco)'),
    e(16, 'S', '#F1DD3A', 'solid', 'yellow solid', 'sólido amarelo'),
    e(17, 'Cl', '#CFE26A', 'gas', 'yellow-green gas', 'gás amarelo-esverdeado'),
    e(18, 'Ar', GAS, 'gas', 'colourless gas', 'gás incolor'),
    e(19, 'K', '#D4D6D2', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(20, 'Ca', '#CDD0CE', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(21, 'Sc', '#C9CCCF', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(22, 'Ti', '#BFC3C6', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(23, 'V', '#B3B9C0', 'solid', 'bluish silvery-grey metal', 'metal cinza-prateado azulado'),
    e(24, 'Cr', '#C6C9CD', 'solid', 'lustrous steel-grey metal', 'metal cinza-aço brilhante'),
    e(25, 'Mn', '#B0B3B7', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(26, 'Fe', '#B7BABD', 'solid', 'lustrous silvery-grey metal', 'metal cinza-prateado brilhante'),
    e(27, 'Co', '#AEB4BB', 'solid', 'bluish silvery-grey metal', 'metal cinza-prateado azulado'),
    e(28, 'Ni', '#C9C9C0', 'solid', 'silvery-white metal with a faint golden tinge', 'metal branco-prateado com leve tom dourado'),
    e(29, 'Cu', '#B87333', 'solid', 'reddish-orange metal', 'metal laranja-avermelhado'),
    e(30, 'Zn', '#B1B8BE', 'solid', 'bluish-silver metal', 'metal prateado-azulado'),
    e(31, 'Ga', '#C4C8CB', 'solid', 'silvery-blue metal', 'metal prateado-azulado'),
    e(32, 'Ge', '#A7ADB2', 'solid', 'grey-white lustrous solid', 'sólido cinza-prateado brilhante'),
    e(33, 'As', '#9DA3A6', 'solid', 'metallic grey solid (grey arsenic)', 'sólido cinza-metálico (arsênio cinza)'),
    e(34, 'Se', '#6E7378', 'solid', 'metallic grey solid (grey selenium; the amorphous form is red)', 'sólido cinza-metálico (selênio cinza; a forma amorfa é vermelha)'),
    e(35, 'Br', '#8B2A11', 'liquid', 'red-brown liquid', 'líquido castanho-avermelhado'),
    e(36, 'Kr', GAS, 'gas', 'colourless gas', 'gás incolor'),
    e(37, 'Rb', '#D6D8D4', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(38, 'Sr', '#CDD0CE', 'solid', 'silvery-white metal (yellowish when oxidised)', 'metal branco-prateado (amarelado quando oxidado)'),
    e(39, 'Y', '#C9CCCF', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(40, 'Zr', '#C3C7CA', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(41, 'Nb', '#B9BEC3', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(42, 'Mo', '#B4B8BC', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(43, 'Tc', '#B5B9BC', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(44, 'Ru', '#B7BBBE', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(45, 'Rh', '#CCCFD2', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(46, 'Pd', '#C9CCCF', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(47, 'Ag', '#E0E1DF', 'solid', 'bright silvery-white metal', 'metal branco-prateado brilhante'),
    e(48, 'Cd', '#C4C8CB', 'solid', 'silvery-white metal with a bluish tinge', 'metal branco-prateado com tom azulado'),
    e(49, 'In', '#C8CBCE', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(50, 'Sn', '#CBCED1', 'solid', 'silvery-white metal (white tin)', 'metal branco-prateado (estanho branco)'),
    e(51, 'Sb', '#AEB2B6', 'solid', 'lustrous silvery-grey solid', 'sólido cinza-prateado brilhante'),
    e(52, 'Te', '#9CA0A4', 'solid', 'lustrous silvery-grey solid', 'sólido cinza-prateado brilhante'),
    e(53, 'I', '#4B3F5E', 'solid', 'lustrous violet-grey solid', 'sólido cinza-violeta brilhante'),
    e(54, 'Xe', GAS, 'gas', 'colourless gas', 'gás incolor'),
    e(55, 'Cs', '#EAD7A0', 'solid', 'pale gold metal', 'metal dourado-pálido'),
    e(56, 'Ba', '#C9CCCF', 'solid', 'silvery-grey metal (tarnishes dark)', 'metal cinza-prateado (escurece no ar)'),
    e(57, 'La', '#C6C9CC', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(58, 'Ce', '#C9CBCE', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(59, 'Pr', '#C8CACD', 'solid', 'silvery-white metal (slightly yellowish)', 'metal branco-prateado (levemente amarelado)'),
    e(60, 'Nd', '#C6C8CB', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(61, 'Pm', '#C4C6C9', 'solid', 'silvery-white metal (prepared in milligram amounts)', 'metal branco-prateado (preparado em miligramas)'),
    e(62, 'Sm', '#C8CACD', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(63, 'Eu', '#C9CBCE', 'solid', 'silvery-white metal (oxidises quickly)', 'metal branco-prateado (oxida rápido)'),
    e(64, 'Gd', '#C7C9CC', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(65, 'Tb', '#C8CACD', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(66, 'Dy', '#C6C8CB', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(67, 'Ho', '#C8CACD', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(68, 'Er', '#C7C9CC', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(69, 'Tm', '#C8CACD', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(70, 'Yb', '#CACCCF', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(71, 'Lu', '#C8CACD', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(72, 'Hf', '#BFC3C6', 'solid', 'lustrous steel-grey metal', 'metal cinza-aço brilhante'),
    e(73, 'Ta', '#9FA6AD', 'solid', 'blue-grey metal', 'metal cinza-azulado'),
    e(74, 'W', '#AEB2B5', 'solid', 'greyish-white lustrous metal', 'metal cinza-prateado brilhante'),
    e(75, 'Re', '#B2B6B9', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(76, 'Os', '#8A93A3', 'solid', 'bluish-grey lustrous metal', 'metal cinza-azulado brilhante'),
    e(77, 'Ir', '#D4D6D9', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(78, 'Pt', '#D5D7D9', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(79, 'Au', '#E6B422', 'solid', 'yellow (golden) metal', 'metal amarelo-dourado'),
    e(80, 'Hg', '#B7BCC0', 'liquid', 'silvery liquid metal', 'metal líquido prateado'),
    e(81, 'Tl', '#B2B6BA', 'solid', 'silvery-white metal (tarnishes blue-grey)', 'metal branco-prateado (escurece para cinza-azulado)'),
    e(82, 'Pb', '#8A8E92', 'solid', 'bluish-grey metal (dull grey when tarnished)', 'metal cinza-azulado (cinza fosco quando oxidado)'),
    e(83, 'Bi', '#C2B0B6', 'solid', 'silvery-white metal with a pink tinge', 'metal branco-prateado com tom rosado'),
    e(84, 'Po', '#9AA0A6', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    unknown(85, 'At', 'dark, metallic-looking solid', 'sólido escuro de aspecto metálico'),
    e(86, 'Rn', GAS, 'gas', 'colourless gas', 'gás incolor'),
    unknown(87, 'Fr', 'silvery metal', 'metal prateado'),
    e(88, 'Ra', '#D5D7D4', 'solid', 'silvery-white metal (blackens in air)', 'metal branco-prateado (enegrece no ar)'),
    e(89, 'Ac', '#D0D3D5', 'solid', 'silvery-white metal (glows blue in the dark)', 'metal branco-prateado (brilha azul no escuro)'),
    e(90, 'Th', '#C9CCCF', 'solid', 'silvery metal (tarnishes grey)', 'metal prateado (escurece para cinza)'),
    e(91, 'Pa', '#C6C9CC', 'solid', 'silvery metal', 'metal prateado'),
    e(92, 'U', '#B5B9BC', 'solid', 'silvery-grey metal', 'metal cinza-prateado'),
    e(93, 'Np', '#BFC3C6', 'solid', 'silvery metal', 'metal prateado'),
    e(94, 'Pu', '#B4B8BC', 'solid', 'silvery-grey metal (tarnishes)', 'metal cinza-prateado (oxida no ar)'),
    e(95, 'Am', '#C8CACD', 'solid', 'silvery-white metal', 'metal branco-prateado'),
    e(96, 'Cm', '#C6C8CB', 'solid', 'silvery metal', 'metal prateado'),
    e(97, 'Bk', '#C4C6C9', 'solid', 'silvery metal (milligram amounts)', 'metal prateado (quantidades de miligramas)'),
    e(98, 'Cf', '#C4C6C9', 'solid', 'silvery-white metal (milligram amounts)', 'metal branco-prateado (quantidades de miligramas)'),
    e(99, 'Es', '#C4C6C9', 'solid', 'silvery metal (microgram amounts)', 'metal prateado (quantidades de microgramas)'),
    unknown(100, 'Fm', 'silvery metal', 'metal prateado'),
    unknown(101, 'Md', 'silvery metal', 'metal prateado'),
    unknown(102, 'No', 'silvery metal', 'metal prateado'),
    unknown(103, 'Lr', 'silvery metal', 'metal prateado'),
    unknown(104, 'Rf', 'silvery metal', 'metal prateado'),
    unknown(105, 'Db', 'silvery metal', 'metal prateado'),
    unknown(106, 'Sg', 'silvery metal', 'metal prateado'),
    unknown(107, 'Bh', 'silvery metal', 'metal prateado'),
    unknown(108, 'Hs', 'silvery metal', 'metal prateado'),
    unknown(109, 'Mt', 'silvery metal', 'metal prateado'),
    unknown(110, 'Ds', 'silvery metal', 'metal prateado'),
    unknown(111, 'Rg', 'silvery metal', 'metal prateado'),
    unknown(112, 'Cn', null, null, 'gas'),
    unknown(113, 'Nh', 'metallic solid', 'sólido metálico'),
    unknown(114, 'Fl', null, null, 'gas'),
    unknown(115, 'Mc', 'metallic solid', 'sólido metálico'),
    unknown(116, 'Lv', 'metallic solid', 'sólido metálico'),
    unknown(117, 'Ts', 'metallic solid', 'sólido metálico'),
    unknown(118, 'Og')
  ];

  var BY_Z = {};
  var BY_SYMBOL = {};
  ELEMENTS.forEach(function (x) { BY_Z[x.z] = x; BY_SYMBOL[x.symbol] = x; });

  function byZ(z) { return BY_Z[Number(z)] || null; }
  function bySymbol(sym) { return BY_SYMBOL[String(sym || '')] || null; }

  /* Colourless gases carry a pale tint only so the tile has a surface. */
  function isColourless(entry) {
    return !!entry && entry.state === 'gas' && entry.hex === GAS;
  }

  function channel(c) {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function luminance(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || ''));
    if (!m) return 1;
    return 0.2126 * channel(parseInt(m[1], 16)) + 0.7152 * channel(parseInt(m[2], 16)) + 0.0722 * channel(parseInt(m[3], 16));
  }
  /* Text colour (WCAG contrast) that reads best on the given background:
     '#111' on light and silvery tiles, '#fff' on dark ones. */
  function textOn(hex) {
    var l = luminance(hex);
    var dark = (l + 0.05) / (0.0056 + 0.05);   // #111 ≈ 0.0056
    var light = (1.0 + 0.05) / (l + 0.05);
    return dark >= light ? '#111' : '#fff';
  }

  function label(z, lang) {
    var x = byZ(z);
    if (!x) return '';
    return String(lang || '').toLowerCase().indexOf('pt') === 0 ? x.pt : x.en;
  }

  return {
    ELEMENTS: ELEMENTS,
    GAS_HEX: GAS,
    UNKNOWN_HEX: UNKNOWN,
    byZ: byZ,
    bySymbol: bySymbol,
    isColourless: isColourless,
    luminance: luminance,
    textOn: textOn,
    label: label
  };
});
