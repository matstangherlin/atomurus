/* Exercise bank (prompt 30). One resolver for the build (Node, in a vm
   context) and for «Novo exercício» in the browser: it picks the variables,
   runs the calc-core engine and describes the engine's steps. Answers are
   never typed: they are what the engine computes. Needs AtomurusCalcCore,
   AtomurusWorkedSteps and AtomurusFormula (and AtomurusWorkedSolution for
   the page). */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusExercises = api;
  if (root.document && root.document.querySelector) api.mount(root.document);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var ENGINES = ['computeMolarMass', 'computeDilution', 'computePH', 'computeIdealGas', 'computeSolutionMass', 'computeBufferRatio'];
  var SEED_RE = /^\d{1,10}$/;
  var FORMULA_RE = /^[A-Z][A-Za-z0-9()·.]*$/;

  function calc() { return root.AtomurusCalcCore; }
  function words() { return root.AtomurusWorkedSteps; }
  function formula() { return root.AtomurusFormula; }

  /* Small seeded generator: the same seed gives the same exercise. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clean(n) { return Number(Number(n).toPrecision(10)); }

  /* { "@by": "unit", "g": …, "mol": … } chooses by another variable. */
  function keyed(spec, vars) {
    if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec['@by']) return spec[vars[spec['@by']]];
    return spec;
  }

  /* Variables are drawn in the order they are listed: a list, a grid
     { min, max, step }, or a list of factors of another variable. */
  function pickVars(def, seed) {
    var rand = mulberry32(seed);
    var vars = {};
    Object.keys(def.variables).forEach(function (name) {
      var spec = keyed(def.variables[name], vars);
      if (spec == null) return;
      if (spec.list) {
        var item = spec.list[Math.floor(rand() * spec.list.length)];
        vars[name] = spec.times ? clean(vars[spec.times] * item) : item;
      } else {
        var steps = Math.round((spec.max - spec.min) / spec.step);
        vars[name] = clean(spec.min + Math.floor(rand() * (steps + 1)) * spec.step);
      }
    });
    return vars;
  }

  function resolve(arg, vars) {
    if (Array.isArray(arg)) return arg.map(function (a) { return resolve(a, vars); });
    if (arg && typeof arg === 'object') {
      var out = {};
      Object.keys(arg).forEach(function (k) { out[k] = resolve(arg[k], vars); });
      return out;
    }
    if (typeof arg !== 'string' || arg.charAt(0) !== '@') return arg;
    if (arg === '@weights') return formula().ATOMIC_WEIGHTS;
    if (arg.indexOf('@counts:') === 0) return counts(vars[arg.slice(8)]);
    if (arg.indexOf('@acid:') === 0) return acidField(vars, arg.slice(6));
    return vars[arg.slice(1)];
  }

  /* '@acid:acid.pKa' — a field of a sourced constant in calc-core
     (ACID_BASE_CONSTANTS), chosen by a variable; values are never typed. */
  function acidField(vars, path) {
    var parts = path.split('.');
    var id = vars[parts[0]];
    var row = calc().ACID_BASE_CONSTANTS.filter(function (r) { return r.id === id; })[0];
    if (!row) throw new Error('no sourced constant ' + id);
    if (parts[1] === 'pKa') return row.pKa ? row.pKa[0] : null;
    return row[parts[1]];
  }

  function counts(text) {
    var parsed = formula().parseFormulaStrict(String(text));
    if (!parsed.ok) throw new Error('formula: ' + text);
    return parsed.counts;
  }

  function run(def, vars) {
    var name = String(def.engine.fn).replace(/^calc-core\./, '');
    if (ENGINES.indexOf(name) === -1) throw new Error('engine not allowed: ' + def.engine.fn);
    return calc()[name].apply(null, resolve(def.engine.args, vars));
  }

  /* What a student gets with a typical mistake — computed by the same
     engine, with the mistake made on purpose. */
  var WRONG = {
    ignoreSubscripts: function (vars, locale) {
      var ones = {};
      Object.keys(counts(vars.formula)).forEach(function (sym) { ones[sym] = 1; });
      return words().formatNumber(calc().computeMolarMass(ones, formula().ATOMIC_WEIGHTS).total, 5, locale) + ' g/mol';
    },
    conversionInverted: function (vars, locale) {
      var M = calc().computeMolarMass(counts(vars.formula), formula().ATOMIC_WEIGHTS).total;
      return vars.unit === 'g'
        ? words().formatNumber(M / vars.amount, 4, locale) + ' mol'
        : words().formatNumber(vars.amount / M, 4, locale) + ' g';
    },
    phSignForgotten: function (vars, locale) {
      return fixed(-calc().computePH({ mode: 'H', value: vars.c }).pH, locale);
    },
    pOHasPH: function (vars, locale) {
      return fixed(calc().computePH({ mode: 'OH', value: vars.c }).pOH, locale);
    },
    volumeInML: function (vars, locale) {
      var M = calc().computeMolarMass(counts(vars.formula), formula().ATOMIC_WEIGHTS).total;
      return words().formatNumber(vars.C * vars.V * M, 4, locale) + ' g';
    }
  };
  function fixed(n, locale) {
    var text = n.toFixed(2).replace(/^-/, '−');
    return locale === 'pt' ? text.replace('.', ',') : text;
  }

  function show(value, locale) {
    if (value && typeof value === 'object' && value.pt != null) return value[locale];
    if (typeof value === 'number') return words().plain(value, locale);
    if (FORMULA_RE.test(String(value))) return formula().formatFormulaDisplay(String(value));
    return String(value);
  }
  function fill(text, vars, locale) {
    return String(text).replace(/\{(\w+)\}/g, function (_, k) { return vars[k] == null ? '' : show(vars[k], locale); });
  }

  /* Template slots: the variables plus def.display (e.g. an acid's name and
     pKa, read from calc-core). */
  function shown(def, vars) {
    var out = {};
    Object.keys(vars).forEach(function (k) { out[k] = vars[k]; });
    Object.keys(def.display || {}).forEach(function (k) {
      var spec = String(def.display[k]);
      var lower = /\|lower$/.test(spec); // mid-sentence: «ácido acético», not «Ácido acético»
      var v = resolve(spec.replace(/\|lower$/, ''), vars);
      if (lower && v && typeof v === 'object') v = { pt: v.pt.charAt(0).toLowerCase() + v.pt.slice(1), en: v.en.charAt(0).toLowerCase() + v.en.slice(1) };
      out[k] = v;
    });
    return out;
  }

  /* → { ok, statement, answer, steps: [{ text, expr }], errors: [text], result } */
  function solve(def, vars, locale) {
    locale = locale === 'pt' ? 'pt' : 'en';
    var result = run(def, vars);
    if (!result || !result.ok || !result.steps || !result.steps.length) return { ok: false, code: result && result.code };
    var view = words().describe(result.steps, { locale: locale, answerStep: keyed(def.answer.step, vars) });
    var right = view.answer.slice(view.answer.indexOf('= ') + 2);
    var errors = [];
    (def.commonErrors || []).forEach(function (e) {
      if (e.when && !Object.keys(e.when).every(function (k) { return vars[k] === e.when[k]; })) return;
      var wrong = WRONG[e.wrong](vars, locale);
      // A mistake that lands on the right value (NaCl has no subscripts) teaches nothing here.
      if (wrong !== right) errors.push(fill(e.message[locale], { wrong: wrong }, locale));
    });
    return {
      ok: true,
      statement: fill(keyed(def.template, vars)[locale], shown(def, vars), locale),
      answer: view.answer,
      steps: view.steps,
      errors: errors,
      result: result
    };
  }

  // ── Page: «Novo exercício» ────────────────────────────────────────────────
  function seedFromUrl(loc) {
    try {
      var s = new URLSearchParams(loc.search).get('seed');
      return s && SEED_RE.test(s) ? Number(s) : null;
    } catch (e) { return null; }
  }

  function mount(doc) {
    var box = doc.querySelector('[data-ex-new-root]');
    var data = doc.getElementById('ex-def');
    if (!box || !data) return;
    var def;
    try { def = JSON.parse(data.textContent); } catch (e) { return; }
    var locale = (doc.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
    var L = def.labels;
    var out = box.querySelector('[data-ex-out]');
    var link = box.querySelector('[data-ex-link]');
    var loc = root.location;

    function render(seed) {
      var ex = solve(def, pickVars(def, seed), locale);
      if (!ex.ok) { out.textContent = L.failed; return; }
      out.innerHTML = '<p class="ex-statement"></p><details class="ex-answer"><summary></summary><p class="ex-answer-v" translate="no"></p></details><div class="ex-wsol"></div>';
      out.querySelector('.ex-statement').textContent = ex.statement;
      out.querySelector('summary').textContent = L.answer;
      out.querySelector('.ex-answer-v').textContent = ex.answer;
      var details = out.querySelector('.ex-answer');
      ex.errors.forEach(function (text) {
        var p = doc.createElement('p');
        p.className = 'ex-error';
        p.textContent = text;
        details.appendChild(p);
      });
      if (root.AtomurusWorkedSolution) {
        root.AtomurusWorkedSolution.render(out.querySelector('.ex-wsol'), { steps: ex.steps, locale: locale, labels: { show: L.showSolution, hide: L.hideSolution } });
      }
      try {
        var u = new URL(loc.href);
        u.searchParams.set('seed', String(seed));
        root.history.replaceState(root.history.state, '', u.href);
        link.href = u.pathname + u.search + '#novo';
        link.hidden = false;
      } catch (e) {}
    }

    box.querySelector('[data-ex-new]').addEventListener('click', function () {
      render(1 + Math.floor(Math.random() * 2147483646));
    });
    var keyToggle = doc.querySelector('[data-ex-print-key]');
    if (keyToggle) keyToggle.addEventListener('change', function () {
      // Printed only on request, on its own page; opened so it prints whole.
      doc.documentElement.classList.toggle('ex-print-key', keyToggle.checked);
      var key = doc.getElementById('gabarito');
      if (key) key.open = keyToggle.checked;
    });
    var shared = seedFromUrl(loc);
    if (shared != null) render(shared);
  }

  return { mulberry32: mulberry32, keyed: keyed, pickVars: pickVars, solve: solve, WRONG: WRONG, ENGINES: ENGINES, mount: mount };
});
