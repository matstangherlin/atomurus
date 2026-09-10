/* Atomurus Virtual Lab — allowlisted educational simulation. Deny by default. */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'atomurus-lab-v1';
  var MAX_SESSIONS = 24;
  var HISTORY_CAP = 24;

  var SUBSTANCES = {
    water: { id: 'water', name: 'Water', formula: 'H₂O', category: 'solvent', color: '#7EB6D9', state: 'liquid', ph: 7, allowed: true },
    nacl: { id: 'nacl', name: 'Sodium chloride', formula: 'NaCl', category: 'salt', color: '#F4F1E4', state: 'solid', allowed: true },
    sucrose: { id: 'sucrose', name: 'Sucrose', formula: 'C₁₂H₂₂O₁₁', category: 'sugar', color: '#F7E7C6', state: 'solid', allowed: true },
    citric_acid: { id: 'citric_acid', name: 'Citric acid', formula: 'C₆H₈O₇', category: 'acid', color: '#F3E27A', state: 'solid', ph: 2.2, allowed: true },
    bicarbonate: { id: 'bicarbonate', name: 'Sodium bicarbonate', formula: 'NaHCO₃', category: 'base', color: '#EEEAE0', state: 'solid', ph: 8.3, allowed: true },
    indicator: { id: 'indicator', name: 'Virtual pH indicator', formula: 'In', category: 'indicator', color: '#D9A7C7', state: 'liquid', allowed: true },
    limonene: { id: 'limonene', name: 'Limonene', formula: 'C₁₀H₁₆', category: 'fragrance', color: '#E8C15A', family: 'citrus', note: 'top', allowed: true },
    linalool: { id: 'linalool', name: 'Linalool', formula: 'C₁₀H₁₈O', category: 'fragrance', color: '#C9D48A', family: 'floral', note: 'heart', allowed: true },
    vanillin: { id: 'vanillin', name: 'Vanillin', formula: 'C₈H₈O₃', category: 'fragrance', color: '#E6C39A', family: 'gourmand', note: 'base', allowed: true },
    carbon: { id: 'carbon', name: 'Carbon (graphite)', formula: 'C', category: 'allotrope', color: '#3A3732', state: 'solid', allowed: true }
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
    crystal: 'guided:crystal', 'acid base': 'guided:ph'
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

  function emptySession(opts) {
    opts = opts || {};
    return {
      id: uid(),
      title: opts.title || 'Open Bench',
      mode: opts.mode || 'bench',
      creationId: opts.creationId || '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      containers: [
        { id: 'beaker-a', type: 'beaker', capacityMl: 250, volumeMl: 0, temperatureC: 22, contents: [], appearance: 'empty' }
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
      stage: session.stage
    })]);
    if (session.history.length > HISTORY_CAP) session.history = session.history.slice(-HISTORY_CAP);
  }

  function observe(session, text) {
    session.observations = (session.observations || []).concat([{ at: nowIso(), text: text }]);
    if (session.observations.length > 80) session.observations = session.observations.slice(-80);
  }

  function containerMass(container) {
    return (container.contents || []).reduce(function (sum, row) {
      return sum + (Number(row.amount) || 0);
    }, 0);
  }

  function mixContainer(container) {
    var contents = container.contents || [];
    var ids = contents.map(function (row) { return row.id; }).sort().join('+');
    var volume = Number(container.volumeMl) || 0;
    var acids = 0;
    var bases = 0;
    var salts = 0;
    var notes = { top: 0, heart: 0, base: 0 };
    contents.forEach(function (row) {
      var spec = SUBSTANCES[row.id];
      if (!spec) return;
      if (spec.category === 'acid') acids += Number(row.amount) || 0;
      if (spec.category === 'base') bases += Number(row.amount) || 0;
      if (spec.category === 'salt') salts += Number(row.amount) || 0;
      if (spec.note) notes[spec.note] += Number(row.amount) || 0;
    });
    var ph = 7;
    if (acids || bases) {
      var net = bases - acids;
      ph = Math.max(1, Math.min(13, 7 + net * 0.08));
    }
    var appearance = 'clear';
    if (!contents.length) appearance = 'empty';
    else if (notes.top + notes.heart + notes.base > 0) appearance = 'fragrance accord';
    else if (salts && volume) appearance = 'saline solution';
    else if (acids && bases) appearance = 'neutralized mixture';
    else if (acids) appearance = 'acidic solution';
    else if (bases) appearance = 'basic solution';
    container.ph = Math.round(ph * 10) / 10;
    container.appearance = appearance;
    container.modeled = Boolean(ids);
    return container;
  }

  function addToContainer(session, containerId, substanceId, amount, unit) {
    var resolved = resolveQuery(substanceId);
    if (!resolved.ok || resolved.kind !== 'substance') {
      return { ok: false, reason: resolved.reason || 'unavailable' };
    }
    var spec = SUBSTANCES[resolved.id];
    var container = (session.containers || []).filter(function (row) { return row.id === containerId; })[0];
    if (!container) return { ok: false, reason: 'no-container' };
    pushHistory(session);
    var qty = Math.max(0.1, Number(amount) || 1);
    var existing = (container.contents || []).filter(function (row) { return row.id === spec.id; })[0];
    if (existing) existing.amount += qty;
    else container.contents.push({ id: spec.id, amount: qty, unit: unit || (spec.state === 'liquid' ? 'mL' : 'g') });
    if (spec.state === 'liquid') container.volumeMl = Math.min(container.capacityMl, (Number(container.volumeMl) || 0) + qty);
    else if (!container.volumeMl) container.volumeMl = Math.min(container.capacityMl, 50);
    mixContainer(container);
    observe(session, 'Added virtual ' + spec.name + ' (' + spec.formula + ').');
    return { ok: true, container: container };
  }

  function measure(session, containerId, kind) {
    var container = (session.containers || []).filter(function (row) { return row.id === containerId; })[0];
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

    function copy(en, pt) { return lang === 'pt' ? pt : en; }
    function esc(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function paint() {
      mixContainer(session.containers[0]);
      var container = session.containers[0];
      var searchValue = params.get('q') || '';
      var results = searchCatalog(searchValue);
      var creation = CREATIONS.filter(function (row) { return row.id === session.creationId; })[0];
      var guest = !user;
      var notice = guest
        ? '<p class="ws-lede">' + esc(copy('Create an account to save sessions. This demo stays on this device.', 'Crie uma conta para salvar sessões. Esta demonstração fica neste dispositivo.')) + '</p>'
        : '';
      var unavailable = results.status === 'unavailable'
        ? '<div class="lab-msg" role="status">' + esc(copy('This experiment isn\'t available in Atomurus Lab.', 'Este experimento não está disponível no Atomurus Lab.')) +
          ' <a href="/explore.html">' + esc(copy('Explore the chemistry concept instead.', 'Explore o conceito de química no Explore.')) + '</a></div>'
        : '';
      var unknown = results.status === 'unknown'
        ? '<div class="lab-msg" role="status">' + esc(copy('This material is not available in the current Lab catalog.', 'Este material não está no catálogo atual do Lab.')) +
          ' <a href="/explore.html">' + esc(copy('Search Explore instead.', 'Buscar no Explore.')) + '</a></div>'
        : '';

      var inventory = Object.keys(SUBSTANCES).map(function (id) {
        var spec = SUBSTANCES[id];
        return '<button type="button" class="lab-chip" data-add="' + esc(id) + '">' + esc(spec.name) + '<span>' + esc(spec.formula) + '</span></button>';
      }).join('');

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

      var notes = (session.observations || []).slice(-8).reverse().map(function (row) {
        return '<li><time>' + esc(String(row.at).slice(11, 16)) + '</time> ' + esc(row.text) + '</li>';
      }).join('') || '<li>' + esc(copy('No observations yet.', 'Ainda não há observações.')) + '</li>';

      var liquidH = Math.max(8, Math.min(92, (container.volumeMl / container.capacityMl) * 100));
      var fill = container.appearance === 'empty' ? 'transparent' : (SUBSTANCES[(container.contents[0] || {}).id] || {}).color || '#7EB6D9';

      var inspector =
        '<div class="lab-kv"><span>' + esc(copy('Volume', 'Volume')) + '</span><strong>' + esc(container.volumeMl) + ' mL</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Mass', 'Massa')) + '</span><strong>' + esc(Math.round(containerMass(container) * 10) / 10) + ' g</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Temperature', 'Temperatura')) + '</span><strong>' + esc(container.temperatureC) + ' °C</strong></div>' +
        '<div class="lab-kv"><span>pH</span><strong>' + esc(container.ph == null ? '—' : container.ph) + '</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Appearance', 'Aparência')) + '</span><strong>' + esc(container.appearance) + '</strong></div>' +
        '<p class="ws-lede">' + esc(copy('Virtual laboratory simulation. Values are educational, not experimental.', 'Simulação de laboratório virtual. Os valores são educacionais, não experimentais.')) + '</p>';

      var diamondNote = session.creationId === 'diamond'
        ? '<div class="lab-msg">' + esc(copy(
          'This stage represents industrial carbon allotropes conceptually. It does not describe how to build or operate high-pressure equipment.',
          'Esta etapa representa alótropos de carbono de forma conceitual. Não descreve como construir ou operar equipamento de alta pressão.'
        )) + ' <a href="/viewer/allotropes.html">' + esc(copy('Open Allotropes viewer', 'Abrir o visualizador de alótropos')) + '</a></div>'
        : '';

      if (section === 'creations') {
        node.innerHTML = '<p class="ws-kicker">Atomurus Lab</p><h1 class="ws-title">' + esc(copy('Guided Creations', 'Criações guiadas')) + '</h1>' +
          '<p class="ws-lede">' + esc(copy('Search a curated catalog. The Lab never invents a chemical recipe from free text.', 'Pesquise um catálogo curado. O Lab nunca inventa uma receita química a partir de texto livre.')) + '</p>' +
          searchBar(searchValue) + unavailable + unknown +
          '<div class="ws-grid ws-public-grid">' + guided + '</div>';
        bind(node);
        return;
      }

      if (section === 'notebook') {
        node.innerHTML = '<p class="ws-kicker">Atomurus Lab</p><h1 class="ws-title">' + esc(copy('Lab Notebook', 'Caderno do Lab')) + '</h1>' +
          notice +
          (recent ? '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Recent sessions', 'Sessões recentes')) + '</h2><div class="ws-grid">' + recent + '</div></section>' : '') +
          '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Observations', 'Observações')) + '</h2><ol class="lab-notes">' + notes + '</ol></section>';
        return;
      }

      node.innerHTML =
        '<div class="lab-shell" data-lab-root>' +
        '<p class="ws-kicker">Atomurus Lab</p>' +
        '<h1 class="ws-title">' + esc(session.title || copy('Virtual Laboratory', 'Laboratório virtual')) + '</h1>' +
        notice + diamondNote +
        '<form class="lab-search" data-lab-search>' +
        '<label class="lc-sr-only" for="lab-q">' + esc(copy('What would you like to create?', 'O que você quer criar?')) + '</label>' +
        '<input id="lab-q" name="q" type="search" value="' + esc(searchValue) + '" placeholder="' + esc(copy('What would you like to create?', 'O que você quer criar?')) + '">' +
        '<button type="submit" class="ws-btn ws-btn-secondary">' + esc(copy('Search catalog', 'Pesquisar catálogo')) + '</button>' +
        '</form>' +
        unavailable + unknown +
        '<div class="lab-toolbar">' +
        '<a class="ws-btn ws-btn-secondary" href="/app?section=lab&mode=bench">' + esc(copy('Open Bench', 'Bancada aberta')) + '</a>' +
        '<a class="ws-btn ws-btn-secondary" href="/app?section=creations">' + esc(copy('Guided Creations', 'Criações guiadas')) + '</a>' +
        '<button type="button" class="ws-btn" data-lab-undo>' + esc(copy('Undo', 'Desfazer')) + '</button>' +
        '<button type="button" class="ws-btn" data-lab-reset>' + esc(copy('Reset', 'Reiniciar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-primary" data-lab-save>' + esc(copy('Save session', 'Salvar sessão')) + '</button>' +
        '</div>' +
        '<div class="lab-grid">' +
        '<section class="lab-pane"><h2>' + esc(copy('Inventory', 'Inventário')) + '</h2><div class="lab-chips">' + inventory + '</div>' +
        '<p class="ws-lede">' + esc(copy('Keyboard: select a material, then Add. Drag is optional.', 'Selecione um material e depois Adicionar. Arrastar é opcional.')) + '</p></section>' +
        '<section class="lab-pane lab-bench"><h2>' + esc(copy('Workbench', 'Bancada')) + '</h2>' +
        '<div class="lab-beaker" aria-label="Beaker"><div class="lab-liquid" style="height:' + liquidH + '%;background:' + esc(fill) + '"></div></div>' +
        '<p class="lab-beaker-label">' + esc(copy('Beaker A', 'Becker A')) + ' · ' + esc(container.appearance) + '</p></section>' +
        '<section class="lab-pane"><h2>' + esc(copy('Inspector', 'Inspetor')) + '</h2>' + inspector +
        '<div class="lab-measures">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="volume">' + esc(copy('Volume', 'Volume')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="mass">' + esc(copy('Mass', 'Massa')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="temperature">' + esc(copy('Temperature', 'Temperatura')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="ph">pH</button>' +
        '</div></section>' +
        '</div>' +
        (creation ? '<p class="ws-lede">' + esc(lang === 'pt' ? creation.lede.pt : creation.lede.en) + '</p>' : '') +
        '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Notebook', 'Caderno')) + '</h2><ol class="lab-notes">' + notes + '</ol></section>' +
        '</div>';
      bind(node);
    }

    function searchBar(value) {
      return '<form class="lab-search" data-lab-search><input id="lab-q" name="q" type="search" value="' + esc(value) + '" placeholder="' +
        esc(copy('What would you like to create?', 'O que você quer criar?')) + '">' +
        '<button type="submit" class="ws-btn ws-btn-secondary">' + esc(copy('Search catalog', 'Pesquisar catálogo')) + '</button></form>';
    }

    function bind(rootEl) {
      var form = rootEl.querySelector('[data-lab-search]');
      if (form) form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = rootEl.querySelector('#lab-q');
        var q = input ? input.value : '';
        var found = searchCatalog(q);
        if (found.status === 'unavailable' || found.status === 'unknown') {
          params.set('q', q);
          paint();
          return;
        }
        if (found.resolved && found.resolved.kind === 'creation') {
          location.assign('/app?section=lab&mode=guided&creation=' + encodeURIComponent(found.resolved.id));
          return;
        }
        params.set('q', q);
        paint();
      });
      rootEl.querySelectorAll('[data-add]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          addToContainer(session, session.containers[0].id, btn.getAttribute('data-add'), 10);
          saveSession(session);
          paint();
        });
      });
      rootEl.querySelectorAll('[data-measure]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          measure(session, session.containers[0].id, btn.getAttribute('data-measure'));
          saveSession(session);
          paint();
        });
      });
      var undo = rootEl.querySelector('[data-lab-undo]');
      if (undo) undo.addEventListener('click', function () {
        var prev = (session.history || []).pop();
        if (!prev) return;
        session.containers = prev.containers;
        session.measurements = prev.measurements;
        session.stage = prev.stage;
        observe(session, copy('Undid the last change.', 'Desfez a última alteração.'));
        saveSession(session);
        paint();
      });
      var reset = rootEl.querySelector('[data-lab-reset]');
      if (reset) reset.addEventListener('click', function () {
        var keep = { id: session.id, title: session.title, mode: session.mode, creationId: session.creationId, createdAt: session.createdAt };
        session = emptySession(keep);
        session.id = keep.id;
        session.createdAt = keep.createdAt;
        observe(session, copy('Bench reset.', 'Bancada reiniciada.'));
        saveSession(session);
        paint();
      });
      var save = rootEl.querySelector('[data-lab-save]');
      if (save) save.addEventListener('click', function () {
        saveSession(session);
        observe(session, copy('Session saved on this device.', 'Sessão salva neste dispositivo.'));
        paint();
      });
    }

    paint();
    return session;
  }

  root.AtomurusLab = {
    SUBSTANCES: SUBSTANCES,
    CREATIONS: CREATIONS,
    resolveQuery: resolveQuery,
    searchCatalog: searchCatalog,
    emptySession: emptySession,
    listSessions: listSessions,
    saveSession: saveSession,
    addToContainer: addToContainer,
    measure: measure,
    mount: mount
  };

  if (typeof module === 'object' && module.exports) module.exports = root.AtomurusLab;
})(typeof window !== 'undefined' ? window : globalThis);
