/* Atomurus — site search (command palette). Loaded on first use by
   site-nav.js (button in the header, "/" or Ctrl/⌘+K). Finds elements by name
   (PT or EN, accents optional), symbol or atomic number, the tools and the
   articles; a formula such as H2SO4 gets "molar mass" and "build in 3D"
   shortcuts. Needs window.RM_ELEMENTS / rmCatOf (elements-lite.js). */
(function (w) {
  'use strict';
  if (w.AtomurusSearch) return;

  var COPY = {
    en: {
      placeholder: 'Search an element, tool or article…',
      label: 'Search',
      close: 'Close',
      elements: 'Elements', tools: 'Tools', articles: 'Articles', formula: 'Formula',
      atom3d: 'Atom in 3D',
      molar: function (f) { return 'Molar mass of ' + f; },
      molarDesc: 'Step by step in the calculator',
      build: function (f) { return 'Build ' + f + ' in 3D'; },
      buildDesc: 'Molecule builder',
      none: function (q) { return 'Nothing found for “' + q + '”. Try a symbol (Fe), a name (iron) or a number (26).'; },
      hint: 'Try “Na”, “26”, “oxygen”, “pH” or “H2SO4”.',
      foot: '↑ ↓ to move · Enter to open · Esc to close',
      z: 'Z'
    },
    pt: {
      placeholder: 'Buscar elemento, ferramenta ou matéria…',
      label: 'Buscar',
      close: 'Fechar',
      elements: 'Elementos', tools: 'Ferramentas', articles: 'Matérias', formula: 'Fórmula',
      atom3d: 'Átomo em 3D',
      molar: function (f) { return 'Massa molar de ' + f; },
      molarDesc: 'Passo a passo na calculadora',
      build: function (f) { return 'Montar ' + f + ' em 3D'; },
      buildDesc: 'Montador de moléculas',
      none: function (q) { return 'Nada encontrado para “' + q + '”. Tente um símbolo (Fe), um nome (ferro) ou um número (26).'; },
      hint: 'Tente “Na”, “26”, “oxigênio”, “pH” ou “H2SO4”.',
      foot: '↑ ↓ para navegar · Enter para abrir · Esc para fechar',
      z: 'Z'
    }
  };

  /* Tools and articles: [url, PT title, EN title, PT desc, EN desc, keywords] */
  var TOOLS = [
    ['/periodic-table.html', 'Tabela periódica', 'Periodic table', 'Os 118 elementos, colorir por propriedade', 'All 118 elements, colour by property', 'tabela periodica elementos periodic table'],
    ['/periodic-table/trends.html', 'Tendências periódicas', 'Periodic trends', 'Gráficos de raio, eletronegatividade, ionização', 'Charts of radius, electronegativity, ionization', 'tendencias trends grafico chart eletronegatividade electronegativity raio radius ionizacao ionization'],
    ['/periodic-table/heatmap.html', 'Mapa de calor', 'Heat map', 'A tabela colorida por uma propriedade', 'The table coloured by one property', 'mapa calor heatmap propriedade property'],
    ['/periodic-table/compare.html', 'Comparar elementos', 'Compare elements', 'Dois ou mais elementos lado a lado', 'Two or more elements side by side', 'comparar compare'],
    ['/periodic-table/isotopes.html', 'Isótopos', 'Isotopes', 'Abundância e meia-vida', 'Abundance and half-life', 'isotopos isotopes meia-vida half-life abundancia abundance radioativo radioactive'],
    ['/calculators.html#molar', 'Massa molar', 'Molar mass', 'Passo a passo, com hidratos', 'Step by step, with hydrates', 'massa molar molar mass formula g/mol'],
    ['/calculators.html#stoich', 'Estequiometria', 'Stoichiometry', 'Reagente limitante e rendimento', 'Limiting reagent and yield', 'estequiometria stoichiometry limitante limiting rendimento yield reacao reaction'],
    ['/calculators.html#ideal', 'Gás ideal', 'Ideal gas', 'PV = nRT em qualquer unidade', 'PV = nRT in any unit', 'gas ideal pv nrt pressao pressure volume temperatura'],
    ['/calculators.html#dilute', 'Diluição', 'Dilution', 'C₁V₁ = C₂V₂', 'C₁V₁ = C₂V₂', 'diluicao dilution concentracao concentration'],
    ['/calculators.html#ph', 'pH e pOH', 'pH and pOH', 'Ácidos e bases, fortes e fracos', 'Acids and bases, strong and weak', 'ph poh acido acid base ka kb'],
    ['/calculators.html#thermo', 'Termodinâmica', 'Thermodynamics', 'Entalpia, entropia e Gibbs', 'Enthalpy, entropy and Gibbs', 'termodinamica thermodynamics entalpia enthalpy gibbs entropia entropy'],
    ['/calculators.html#unit', 'Conversor de unidades', 'Unit converter', 'Massa, volume, pressão, energia', 'Mass, volume, pressure, energy', 'conversor converter unidades units'],
    ['/calculators.html#scientific', 'Calculadora científica', 'Scientific calculator', 'Notação científica e constantes', 'Scientific notation and constants', 'calculadora cientifica scientific calculator'],
    ['/viewer/atomic-models.html', 'Modelos atômicos 3D', '3D atomic models', 'Dalton, Thomson, Rutherford, Bohr e quântico', 'Dalton, Thomson, Rutherford, Bohr and quantum', 'modelos atomicos atomic models bohr dalton thomson rutherford quantico quantum orbitais orbitals'],
    ['/viewer/molecules.html', 'Moléculas 3D', '3D molecules', 'Geometria, polaridade e montador', 'Geometry, polarity and builder', 'moleculas molecules geometria geometry polaridade polarity vsepr trpecv'],
    ['/viewer/allotropes.html', 'Alótropos 3D', '3D allotropes', 'Grafite, diamante, fulereno, grafeno', 'Graphite, diamond, fullerene, graphene', 'alotropos allotropes grafite graphite diamante diamond fulereno fullerene grafeno graphene ozonio ozone'],
    ['/viewer/isomerism.html', 'Isomeria', 'Isomerism', 'Todos os isômeros de uma fórmula', 'Every isomer of a formula', 'isomeria isomerism isomeros isomers quiral chiral cis trans'],
    ['/app?section=lab', 'Laboratório', 'Lab', 'Bancada virtual com reações', 'Virtual bench with reactions', 'laboratorio lab bancada bench reacoes reactions'],
    ['/explore.html', 'Matérias', 'Articles', 'Todas as matérias', 'Every article', 'materias articles explorar explore'],
    ['/pricing.html', 'Planos', 'Plans', 'Grátis e Pro', 'Free and Pro', 'planos plans pro preco price']
  ];
  var ARTICLES = [
    ['/explore/what-is-an-atom.html', 'O que é um átomo?', 'What is an atom?', 'atomo atom particulas particles'],
    ['/explore/what-is-the-periodic-table.html', 'O que é a tabela periódica?', 'What is the periodic table?', 'tabela periodica periodic table mendeleev'],
    ['/explore/what-are-isotopes.html', 'O que são isótopos?', 'What are isotopes?', 'isotopos isotopes'],
    ['/explore/what-is-a-mole.html', 'O que é o mol?', 'What is a mole?', 'mol mole avogadro'],
    ['/explore/what-is-chemical-bonding.html', 'O que é ligação química?', 'What is chemical bonding?', 'ligacao bonding ionica ionic covalente covalent metalica metallic'],
    ['/explore/what-is-a-chemical-reaction.html', 'O que é uma reação química?', 'What is a chemical reaction?', 'reacao reaction balanceamento balancing equacao equation'],
    ['/explore/what-are-acids-and-bases.html', 'O que são ácidos e bases?', 'What are acids and bases?', 'acidos acids bases ph'],
    ['/explore/what-are-states-of-matter.html', 'Estados da matéria', 'States of matter', 'estados states solido solid liquido liquid gas plasma'],
    ['/explore/what-is-isomerism.html', 'O que é isomeria?', 'What is isomerism?', 'isomeria isomerism isomeros isomers'],
    ['/explore/what-is-radioactivity.html', 'O que é radioatividade?', 'What is radioactivity?', 'radioatividade radioactivity decaimento decay meia-vida half-life'],
    ['/explore/history-of-chemistry.html', 'História da Química', 'History of Chemistry', 'historia history alquimia alchemy'],
    ['/explore/marie-curie.html', 'Marie Curie', 'Marie Curie', 'curie radio radium polonio polonium nobel'],
    ['/explore/lavoisier-chemical-revolution.html', 'Lavoisier e a revolução química', 'Lavoisier and the chemical revolution', 'lavoisier oxigenio oxygen massa mass'],
    ['/explore/haber-bosch-process.html', 'O processo Haber–Bosch', 'The Haber–Bosch process', 'haber bosch amonia ammonia fertilizante fertilizer'],
    ['/explore/chernobyl-disaster.html', 'O desastre de Chernobyl', 'The Chernobyl disaster', 'chernobyl reator reactor nuclear'],
    ['/explore/bhopal-disaster.html', 'O desastre de Bhopal', 'The Bhopal disaster', 'bhopal isocianato isocyanate']
  ];

  function lang() { return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en'; }
  function T() { return COPY[lang()]; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function massText(m) { var s = String(m); if (s.indexOf('.') < 0) s = '[' + s + ']'; return lang() === 'pt' ? s.replace('.', ',') : s; }

  /* ── matching ───────────────────────────────────────────────────── */
  function scoreText(q, hay) {
    if (!q) return 0;
    if (hay === q) return 90;
    // the query is the first whole word ("ph" → "pH e pOH")
    if (hay.indexOf(q + ' ') === 0) return 85;
    if (hay.indexOf(q) === 0) return 70;
    if (hay.indexOf(' ' + q) >= 0) return 55;
    if (hay.indexOf(q) >= 0) return 35;
    return 0;
  }
  function searchElements(raw) {
    var E = w.RM_ELEMENTS || [];
    var q = norm(raw), out = [];
    if (!q) return out;
    var num = /^\d{1,3}$/.test(q) ? +q : 0;
    var mine = lang() === 'pt' ? 2 : 3, other = lang() === 'pt' ? 3 : 2;
    E.forEach(function (e) {
      var s = 0;
      if (num && e[0] === num) s = 100;
      if (raw.trim().toLowerCase() === e[1].toLowerCase()) s = Math.max(s, 98);
      // names in the page language count most; the other language and the latin slug help
      s = Math.max(s, scoreText(q, norm(e[mine])), Math.round(scoreText(q, norm(e[other])) * 0.75), Math.round(scoreText(q, e[5]) * 0.7));
      if (q.length <= 2 && norm(e[1]).indexOf(q) === 0) s = Math.max(s, 60);
      if (s > 0) out.push({ e: e, s: s });
    });
    out.sort(function (a, b) { return b.s - a.s || a.e[0] - b.e[0]; });
    out = out.slice(0, 8);
    var res = out.map(function (x) { return x.e; });
    res.best = out.length ? out[0].s : 0;
    return res;
  }
  /* keywords match from the start of a word only ("fe" ≠ "half-life") */
  function scoreWords(q, hay) {
    if (!q) return 0;
    var best = 0;
    hay.split(/[\s\-\/]+/).forEach(function (w) {
      if (w === q) best = Math.max(best, 75);
      else if (w.indexOf(q) === 0) best = Math.max(best, 50);
    });
    return best;
  }
  function searchList(raw, list, titleIdx, kwIdx) {
    var q = norm(raw), L = lang();
    var out = [];
    list.forEach(function (it) {
      var title = norm(it[L === 'pt' ? titleIdx[0] : titleIdx[1]]), other = norm(it[L === 'pt' ? titleIdx[1] : titleIdx[0]]);
      var s = Math.max(scoreText(q, title), scoreText(q, other) * 0.8, scoreWords(q, norm(it[kwIdx])));
      if (!q) s = 1;
      if (s > 0) out.push({ it: it, s: s });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    var res = out.map(function (x) { return x.it; });
    res.best = out.length ? out[0].s : 0;
    return res;
  }
  /* "H2SO4", "CuSO4·5H2O", "CH3CH2OH": every token is a known element symbol */
  function asFormula(raw) {
    var s = String(raw || '').trim().replace(/\s+/g, '');
    if (s.length < 2 || !/^[A-Z]/.test(s) || !/[0-9]|[A-Z].*[A-Z]/.test(s) || /[^A-Za-z0-9()[\]·.*+\-]/.test(s)) return null;
    var syms = {};
    (w.RM_ELEMENTS || []).forEach(function (e) { syms[e[1]] = 1; });
    var tokens = s.match(/[A-Z][a-z]?/g) || [];
    if (!tokens.length || tokens.some(function (t) { return !syms[t]; })) return null;
    if (s.replace(/[A-Z][a-z]?|\d|[()[\]·.*+\-]/g, '').length) return null;
    return s;
  }

  /* ── dialog ─────────────────────────────────────────────────────── */
  var root = null, input = null, list = null, opener = null, items = [], active = 0;

  function build() {
    root = document.createElement('div');
    root.className = 'rm-cmdk';
    root.hidden = true;
    root.innerHTML =
      '<div class="rm-cmdk-backdrop" data-cmdk-close></div>' +
      '<div class="rm-cmdk-panel" role="dialog" aria-modal="true">' +
        '<div class="rm-cmdk-head">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
          '<input class="rm-cmdk-input" type="search" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="rm-cmdk-list">' +
          '<button class="rm-cmdk-esc" type="button" data-cmdk-close>Esc</button>' +
        '</div>' +
        '<div class="rm-cmdk-list" id="rm-cmdk-list" role="listbox"></div>' +
        '<p class="rm-cmdk-foot"></p>' +
      '</div>';
    document.body.appendChild(root);
    input = root.querySelector('.rm-cmdk-input');
    list = root.querySelector('.rm-cmdk-list');
    input.addEventListener('input', render);
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-cmdk-close]')) { close(); return; }
      var link = e.target.closest('a[href]');
      if (link) {
        // new tab / window: let the browser do it and keep the palette
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        navigate(link.getAttribute('href'));
        return;
      }
      var opt = e.target.closest('[data-cmdk-i]');
      if (opt) go(+opt.getAttribute('data-cmdk-i'), e);
    });
    root.addEventListener('mousemove', function (e) {
      var opt = e.target.closest('[data-cmdk-i]');
      if (opt) setActive(+opt.getAttribute('data-cmdk-i'), false);
    });
    root.addEventListener('keydown', onKey);
  }

  function labels() {
    var t = T();
    input.placeholder = t.placeholder;
    input.setAttribute('aria-label', t.placeholder);
    root.querySelector('.rm-cmdk-panel').setAttribute('aria-label', t.label);
    root.querySelector('.rm-cmdk-esc').setAttribute('aria-label', t.close);
    root.querySelector('.rm-cmdk-foot').textContent = t.foot;
  }

  /* One option: the main link and, for elements, a sibling "atom in 3D" link
     (links cannot be nested). Real links, so middle-click / new tab work. */
  function option(i, href, main, sub, lead, extra) {
    return '<div class="rm-cmdk-opt" id="rm-cmdk-o' + i + '" role="option" aria-selected="false" data-cmdk-i="' + i + '">' +
      '<a class="rm-cmdk-link" href="' + esc(href) + '" tabindex="-1">' + lead +
      '<span class="rm-cmdk-txt"><span class="rm-cmdk-main">' + main + '</span>' + (sub ? '<span class="rm-cmdk-sub-t">' + sub + '</span>' : '') + '</span></a>' +
      (extra || '') + '</div>';
  }

  function render() {
    var t = T(), raw = input.value, q = raw.trim(), L = lang();
    var html = '';
    items = [];
    var els = searchElements(q);
    var formula = els.length && els[0][1] === q ? null : asFormula(q);
    var tools = searchList(q, TOOLS, [1, 2], 5);
    var arts = q ? searchList(q, ARTICLES, [1, 2], 3) : [];

    var groups = [];
    var toolsBest = tools.best || 0, artsBest = arts.best || 0;
    tools = tools.slice(0, q ? 5 : 6);
    arts = arts.slice(0, 4);
    function elGroup() {
      var h = '<div class="rm-cmdk-group" role="presentation">' + t.elements + '</div>';
      els.forEach(function (e) {
        var i = items.length, cat = w.rmCatOf ? w.rmCatOf(e[0]) : '';
        var href = '/periodic-table/' + e[5] + '.html';
        items.push(href);
        var tile = '<span class="rm-cmdk-tile" data-cat="' + cat + '"><span>' + e[0] + '</span><b>' + esc(e[1]) + '</b></span>';
        var sub = t.z + ' ' + e[0] + ' · ' + massText(e[4]) + ' u';
        var atom = '<a class="rm-cmdk-sub" href="/viewer/atomic-models.html?el=' + encodeURIComponent(e[1]) + '&amp;model=bohr" tabindex="-1">' + t.atom3d + '</a>';
        h += option(i, href, esc(e[L === 'pt' ? 2 : 3]), sub, tile, atom);
      });
      return h;
    }
    function formulaGroup() {
      var h = '<div class="rm-cmdk-group" role="presentation">' + t.formula + '</div>';
      var mh = '/calculators.html?formula=' + encodeURIComponent(formula) + '#molar';
      items.push(mh);
      h += option(items.length - 1, mh, esc(t.molar(formula)), esc(t.molarDesc), '<span class="rm-cmdk-ico" aria-hidden="true">M</span>');
      if (/C/.test(formula.replace(/C[a-z]/g, ''))) {
        var bh = '/viewer/molecules.html?build=' + encodeURIComponent(formula);
        items.push(bh);
        h += option(items.length - 1, bh, esc(t.build(formula)), esc(t.buildDesc), '<span class="rm-cmdk-ico" aria-hidden="true">3D</span>');
      }
      return h;
    }
    function toolGroup() {
      var h = '<div class="rm-cmdk-group" role="presentation">' + t.tools + '</div>';
      tools.forEach(function (it) {
        items.push(it[0]);
        h += option(items.length - 1, it[0], esc(it[L === 'pt' ? 1 : 2]), esc(it[L === 'pt' ? 3 : 4]), '<span class="rm-cmdk-ico" aria-hidden="true">→</span>');
      });
      return h;
    }
    function artGroup() {
      var h = '<div class="rm-cmdk-group" role="presentation">' + t.articles + '</div>';
      arts.forEach(function (it) {
        items.push(it[0]);
        h += option(items.length - 1, it[0], esc(it[L === 'pt' ? 1 : 2]), '', '<span class="rm-cmdk-ico" aria-hidden="true">¶</span>');
      });
      return h;
    }
    if (els.length) groups.push({ s: els.best, f: elGroup, k: 0 });
    if (formula) groups.push({ s: 95, f: formulaGroup, k: 1 });
    if (tools.length) groups.push({ s: q ? toolsBest : 0, f: toolGroup, k: 2 });
    if (arts.length) groups.push({ s: artsBest, f: artGroup, k: 3 });
    // best match first; ties keep elements → formula → tools → articles
    groups.sort(function (a, b) { return b.s - a.s || a.k - b.k; });
    groups.forEach(function (g) { html += g.f(); });
    if (q && !els.length && !formula && !tools.length && !arts.length) html = '<p class="rm-cmdk-empty">' + esc(t.none(q)) + '</p>';
    else if (!q) html = '<p class="rm-cmdk-hint">' + esc(t.hint) + '</p>' + html;
    list.innerHTML = html;
    setActive(0, true);
  }

  function setActive(i, scroll) {
    if (!items.length) { input.removeAttribute('aria-activedescendant'); return; }
    active = Math.max(0, Math.min(items.length - 1, i));
    list.querySelectorAll('.rm-cmdk-opt').forEach(function (o) {
      var on = +o.getAttribute('data-cmdk-i') === active;
      o.classList.toggle('is-active', on);
      o.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && scroll && o.scrollIntoView) o.scrollIntoView({ block: 'nearest' });
    });
    input.setAttribute('aria-activedescendant', 'rm-cmdk-o' + active);
  }

  function go(i, e) {
    var href = items[i];
    if (!href) return;
    if (e && (e.metaKey || e.ctrlKey)) { w.open(href, '_blank', 'noopener'); return; }
    navigate(href);
  }
  function navigate(href) {
    close(true);
    var u = new URL(href, w.location.href);
    // same page, other #tab (calculators): change the hash, the page switches tab
    if (u.pathname === w.location.pathname && u.search === w.location.search && u.hash) {
      if (u.hash !== w.location.hash) w.location.hash = u.hash;
      return;
    }
    w.location.href = u.href;
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1, true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1, true); }
    else if (e.key === 'Enter' && e.target === input) { e.preventDefault(); go(active, e); }
    else if (e.key === 'Tab') {
      // keep focus inside the dialog
      var f = [].slice.call(root.querySelectorAll('input, button'));
      var idx = f.indexOf(document.activeElement);
      if (e.shiftKey && idx <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && idx === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }

  function open(from) {
    if (!root) build();
    opener = from || document.activeElement;
    labels();
    root.hidden = false;
    document.documentElement.classList.add('rm-cmdk-open');
    input.value = '';
    render();
    setTimeout(function () { input.focus(); }, 0);
  }
  function close(navigating) {
    if (!root || root.hidden) return;
    root.hidden = true;
    document.documentElement.classList.remove('rm-cmdk-open');
    if (!navigating && opener && opener.focus) opener.focus();
  }

  w.AtomurusSearch = { open: open, close: close, _elements: searchElements, _formula: asFormula, _tools: TOOLS, _articles: ARTICLES };
})(window);
