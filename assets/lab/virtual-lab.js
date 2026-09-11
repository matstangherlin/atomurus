/* Atomurus Virtual Lab — allowlisted educational simulation. Deny by default. */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'atomurus-lab-v1';
  var MAX_SESSIONS = 24;
  var HISTORY_CAP = 24;
  var MAX_VESSELS = 18;
  var SAVE_MS = 400;

  var SUBSTANCES = {
    water: { id: 'water', name: 'Water', formula: 'H₂O', category: 'solvent', color: '#7EB6D9', state: 'liquid', ph: 7, allowed: true },
    nacl: { id: 'nacl', name: 'Sodium chloride', formula: 'NaCl', category: 'salt', color: '#F4F1E4', state: 'solid', allowed: true },
    sucrose: { id: 'sucrose', name: 'Sucrose', formula: 'C₁₂H₂₂O₁₁', category: 'sugar', color: '#F7E7C6', state: 'solid', allowed: true },
    citric_acid: { id: 'citric_acid', name: 'Citric acid', formula: 'C₆H₈O₇', category: 'acid', color: '#F3E27A', state: 'solid', ph: 2.2, allowed: true },
    bicarbonate: { id: 'bicarbonate', name: 'Sodium bicarbonate', formula: 'NaHCO₃', category: 'base', color: '#EEEAE0', state: 'solid', ph: 8.3, allowed: true },
    indicator: { id: 'indicator', name: 'Virtual pH indicator', formula: 'In', category: 'indicator', color: '#D9A7C7', state: 'liquid', allowed: true },
    cusulfate: { id: 'cusulfate', name: 'Copper sulfate', formula: 'CuSO₄', category: 'salt', color: '#3F8CDA', state: 'solid', allowed: true },
    fe: { id: 'fe', name: 'Iron', formula: 'Fe', category: 'element', color: '#8A8680', state: 'solid', allowed: true },
    cu: { id: 'cu', name: 'Copper', formula: 'Cu', category: 'element', color: '#C47A4A', state: 'solid', allowed: true },
    zn: { id: 'zn', name: 'Zinc', formula: 'Zn', category: 'element', color: '#C5CBD1', state: 'solid', allowed: true },
    s: { id: 's', name: 'Sulfur', formula: 'S', category: 'element', color: '#E3C95A', state: 'solid', allowed: true },
    c: { id: 'c', name: 'Carbon', formula: 'C', category: 'element', color: '#3A3732', state: 'solid', allowed: true },
    limonene: { id: 'limonene', name: 'Limonene', formula: 'C₁₀H₁₆', category: 'fragrance', color: '#E8C15A', family: 'citrus', note: 'top', allowed: true },
    linalool: { id: 'linalool', name: 'Linalool', formula: 'C₁₀H₁₈O', category: 'fragrance', color: '#C9D48A', family: 'floral', note: 'heart', allowed: true },
    vanillin: { id: 'vanillin', name: 'Vanillin', formula: 'C₈H₈O₃', category: 'fragrance', color: '#E6C39A', family: 'gourmand', note: 'base', allowed: true },
    carbon: { id: 'carbon', name: 'Carbon (graphite)', formula: 'C', category: 'allotrope', color: '#3A3732', state: 'solid', allowed: true, inventory: false },
    zno: { id: 'zno', name: 'Zinc oxide', formula: 'ZnO', category: 'mineral', color: '#F4F1EA', state: 'solid', allowed: true },
    tio2: { id: 'tio2', name: 'Titanium dioxide', formula: 'TiO₂', category: 'mineral', color: '#E8EEF2', state: 'solid', allowed: true },
    oil: { id: 'oil', name: 'Virtual carrier oil', formula: 'oil', category: 'solvent', color: '#E6D5A2', state: 'liquid', allowed: true }
  };

  var EQUIPMENT = {
    beaker: { type: 'beaker', capacityMl: 250, labelEn: 'Beaker', labelPt: 'Becker' },
    flask: { type: 'flask', capacityMl: 250, labelEn: 'Flask', labelPt: 'Erlenmeyer' },
    cylinder: { type: 'cylinder', capacityMl: 100, labelEn: 'Cylinder', labelPt: 'Proveta' },
    'volumetric-flask': { type: 'volumetric-flask', capacityMl: 100, labelEn: 'Volumetric flask', labelPt: 'Balão volumétrico' },
    'pipette-graduated': { type: 'pipette-graduated', capacityMl: 10, labelEn: 'Graduated pipette', labelPt: 'Pipeta graduada' },
    'pipette-volumetric': { type: 'pipette-volumetric', capacityMl: 25, labelEn: 'Volumetric pipette', labelPt: 'Pipeta volumétrica' },
    pipettor: { type: 'pipettor', capacityMl: 5, labelEn: 'Pipette filler', labelPt: 'Pipetador' },
    funnel: { type: 'funnel', capacityMl: 0, holds: false, labelEn: 'Funnel', labelPt: 'Funil' },
    mortar: { type: 'mortar', capacityMl: 80, labelEn: 'Mortar', labelPt: 'Almofariz' },
    piston: { type: 'piston', capacityMl: 20, labelEn: 'Syringe', labelPt: 'Pistão' },
    'test-tube': { type: 'test-tube', capacityMl: 20, labelEn: 'Test tube', labelPt: 'Tubo de ensaio' },
    'test-tube-capped': { type: 'test-tube-capped', capacityMl: 20, labelEn: 'Capped tube', labelPt: 'Tubo com tampa' },
    rack: { type: 'rack', capacityMl: 0, holds: false, labelEn: 'Test-tube rack', labelPt: 'Grade de tubos' },
    'separatory-funnel': { type: 'separatory-funnel', capacityMl: 250, labelEn: 'Separatory funnel', labelPt: 'Funil de decantação' },
    bunsen: { type: 'bunsen', capacityMl: 0, holds: false, heat: true, labelEn: 'Bunsen burner', labelPt: 'Bico de Bunsen' },
    'heating-gauze': { type: 'heating-gauze', capacityMl: 0, holds: false, heat: true, labelEn: 'Heating gauze', labelPt: 'Manta de aquecimento' },
    condenser: { type: 'condenser', capacityMl: 0, holds: false, labelEn: 'Condenser', labelPt: 'Condensador' }
  };

  var READY = [
    { id: 'saline_ready', labelEn: 'Saline (ready)', labelPt: 'Soro (pronto)', parts: [{ id: 'water', amount: 40 }, { id: 'nacl', amount: 8 }] },
    { id: 'cu_ready', labelEn: 'Copper sulfate solution', labelPt: 'Sulfato de cobre (pronto)', parts: [{ id: 'water', amount: 40 }, { id: 'cusulfate', amount: 8 }] },
    { id: 'sugar_ready', labelEn: 'Sugar solution', labelPt: 'Solução de açúcar', parts: [{ id: 'water', amount: 40 }, { id: 'sucrose', amount: 10 }] },
    { id: 'sunscreen_ready', labelEn: 'Mineral lotion (ready)', labelPt: 'Loção mineral (pronta)', parts: [{ id: 'water', amount: 20 }, { id: 'oil', amount: 15 }, { id: 'zno', amount: 8 }] },
    { id: 'accord_ready', labelEn: 'Citrus accord (ready)', labelPt: 'Acorde cítrico (pronto)', parts: [{ id: 'limonene', amount: 8 }, { id: 'linalool', amount: 6 }, { id: 'vanillin', amount: 4 }] }
  ];

  var DENIED = {
    cocaine: 1, heroin: 1, methamphetamine: 1, meth: 1, fentanyl: 1, mdma: 1,
    tnt: 1, c4: 1, dynamite: 1, rdx: 1, anfo: 1, nitroglycerin: 1,
    ricin: 1, sarin: 1, vx: 1, cyanide: 1, chlorine_gas: 1, mustard_gas: 1,
    gunpowder: 1, black_powder: 1, thermite: 1, napalm: 1, ricinolo: 1,
    cocaina: 1, heroina: 1, metanfetamina: 1, explosivo: 1, bomba: 1, explosivos: 1,
    veneno: 1, poison: 1, bomba_caseira: 1
  };

  var ALIASES = {
    h2o: 'water', agua: 'water', água: 'water', salt: 'nacl', 'sodium chloride': 'nacl',
    sugar: 'sucrose', 'citric acid': 'citric_acid', baking_soda: 'bicarbonate',
    'sodium bicarbonate': 'bicarbonate', lemon: 'limonene', vanilla: 'vanillin',
    graphite: 'carbon', diamond: 'guided:diamond', perfume: 'guided:fragrance',
    fragrance: 'guided:fragrance', solution: 'guided:solution', ph: 'guided:ph',
    crystal: 'guided:crystal', 'acid base': 'guided:ph', iron: 'fe', ferro: 'fe',
    copper: 'cu', cobre: 'cu', zinc: 'zn', zinco: 'zn', sulfur: 's', enxofre: 's',
    'copper sulfate': 'cusulfate', 'sulfato de cobre': 'cusulfate', carbon: 'c',
    sunscreen: 'guided:sunscreen', 'protetor solar': 'guided:sunscreen', protetor: 'guided:sunscreen',
    'zinc oxide': 'zno', 'oxido de zinco': 'zno', 'óxido de zinco': 'zno',
    'titanium dioxide': 'tio2', oil: 'oil', oleo: 'oil', óleo: 'oil'
  };

  var CREATIONS = [
    {
      id: 'solution',
      slug: 'prepare-a-solution',
      title: { en: 'Prepare a Solution', pt: 'Preparar uma solução' },
      category: 'Solutions',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: true,
      lede: {
        en: 'Dissolve a virtual solute and read concentration, volume and appearance.',
        pt: 'Dissolva um soluto virtual e leia concentração, volume e aparência.'
      },
      stages: ['choose', 'dissolve', 'measure']
    },
    {
      id: 'fragrance',
      slug: 'create-a-fragrance-accord',
      title: { en: 'Create a Fragrance Accord', pt: 'Criar um acorde de fragrância' },
      category: 'Fragrance',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: true,
      lede: {
        en: 'Compose top, heart and base notes. This is a virtual olfactory family, not a manufacturing recipe.',
        pt: 'Componha notas de topo, coração e fundo. É uma família olfativa virtual, não uma receita de fabricação.'
      },
      stages: ['notes', 'balance', 'observe']
    },
    {
      id: 'diamond',
      slug: 'explore-artificial-diamond',
      title: { en: 'Explore Artificial Diamond Formation', pt: 'Explorar a formação do diamante' },
      category: 'Materials',
      difficulty: { en: 'Intermediate', pt: 'Intermediário' },
      access: 'account',
      demo: false,
      educational: true,
      lede: {
        en: 'A conceptual simulation of carbon allotropes. Not a procedure for high-pressure equipment.',
        pt: 'Simulação conceitual de alótropos de carbono. Não é um procedimento de equipamento de alta pressão.'
      },
      stages: ['structure', 'conditions', 'result']
    },
    {
      id: 'ph',
      slug: 'ph-challenge',
      title: { en: 'pH Challenge', pt: 'Desafio de pH' },
      category: 'Solutions',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: true,
      lede: {
        en: 'Mix approved acidic and basic materials and measure a virtual pH.',
        pt: 'Misture materiais ácidos e básicos aprovados e meça um pH virtual.'
      },
      stages: ['mix', 'measure', 'neutral']
    },
    {
      id: 'crystal',
      slug: 'crystal-growth',
      title: { en: 'Crystal Growth Simulation', pt: 'Crescimento de cristal' },
      category: 'Crystals',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: false,
      lede: {
        en: 'Evaporate a virtual solution and observe crystal growth conceptually.',
        pt: 'Evapore uma solução virtual e observe o crescimento cristalino de forma conceitual.'
      },
      stages: ['dissolve', 'evaporate', 'observe']
    },
    {
      id: 'sunscreen',
      slug: 'virtual-mineral-sunscreen',
      title: { en: 'Virtual mineral sunscreen', pt: 'Protetor solar virtual' },
      category: 'Cosmetics',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: true,
      educational: true,
      lede: {
        en: 'A conceptual mineral emulsion with zinc oxide. Not a manufacturing recipe and not an SPF claim.',
        pt: 'Emulsão mineral conceitual com óxido de zinco. Não é receita de fabricação nem alegação de FPS.'
      },
      stages: ['choose', 'disperse', 'emulsify', 'observe'],
      tutorial: [
        { id: 'base', need: { water: true, oil: true }, en: 'Add water and virtual carrier oil to a beaker.', pt: 'Coloque água e óleo virtual em um becker.' },
        { id: 'filter', needAny: ['zno', 'tio2'], en: 'Disperse zinc oxide or titanium dioxide into the base.', pt: 'Dispersar óxido de zinco ou dióxido de titânio na base.' },
        { id: 'stir', stir: true, en: 'Stir to form a virtual emulsion.', pt: 'Agite para formar uma emulsão virtual.' },
        { id: 'observe', product: 'sunscreen', en: 'Read the inspector. This models a mineral UV filter, not a real SPF.', pt: 'Leia o inspetor. Isto modela um filtro UV mineral, não um FPS real.' }
      ]
    }
  ];

  function nowIso() { return new Date().toISOString(); }

  function uid() {
    return 'lab_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function norm(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function logDeny(kind, query) {
    try {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[atomurus-lab] blocked', kind, String(query || '').slice(0, 80));
      }
    } catch (e) {}
  }

  function resolveQuery(raw) {
    var q = norm(raw);
    if (!q) return { ok: false, reason: 'empty' };
    if (DENIED[q] || DENIED[q.replace(/\s+/g, '_')]) {
      logDeny('denied', q);
      return { ok: false, reason: 'unavailable', educational: '/explore.html' };
    }
    if (ALIASES[q] && String(ALIASES[q]).indexOf('guided:') === 0) {
      return { ok: true, kind: 'creation', id: ALIASES[q].slice(7) };
    }
    var sid = ALIASES[q] || q;
    if (SUBSTANCES[sid] && SUBSTANCES[sid].allowed) return { ok: true, kind: 'substance', id: sid };
    var creation = CREATIONS.filter(function (row) {
      return row.id === q || row.slug === q || norm(row.title.en) === q || norm(row.title.pt) === q;
    })[0];
    if (creation) return { ok: true, kind: 'creation', id: creation.id };
    logDeny('unknown', q);
    return { ok: false, reason: 'unknown', explore: '/explore.html' };
  }

  function vesselLetter(index) {
    return String.fromCharCode(65 + (index % 26));
  }

  function defaultPos(index) {
    return {
      x: 56 + (index % 5) * 148,
      y: 48 + Math.floor(index / 5) * 210
    };
  }

  function canHold(container) {
    if (!container) return false;
    var spec = EQUIPMENT[container.type] || {};
    if (spec.holds === false) return false;
    return (Number(container.capacityMl) || 0) > 0;
  }

  function makeVessel(type, index) {
    var spec = EQUIPMENT[type] || EQUIPMENT.beaker;
    var pos = defaultPos(index);
    return {
      id: spec.type + '-' + vesselLetter(index).toLowerCase(),
      type: spec.type,
      label: spec.labelEn + ' ' + vesselLetter(index),
      capacityMl: spec.capacityMl || 0,
      volumeMl: 0,
      temperatureC: 22,
      contents: [],
      appearance: 'empty',
      x: pos.x,
      y: pos.y
    };
  }

  function emptySession(opts) {
    opts = opts || {};
    return {
      id: uid(),
      title: opts.title || 'Open Bench',
      mode: opts.mode || 'bench',
      creationId: opts.creationId || '',
      lang: opts.lang || 'en',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      selectedId: 'beaker-a',
      containers: [
        makeVessel('beaker', 0),
        makeVessel('flask', 1),
        makeVessel('cylinder', 2)
      ],
      inventory: Object.keys(SUBSTANCES),
      measurements: [],
      observations: [],
      history: [],
      stage: 0,
      result: ''
    };
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : { sessions: [] };
      if (!Array.isArray(data.sessions)) data.sessions = [];
      return data;
    } catch (e) {
      return { sessions: [] };
    }
  }

  function writeStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function listSessions() {
    return loadStore().sessions.slice().sort(function (a, b) {
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });
  }

  function saveSession(session) {
    if (!session) return session;
    session.updatedAt = nowIso();
    var store = loadStore();
    var i = 0;
    var found = false;
    for (i = 0; i < store.sessions.length; i += 1) {
      if (store.sessions[i].id === session.id) {
        store.sessions[i] = session;
        found = true;
        break;
      }
    }
    if (!found) store.sessions.unshift(session);
    if (store.sessions.length > MAX_SESSIONS) store.sessions = store.sessions.slice(0, MAX_SESSIONS);
    writeStore(store);
    return session;
  }

  function snapshot(session) {
    try { return JSON.parse(JSON.stringify(session)); } catch (e) { return session; }
  }

  function pushHistory(session) {
    session.history = (session.history || []).concat([snapshot({
      containers: session.containers,
      measurements: session.measurements,
      stage: session.stage,
      selectedId: session.selectedId
    })]);
    if (session.history.length > HISTORY_CAP) session.history = session.history.slice(-HISTORY_CAP);
  }

  function line(session, en, pt) {
    return (session && session.lang === 'pt' && pt) ? pt : en;
  }

  function observe(session, text) {
    session.observations = (session.observations || []).concat([{ at: nowIso(), text: text }]);
    if (session.observations.length > 80) session.observations = session.observations.slice(-80);
  }

  function findContainer(session, id) {
    return (session.containers || []).filter(function (row) { return row.id === id; })[0];
  }

  function containerMass(container) {
    return (container.contents || []).reduce(function (sum, row) {
      return sum + (Number(row.amount) || 0);
    }, 0);
  }

  function hexRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!n && n !== 0) return { r: 126, g: 182, b: 217 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixColor(container) {
    var contents = container.contents || [];
    if (!contents.length) return 'transparent';
    var hasIndicator = contents.some(function (row) { return row.id === 'indicator'; });
    if (hasIndicator && container.ph != null) {
      var ph = Number(container.ph);
      if (ph < 4) return '#E06B6B';
      if (ph < 6) return '#E6A15A';
      if (ph < 8) return '#7EBF7A';
      if (ph < 10) return '#5B8FD9';
      return '#8A6BBF';
    }
    var r = 0;
    var g = 0;
    var b = 0;
    var w = 0;
    contents.forEach(function (row) {
      var spec = SUBSTANCES[row.id];
      if (!spec) return;
      var amt = Number(row.amount) || 1;
      var rgb = hexRgb(spec.color);
      r += rgb.r * amt;
      g += rgb.g * amt;
      b += rgb.b * amt;
      w += amt;
    });
    if (!w) return 'transparent';
    return 'rgb(' + Math.round(r / w) + ',' + Math.round(g / w) + ',' + Math.round(b / w) + ')';
  }

  function mixContainer(container) {
    var contents = container.contents || [];
    var volume = Number(container.volumeMl) || 0;
    var acids = 0;
    var bases = 0;
    var salts = 0;
    var copper = 0;
    var notes = { top: 0, heart: 0, base: 0 };
    var elements = 0;
    var minerals = 0;
    var oilAmt = 0;
    var fizz = false;
    contents.forEach(function (row) {
      var spec = SUBSTANCES[row.id];
      if (!spec) return;
      var amt = Number(row.amount) || 0;
      if (spec.category === 'acid') acids += amt;
      if (spec.category === 'base') bases += amt;
      if (spec.category === 'salt') salts += amt;
      if (spec.category === 'mineral') minerals += amt;
      if (spec.id === 'oil') oilAmt += amt;
      if (spec.id === 'cusulfate') copper += amt;
      if (spec.category === 'element') elements += amt;
      if (spec.note) notes[spec.note] += amt;
    });
    fizz = acids > 0 && bases > 0 && volume > 0;
    var ph = 7;
    if (acids || bases) {
      var net = bases - acids;
      ph = Math.max(1, Math.min(13, 7 + net * 0.08));
    }
    var appearance = 'clear';
    if (!contents.length) appearance = 'empty';
    else if (minerals && (oilAmt || volume)) appearance = 'mineral emulsion';
    else if (oilAmt && volume) appearance = 'emulsion';
    else if (notes.top + notes.heart + notes.base > 0) appearance = 'fragrance accord';
    else if (copper && volume) appearance = 'blue solution';
    else if (fizz) appearance = 'effervescent mixture';
    else if (salts && volume) appearance = 'saline solution';
    else if (acids && bases) appearance = 'neutralized mixture';
    else if (acids) appearance = 'acidic solution';
    else if (bases) appearance = 'basic solution';
    else if (elements && !volume) appearance = 'dry sample';
    else if (elements && (Number(container.temperatureC) || 22) >= 40) appearance = 'warm suspension';
    else if (elements) appearance = 'suspension';
    container.ph = Math.round(ph * 10) / 10;
    container.appearance = appearance;
    container.color = mixColor(container);
    container.fizz = fizz;
    container.modeled = Boolean(contents.length);
    var product = identifyProduct(container);
    container.productId = product ? product.id : '';
    container.product = product ? product.en : '';
    container.productPt = product ? product.pt : '';
    return container;
  }

  function identifyProduct(container) {
    var has = {};
    (container.contents || []).forEach(function (row) {
      if ((Number(row.amount) || 0) > 0.05) has[row.id] = true;
    });
    var wet = (Number(container.volumeMl) || 0) > 0;
    var warm = (Number(container.temperatureC) || 22) >= 40;
    if ((has.zno || has.tio2) && has.oil && wet) {
      return { id: 'sunscreen', en: 'Virtual mineral sunscreen', pt: 'Protetor solar virtual' };
    }
    if (has.oil && wet) {
      return { id: 'emulsion', en: 'Virtual emulsion', pt: 'Emulsão virtual' };
    }
    if (has.citric_acid && has.bicarbonate && wet) {
      return { id: 'fizz', en: 'Effervescent mixture', pt: 'Mistura efervescente' };
    }
    if (has.indicator && wet) {
      return { id: 'indicator-mix', en: 'pH indicator mixture', pt: 'Mistura com indicador de pH' };
    }
    if (has.cusulfate && wet) {
      return { id: 'cu-sol', en: 'Copper sulfate solution', pt: 'Solução de sulfato de cobre' };
    }
    if (has.nacl && wet) {
      return { id: 'saline', en: 'Saline solution', pt: 'Solução salina' };
    }
    if (has.sucrose && wet) {
      return { id: 'sugar-sol', en: 'Sugar solution', pt: 'Solução de açúcar' };
    }
    if (has.limonene || has.linalool || has.vanillin) {
      return { id: 'accord', en: 'Fragrance accord', pt: 'Acorde de fragrância' };
    }
    if (has.cu && has.zn) {
      return { id: 'brass', en: 'Copper–zinc mix', pt: 'Mistura cobre–zinco' };
    }
    if (has.fe && has.s) {
      return { id: 'fes', en: 'Iron–sulfur mix', pt: 'Mistura ferro–enxofre' };
    }
    if (has.fe && wet) {
      return {
        id: warm ? 'iron-warm' : 'iron-water',
        en: warm ? 'Warm iron–water mix' : 'Iron in water',
        pt: warm ? 'Mistura quente de ferro e água' : 'Ferro em água'
      };
    }
    return null;
  }

  function noteProduct(session, container, beforeId) {
    if (container.productId && container.productId !== beforeId) {
      var name = line(session, container.product, container.productPt);
      observe(session, line(session, 'Created: ' + name + '.', 'Criou: ' + name + '.'));
    }
  }

  function visualFillPct(container) {
    var vol = Number(container.volumeMl) || 0;
    var cap = Math.max(1, Number(container.capacityMl) || 1);
    if (vol <= 0) return 0;
    return Math.round(Math.max(18, Math.min(96, 12 + (vol / cap) * 84)));
  }

  function emptyContainer(session, containerId) {
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    if (!(container.contents || []).length && !(Number(container.volumeMl) || 0)) {
      return { ok: true, container: container };
    }
    pushHistory(session);
    container.contents = [];
    container.volumeMl = 0;
    mixContainer(container);
    observe(session, line(session, 'Emptied ' + (container.label || container.id) + '.', 'Esvaziou ' + (container.label || container.id) + '.'));
    return { ok: true, container: container };
  }

  function ensureWorkbench(session) {
    if (!session.containers) session.containers = [];
    var types = {};
    session.containers.forEach(function (row, i) {
      types[row.type || 'beaker'] = true;
      if (!isFinite(Number(row.x)) || !isFinite(Number(row.y))) {
        var pos = defaultPos(i);
        row.x = pos.x;
        row.y = pos.y;
      }
    });
    if (!session.containers.length) session.containers.push(makeVessel('beaker', 0));
    if (!types.flask && session.containers.length < MAX_VESSELS) session.containers.push(makeVessel('flask', 1));
    if (!types.cylinder && session.containers.length < MAX_VESSELS) session.containers.push(makeVessel('cylinder', 2));
    if (!session.selectedId) session.selectedId = session.containers[0].id;
    return session;
  }

  function addToContainer(session, containerId, substanceId, amount, unit) {
    var resolved = resolveQuery(substanceId);
    if (!resolved.ok || resolved.kind !== 'substance') {
      return { ok: false, reason: resolved.reason || 'unavailable' };
    }
    var spec = SUBSTANCES[resolved.id];
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    if (!canHold(container)) {
      observe(session, line(session, 'That tool does not hold a mixture.', 'Essa ferramenta não retém mistura.'));
      return { ok: false, reason: 'tool' };
    }
    var qty = Math.max(0.1, Number(amount) || 1);
    var nextVol = Number(container.volumeMl) || 0;
    if (spec.state === 'liquid') nextVol += qty;
    if (nextVol > container.capacityMl + 0.05) {
      observe(session, line(session, (container.label || container.id) + ' is full.', (container.label || container.id) + ' está cheio.'));
      return { ok: false, reason: 'full' };
    }
    pushHistory(session);
    var beforeProduct = container.productId || '';
    var existing = (container.contents || []).filter(function (row) { return row.id === spec.id; })[0];
    if (existing) existing.amount += qty;
    else container.contents.push({ id: spec.id, amount: qty, unit: unit || (spec.state === 'liquid' ? 'mL' : 'g') });
    if (spec.state === 'liquid') container.volumeMl = Math.min(container.capacityMl, (Number(container.volumeMl) || 0) + qty);
    mixContainer(container);
    observe(session, line(
      session,
      'Added virtual ' + spec.name + ' (' + spec.formula + ') to ' + (container.label || container.id) + '.',
      'Adicionou ' + spec.name + ' (' + spec.formula + ') virtual em ' + (container.label || container.id) + '.'
    ));
    noteProduct(session, container, beforeProduct);
    return { ok: true, container: container };
  }

  function pour(session, fromId, toId, amount) {
    if (fromId === toId) return { ok: false, reason: 'same' };
    var from = findContainer(session, fromId);
    var to = findContainer(session, toId);
    if (!from || !to) return { ok: false, reason: 'no-container' };
    if (!canHold(to)) return { ok: false, reason: 'tool' };
    mixContainer(from);
    var vol = Number(from.volumeMl) || 0;
    if (vol <= 0) return { ok: false, reason: 'empty' };
    var room = Math.max(0, (Number(to.capacityMl) || 0) - (Number(to.volumeMl) || 0));
    var qty = Math.min(vol, Number(amount) > 0 ? Number(amount) : vol, room);
    if (qty <= 0) {
      observe(session, line(session, (to.label || to.id) + ' is full.', (to.label || to.id) + ' está cheio.'));
      return { ok: false, reason: 'full' };
    }
    pushHistory(session);
    var beforeProduct = to.productId || '';
    var ratio = qty / vol;
    to.contents = to.contents || [];
    (from.contents || []).forEach(function (row) {
      var move = (Number(row.amount) || 0) * ratio;
      row.amount -= move;
      var dest = to.contents.filter(function (item) { return item.id === row.id; })[0];
      if (dest) dest.amount += move;
      else to.contents.push({ id: row.id, amount: move, unit: row.unit });
    });
    from.contents = (from.contents || []).filter(function (row) { return Number(row.amount) > 0.05; });
    from.volumeMl = Math.max(0, Math.round((vol - qty) * 10) / 10);
    to.volumeMl = Math.round(((Number(to.volumeMl) || 0) + qty) * 10) / 10;
    mixContainer(from);
    mixContainer(to);
    observe(session, line(
      session,
      'Poured ' + qty + ' mL from ' + (from.label || from.id) + ' into ' + (to.label || to.id) + '.',
      'Transferiu ' + qty + ' mL de ' + (from.label || from.id) + ' para ' + (to.label || to.id) + '.'
    ));
    noteProduct(session, to, beforeProduct);
    return { ok: true, amount: qty };
  }

  function addVessel(session, type) {
    var spec = EQUIPMENT[type] || EQUIPMENT.beaker;
    if ((session.containers || []).length >= MAX_VESSELS) return { ok: false, reason: 'limit' };
    pushHistory(session);
    var vessel = makeVessel(spec.type, session.containers.length);
    vessel.id = spec.type + '-' + uid().slice(-5);
    session.containers.push(vessel);
    session.selectedId = vessel.id;
    observe(session, line(session, 'Added ' + (vessel.label || spec.type) + ' to the bench.', 'Adicionou ' + (vessel.label || spec.type) + ' à bancada.'));
    return { ok: true, container: vessel };
  }

  function setTemperature(session, containerId, next) {
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    var temp = Math.max(5, Math.min(95, Number(next)));
    if (temp === container.temperatureC) return { ok: true, container: container };
    pushHistory(session);
    container.temperatureC = temp;
    var beforeProduct = container.productId || '';
    observe(session, line(session, (container.label || container.id) + ' is now ' + temp + ' °C (virtual).', (container.label || container.id) + ' está a ' + temp + ' °C (virtual).'));
    mixContainer(container);
    noteProduct(session, container, beforeProduct);
    return { ok: true, container: container };
  }

  function measure(session, containerId, kind) {
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    mixContainer(container);
    var value = null;
    var unit = '';
    if (kind === 'volume') { value = container.volumeMl; unit = 'mL'; }
    else if (kind === 'mass') { value = Math.round(containerMass(container) * 10) / 10; unit = 'g'; }
    else if (kind === 'temperature') { value = container.temperatureC; unit = '°C'; }
    else if (kind === 'ph') { value = container.ph; unit = ''; }
    else return { ok: false, reason: 'unknown-measure' };
    var row = { at: nowIso(), kind: kind, value: value, unit: unit, containerId: containerId };
    session.measurements = (session.measurements || []).concat([row]);
    observe(session, 'Measured ' + kind + ': ' + value + (unit ? ' ' + unit : '') + '.');
    return { ok: true, row: row };
  }

  function addReady(session, kitId, containerId) {
    var kit = READY.filter(function (row) { return row.id === kitId; })[0];
    if (!kit) return { ok: false, reason: 'unknown' };
    var container = findContainer(session, containerId);
    if (!canHold(container)) return { ok: false, reason: 'no-container' };
    pushHistory(session);
    var beforeProduct = container.productId || '';
    kit.parts.forEach(function (part) {
      var spec = SUBSTANCES[part.id];
      if (!spec || !spec.allowed) return;
      var qty = Math.max(0.1, Number(part.amount) || 1);
      var existing = (container.contents || []).filter(function (row) { return row.id === spec.id; })[0];
      if (existing) existing.amount += qty;
      else container.contents.push({ id: spec.id, amount: qty, unit: spec.state === 'liquid' ? 'mL' : 'g' });
      if (spec.state === 'liquid') {
        container.volumeMl = Math.min(container.capacityMl, (Number(container.volumeMl) || 0) + qty);
      }
    });
    mixContainer(container);
    observe(session, line(
      session,
      'Added ready mixture (' + (kit.labelEn || kit.id) + ') to ' + (container.label || container.id) + '.',
      'Adicionou mistura pronta (' + (kit.labelPt || kit.labelEn || kit.id) + ') em ' + (container.label || container.id) + '.'
    ));
    noteProduct(session, container, beforeProduct);
    return { ok: true, container: container };
  }

  function tutorialProgressFor(session, creation, container) {
    if (!container) {
      return { current: 0, done: creation.tutorial.map(function () { return false; }) };
    }
    mixContainer(container);
    var has = {};
    (container.contents || []).forEach(function (row) {
      if ((Number(row.amount) || 0) > 0.05) has[row.id] = true;
    });
    var done = [];
    var current = 0;
    var unlocked = true;
    creation.tutorial.forEach(function (step, i) {
      var ok = unlocked;
      if (ok && step.need) {
        Object.keys(step.need).forEach(function (id) { if (!has[id]) ok = false; });
      }
      if (ok && step.needAny) ok = step.needAny.some(function (id) { return has[id]; });
      if (ok && step.stir && !session.stirred) ok = false;
      if (ok && step.product && container.productId !== step.product) ok = false;
      done[i] = ok;
      if (ok) current = i + 1;
      else unlocked = false;
    });
    return { current: current, done: done };
  }

  function tutorialState(session, creation) {
    if (!creation || !Array.isArray(creation.tutorial) || !creation.tutorial.length) return null;
    var containers = session.containers || [];
    var selected = findContainer(session, session.selectedId);
    var best = tutorialProgressFor(session, creation, selected || containers[0]);
    containers.forEach(function (container) {
      if (selected && container.id === selected.id) return;
      var next = tutorialProgressFor(session, creation, container);
      if (next.current > best.current) best = next;
    });
    return {
      current: best.current,
      steps: creation.tutorial,
      done: best.done,
      complete: best.current >= creation.tutorial.length
    };
  }

  function searchCatalog(raw) {
    var q = norm(raw);
    var resolved = resolveQuery(raw);
    if (resolved.reason === 'unavailable') {
      return { status: 'unavailable', items: [], message: 'This experiment isn\'t available in Atomurus Lab.' };
    }
    var items = [];
    CREATIONS.forEach(function (row) {
      var hay = [row.id, row.slug, row.title.en, row.title.pt, row.category].join(' ');
      if (!q || hay.toLowerCase().indexOf(q) !== -1 || (resolved.ok && resolved.kind === 'creation' && resolved.id === row.id)) {
        items.push({ type: 'creation', row: row });
      }
    });
    Object.keys(SUBSTANCES).forEach(function (id) {
      var spec = SUBSTANCES[id];
      var hay = [spec.id, spec.name, spec.formula, spec.category].join(' ');
      if (!q || hay.toLowerCase().indexOf(q) !== -1 || (resolved.ok && resolved.kind === 'substance' && resolved.id === id)) {
        items.push({ type: 'substance', row: spec });
      }
    });
    if (!items.length && q) return { status: 'unknown', items: [], message: 'This material is not available in the current Lab catalog.' };
    return { status: 'ok', items: items, resolved: resolved };
  }

  function labelOf(row, lang) {
    if (!row) return '';
    if (row.title) return (lang === 'pt' ? row.title.pt : row.title.en) || row.title.en;
    return row.name || row.id;
  }

  function mount(node, opts) {
    if (!node) return;
    if (node._labAbort && typeof node._labAbort.abort === 'function') {
      try { node._labAbort.abort(); } catch (e) {}
    }
    opts = opts || {};
    var lang = (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
    var user = opts.user || null;
    var section = opts.section || 'lab';
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { params = new URLSearchParams(); }
    var creationId = params.get('creation') || opts.creationId || '';
    var mode = params.get('mode') || opts.mode || (section === 'creations' ? 'guided' : (section === 'notebook' ? 'notebook' : 'bench'));
    var session = null;
    var sessions = listSessions();
    var last = sessions[0];
    if (params.get('session')) {
      session = sessions.filter(function (row) { return row.id === params.get('session'); })[0] || null;
    }
    if (!session && creationId) {
      var creation = CREATIONS.filter(function (row) { return row.id === creationId; })[0];
      session = emptySession({
        title: creation ? labelOf(creation, lang) : 'Guided creation',
        mode: 'guided',
        creationId: creationId,
        lang: lang
      });
    }
    if (!session && mode === 'bench') session = emptySession({ title: lang === 'pt' ? 'Bancada aberta' : 'Open Bench', mode: 'bench', lang: lang });
    if (!session) session = last || emptySession({ title: lang === 'pt' ? 'Bancada aberta' : 'Open Bench', lang: lang });
    session.lang = lang;
    ensureWorkbench(session);
    if (!session.selectedId) session.selectedId = (session.containers[0] || {}).id;
    var amount = 25;
    var pourFrom = '';
    var heatFrom = '';
    var panX = Number(session.panX) || 0;
    var panY = Number(session.panY) || 0;
    var zoom = Number(session.zoom) || 1;
    if (zoom < 0.5) zoom = 0.5;
    if (zoom > 1.6) zoom = 1.6;
    var saveTimer = 0;
    var stirTimer = 0;
    var lastStatus = '';
    var dragging = null;
    var dragMoved = false;
    var ignoreClickUntil = 0;
    var panning = false;
    var panStart = null;

    function copy(en, pt) { return lang === 'pt' ? pt : en; }
    function esc(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function selected() {
      return findContainer(session, session.selectedId) || session.containers[0];
    }
    function queueSave() {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        saveTimer = 0;
        saveSession(session);
      }, SAVE_MS);
    }
    function flushSave() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = 0;
      }
      saveSession(session);
    }

    function statusHtml(results) {
      if (!results) return '';
      if (results.status === 'unavailable') {
        return '<div class="lab-msg" role="status">' + esc(copy('This experiment isn\'t available in Atomurus Lab.', 'Este experimento não está disponível no Atomurus Lab.')) +
          ' <a href="/explore.html">' + esc(copy('Explore the chemistry concept instead.', 'Explore o conceito de química no Explore.')) + '</a></div>';
      }
      if (results.status === 'unknown') {
        return '<div class="lab-msg" role="status">' + esc(copy('This material is not available in the current Lab catalog.', 'Este material não está no catálogo atual do Lab.')) +
          ' <a href="/explore.html">' + esc(copy('Search Explore instead.', 'Buscar no Explore.')) + '</a></div>';
      }
      return '';
    }

    function inventoryHtml() {
      var groups = [
        { title: copy('Liquids', 'Líquidos'), ids: ['water', 'oil'] },
        { title: copy('Salts & sugars', 'Sais e açúcares'), ids: ['nacl', 'sucrose', 'cusulfate'] },
        { title: copy('Acids & bases', 'Ácidos e bases'), ids: ['citric_acid', 'bicarbonate', 'indicator'] },
        { title: copy('Elements', 'Elementos'), ids: ['fe', 'cu', 'zn', 's', 'c'] },
        { title: copy('Minerals', 'Minerais'), ids: ['zno', 'tio2'] },
        { title: copy('Fragrance notes', 'Notas de fragrância'), ids: ['limonene', 'linalool', 'vanillin'] }
      ];
      return groups.map(function (group) {
        return '<div class="lab-chip-group"><span class="lab-chip-group-title">' + esc(group.title) + '</span><div class="lab-chips">' +
          group.ids.map(function (id) {
            var spec = SUBSTANCES[id];
            if (!spec || spec.inventory === false) return '';
            return '<button type="button" class="lab-chip" data-add="' + esc(id) + '">' +
              '<i class="lab-chip-swatch" style="background:' + esc(spec.color) + '"></i>' +
              esc(spec.name) + '<span>' + esc(spec.formula) + '</span></button>';
          }).join('') + '</div></div>';
      }).join('');
    }

    function equipmentHtml() {
      var groups = [
        { title: copy('Glassware', 'Vidraria'), ids: ['beaker', 'flask', 'cylinder', 'volumetric-flask', 'test-tube', 'test-tube-capped', 'separatory-funnel'] },
        { title: copy('Transfer', 'Transferência'), ids: ['pipette-graduated', 'pipette-volumetric', 'pipettor', 'funnel', 'piston'] },
        { title: copy('Prep', 'Preparo'), ids: ['mortar', 'rack'] },
        { title: copy('Heat & setup', 'Aquecimento'), ids: ['bunsen', 'heating-gauze', 'condenser'] }
      ];
      return groups.map(function (group) {
        return '<div class="lab-chip-group"><span class="lab-chip-group-title">' + esc(group.title) + '</span><div class="lab-chips">' +
          group.ids.map(function (id) {
            var spec = EQUIPMENT[id];
            if (!spec) return '';
            return '<button type="button" class="lab-chip" data-add-vessel="' + esc(id) + '">' + esc(lang === 'pt' ? spec.labelPt : spec.labelEn) + '</button>';
          }).join('') + '</div></div>';
      }).join('');
    }

    function readyHtml() {
      return READY.map(function (kit) {
        return '<button type="button" class="lab-chip" data-ready="' + esc(kit.id) + '">' + esc(lang === 'pt' ? kit.labelPt : kit.labelEn) + '</button>';
      }).join('');
    }

    function tutorialHtml() {
      var creation = CREATIONS.filter(function (row) { return row.id === session.creationId; })[0];
      var state = tutorialState(session, creation);
      if (!state) return '';
      var items = state.steps.map(function (step, i) {
        var mark = state.done[i] ? ' is-done' : (i === state.current ? ' is-now' : '');
        return '<li class="lab-guide-step' + mark + '">' + esc(lang === 'pt' ? step.pt : step.en) + '</li>';
      }).join('');
      return '<section class="lab-guide" data-lab-guide>' +
        '<h2>' + esc(copy('Tutorial + practice', 'Tutorial + prática')) + '</h2>' +
        '<p class="ws-lede">' + esc(lang === 'pt' ? creation.lede.pt : creation.lede.en) + '</p>' +
        '<ol>' + items + '</ol>' +
        (state.complete ? '<p class="lab-guide-done">' + esc(copy('Practice complete (virtual).', 'Prática concluída (virtual).')) + '</p>' : '') +
        '</section>';
    }

    function vesselHtml(container) {
      mixContainer(container);
      var fill = canHold(container) ? visualFillPct(container) : 0;
      var sediment = 0;
      var solids = (container.contents || []).filter(function (row) {
        var spec = SUBSTANCES[row.id];
        return spec && spec.state === 'solid';
      });
      if (solids.length && canHold(container)) {
        sediment = Math.min(22, 6 + solids.reduce(function (sum, row) { return sum + (Number(row.amount) || 0); }, 0) * 0.35);
      }
      var color = container.color || mixColor(container);
      var active = container.id === session.selectedId;
      var kind = container.type || 'beaker';
      var pourCls = pourFrom === container.id ? ' is-pour-source' : (pourFrom && canHold(container) ? ' is-pour-target' : '');
      var heatCls = heatFrom === container.id ? ' is-heat-source' : '';
      var emulsion = String(container.appearance || '').indexOf('emulsion') !== -1 || container.productId === 'sunscreen';
      var cls = 'lab-glass lab-piece lab-' + kind + (kind === 'beaker' ? ' lab-beaker' : '') + (active ? ' is-active' : '') + (container.fizz ? ' is-fizz' : '') + (emulsion ? ' is-emulsion' : '') + pourCls + heatCls;
      var product = lang === 'pt' ? (container.productPt || container.product) : container.product;
      var x = Number(container.x);
      var y = Number(container.y);
      if (!isFinite(x)) x = 80;
      if (!isFinite(y)) y = 80;
      var holds = canHold(container);
      var body = holds
        ? ('<span class="lab-glass-body">' +
          (sediment ? '<span class="lab-sediment" style="height:' + sediment + '%"></span>' : '') +
          '<span class="lab-liquid' + (container.fizz ? ' is-fizz-liquid' : '') + (Number(container.volumeMl) > 0 ? ' is-filled' : '') + '" style="height:' + fill + '%;background:' + esc(color) + '"></span>' +
          '</span>')
        : '<span class="lab-tool-body">' + (kind === 'bunsen' ? '<span class="lab-flame" aria-hidden="true"></span>' : '') + '</span>';
      var meta = holds
        ? (esc(container.volumeMl) + ' / ' + esc(container.capacityMl) + ' mL')
        : esc(copy('Tool', 'Ferramenta'));
      return '<button type="button" class="' + cls + '" data-vessel="' + esc(container.id) + '" draggable="false" aria-pressed="' + (active ? 'true' : 'false') + '" style="left:' + x + 'px;top:' + y + 'px">' +
        body +
        '<span class="lab-glass-name">' + esc(container.label || kind) + '</span>' +
        '<span class="lab-glass-meta">' + meta + '</span>' +
        (product ? '<span class="lab-glass-product">' + esc(product) + '</span>' : '') +
        '</button>';
    }

    function inspectorHtml() {
      var container = selected();
      if (!container) return '';
      mixContainer(container);
      var contents = (container.contents || []).map(function (row) {
        var spec = SUBSTANCES[row.id];
        return esc((spec && spec.name) || row.id) + ' ' + esc(Math.round((Number(row.amount) || 0) * 10) / 10) + (row.unit ? ' ' + row.unit : '');
      }).join(' · ') || copy('Empty', 'Vazio');
      return '<div class="lab-kv"><span>' + esc(copy('Vessel', 'Vidro')) + '</span><strong>' + esc(container.label || container.id) + '</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Contents', 'Conteúdo')) + '</span><strong>' + contents + '</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Volume', 'Volume')) + '</span><strong>' + esc(container.volumeMl) + ' mL</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Mass', 'Massa')) + '</span><strong>' + esc(Math.round(containerMass(container) * 10) / 10) + ' g</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Temperature', 'Temperatura')) + '</span><strong>' + esc(container.temperatureC) + ' °C</strong></div>' +
        '<div class="lab-kv"><span>pH</span><strong>' + esc(container.ph == null ? '—' : container.ph) + '</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Appearance', 'Aparência')) + '</span><strong>' + esc(container.appearance) + '</strong></div>' +
        (container.product ? '<div class="lab-kv lab-kv-product"><span>' + esc(copy('Created', 'Criado')) + '</span><strong>' + esc(lang === 'pt' ? (container.productPt || container.product) : container.product) + '</strong></div>' : '') +
        (pourFrom ? '<p class="lab-pour-hint">' + esc(copy('Pouring: click another vessel to transfer.', 'Transferindo: clique em outro vidro para despejar.')) + '</p>' : '') +
        '<p class="ws-lede">' + esc(copy('Virtual laboratory simulation. Values are educational, not experimental.', 'Simulação de laboratório virtual. Os valores são educacionais, não experimentais.')) + '</p>' +
        '<div class="lab-measures">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="volume">' + esc(copy('Volume', 'Volume')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="mass">' + esc(copy('Mass', 'Massa')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="temperature">' + esc(copy('Temperature', 'Temperatura')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="ph">pH</button>' +
        '</div>';
    }

    function notesHtml() {
      var notes = (session.observations || []).slice(-8).reverse().map(function (row) {
        return '<li><time>' + esc(String(row.at).slice(11, 16)) + '</time> ' + esc(row.text) + '</li>';
      }).join('') || '<li>' + esc(copy('No observations yet.', 'Ainda não há observações.')) + '</li>';
      return notes;
    }

    function pulseLiquid() {
      if (document.documentElement.getAttribute('data-reduced-motion')) return;
      var liquid = node.querySelector('.lab-glass.is-active .lab-liquid') || node.querySelector('.lab-glass.is-fizz .lab-liquid');
      if (!liquid) return;
      liquid.classList.remove('is-stirring');
      void liquid.offsetWidth;
      liquid.classList.add('is-stirring');
      if (stirTimer) clearTimeout(stirTimer);
      stirTimer = setTimeout(function () {
        if (liquid.classList) liquid.classList.remove('is-stirring');
      }, 420);
    }

    function flashStatus(html) {
      lastStatus = html || '';
      var status = node.querySelector('[data-lab-status]');
      if (status) status.innerHTML = lastStatus;
    }

    function applyWorld() {
      var world = node.querySelector('[data-lab-world]');
      if (world) world.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
      session.panX = panX;
      session.panY = panY;
      session.zoom = zoom;
    }

    function updateLive() {
      var bench = node.querySelector('[data-lab-bench]');
      var inspector = node.querySelector('[data-lab-inspector]');
      var notes = node.querySelector('[data-lab-notes]');
      var guide = node.querySelector('[data-lab-guide-host]');
      var amounts = node.querySelectorAll('[data-amount]');
      if (bench && !dragging) bench.innerHTML = session.containers.map(vesselHtml).join('');
      if (inspector) inspector.innerHTML = inspectorHtml();
      if (notes) notes.innerHTML = notesHtml();
      if (guide) guide.innerHTML = tutorialHtml();
      amounts.forEach(function (btn) {
        btn.classList.toggle('is-on', Number(btn.getAttribute('data-amount')) === amount);
      });
      var pourBtn = node.querySelector('[data-lab-pour]');
      if (pourBtn) pourBtn.classList.toggle('is-on', Boolean(pourFrom));
      applyWorld();
    }

    function paint(results) {
      var searchValue = params.get('q') || '';
      results = results || (searchValue ? searchCatalog(searchValue) : { status: 'ok' });
      var creation = CREATIONS.filter(function (row) { return row.id === session.creationId; })[0];
      var guest = !user;
      var notice = guest
        ? '<p class="ws-lede">' + esc(copy('Create an account to save sessions. This demo stays on this device.', 'Crie uma conta para salvar sessões. Esta demonstração fica neste dispositivo.')) + '</p>'
        : '';
      var guided = CREATIONS.map(function (row) {
        return '<a class="ws-lab-card lab-creation-card" href="/app?section=lab&mode=guided&creation=' + esc(row.id) + '">' +
          '<span class="ws-lab-badge">' + esc(row.category) + '</span>' +
          '<h3 class="ws-lab-card-title">' + esc(labelOf(row, lang)) + '</h3>' +
          '<p class="ws-lab-card-copy">' + esc(lang === 'pt' ? row.lede.pt : row.lede.en) + '</p></a>';
      }).join('');
      var recent = listSessions().slice(0, 4).map(function (row) {
        return '<a class="ws-study-item" href="/app?section=lab&session=' + esc(row.id) + '"><div><h3 class="ws-item-title">' + esc(row.title) + '</h3>' +
          '<div class="ws-muted">' + esc(row.mode) + '</div></div></a>';
      }).join('');
      var diamondNote = session.creationId === 'diamond'
        ? '<div class="lab-msg">' + esc(copy(
          'This stage represents industrial carbon allotropes conceptually. It does not describe how to build or operate high-pressure equipment.',
          'Esta etapa representa alótropos de carbono de forma conceitual. Não descreve como construir ou operar equipamento de alta pressão.'
        )) + ' <a href="/viewer/allotropes.html">' + esc(copy('Open Allotropes viewer', 'Abrir o visualizador de alótropos')) + '</a></div>'
        : '';

      if (section === 'creations') {
        node.innerHTML = '<p class="ws-kicker">Atomurus Lab</p><h1 class="ws-title">' + esc(copy('Guided Creations', 'Criações guiadas')) + '</h1>' +
          '<p class="ws-lede">' + esc(copy('Search a curated catalog. The Lab never invents a chemical recipe from free text.', 'Pesquise um catálogo curado. O Lab nunca inventa uma receita química a partir de texto livre.')) + '</p>' +
          searchBar(searchValue) + statusHtml(results) +
          '<div class="ws-grid ws-public-grid">' + guided + '</div>';
        bind(node);
        return;
      }

      if (section === 'notebook') {
        node.innerHTML = '<p class="ws-kicker">Atomurus Lab</p><h1 class="ws-title">' + esc(copy('Lab Notebook', 'Caderno do Lab')) + '</h1>' +
          notice +
          (recent ? '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Recent sessions', 'Sessões recentes')) + '</h2><div class="ws-grid">' + recent + '</div></section>' : '') +
          '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Observations', 'Observações')) + '</h2><ol class="lab-notes" data-lab-notes>' + notesHtml() + '</ol></section>';
        return;
      }

      var root = node.querySelector('[data-lab-root]');
      if (root) {
        var status = node.querySelector('[data-lab-status]');
        if (status) status.innerHTML = statusHtml(results);
        updateLive();
        return;
      }

      node.innerHTML =
        '<div class="lab-board" data-lab-root>' +
        '<div class="lab-board-bar">' +
        '<div><p class="ws-kicker">Atomurus Lab</p>' +
        '<h1 class="ws-title">' + esc(session.title || copy('Creation board', 'Board de criação')) + '</h1></div>' +
        '<form class="lab-search" data-lab-search>' +
        '<label class="lc-sr-only" for="lab-q">' + esc(copy('What would you like to create?', 'O que você quer criar?')) + '</label>' +
        '<input id="lab-q" name="q" type="search" value="' + esc(searchValue) + '" placeholder="' + esc(copy('What would you like to create?', 'O que você quer criar?')) + '" autocomplete="off">' +
        '<button type="submit" class="ws-btn ws-btn-secondary">' + esc(copy('Search catalog', 'Pesquisar catálogo')) + '</button>' +
        '</form>' +
        '<div class="lab-toolbar">' +
        '<a class="ws-btn ws-btn-secondary" href="/app?section=lab&mode=bench">' + esc(copy('Open Bench', 'Bancada aberta')) + '</a>' +
        '<a class="ws-btn ws-btn-secondary" href="/app?section=creations">' + esc(copy('Guided Creations', 'Criações guiadas')) + '</a>' +
        '<button type="button" class="ws-btn" data-lab-zoom="out">−</button>' +
        '<button type="button" class="ws-btn" data-lab-zoom="in">+</button>' +
        '<button type="button" class="ws-btn" data-lab-undo>' + esc(copy('Undo', 'Desfazer')) + '</button>' +
        '<button type="button" class="ws-btn" data-lab-reset>' + esc(copy('Reset', 'Reiniciar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-primary" data-lab-save>' + esc(copy('Save session', 'Salvar sessão')) + '</button>' +
        '</div></div>' +
        notice + diamondNote +
        '<div data-lab-status>' + statusHtml(results) + '</div>' +
        '<div class="lab-board-layout">' +
        '<aside class="lab-board-rail lab-pane">' +
        '<h2>' + esc(copy('Add to board', 'Adicionar ao board')) + '</h2>' +
        equipmentHtml() +
        '<h2>' + esc(copy('Ready mixtures', 'Misturas prontas')) + '</h2>' +
        '<div class="lab-chips">' + readyHtml() + '</div>' +
        '<p class="ws-lede">' + esc(copy('Drag pieces on the free board. Scroll to zoom. The catalog stays allowlisted.', 'Arraste peças no board livre. Role para zoom. O catálogo continua allowlist.')) + '</p>' +
        '</aside>' +
        '<section class="lab-pane lab-bench lab-board-stage-wrap">' +
        '<div class="lab-board-stage" data-lab-stage>' +
        '<div class="lab-board-world" data-lab-world data-lab-bench>' + session.containers.map(vesselHtml).join('') + '</div>' +
        '</div>' +
        '<div class="lab-bench-actions">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-pour>' + esc(copy('Pour', 'Transferir')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-stir>' + esc(copy('Stir', 'Agitar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-empty>' + esc(copy('Empty', 'Esvaziar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-heat="-10">' + esc(copy('Cool', 'Esfriar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-heat="10">' + esc(copy('Heat', 'Aquecer')) + '</button>' +
        '</div></section>' +
        '<aside class="lab-pane lab-board-side">' +
        '<h2>' + esc(copy('Elements', 'Elementos')) + '</h2>' + inventoryHtml() +
        '<div class="lab-amount" role="group" aria-label="' + esc(copy('Amount', 'Quantidade')) + '">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-amount="5">5</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-amount="10">10</button>' +
        '<button type="button" class="ws-btn ws-btn-sm is-on" data-amount="25">25</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-amount="50">50</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-amount="100">100</button>' +
        '<span class="ws-lede">' + esc(copy('mL or g, virtual', 'mL ou g, virtual')) + '</span></div>' +
        '<h2>' + esc(copy('Inspector', 'Inspetor')) + '</h2><div data-lab-inspector>' + inspectorHtml() + '</div>' +
        '<div data-lab-guide-host>' + tutorialHtml() + '</div>' +
        '</aside></div>' +
        '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Notebook', 'Caderno')) + '</h2><ol class="lab-notes" data-lab-notes>' + notesHtml() + '</ol></section>' +
        '</div>';
      bind(node);
      applyWorld();
    }

    function searchBar(value) {
      return '<form class="lab-search" data-lab-search><input id="lab-q" name="q" type="search" value="' + esc(value) + '" placeholder="' +
        esc(copy('What would you like to create?', 'O que você quer criar?')) + '" autocomplete="off">' +
        '<button type="submit" class="ws-btn ws-btn-secondary">' + esc(copy('Search catalog', 'Pesquisar catálogo')) + '</button></form>';
    }

    function bind(rootEl) {
      var opts = {};
      if (typeof AbortController === 'function') {
        if (node._labAbort && typeof node._labAbort.abort === 'function') {
          try { node._labAbort.abort(); } catch (e) {}
        }
        node._labAbort = new AbortController();
        opts.signal = node._labAbort.signal;
      } else if (rootEl.dataset.labBound === '1') {
        return;
      }
      rootEl.dataset.labBound = '1';
      rootEl.addEventListener('submit', function (event) {
        var form = event.target && event.target.closest && event.target.closest('[data-lab-search]');
        if (!form) return;
        event.preventDefault();
        var input = rootEl.querySelector('#lab-q');
        var q = input ? input.value : '';
        var found = searchCatalog(q);
        if (found.status === 'unavailable' || found.status === 'unknown') {
          params.set('q', q);
          paint(found);
          return;
        }
        if (found.resolved && found.resolved.kind === 'creation') {
          location.assign('/app?section=lab&mode=guided&creation=' + encodeURIComponent(found.resolved.id));
          return;
        }
        if (found.resolved && found.resolved.kind === 'substance') {
          pourFrom = '';
          addToContainer(session, selected().id, found.resolved.id, amount);
          queueSave();
          params.set('q', q);
          paint(found);
          pulseLiquid();
          return;
        }
        params.set('q', q);
        paint(found);
      }, opts);
      rootEl.addEventListener('click', function (event) {
        try {
          var t = event.target && event.target.closest
            ? event.target.closest('[data-add], [data-vessel], [data-measure], [data-amount], [data-lab-undo], [data-lab-reset], [data-lab-save], [data-lab-pour], [data-lab-stir], [data-lab-empty], [data-heat], [data-add-vessel], [data-ready], [data-lab-zoom]')
            : null;
          if (!t) return;
          if (t.getAttribute('data-amount')) {
            amount = Number(t.getAttribute('data-amount')) || 25;
            updateLive();
            return;
          }
          if (t.getAttribute('data-vessel')) {
            if (Date.now() < ignoreClickUntil) return;
            var id = t.getAttribute('data-vessel');
            var clicked = findContainer(session, id);
            var spec = clicked ? EQUIPMENT[clicked.type] || {} : {};
            if (heatFrom && pourFrom === '' && id !== heatFrom && canHold(clicked)) {
              setTemperature(session, id, (Number(clicked.temperatureC) || 22) + 15);
              heatFrom = '';
              session.selectedId = id;
              queueSave();
              updateLive();
              pulseLiquid();
              return;
            }
            if (pourFrom && pourFrom !== id) {
              var poured = pour(session, pourFrom, id, amount);
              pourFrom = '';
              session.selectedId = id;
              queueSave();
              updateLive();
              if (poured.ok) pulseLiquid();
              else if (poured.reason === 'empty') flashStatus('<div class="lab-msg" role="status">' + esc(copy('That vessel is empty.', 'Esse vidro está vazio.')) + '</div>');
              else if (poured.reason === 'full') flashStatus('<div class="lab-msg" role="status">' + esc(copy('That vessel is full.', 'Esse vidro está cheio.')) + '</div>');
              return;
            }
            session.selectedId = id;
            pourFrom = '';
            heatFrom = spec.heat ? id : '';
            updateLive();
            return;
          }
          if (t.getAttribute('data-add')) {
            pourFrom = '';
            var added = addToContainer(session, selected().id, t.getAttribute('data-add'), amount);
            queueSave();
            updateLive();
            if (added.ok) {
              flashStatus('');
              pulseLiquid();
            } else if (added.reason === 'full') {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('That vessel is full. Empty it or pour into another glass.', 'Esse vidro está cheio. Esvazie ou transfira para outro.')) + '</div>');
            } else if (added.reason === 'tool') {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('That tool does not hold a mixture. Select a beaker or flask.', 'Essa ferramenta não retém mistura. Selecione um becker ou erlenmeyer.')) + '</div>');
            }
            return;
          }
          if (t.getAttribute('data-measure')) {
            measure(session, selected().id, t.getAttribute('data-measure'));
            queueSave();
            updateLive();
            return;
          }
          if (t.getAttribute('data-heat')) {
            var delta = Number(t.getAttribute('data-heat')) || 0;
            var vessel = selected();
            setTemperature(session, vessel.id, (Number(vessel.temperatureC) || 22) + delta);
            queueSave();
            updateLive();
            pulseLiquid();
            return;
          }
          if (t.getAttribute('data-add-vessel')) {
            addVessel(session, t.getAttribute('data-add-vessel'));
            queueSave();
            updateLive();
            return;
          }
          if (t.getAttribute('data-ready')) {
            var kit = addReady(session, t.getAttribute('data-ready'), selected().id);
            queueSave();
            updateLive();
            if (kit.ok) {
              flashStatus('');
              pulseLiquid();
            } else {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('Select a vessel that can hold a mixture first.', 'Selecione um vidro que possa reter a mistura.')) + '</div>');
            }
            return;
          }
          if (t.getAttribute('data-lab-zoom')) {
            zoom = t.getAttribute('data-lab-zoom') === 'in' ? Math.min(1.6, zoom + 0.1) : Math.max(0.5, zoom - 0.1);
            applyWorld();
            queueSave();
            return;
          }
          if (t.hasAttribute('data-lab-pour')) {
            pourFrom = pourFrom ? '' : selected().id;
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-stir')) {
            mixContainer(selected());
            session.stirred = true;
            observe(session, copy('Stirred the selected vessel.', 'Agitou o vidro selecionado.'));
            queueSave();
            updateLive();
            pulseLiquid();
            return;
          }
          if (t.hasAttribute('data-lab-empty')) {
            emptyContainer(session, selected().id);
            pourFrom = '';
            queueSave();
            updateLive();
            flashStatus('');
            return;
          }
          if (t.hasAttribute('data-lab-undo')) {
            var prev = (session.history || []).pop();
            if (!prev) return;
            session.containers = prev.containers;
            session.measurements = prev.measurements;
            session.stage = prev.stage;
            session.selectedId = prev.selectedId || (session.containers[0] || {}).id;
            observe(session, copy('Undid the last change.', 'Desfez a última alteração.'));
            queueSave();
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-reset')) {
            var keep = { id: session.id, title: session.title, mode: session.mode, creationId: session.creationId, createdAt: session.createdAt, lang: lang };
            session = emptySession(keep);
            session.id = keep.id;
            session.createdAt = keep.createdAt;
            observe(session, copy('Bench reset.', 'Bancada reiniciada.'));
            pourFrom = '';
            heatFrom = '';
            panX = 0;
            panY = 0;
            zoom = 1;
            flushSave();
            updateLive();
            flashStatus('');
            return;
          }
          if (t.hasAttribute('data-lab-save')) {
            observe(session, copy('Session saved on this device.', 'Sessão salva neste dispositivo.'));
            flushSave();
            updateLive();
          }
        } catch (err) {
          try { if (typeof console !== 'undefined' && console.debug) console.debug('[atomurus-lab] click', err); } catch (e) {}
        }
      }, opts);

      var stage = rootEl.querySelector('[data-lab-stage]');
      if (stage) {
        stage.addEventListener('pointerdown', function (event) {
          if (event.button != null && event.button !== 0) return;
          var piece = event.target.closest && event.target.closest('[data-vessel]');
          if (piece) {
            var id = piece.getAttribute('data-vessel');
            var vessel = findContainer(session, id);
            if (!vessel) return;
            dragging = {
              id: id,
              startX: event.clientX,
              startY: event.clientY,
              origX: Number(vessel.x) || 0,
              origY: Number(vessel.y) || 0
            };
            dragMoved = false;
            try { piece.setPointerCapture(event.pointerId); } catch (e) {}
            return;
          }
          panning = true;
          panStart = { x: event.clientX, y: event.clientY, panX: panX, panY: panY };
          dragMoved = false;
          try { stage.setPointerCapture(event.pointerId); } catch (e2) {}
        }, opts);
        stage.addEventListener('pointermove', function (event) {
          if (dragging) {
            var dx = (event.clientX - dragging.startX) / zoom;
            var dy = (event.clientY - dragging.startY) / zoom;
            if (Math.abs(event.clientX - dragging.startX) > 4 || Math.abs(event.clientY - dragging.startY) > 4) {
              dragMoved = true;
            }
            var moving = findContainer(session, dragging.id);
            if (!moving) return;
            moving.x = Math.round(dragging.origX + dx);
            moving.y = Math.round(dragging.origY + dy);
            var el = node.querySelector('[data-lab-world] [data-vessel="' + dragging.id + '"]');
            if (el) {
              el.style.left = moving.x + 'px';
              el.style.top = moving.y + 'px';
            }
            return;
          }
          if (panning && panStart) {
            panX = panStart.panX + (event.clientX - panStart.x);
            panY = panStart.panY + (event.clientY - panStart.y);
            applyWorld();
          }
        }, opts);
        function endPointer() {
          if (dragging && dragMoved) {
            ignoreClickUntil = Date.now() + 280;
            queueSave();
          } else if (panning && panStart) {
            var moved = Math.abs(panX - panStart.panX) > 4 || Math.abs(panY - panStart.panY) > 4;
            if (moved) {
              ignoreClickUntil = Date.now() + 280;
              queueSave();
            }
          }
          dragging = null;
          dragMoved = false;
          panning = false;
          panStart = null;
        }
        stage.addEventListener('pointerup', endPointer, opts);
        stage.addEventListener('pointercancel', endPointer, opts);
        stage.addEventListener('wheel', function (event) {
          event.preventDefault();
          var rect = stage.getBoundingClientRect();
          var mx = event.clientX - rect.left;
          var my = event.clientY - rect.top;
          var wx = (mx - panX) / zoom;
          var wy = (my - panY) / zoom;
          var next = zoom + (event.deltaY > 0 ? -0.08 : 0.08);
          zoom = Math.min(1.6, Math.max(0.5, next));
          panX = mx - wx * zoom;
          panY = my - wy * zoom;
          applyWorld();
          queueSave();
        }, Object.assign({ passive: false }, opts));
      }
    }

    paint();
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', flushSave, { once: true });
    }
    return session;
  }

  root.AtomurusLab = {
    SUBSTANCES: SUBSTANCES,
    CREATIONS: CREATIONS,
    EQUIPMENT: EQUIPMENT,
    READY: READY,
    resolveQuery: resolveQuery,
    searchCatalog: searchCatalog,
    emptySession: emptySession,
    listSessions: listSessions,
    saveSession: saveSession,
    addToContainer: addToContainer,
    addVessel: addVessel,
    addReady: addReady,
    emptyContainer: emptyContainer,
    identifyProduct: identifyProduct,
    visualFillPct: visualFillPct,
    tutorialState: tutorialState,
    canHold: canHold,
    pour: pour,
    setTemperature: setTemperature,
    measure: measure,
    mount: mount
  };

  if (typeof module === 'object' && module.exports) module.exports = root.AtomurusLab;
})(typeof window !== 'undefined' ? window : globalThis);
