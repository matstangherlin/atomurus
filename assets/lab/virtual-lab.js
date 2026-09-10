/* Atomurus Virtual Lab — allowlisted educational simulation. Deny by default. */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'atomurus-lab-v1';
  var MAX_SESSIONS = 24;
  var HISTORY_CAP = 24;
  var MAX_VESSELS = 6;
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
    carbon: { id: 'carbon', name: 'Carbon (graphite)', formula: 'C', category: 'allotrope', color: '#3A3732', state: 'solid', allowed: true }
  };

  var EQUIPMENT = {
    beaker: { type: 'beaker', capacityMl: 250, labelEn: 'Beaker', labelPt: 'Becker' },
    flask: { type: 'flask', capacityMl: 250, labelEn: 'Flask', labelPt: 'Erlenmeyer' },
    cylinder: { type: 'cylinder', capacityMl: 100, labelEn: 'Cylinder', labelPt: 'Proveta' }
  };

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
    'copper sulfate': 'cusulfate', 'sulfato de cobre': 'cusulfate', carbon: 'c'
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

  function makeVessel(type, index) {
    var spec = EQUIPMENT[type] || EQUIPMENT.beaker;
    return {
      id: spec.type + '-' + vesselLetter(index).toLowerCase(),
      type: spec.type,
      label: spec.labelEn + ' ' + vesselLetter(index),
      capacityMl: spec.capacityMl,
      volumeMl: 0,
      temperatureC: 22,
      contents: [],
      appearance: 'empty'
    };
  }

  function emptySession(opts) {
    opts = opts || {};
    return {
      id: uid(),
      title: opts.title || 'Open Bench',
      mode: opts.mode || 'bench',
      creationId: opts.creationId || '',
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
    var fizz = false;
    contents.forEach(function (row) {
      var spec = SUBSTANCES[row.id];
      if (!spec) return;
      var amt = Number(row.amount) || 0;
      if (spec.category === 'acid') acids += amt;
      if (spec.category === 'base') bases += amt;
      if (spec.category === 'salt') salts += amt;
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
    else if (notes.top + notes.heart + notes.base > 0) appearance = 'fragrance accord';
    else if (copper && volume) appearance = 'blue solution';
    else if (fizz) appearance = 'effervescent mixture';
    else if (salts && volume) appearance = 'saline solution';
    else if (acids && bases) appearance = 'neutralized mixture';
    else if (acids) appearance = 'acidic solution';
    else if (bases) appearance = 'basic solution';
    else if (elements && !volume) appearance = 'dry sample';
    else if (elements) appearance = 'suspension';
    container.ph = Math.round(ph * 10) / 10;
    container.appearance = appearance;
    container.color = mixColor(container);
    container.fizz = fizz;
    container.modeled = Boolean(contents.length);
    return container;
  }

  function addToContainer(session, containerId, substanceId, amount, unit) {
    var resolved = resolveQuery(substanceId);
    if (!resolved.ok || resolved.kind !== 'substance') {
      return { ok: false, reason: resolved.reason || 'unavailable' };
    }
    var spec = SUBSTANCES[resolved.id];
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    var qty = Math.max(0.1, Number(amount) || 1);
    var nextVol = Number(container.volumeMl) || 0;
    if (spec.state === 'liquid') nextVol += qty;
    if (nextVol > container.capacityMl + 0.05) {
      observe(session, (container.label || container.id) + ' is full.');
      return { ok: false, reason: 'full' };
    }
    pushHistory(session);
    var existing = (container.contents || []).filter(function (row) { return row.id === spec.id; })[0];
    if (existing) existing.amount += qty;
    else container.contents.push({ id: spec.id, amount: qty, unit: unit || (spec.state === 'liquid' ? 'mL' : 'g') });
    if (spec.state === 'liquid') container.volumeMl = Math.min(container.capacityMl, (Number(container.volumeMl) || 0) + qty);
    else if (!container.volumeMl) container.volumeMl = Math.min(container.capacityMl, Math.max(8, qty * 0.6));
    mixContainer(container);
    observe(session, 'Added virtual ' + spec.name + ' (' + spec.formula + ') to ' + (container.label || container.id) + '.');
    return { ok: true, container: container };
  }

  function pour(session, fromId, toId, amount) {
    if (fromId === toId) return { ok: false, reason: 'same' };
    var from = findContainer(session, fromId);
    var to = findContainer(session, toId);
    if (!from || !to) return { ok: false, reason: 'no-container' };
    mixContainer(from);
    var vol = Number(from.volumeMl) || 0;
    if (vol <= 0) return { ok: false, reason: 'empty' };
    var room = Math.max(0, (Number(to.capacityMl) || 0) - (Number(to.volumeMl) || 0));
    var qty = Math.min(vol, Number(amount) > 0 ? Number(amount) : vol, room);
    if (qty <= 0) return { ok: false, reason: 'full' };
    pushHistory(session);
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
    observe(session, 'Poured ' + qty + ' mL from ' + (from.label || from.id) + ' into ' + (to.label || to.id) + '.');
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
    observe(session, 'Added ' + (vessel.label || spec.type) + ' to the bench.');
    return { ok: true, container: vessel };
  }

  function setTemperature(session, containerId, next) {
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    var temp = Math.max(5, Math.min(95, Number(next)));
    if (temp === container.temperatureC) return { ok: true, container: container };
    pushHistory(session);
    container.temperatureC = temp;
    observe(session, (container.label || container.id) + ' is now ' + temp + ' °C (virtual).');
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
        creationId: creationId
      });
    }
    if (!session && mode === 'bench') session = emptySession({ title: lang === 'pt' ? 'Bancada aberta' : 'Open Bench', mode: 'bench' });
    if (!session) session = last || emptySession({ title: lang === 'pt' ? 'Bancada aberta' : 'Open Bench' });
    if (!session.selectedId) session.selectedId = (session.containers[0] || {}).id;
    var amount = 10;
    var pourFrom = '';
    var saveTimer = 0;
    var stirTimer = 0;

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
      return Object.keys(SUBSTANCES).map(function (id) {
        var spec = SUBSTANCES[id];
        return '<button type="button" class="lab-chip" data-add="' + esc(id) + '">' + esc(spec.name) + '<span>' + esc(spec.formula) + '</span></button>';
      }).join('');
    }

    function vesselHtml(container) {
      mixContainer(container);
      var fill = Math.max(0, Math.min(100, ((Number(container.volumeMl) || 0) / container.capacityMl) * 100));
      var sediment = 0;
      var solids = (container.contents || []).filter(function (row) {
        var spec = SUBSTANCES[row.id];
        return spec && spec.state === 'solid';
      });
      if (solids.length && fill < 8) sediment = Math.min(18, solids.reduce(function (sum, row) { return sum + Number(row.amount) || 0; }, 0));
      var color = container.color || mixColor(container);
      var active = container.id === session.selectedId;
      var kind = container.type || 'beaker';
      var cls = 'lab-glass lab-' + kind + (kind === 'beaker' ? ' lab-beaker' : '') + (active ? ' is-active' : '') + (container.fizz ? ' is-fizz' : '');
      return '<button type="button" class="' + cls + '" data-vessel="' + esc(container.id) + '" aria-pressed="' + (active ? 'true' : 'false') + '">' +
        '<span class="lab-glass-body">' +
        (sediment ? '<span class="lab-sediment" style="height:' + sediment + '%"></span>' : '') +
        '<span class="lab-liquid" style="height:' + fill + '%;background:' + esc(color) + '"></span>' +
        '</span>' +
        '<span class="lab-glass-name">' + esc(container.label || kind) + '</span>' +
        '<span class="lab-glass-meta">' + esc(container.volumeMl) + ' / ' + esc(container.capacityMl) + ' mL</span>' +
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

    function updateLive() {
      var bench = node.querySelector('[data-lab-bench]');
      var inspector = node.querySelector('[data-lab-inspector]');
      var notes = node.querySelector('[data-lab-notes]');
      var amounts = node.querySelectorAll('[data-amount]');
      if (bench) bench.innerHTML = session.containers.map(vesselHtml).join('');
      if (inspector) inspector.innerHTML = inspectorHtml();
      if (notes) notes.innerHTML = notesHtml();
      amounts.forEach(function (btn) {
        btn.classList.toggle('is-on', Number(btn.getAttribute('data-amount')) === amount);
      });
      var pourBtn = node.querySelector('[data-lab-pour]');
      if (pourBtn) pourBtn.classList.toggle('is-on', Boolean(pourFrom));
      var fizzNode = node.querySelector('.lab-glass.is-fizz .lab-liquid');
      if (fizzNode && !document.documentElement.getAttribute('data-reduced-motion')) {
        fizzNode.classList.add('is-stirring');
        if (stirTimer) clearTimeout(stirTimer);
        stirTimer = setTimeout(function () {
          if (fizzNode.classList) fizzNode.classList.remove('is-stirring');
        }, 420);
      }
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
        '<div class="lab-shell" data-lab-root>' +
        '<p class="ws-kicker">Atomurus Lab</p>' +
        '<h1 class="ws-title">' + esc(session.title || copy('Virtual Laboratory', 'Laboratório virtual')) + '</h1>' +
        notice + diamondNote +
        '<form class="lab-search" data-lab-search>' +
        '<label class="lc-sr-only" for="lab-q">' + esc(copy('What would you like to create?', 'O que você quer criar?')) + '</label>' +
        '<input id="lab-q" name="q" type="search" value="' + esc(searchValue) + '" placeholder="' + esc(copy('What would you like to create?', 'O que você quer criar?')) + '" autocomplete="off">' +
        '<button type="submit" class="ws-btn ws-btn-secondary">' + esc(copy('Search catalog', 'Pesquisar catálogo')) + '</button>' +
        '</form>' +
        '<div data-lab-status>' + statusHtml(results) + '</div>' +
        '<div class="lab-toolbar">' +
        '<a class="ws-btn ws-btn-secondary" href="/app?section=lab&mode=bench">' + esc(copy('Open Bench', 'Bancada aberta')) + '</a>' +
        '<a class="ws-btn ws-btn-secondary" href="/app?section=creations">' + esc(copy('Guided Creations', 'Criações guiadas')) + '</a>' +
        '<button type="button" class="ws-btn" data-lab-undo>' + esc(copy('Undo', 'Desfazer')) + '</button>' +
        '<button type="button" class="ws-btn" data-lab-reset>' + esc(copy('Reset', 'Reiniciar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-primary" data-lab-save>' + esc(copy('Save session', 'Salvar sessão')) + '</button>' +
        '</div>' +
        '<div class="lab-grid">' +
        '<section class="lab-pane"><h2>' + esc(copy('Inventory', 'Inventário')) + '</h2><div class="lab-chips">' + inventoryHtml() + '</div>' +
        '<div class="lab-amount" role="group" aria-label="' + esc(copy('Amount', 'Quantidade')) + '">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-amount="5">5</button>' +
        '<button type="button" class="ws-btn ws-btn-sm is-on" data-amount="10">10</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-amount="25">25</button>' +
        '<span class="ws-lede">' + esc(copy('mL or g, virtual', 'mL ou g, virtual')) + '</span></div>' +
        '<p class="ws-lede">' + esc(copy('Select a vessel, then a material. Keyboard works; drag is optional.', 'Selecione um vidro e depois um material. O teclado funciona; arrastar é opcional.')) + '</p></section>' +
        '<section class="lab-pane lab-bench"><h2>' + esc(copy('Workbench', 'Bancada')) + '</h2>' +
        '<div class="lab-glass-row" data-lab-bench>' + session.containers.map(vesselHtml).join('') + '</div>' +
        '<div class="lab-bench-actions">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-pour>' + esc(copy('Pour', 'Transferir')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-heat="-10">' + esc(copy('Cool', 'Esfriar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-heat="10">' + esc(copy('Heat', 'Aquecer')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-add-vessel="beaker">' + esc(copy('Add beaker', 'Adicionar becker')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-add-vessel="flask">' + esc(copy('Add flask', 'Adicionar erlenmeyer')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-add-vessel="cylinder">' + esc(copy('Add cylinder', 'Adicionar proveta')) + '</button>' +
        '</div></section>' +
        '<section class="lab-pane"><h2>' + esc(copy('Inspector', 'Inspetor')) + '</h2><div data-lab-inspector>' + inspectorHtml() + '</div></section>' +
        '</div>' +
        (creation ? '<p class="ws-lede">' + esc(lang === 'pt' ? creation.lede.pt : creation.lede.en) + '</p>' : '') +
        '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Notebook', 'Caderno')) + '</h2><ol class="lab-notes" data-lab-notes>' + notesHtml() + '</ol></section>' +
        '</div>';
      bind(node);
    }

    function searchBar(value) {
      return '<form class="lab-search" data-lab-search><input id="lab-q" name="q" type="search" value="' + esc(value) + '" placeholder="' +
        esc(copy('What would you like to create?', 'O que você quer criar?')) + '" autocomplete="off">' +
        '<button type="submit" class="ws-btn ws-btn-secondary">' + esc(copy('Search catalog', 'Pesquisar catálogo')) + '</button></form>';
    }

    function bind(rootEl) {
      if (rootEl.dataset.labBound === '1') return;
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
          addToContainer(session, selected().id, found.resolved.id, amount);
          queueSave();
          params.set('q', q);
          paint(found);
          return;
        }
        params.set('q', q);
        paint(found);
      });
      rootEl.addEventListener('click', function (event) {
        var t = event.target && event.target.closest ? event.target.closest('[data-add], [data-vessel], [data-measure], [data-amount], [data-lab-undo], [data-lab-reset], [data-lab-save], [data-lab-pour], [data-heat], [data-add-vessel]') : null;
        if (!t) return;
        if (t.getAttribute('data-amount')) {
          amount = Number(t.getAttribute('data-amount')) || 10;
          updateLive();
          return;
        }
        if (t.getAttribute('data-vessel')) {
          var id = t.getAttribute('data-vessel');
          if (pourFrom && pourFrom !== id) {
            pour(session, pourFrom, id, amount);
            pourFrom = '';
            queueSave();
            updateLive();
            return;
          }
          session.selectedId = id;
          pourFrom = '';
          updateLive();
          return;
        }
        if (t.getAttribute('data-add')) {
          addToContainer(session, selected().id, t.getAttribute('data-add'), amount);
          queueSave();
          updateLive();
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
          return;
        }
        if (t.getAttribute('data-add-vessel')) {
          addVessel(session, t.getAttribute('data-add-vessel'));
          queueSave();
          updateLive();
          return;
        }
        if (t.hasAttribute('data-lab-pour')) {
          pourFrom = pourFrom ? '' : selected().id;
          updateLive();
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
          var keep = { id: session.id, title: session.title, mode: session.mode, creationId: session.creationId, createdAt: session.createdAt };
          session = emptySession(keep);
          session.id = keep.id;
          session.createdAt = keep.createdAt;
          observe(session, copy('Bench reset.', 'Bancada reiniciada.'));
          flushSave();
          updateLive();
          return;
        }
        if (t.hasAttribute('data-lab-save')) {
          observe(session, copy('Session saved on this device.', 'Sessão salva neste dispositivo.'));
          flushSave();
          updateLive();
        }
      });
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
    resolveQuery: resolveQuery,
    searchCatalog: searchCatalog,
    emptySession: emptySession,
    listSessions: listSessions,
    saveSession: saveSession,
    addToContainer: addToContainer,
    addVessel: addVessel,
    pour: pour,
    setTemperature: setTemperature,
    measure: measure,
    mount: mount
  };

  if (typeof module === 'object' && module.exports) module.exports = root.AtomurusLab;
})(typeof window !== 'undefined' ? window : globalThis);
