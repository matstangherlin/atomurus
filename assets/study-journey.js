(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusJourney = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Study journey ("Estudo"): short daily lessons in units, Duolingo-style.
   *
   * Node kinds
   *   lesson     — "Aula": teaching cards followed by a few questions
   *   practice   — "Prática": questions only, played in rounds
   *   bench      — "Bancada": opens a real Atomurus tool (Lab, 3D viewer…)
   *   reading    — optional article, never blocks the path
   *   checkpoint — mixed questions from the whole unit
   *
   * Every question here was written for this path and checked against the
   * site's own articles; nothing is generated from free text. Progress lives
   * on this device (localStorage) and is never sent anywhere.
   */

  var XP = { lesson: 10, practice: 15, bench: 10, reading: 5, checkpoint: 20 };
  var DAILY_GOAL = 50;
  var STORE_KEY = 'atomurus-journey-v1';

  /* ── question helpers ─────────────────────────────────────────────── */
  function q(kind, en, pt, options, answer, explainEn, explainPt, tile) {
    return { type: 'choice', kind: kind, q: { en: en, pt: pt }, options: options, answer: answer, explain: { en: explainEn, pt: explainPt }, tile: tile || null };
  }
  function opts(enList, ptList) { return enList.map(function (en, i) { return { en: en, pt: ptList ? ptList[i] : en }; }); }
  function same(list) { return list.map(function (v) { return { en: String(v), pt: String(v) }; }); }
  function teach(titleEn, titlePt, bodyEn, bodyPt, tile) {
    return { type: 'teach', title: { en: titleEn, pt: titlePt }, body: { en: bodyEn, pt: bodyPt }, tile: tile || null };
  }

  /* Common isotope of each element used in particle questions. */
  var NUCLIDES = [
    { sym: 'H', z: 1, a: 1, mass: '1.008', en: 'hydrogen', pt: 'hidrogênio' },
    { sym: 'He', z: 2, a: 4, mass: '4.003', en: 'helium', pt: 'hélio' },
    { sym: 'C', z: 6, a: 12, mass: '12.011', en: 'carbon', pt: 'carbono' },
    { sym: 'N', z: 7, a: 14, mass: '14.007', en: 'nitrogen', pt: 'nitrogênio' },
    { sym: 'O', z: 8, a: 16, mass: '15.999', en: 'oxygen', pt: 'oxigênio' },
    { sym: 'Na', z: 11, a: 23, mass: '22.990', en: 'sodium', pt: 'sódio' },
    { sym: 'Mg', z: 12, a: 24, mass: '24.305', en: 'magnesium', pt: 'magnésio' },
    { sym: 'Al', z: 13, a: 27, mass: '26.982', en: 'aluminium', pt: 'alumínio' },
    { sym: 'Cl', z: 17, a: 35, mass: '35.45', en: 'chlorine', pt: 'cloro' },
    { sym: 'Ca', z: 20, a: 40, mass: '40.078', en: 'calcium', pt: 'cálcio' },
    { sym: 'Fe', z: 26, a: 56, mass: '55.845', en: 'iron', pt: 'ferro' },
    { sym: 'Au', z: 79, a: 197, mass: '196.97', en: 'gold', pt: 'ouro' }
  ];
  function nuc(sym) { return NUCLIDES.filter(function (n) { return n.sym === sym; })[0]; }
  function spread(correct, deltas) {
    var out = [correct];
    deltas.forEach(function (d) { var v = correct + d; if (v >= 0 && out.indexOf(v) < 0) out.push(v); });
    return out.slice(0, 4);
  }
  function uniq(list) { var out = []; list.forEach(function (v) { if (v >= 0 && out.indexOf(v) < 0) out.push(v); }); return out; }
  function protonsQ(sym) {
    var n = nuc(sym);
    return q('identify', 'How many protons does a ' + n.en + ' atom have?', 'Quantos prótons tem um átomo de ' + n.pt + '?',
      same(uniq([n.z, n.a, n.z + 2, n.z - 2, n.z + 1]).slice(0, 4)), 0,
      'The atomic number Z is the number of protons. It is what defines the element.',
      'O número atômico é a quantidade de prótons. É ele que define qual elemento é.',
      { sym: n.sym, top: 'Z = ?', bottom: n.mass });
  }
  function electronsQ(sym) {
    var n = nuc(sym);
    return q('identify', 'How many electrons does a neutral ' + n.en + ' atom have?', 'Quantos elétrons tem um átomo neutro de ' + n.pt + '?',
      same(uniq([n.z, n.a - n.z === n.z ? n.z + 2 : n.a - n.z, n.z + 1, n.z - 1]).slice(0, 4)), 0,
      'In a neutral atom the electrons balance the protons: electrons = Z = ' + n.z + '.',
      'Num átomo neutro os elétrons equilibram os prótons: elétrons = Z = ' + n.z + '.',
      { sym: n.sym, top: 'Z = ' + n.z, bottom: n.mass });
  }
  function neutronsQ(sym) {
    var n = nuc(sym);
    var neu = n.a - n.z;
    var en = n.en.charAt(0).toUpperCase() + n.en.slice(1);
    var pt = n.pt.charAt(0).toUpperCase() + n.pt.slice(1);
    return q('calculate', en + '-' + n.a + ' has Z = ' + n.z + '. How many neutrons?', pt + '-' + n.a + ' tem Z = ' + n.z + '. Quantos nêutrons?',
      same(uniq([neu, n.a, n.z === neu ? neu + 1 : n.z, neu - 1, neu + 2]).slice(0, 4)), 0,
      'Neutrons = mass number − atomic number = ' + n.a + ' − ' + n.z + ' = ' + neu + '.',
      'Nêutrons = número de massa − número atômico = ' + n.a + ' − ' + n.z + ' = ' + neu + '.',
      { sym: n.sym, top: 'A = ' + n.a, bottom: 'Z = ' + n.z });
  }
  var SYMBOL_DISTRACTORS = {
    He: ['H', 'Hl', 'Hm'], C: ['Ca', 'Cb', 'Co'], N: ['Ni', 'Na', 'Ne'], O: ['Ox', 'Os', 'Og'], Na: ['So', 'N', 'Sd'],
    Mg: ['Mn', 'Ma', 'Mo'], Al: ['Am', 'Ar', 'Au'], Cl: ['C', 'Co', 'Cr'], Ca: ['C', 'Cd', 'Cl'], Fe: ['F', 'Fr', 'Ir'], Au: ['Ag', 'Go', 'Gd'], H: ['He', 'Hg', 'Hd']
  };
  function symbolQ(sym) {
    var n = nuc(sym);
    return q('identify', 'What is the symbol for ' + n.en + '?', 'Qual é o símbolo do ' + n.pt + '?', same([n.sym].concat(SYMBOL_DISTRACTORS[n.sym] || ['X', 'Y', 'Z'])), 0,
      n.en.charAt(0).toUpperCase() + n.en.slice(1) + ' is ' + n.sym + '.', (n.pt.charAt(0).toUpperCase() + n.pt.slice(1)) + ' é ' + n.sym + '.');
  }

  /* ── the path ──────────────────────────────────────────────────────── */
  var UNITS = [
    {
      id: 'u1', phase: 1, title: { en: 'Chemistry Foundations', pt: 'Fundamentos de Química' },
      subtitle: { en: 'Matter, energy and change', pt: 'Matéria, energia e transformações' },
      guide: '/explore/what-is-a-chemical-reaction.html',
      nodes: [
        {
          id: 'u1-what', kind: 'lesson', title: { en: 'What is chemistry?', pt: 'O que é química?' },
          steps: [
            teach('Chemistry studies matter', 'A química estuda a matéria',
              'Matter is anything that has mass and takes up space: air, water, your hand. Chemistry studies what matter is made of and how it changes into other substances.',
              'Matéria é tudo o que tem massa e ocupa espaço: o ar, a água, a sua mão. A química estuda do que a matéria é feita e como ela se transforma em outras substâncias.'),
            q('concept', 'Which of these is matter?', 'Qual destes é matéria?', opts(['Air', 'Light', 'Sound', 'Heat'], ['Ar', 'Luz', 'Som', 'Calor']), 0,
              'Air has mass and fills space. Light, sound and heat are forms of energy.', 'O ar tem massa e ocupa espaço. Luz, som e calor são formas de energia.'),
            teach('Physical or chemical change', 'Transformação física ou química',
              'In a physical change the substance stays the same (ice melting is still water). In a chemical change new substances form (iron rusting becomes iron oxide).',
              'Numa transformação física a substância continua a mesma (gelo derretendo ainda é água). Numa transformação química surgem substâncias novas (ferro enferrujando vira óxido de ferro).'),
            q('concept', 'Iron rusting is a…', 'Ferro enferrujando é uma transformação…', opts(['Chemical change', 'Physical change'], ['Química', 'Física']), 0,
              'Rust is a new substance (iron oxide), so the change is chemical.', 'A ferrugem é uma substância nova (óxido de ferro), então a transformação é química.'),
            q('concept', 'Ice melting into water is a…', 'Gelo derretendo é uma transformação…', opts(['Physical change', 'Chemical change'], ['Física', 'Química']), 0,
              'It is still H₂O, only in another state.', 'Continua sendo H₂O, só em outro estado.')
          ]
        },
        {
          id: 'u1-energy', kind: 'practice', rounds: 2, title: { en: 'Matter and energy', pt: 'Matéria e energia' },
          steps: [
            q('concept', 'Solid to gas without becoming liquid is called…', 'Sólido virando gás sem passar por líquido se chama…', opts(['Sublimation', 'Melting', 'Condensation', 'Freezing'], ['Sublimação', 'Fusão', 'Condensação', 'Solidificação']), 0,
              'Dry ice (solid CO₂) sublimes at room pressure.', 'O gelo-seco (CO₂ sólido) sublima à pressão ambiente.'),
            q('concept', 'Which is a mixture?', 'Qual destes é uma mistura?', opts(['Sea water', 'Pure water', 'Oxygen gas', 'Table salt'], ['Água do mar', 'Água pura', 'Gás oxigênio', 'Sal de cozinha']), 0,
              'Sea water is water with dissolved salts — more than one substance.', 'A água do mar é água com sais dissolvidos — mais de uma substância.'),
            q('concept', 'A reaction that releases heat is…', 'Uma reação que libera calor é…', opts(['Exothermic', 'Endothermic', 'Neutral', 'Physical'], ['Exotérmica', 'Endotérmica', 'Neutra', 'Física']), 0,
              'Exo = out: energy leaves to the surroundings, like in combustion.', 'Exo = para fora: a energia sai para o ambiente, como na combustão.'),
            q('concept', 'In a closed container, the total mass after a reaction…', 'Num recipiente fechado, a massa total depois de uma reação…', opts(['Stays the same', 'Increases', 'Decreases', 'Becomes zero'], ['Continua igual', 'Aumenta', 'Diminui', 'Vira zero']), 0,
              'Lavoisier: atoms are rearranged, not created or destroyed.', 'Lavoisier: os átomos se rearranjam, não são criados nem destruídos.'),
            q('concept', 'Bubbles of gas when mixing baking soda and vinegar suggest…', 'Bolhas de gás ao misturar bicarbonato e vinagre indicam…', opts(['A chemical reaction', 'Only dissolving', 'Melting', 'Nothing happened'], ['Uma reação química', 'Só dissolução', 'Fusão', 'Nada aconteceu']), 0,
              'A new gas (CO₂) forms — a classic sign of a reaction.', 'Forma-se um gás novo (CO₂) — sinal clássico de reação.'),
            q('concept', 'At sea level, pure water boils at…', 'Ao nível do mar, a água pura ferve a…', opts(['100 °C', '0 °C', '50 °C', '212 °C'], ['100 °C', '0 °C', '50 °C', '212 °C']), 0,
              '100 °C at 1 atm (212 °F). On a mountain it boils lower.', '100 °C a 1 atm. No alto de uma montanha ferve abaixo disso.')
          ]
        },
        { id: 'u1-bench', kind: 'bench', title: { en: 'Prepare a solution', pt: 'Preparar uma solução' }, href: '/app?section=lab&mode=bench' }
      ]
    },
    {
      id: 'u2', phase: 1, title: { en: 'Atomic structure', pt: 'Estrutura atômica' },
      subtitle: { en: 'Protons, neutrons, electrons and models', pt: 'Prótons, nêutrons, elétrons e modelos' },
      guide: '/explore/what-is-an-atom.html',
      nodes: [
        {
          id: 'u2-atom', kind: 'lesson', title: { en: 'What is an atom?', pt: 'O que é um átomo?' },
          steps: [
            teach('The smallest piece of an element', 'O menor pedaço de um elemento',
              'An atom is the smallest unit of an element that still behaves like that element. It has a tiny, dense nucleus with protons and neutrons, surrounded by electrons.',
              'Um átomo é a menor unidade de um elemento que ainda se comporta como ele. Tem um núcleo minúsculo e denso, com prótons e nêutrons, cercado por elétrons.', { sym: 'C', top: '6', bottom: '12.011' }),
            q('concept', 'Where are protons and neutrons?', 'Onde ficam os prótons e os nêutrons?', opts(['In the nucleus', 'Around the nucleus', 'Between atoms', 'In the electron cloud'], ['No núcleo', 'Ao redor do núcleo', 'Entre os átomos', 'Na nuvem eletrônica']), 0,
              'Both sit in the nucleus; electrons occupy the space around it.', 'Os dois ficam no núcleo; os elétrons ocupam o espaço ao redor.'),
            q('concept', 'An atom is mostly…', 'Um átomo é quase todo…', opts(['Empty space', 'Protons', 'Neutrons', 'Solid matter'], ['Espaço vazio', 'Prótons', 'Nêutrons', 'Matéria sólida']), 0,
              'If the nucleus were a marble, the electrons would be in the stadium stands.', 'Se o núcleo fosse uma bolinha de gude, os elétrons estariam nas arquibancadas de um estádio.'),
            q('concept', 'Which model pictured electrons in fixed energy levels?', 'Qual modelo pôs os elétrons em níveis de energia fixos?', opts(['Bohr (1913)', 'Dalton (1803)', 'Thomson (1897)', 'Democritus'], ['Bohr (1913)', 'Dalton (1803)', 'Thomson (1897)', 'Demócrito']), 0,
              'Bohr’s shells explained the colours of the hydrogen spectrum.', 'As camadas de Bohr explicaram as cores do espectro do hidrogênio.')
          ]
        },
        {
          id: 'u2-particles', kind: 'lesson', title: { en: 'Protons, neutrons and electrons', pt: 'Prótons, nêutrons e elétrons' },
          steps: [
            teach('Three particles, three charges', 'Três partículas, três cargas',
              'Proton: charge +1, in the nucleus. Neutron: no charge, in the nucleus. Electron: charge −1, around the nucleus, about 1/1836 of a proton’s mass.',
              'Próton: carga +1, no núcleo. Nêutron: sem carga, no núcleo. Elétron: carga −1, ao redor do núcleo, com cerca de 1/1836 da massa de um próton.'),
            q('concept', 'Which particle has no electric charge?', 'Qual partícula não tem carga elétrica?', opts(['Neutron', 'Proton', 'Electron', 'Ion'], ['Nêutron', 'Próton', 'Elétron', 'Íon']), 0,
              'Neutrons are neutral; they add mass and hold the nucleus together.', 'Os nêutrons são neutros; somam massa e ajudam a manter o núcleo coeso.'),
            q('concept', 'The atomic number Z counts…', 'O número atômico Z conta…', opts(['Protons', 'Neutrons', 'Protons + neutrons', 'Electron shells'], ['Prótons', 'Nêutrons', 'Prótons + nêutrons', 'Camadas eletrônicas']), 0,
              'Z = protons. Protons + neutrons is the mass number A.', 'Z = prótons. Prótons + nêutrons é o número de massa A.'),
            protonsQ('C')
          ]
        },
        {
          id: 'u2-practice', kind: 'practice', rounds: 4, title: { en: 'Particles of the atom', pt: 'Partículas do átomo' },
          steps: [protonsQ('O'), electronsQ('Na'), neutronsQ('C'), protonsQ('Fe'), neutronsQ('O'), electronsQ('Cl'), neutronsQ('Na'), protonsQ('Au')]
        },
        { id: 'u2-read', kind: 'reading', optional: true, title: { en: 'What are isotopes', pt: 'O que são isótopos' }, blurb: { en: 'The full article, with examples from carbon-14 to uranium.', pt: 'O artigo completo, com exemplos do carbono-14 ao urânio.' }, href: '/explore/what-are-isotopes.html' },
        {
          id: 'u2-isotopes', kind: 'lesson', title: { en: 'Isotopes', pt: 'Isótopos' },
          steps: [
            teach('Same element, different neutrons', 'Mesmo elemento, nêutrons diferentes',
              'Isotopes have the same number of protons but different numbers of neutrons. Carbon-12 has 6 neutrons, carbon-14 has 8 — both are carbon because both have 6 protons.',
              'Isótopos têm o mesmo número de prótons e números diferentes de nêutrons. O carbono-12 tem 6 nêutrons, o carbono-14 tem 8 — os dois são carbono porque os dois têm 6 prótons.', { sym: 'C', top: '¹⁴C', bottom: 'Z = 6' }),
            q('concept', 'Carbon-12 and carbon-14 differ in their number of…', 'Carbono-12 e carbono-14 diferem no número de…', opts(['Neutrons', 'Protons', 'Electrons in a neutral atom', 'Atomic number'], ['Nêutrons', 'Prótons', 'Elétrons no átomo neutro', 'Número atômico']), 0,
              '14 − 6 = 8 neutrons versus 12 − 6 = 6.', '14 − 6 = 8 nêutrons contra 12 − 6 = 6.'),
            q('concept', 'Why is carbon’s atomic mass 12.011 and not 12?', 'Por que a massa atômica do carbono é 12,011 e não 12?', opts(['It averages its natural isotopes', 'Electrons are heavy', 'It is a rounding error', 'Protons weigh more in carbon'], ['É a média dos isótopos naturais', 'Os elétrons são pesados', 'É um erro de arredondamento', 'Os prótons pesam mais no carbono']), 0,
              'About 1.1% of carbon is carbon-13, which pulls the average up.', 'Cerca de 1,1% do carbono é carbono-13, que puxa a média para cima.'),
            neutronsQ('Cl')
          ]
        },
        { id: 'u2-bench', kind: 'bench', title: { en: 'Bohr model in 3D', pt: 'Modelo de Bohr em 3D' }, href: '/viewer/atomic-models.html?model=bohr' },
        { id: 'u2-check', kind: 'checkpoint', title: { en: 'Unit checkpoint', pt: 'Checkpoint da unidade' } }
      ]
    },
    {
      id: 'u3', phase: 1, title: { en: 'Periodic table', pt: 'Tabela periódica' },
      subtitle: { en: 'Groups, periods and trends', pt: 'Grupos, períodos e tendências' },
      guide: '/explore/what-is-the-periodic-table.html',
      nodes: [
        {
          id: 'u3-order', kind: 'lesson', title: { en: 'How the table is organized', pt: 'Como a tabela se organiza' },
          steps: [
            teach('Rows and columns', 'Linhas e colunas',
              'Elements are ordered by atomic number. Rows are periods (the number of electron shells); columns are groups, and elements in the same group behave alike.',
              'Os elementos seguem a ordem do número atômico. As linhas são os períodos (o número de camadas eletrônicas); as colunas são os grupos, e quem está no mesmo grupo se comporta de forma parecida.'),
            q('concept', 'The table is ordered by…', 'A tabela está em ordem de…', opts(['Atomic number', 'Atomic mass', 'Discovery date', 'Alphabet'], ['Número atômico', 'Massa atômica', 'Data de descoberta', 'Ordem alfabética']), 0,
              'Moseley showed in 1913 that Z, not mass, sets the order.', 'Moseley mostrou em 1913 que é o Z, não a massa, que define a ordem.'),
            q('concept', 'Elements in the same column…', 'Elementos na mesma coluna…', opts(['Have similar properties', 'Have the same mass', 'Are all gases', 'Have the same number of protons'], ['Têm propriedades parecidas', 'Têm a mesma massa', 'São todos gases', 'Têm o mesmo número de prótons']), 0,
              'Same group, same number of outer electrons, similar chemistry.', 'Mesmo grupo, mesmo número de elétrons de valência, química parecida.'),
            q('concept', 'A horizontal row is called a…', 'Uma linha horizontal se chama…', opts(['Period', 'Group', 'Family', 'Block'], ['Período', 'Grupo', 'Família', 'Bloco']), 0,
              'There are 7 periods; groups (families) are the 18 columns.', 'São 7 períodos; os grupos (famílias) são as 18 colunas.')
          ]
        },
        {
          id: 'u3-families', kind: 'practice', rounds: 2, title: { en: 'Families', pt: 'Famílias' },
          steps: [
            q('identify', 'Sodium (Na) is…', 'O sódio (Na) é…', opts(['An alkali metal', 'A halogen', 'A noble gas', 'A transition metal'], ['Metal alcalino', 'Halogênio', 'Gás nobre', 'Metal de transição']), 0, 'Group 1: very reactive metals.', 'Grupo 1: metais muito reativos.', { sym: 'Na', top: '11', bottom: '22.990' }),
            q('identify', 'Chlorine (Cl) is…', 'O cloro (Cl) é…', opts(['A halogen', 'An alkali metal', 'A noble gas', 'A metalloid'], ['Halogênio', 'Metal alcalino', 'Gás nobre', 'Semimetal']), 0, 'Group 17: halogens, one electron short of a full shell.', 'Grupo 17: halogênios, a um elétron de completar a camada.', { sym: 'Cl', top: '17', bottom: '35.45' }),
            q('identify', 'Neon (Ne) is…', 'O neônio (Ne) é…', opts(['A noble gas', 'A halogen', 'An alkaline earth metal', 'A nonmetal that bonds easily'], ['Gás nobre', 'Halogênio', 'Metal alcalinoterroso', 'Ametal que se liga fácil']), 0, 'Group 18: full shells, almost inert.', 'Grupo 18: camadas completas, quase inerte.', { sym: 'Ne', top: '10', bottom: '20.180' }),
            q('identify', 'Calcium (Ca) is…', 'O cálcio (Ca) é…', opts(['An alkaline earth metal', 'An alkali metal', 'A transition metal', 'A halogen'], ['Metal alcalinoterroso', 'Metal alcalino', 'Metal de transição', 'Halogênio']), 0, 'Group 2.', 'Grupo 2.', { sym: 'Ca', top: '20', bottom: '40.078' }),
            q('identify', 'Iron (Fe) is…', 'O ferro (Fe) é…', opts(['A transition metal', 'An alkali metal', 'A noble gas', 'A lanthanide'], ['Metal de transição', 'Metal alcalino', 'Gás nobre', 'Lantanídeo']), 0, 'Group 8, in the d-block.', 'Grupo 8, no bloco d.', { sym: 'Fe', top: '26', bottom: '55.845' }),
            symbolQ('Au'), symbolQ('Fe')
          ]
        },
        { id: 'u3-bench', kind: 'bench', title: { en: 'Explore the table', pt: 'Explorar a tabela' }, href: '/periodic-table.html' },
        { id: 'u3-check', kind: 'checkpoint', title: { en: 'Unit checkpoint', pt: 'Checkpoint da unidade' } }
      ]
    },
    {
      id: 'u4', phase: 1, title: { en: 'Chemical bonding', pt: 'Ligações químicas' },
      subtitle: { en: 'Ionic, covalent and metallic', pt: 'Iônica, covalente e metálica' },
      guide: '/explore/what-is-chemical-bonding.html',
      nodes: [
        {
          id: 'u4-why', kind: 'lesson', title: { en: 'Why atoms bond', pt: 'Por que os átomos se ligam' },
          steps: [
            teach('Reaching a stable shell', 'Chegando a uma camada estável',
              'Atoms bond to reach a more stable arrangement of outer electrons — often eight (the octet rule). They can transfer electrons (ionic), share them (covalent) or pool them (metallic).',
              'Os átomos se ligam para chegar a um arranjo mais estável dos elétrons externos — muitas vezes oito (a regra do octeto). Eles podem transferir elétrons (iônica), compartilhar (covalente) ou juntar num “mar” (metálica).'),
            q('concept', 'In an ionic bond electrons are…', 'Numa ligação iônica os elétrons são…', opts(['Transferred', 'Shared', 'Pooled in a sea', 'Destroyed'], ['Transferidos', 'Compartilhados', 'Juntados num mar', 'Destruídos']), 0, 'Na gives one electron to Cl: Na⁺ and Cl⁻.', 'O Na cede um elétron ao Cl: Na⁺ e Cl⁻.'),
            q('concept', 'In a covalent bond electrons are…', 'Numa ligação covalente os elétrons são…', opts(['Shared', 'Transferred', 'Removed', 'Turned into protons'], ['Compartilhados', 'Transferidos', 'Removidos', 'Transformados em prótons']), 0, 'Like the two O–H bonds in water.', 'Como as duas ligações O–H da água.')
          ]
        },
        {
          id: 'u4-types', kind: 'practice', rounds: 2, title: { en: 'Bond types', pt: 'Tipos de ligação' },
          steps: [
            q('identify', 'Table salt, NaCl, has…', 'O sal de cozinha, NaCl, tem ligação…', opts(['Ionic bonds', 'Covalent bonds', 'Metallic bonds', 'No bonds'], ['Iônica', 'Covalente', 'Metálica', 'Nenhuma']), 0, 'A metal and a nonmetal trading an electron.', 'Um metal e um ametal trocando um elétron.'),
            q('identify', 'Water, H₂O, has…', 'A água, H₂O, tem ligação…', opts(['Covalent bonds', 'Ionic bonds', 'Metallic bonds', 'Hydrogen nuclei only'], ['Covalente', 'Iônica', 'Metálica', 'Só núcleos de hidrogênio']), 0, 'Two nonmetals sharing electrons.', 'Dois ametais compartilhando elétrons.'),
            q('identify', 'A copper wire is held together by…', 'Um fio de cobre se mantém unido por ligação…', opts(['Metallic bonds', 'Ionic bonds', 'Covalent bonds', 'Gravity'], ['Metálica', 'Iônica', 'Covalente', 'Gravidade']), 0, 'Free electrons flow — that is why copper conducts.', 'Elétrons livres circulam — por isso o cobre conduz.'),
            q('identify', 'CO₂ has…', 'O CO₂ tem ligação…', opts(['Covalent bonds', 'Ionic bonds', 'Metallic bonds', 'No bonds'], ['Covalente', 'Iônica', 'Metálica', 'Nenhuma']), 0, 'Two C=O double bonds.', 'Duas ligações duplas C=O.'),
            q('identify', 'Magnesium oxide, MgO, has…', 'O óxido de magnésio, MgO, tem ligação…', opts(['Ionic bonds', 'Covalent bonds', 'Metallic bonds', 'No bonds'], ['Iônica', 'Covalente', 'Metálica', 'Nenhuma']), 0, 'Mg²⁺ and O²⁻.', 'Mg²⁺ e O²⁻.')
          ]
        },
        { id: 'u4-bench', kind: 'bench', title: { en: 'Molecules in 3D', pt: 'Moléculas em 3D' }, href: '/viewer/molecules.html' },
        { id: 'u4-check', kind: 'checkpoint', title: { en: 'Unit checkpoint', pt: 'Checkpoint da unidade' } }
      ]
    },
    {
      id: 'u5', phase: 2, title: { en: 'The mole', pt: 'O mol' },
      subtitle: { en: 'Counting atoms by weighing them', pt: 'Contando átomos pela massa' },
      guide: '/explore/what-is-a-mole.html',
      nodes: [
        {
          id: 'u5-mole', kind: 'lesson', title: { en: 'What is a mole', pt: 'O que é o mol' },
          steps: [
            teach('Chemistry’s dozen', 'A dúzia da química',
              'One mole is 6.022 × 10²³ particles (Avogadro’s number). The molar mass, in g/mol, is the mass of one mole: carbon is 12.011 g/mol.',
              'Um mol são 6,022 × 10²³ partículas (número de Avogadro). A massa molar, em g/mol, é a massa de um mol: o carbono tem 12,011 g/mol.'),
            q('concept', 'One mole contains…', 'Um mol contém…', opts(['6.022 × 10²³ particles', '1000 particles', '12 particles', '1 gram'], ['6,022 × 10²³ partículas', '1000 partículas', '12 partículas', '1 grama']), 0, 'Avogadro’s number, exact since 2019.', 'O número de Avogadro, exato desde 2019.'),
            q('calculate', '36 g of water (18 g/mol) is how many moles?', '36 g de água (18 g/mol) são quantos mols?', same(['2', '0.5', '18', '648']), 0, 'n = m ÷ M = 36 ÷ 18 = 2 mol.', 'n = m ÷ M = 36 ÷ 18 = 2 mol.')
          ]
        },
        {
          id: 'u5-molar', kind: 'practice', rounds: 2, title: { en: 'Molar mass', pt: 'Massa molar' },
          steps: [
            q('calculate', 'Molar mass of H₂O? (H = 1, O = 16)', 'Massa molar da H₂O? (H = 1, O = 16)', same(['18 g/mol', '17 g/mol', '32 g/mol', '10 g/mol']), 0, '2 × 1 + 16 = 18.', '2 × 1 + 16 = 18.'),
            q('calculate', 'Molar mass of CO₂? (C = 12, O = 16)', 'Massa molar do CO₂? (C = 12, O = 16)', same(['44 g/mol', '28 g/mol', '40 g/mol', '56 g/mol']), 0, '12 + 2 × 16 = 44.', '12 + 2 × 16 = 44.'),
            q('calculate', 'Molar mass of O₂? (O = 16)', 'Massa molar do O₂? (O = 16)', same(['32 g/mol', '16 g/mol', '8 g/mol', '64 g/mol']), 0, '2 × 16 = 32.', '2 × 16 = 32.'),
            q('calculate', 'Molar mass of CH₄? (C = 12, H = 1)', 'Massa molar do CH₄? (C = 12, H = 1)', same(['16 g/mol', '13 g/mol', '14 g/mol', '20 g/mol']), 0, '12 + 4 × 1 = 16.', '12 + 4 × 1 = 16.'),
            q('calculate', 'Molar mass of NaCl? (Na = 23, Cl = 35.5)', 'Massa molar do NaCl? (Na = 23, Cl = 35,5)', same(['58.5 g/mol', '35.5 g/mol', '46 g/mol', '71 g/mol']), 0, '23 + 35.5 = 58.5.', '23 + 35,5 = 58,5.')
          ]
        },
        { id: 'u5-read', kind: 'reading', optional: true, title: { en: 'What is a Mole', pt: 'O que é o Mol' }, blurb: { en: 'Avogadro, molar mass and the three conversions.', pt: 'Avogadro, massa molar e as três conversões.' }, href: '/explore/what-is-a-mole.html' },
        { id: 'u5-bench', kind: 'bench', title: { en: 'Molar mass calculator', pt: 'Calculadora de massa molar' }, href: '/calculators.html#molar' },
        { id: 'u5-check', kind: 'checkpoint', title: { en: 'Unit checkpoint', pt: 'Checkpoint da unidade' } }
      ]
    },
    {
      id: 'u6', phase: 2, title: { en: 'Acids and bases', pt: 'Ácidos e bases' },
      subtitle: { en: 'pH, strength and neutralization', pt: 'pH, força e neutralização' },
      guide: '/explore/what-are-acids-and-bases.html',
      nodes: [
        {
          id: 'u6-ph', kind: 'lesson', title: { en: 'The pH scale', pt: 'A escala de pH' },
          steps: [
            teach('One unit, ten times', 'Uma unidade, dez vezes',
              'pH = −log[H⁺]. At 25 °C, 7 is neutral, below 7 is acidic and above 7 is basic. Each unit is a tenfold change in H⁺.',
              'pH = −log[H⁺]. A 25 °C, 7 é neutro, abaixo de 7 é ácido e acima de 7 é básico. Cada unidade é uma mudança de dez vezes no H⁺.'),
            q('concept', 'Lemon juice (pH ≈ 2) is…', 'O suco de limão (pH ≈ 2) é…', opts(['Acidic', 'Basic', 'Neutral', 'Not a solution'], ['Ácido', 'Básico', 'Neutro', 'Não é solução']), 0, 'Below 7.', 'Abaixo de 7.'),
            q('concept', 'pH 3 compared with pH 4 has…', 'pH 3 comparado com pH 4 tem…', opts(['10 times more H⁺', '1 more H⁺', 'Half the H⁺', 'The same H⁺'], ['10 vezes mais H⁺', '1 H⁺ a mais', 'Metade do H⁺', 'O mesmo H⁺']), 0, 'The scale is logarithmic.', 'A escala é logarítmica.')
          ]
        },
        {
          id: 'u6-practice', kind: 'practice', rounds: 2, title: { en: 'Acids, bases and salts', pt: 'Ácidos, bases e sais' },
          steps: [
            q('concept', 'Bleach (pH ≈ 13) is…', 'A água sanitária (pH ≈ 13) é…', opts(['Basic', 'Acidic', 'Neutral', 'A salt'], ['Básica', 'Ácida', 'Neutra', 'Um sal']), 0, 'Above 7.', 'Acima de 7.'),
            q('concept', 'HCl + NaOH → ?', 'HCl + NaOH → ?', same(['NaCl + H₂O', 'NaOH + Cl₂', 'H₂ + NaClO', 'HCl + Na']), 0, 'Acid + base → salt + water.', 'Ácido + base → sal + água.'),
            q('concept', 'A strong acid…', 'Um ácido forte…', opts(['Ionizes completely in water', 'Is always concentrated', 'Has pH above 7', 'Does not dissolve'], ['Se ioniza completamente em água', 'É sempre concentrado', 'Tem pH acima de 7', 'Não se dissolve']), 0, 'Strength is about ionization, not concentration.', 'Força é sobre ionização, não concentração.'),
            q('concept', 'Brønsted–Lowry: a base is a proton…', 'Brønsted–Lowry: uma base é uma… de prótons', opts(['Acceptor', 'Donor', 'Destroyer', 'Source'], ['Receptora', 'Doadora', 'Destruidora', 'Fonte']), 0, 'Acids donate H⁺, bases accept it.', 'Ácidos doam H⁺, bases recebem.')
          ]
        },
        { id: 'u6-bench', kind: 'bench', title: { en: 'pH challenge on the bench', pt: 'Desafio de pH na bancada' }, href: '/app?section=lab&mode=bench&q=ph' },
        { id: 'u6-check', kind: 'checkpoint', title: { en: 'Unit checkpoint', pt: 'Checkpoint da unidade' } }
      ]
    }
  ];

  /* ── derived data ─────────────────────────────────────────────────── */
  function allNodes() {
    var out = [];
    UNITS.forEach(function (u) { u.nodes.forEach(function (n) { out.push({ unit: u, node: n }); }); });
    return out;
  }
  function findNode(id) { return allNodes().filter(function (r) { return r.node.id === id; })[0] || null; }

  function shuffle(list, seed) {
    var a = list.slice();
    var s = seed || 1;
    for (var i = a.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      var j = Math.floor((s / 233280) * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Options are stored with the right answer first; shuffle per play. */
  function playable(step, seed) {
    if (step.type !== 'choice') return step;
    var order = shuffle(step.options.map(function (_, i) { return i; }), seed);
    return Object.assign({}, step, { options: order.map(function (i) { return step.options[i]; }), answer: order.indexOf(step.answer) });
  }

  function withRefs(node) {
    return (node.steps || []).map(function (s, i) { return Object.assign({ ref: node.id + '#' + i }, s); });
  }
  function stepsFor(nodeId, seed) {
    var row = findNode(nodeId);
    if (!row) return [];
    var node = row.node;
    var steps;
    if (node.kind === 'checkpoint') {
      var pool = [];
      row.unit.nodes.forEach(function (n) { withRefs(n).forEach(function (s) { if (s.type === 'choice') pool.push(s); }); });
      steps = shuffle(pool, seed || 7).slice(0, 6);
    } else if (node.kind === 'practice') {
      steps = shuffle(withRefs(node), seed || 3);
    } else {
      steps = withRefs(node);
    }
    return steps.map(function (s, i) { return playable(s, (seed || 1) + i * 13); });
  }

  function symbolBlitz(seed) {
    return shuffle(NUCLIDES.filter(function (n) { return n.z > 1; }), seed).slice(0, 8).map(function (n, i) { return playable(symbolQ(n.sym), seed + i); });
  }
  function molarSeries(seed) {
    var u5 = UNITS.filter(function (u) { return u.id === 'u5'; })[0];
    var practice = u5.nodes.filter(function (n) { return n.id === 'u5-molar'; })[0];
    return shuffle(practice.steps, seed).map(function (s, i) { return playable(s, seed + i); });
  }

  /* ── progress (this device) ───────────────────────────────────────── */
  function today(d) {
    var x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function emptyState() { return { v: 1, done: {}, rounds: {}, xp: 0, days: {}, perfectDays: {}, benchDays: {}, mistakes: [] }; }
  function load(storage) {
    try {
      var raw = (storage || globalThis.localStorage).getItem(STORE_KEY);
      var s = raw ? JSON.parse(raw) : null;
      if (!s || s.v !== 1) return emptyState();
      ['done', 'rounds', 'days', 'perfectDays', 'benchDays'].forEach(function (k) { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
      if (!Array.isArray(s.mistakes)) s.mistakes = [];
      s.xp = Number(s.xp) || 0;
      return s;
    } catch (e) { return emptyState(); }
  }
  function save(state, storage) {
    try { (storage || globalThis.localStorage).setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function roundsNeeded(node) { return node.kind === 'practice' ? (node.rounds || 1) : 1; }
  function isDone(state, node) { return Boolean(state.done[node.id]); }
  function required(node) { return !node.optional; }

  /* Status for every node: done | current | open | locked. */
  function statuses(state) {
    var out = {};
    var blocked = false;
    var lockedSeen = false;
    var currentSet = false;
    allNodes().forEach(function (r) {
      var n = r.node;
      if (isDone(state, n)) { out[n.id] = 'done'; return; }
      /* Optional readings open as soon as the path reaches them (the step
         before is done or current) and never block what comes after. */
      if (!required(n)) { out[n.id] = lockedSeen ? 'locked' : 'open'; return; }
      if (blocked) { out[n.id] = 'locked'; lockedSeen = true; return; }
      out[n.id] = currentSet ? 'locked' : 'current';
      currentSet = true;
      blocked = true;
    });
    return out;
  }

  function unitProgress(state, unit) {
    var req = unit.nodes.filter(required);
    var done = req.filter(function (n) { return isDone(state, n); }).length;
    var minutes = req.reduce(function (sum, n) { return sum + (n.kind === 'bench' ? 5 : n.kind === 'practice' ? 4 * (n.rounds || 1) : 4); }, 0);
    return { done: done, total: req.length, complete: done === req.length, minutes: minutes };
  }

  function streak(state, now) {
    var d = now ? new Date(now) : new Date();
    var count = 0;
    if (!state.days[today(d)]) d.setDate(d.getDate() - 1);
    while (state.days[today(d)]) { count += 1; d.setDate(d.getDate() - 1); }
    return count;
  }

  function addXp(state, amount, now) {
    var key = today(now ? new Date(now) : undefined);
    state.xp += amount;
    state.days[key] = (Number(state.days[key]) || 0) + amount;
  }

  /* Record a finished play. Returns { xp, completed }. */
  function finish(state, nodeId, result, now) {
    var row = findNode(nodeId);
    if (!row) return { xp: 0, completed: false };
    var node = row.node;
    var key = today(now ? new Date(now) : undefined);
    var xp = XP[node.kind] || 10;
    if (node.kind === 'practice') {
      state.rounds[node.id] = Math.min(roundsNeeded(node), (Number(state.rounds[node.id]) || 0) + 1);
      if (state.rounds[node.id] >= roundsNeeded(node)) state.done[node.id] = { at: key };
    } else {
      state.done[node.id] = { at: key };
    }
    if (result && result.perfect && (node.kind === 'practice' || node.kind === 'checkpoint')) state.perfectDays[key] = true;
    if (node.kind === 'bench') state.benchDays[key] = true;
    if (result && Array.isArray(result.missed)) {
      result.missed.forEach(function (m) { if (state.mistakes.indexOf(m) < 0) state.mistakes.push(m); });
      state.mistakes = state.mistakes.slice(-40);
    }
    addXp(state, xp, now);
    return { xp: xp, completed: Boolean(state.done[node.id]) };
  }

  function missions(state, now) {
    var key = today(now ? new Date(now) : undefined);
    var xpToday = Number(state.days[key]) || 0;
    return [
      { id: 'xp', title: { en: 'Earn 50 XP', pt: 'Ganhe 50 XP' }, value: Math.min(xpToday, DAILY_GOAL), goal: DAILY_GOAL },
      { id: 'perfect', title: { en: 'Finish a practice without mistakes', pt: 'Faça uma prática sem errar' }, value: state.perfectDays[key] ? 1 : 0, goal: 1 },
      { id: 'bench', title: { en: 'Use the bench in a lesson', pt: 'Use a bancada em uma lição' }, value: state.benchDays[key] ? 1 : 0, goal: 1 }
    ];
  }

  function stats(state, now) {
    var key = today(now ? new Date(now) : undefined);
    return { streak: streak(state, now), xp: state.xp, today: Number(state.days[key]) || 0, goal: DAILY_GOAL };
  }

  /* Missed questions come back as a review round (question ids are
     "<nodeId>#<index>" into the node's own steps). */
  function questionById(id) {
    var parts = String(id).split('#');
    var row = findNode(parts[0]);
    if (!row || !row.node.steps) return null;
    return row.node.steps[Number(parts[1])] || null;
  }
  function reviewSteps(state, seed) {
    return state.mistakes.map(function (id) { var s = questionById(id); return s ? Object.assign({ ref: id }, s) : null; })
      .filter(Boolean).slice(0, 8).map(function (s, i) { return playable(s, (seed || 5) + i); });
  }

  return {
    UNITS: UNITS, XP: XP, DAILY_GOAL: DAILY_GOAL, STORE_KEY: STORE_KEY,
    allNodes: allNodes, findNode: findNode, stepsFor: stepsFor, symbolBlitz: symbolBlitz, molarSeries: molarSeries,
    load: load, save: save, statuses: statuses, unitProgress: unitProgress, roundsNeeded: roundsNeeded,
    finish: finish, missions: missions, stats: stats, reviewSteps: reviewSteps, questionById: questionById, today: today,
    emptyState: emptyState
  };
});
