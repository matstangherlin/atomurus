(function () {
  'use strict';

  var STYLE_ID = 'atomurus-study-save-style';
  var HOST_ID = 'atomurus-study-save';
  var lastCalculatorRun = null;
  var pending = false;
  var savedItem = null;

  function study() {
    return window.AtomurusStudy;
  }

  function langIsPt() {
    var lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.indexOf('pt') === 0) return true;
    try {
      return localStorage.getItem('atomurus-lang') === 'pt';
    } catch (_err) {
      return false;
    }
  }

  function t(key, fallback) {
    if (window.I18N && typeof window.I18N.t === 'function') {
      var value = window.I18N.t('common.study.' + key);
      if (value && value !== 'common.study.' + key) return value;
    }
    return fallback;
  }

  function copy() {
    var pt = langIsPt();
    return {
      save: t('save', pt ? 'Salvar' : 'Save'),
      saved: t('saved', pt ? 'Salvo ✓' : 'Saved ✓'),
      saveResult: t('saveResult', pt ? 'Salvar resultado' : 'Save result'),
      note: t('note', pt ? 'Nota' : 'Note'),
      tags: t('tags', pt ? 'Tags' : 'Tags'),
      signIn: t('signIn', pt ? 'Entre para salvar no Study Cloud.' : 'Sign in to save to Study Cloud.'),
      proOnly: t('proOnly', pt ? 'Study Cloud está no Atomurus Pro.' : 'Study Cloud is included with Atomurus Pro.'),
      upgrade: t('upgrade', pt ? 'Ver planos' : 'See plans'),
      login: t('login', pt ? 'Entrar' : 'Sign in')
    };
  }

  function currentPath() {
    return location.pathname + location.search;
  }

  function loginHref() {
    var client = window.AtomurusAuth;
    if (client && typeof client.loginUrl === 'function') return client.loginUrl(currentPath());
    return '/login?next=' + encodeURIComponent(currentPath());
  }

  function goLogin() {
    var client = window.AtomurusAuth;
    if (client && typeof client.redirectToLogin === 'function') {
      client.redirectToLogin(currentPath());
      return;
    }
    location.replace(loginHref());
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#atomurus-study-save{font-family:var(--lc-mono,ui-monospace,monospace);margin:14px 0 18px}',
      '#atomurus-study-save .study-save-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}',
      '#atomurus-study-save button{font:inherit;letter-spacing:.08em;text-transform:uppercase;font-size:10.5px;padding:7px 10px;border:1px solid var(--lc-rule,rgba(30,106,80,.35));background:transparent;color:inherit;border-radius:2px;cursor:pointer}',
      '#atomurus-study-save button[disabled]{opacity:.6;cursor:wait}',
      '#atomurus-study-save button.saved{color:var(--lc-green,#1E6A50);border-color:color-mix(in oklab,var(--lc-green,#1E6A50) 40%,transparent)}',
      '#atomurus-study-save .study-save-msg{font-size:11.5px;letter-spacing:.02em;color:var(--lc-ink-3,#667)}',
      '#atomurus-study-save .study-save-msg a{color:inherit}',
      '#atomurus-study-save .study-save-fields{display:none;margin-top:10px;max-width:420px}',
      '#atomurus-study-save.open .study-save-fields{display:grid;gap:8px}',
      '#atomurus-study-save label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--lc-ink-3,#667)}',
      '#atomurus-study-save input,#atomurus-study-save textarea{font:inherit;width:100%;padding:8px;border:1px solid var(--lc-rule,rgba(0,0,0,.12));background:transparent;color:inherit;border-radius:2px}',
      '#atomurus-study-save textarea{min-height:72px;resize:vertical}'
    ].join('');
    document.head.appendChild(style);
  }

  function latinSlug() {
    var path = location.pathname.replace(/\.html$/i, '').replace(/\/$/, '');
    var slug = path.split('/').pop() || '';
    return slug.replace(/\.en$|\.pt$/i, '');
  }

  function pageHref() {
    var path = location.pathname.replace(/\.html$/i, '');
    if (!path) path = '/';
    return path;
  }

  function detectContext() {
    if (typeof window.PAGE_Z === 'number' && window.PAGE_Z > 0) {
      var el = (typeof ELEMENTS !== 'undefined' && ELEMENTS.find)
        ? ELEMENTS.find(function (item) { return item.z === window.PAGE_Z; })
        : null;
      var nameNode = document.querySelector('.lc-el-name');
      var title = nameNode ? nameNode.textContent.replace(/\s+/g, ' ').trim() : (el && el.name) || latinSlug();
      return {
        kind: 'library',
        itemType: 'element',
        itemKey: latinSlug() || String(window.PAGE_Z),
        title: title,
        href: pageHref()
      };
    }

    var path = location.pathname.replace(/\.html$/i, '').replace(/\/$/, '').toLowerCase();
    if (path === '/calculators') {
      return { kind: 'calculator' };
    }

    if (path === '/viewer/molecules' || document.querySelector('[data-mol]')) {
      var active = document.querySelector('.mol-btn.active,[data-mol].active');
      var mol = (active && active.getAttribute('data-mol')) || new URLSearchParams(location.search).get('mol') || 'water';
      var name = document.getElementById('model-name');
      return {
        kind: 'library',
        itemType: 'molecule',
        itemKey: mol,
        title: name ? name.textContent.trim() : mol,
        href: '/viewer/molecules?mol=' + encodeURIComponent(mol)
      };
    }

    if (path.indexOf('/explore/') === 0 || path === '/viewer/atomic-models' || path.indexOf('/viewer/atomic-models/') === 0 || path.indexOf('/viewer/isomerism') === 0 || path === '/explore') {
      var heading = document.querySelector('h1, .lc-doc-title, .lc-el-name');
      return {
        kind: 'library',
        itemType: 'article',
        itemKey: latinSlug() || path,
        title: heading ? heading.textContent.replace(/\s+/g, ' ').trim() : document.title,
        href: pageHref()
      };
    }

    return null;
  }

  function hostParent() {
    return document.querySelector('.lc-el-header-l, .calc-panel-head, .content-inner, .lc-doc-prose, article, .main') || document.body;
  }

  function setMsg(node, text, href, hrefLabel) {
    node.textContent = '';
    if (!text) return;
    node.appendChild(document.createTextNode(text + (href ? ' ' : '')));
    if (href) {
      var link = document.createElement('a');
      link.href = href;
      link.textContent = hrefLabel || href;
      node.appendChild(link);
    }
  }

  function handleError(err, msgNode, labels) {
    if (!err) return;
    if (err.status === 401 || err.code === 'session_expired') {
      goLogin();
      return;
    }
    if (err.status === 403 || err.code === 'feature_locked') {
      setMsg(msgNode, labels.proOnly, err.upgradeUrl || '/pricing', labels.upgrade);
      return;
    }
    setMsg(msgNode, err.message || 'Could not save.');
  }

  function paintSaved(button, labels, on) {
    button.classList.toggle('saved', on);
    button.textContent = on ? labels.saved : (lastCalculatorRun && detectContext() && detectContext().kind === 'calculator' ? labels.saveResult : labels.save);
  }

  function readFields(host) {
    var note = host.querySelector('[data-study-note]');
    var tags = host.querySelector('[data-study-tags]');
    return {
      note: note ? note.value : '',
      tags: tags ? tags.value.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean) : []
    };
  }

  function mountLibrary(ctx) {
    ensureStyle();
    var existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();
    savedItem = null;
    var labels = copy();
    var host = document.createElement('div');
    host.id = HOST_ID;
    var row = document.createElement('div');
    row.className = 'study-save-row';
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = labels.save;
    var details = document.createElement('button');
    details.type = 'button';
    details.textContent = labels.note;
    var msg = document.createElement('div');
    msg.className = 'study-save-msg';
    var fields = document.createElement('div');
    fields.className = 'study-save-fields';
    var noteLabel = document.createElement('label');
    noteLabel.textContent = labels.note;
    var note = document.createElement('textarea');
    note.setAttribute('data-study-note', '1');
    note.maxLength = 5000;
    var tagsLabel = document.createElement('label');
    tagsLabel.textContent = labels.tags;
    var tags = document.createElement('input');
    tags.setAttribute('data-study-tags', '1');
    tags.maxLength = 400;
    fields.appendChild(noteLabel);
    fields.appendChild(note);
    fields.appendChild(tagsLabel);
    fields.appendChild(tags);
    row.appendChild(button);
    row.appendChild(details);
    row.appendChild(msg);
    host.appendChild(row);
    host.appendChild(fields);
    var parent = hostParent();
    parent.insertBefore(host, parent.firstChild);

    details.addEventListener('click', function () {
      host.classList.toggle('open');
    });

    button.addEventListener('click', function () {
      if (pending) return;
      var api = study();
      if (!api) return;
      var fieldsValue = readFields(host);
      var payload = {
        itemType: ctx.itemType,
        itemKey: ctx.itemKey,
        title: ctx.title,
        href: ctx.href,
        note: fieldsValue.note,
        tags: fieldsValue.tags
      };
      pending = true;
      paintSaved(button, labels, true);
      setMsg(msg, '');
      api.saveItem(payload).then(function (data) {
        savedItem = data.item || null;
        paintSaved(button, labels, true);
      }).catch(function (err) {
        paintSaved(button, labels, false);
        handleError(err, msg, labels);
      }).then(function () {
        pending = false;
      });
    });
  }

  function captureCalculatorRun() {
    var tab = document.querySelector('.calc-tab.active') || document;
    var result = tab.querySelector('.calc-result-v.big, .calc-result-v');
    if (!result) return null;
    var titleNode = tab.querySelector('.calc-panel-title, h2');
    var input = tab.querySelector('input:not([type="hidden"]), textarea');
    var resultText = result.textContent.replace(/\s+/g, ' ').trim();
    if (!resultText) return null;
    var calculator = (tab.id || 'calculator').replace(/^tab-/, '') || 'calculator';
    lastCalculatorRun = {
      calculator: calculator,
      title: titleNode ? titleNode.textContent.replace(/\s+/g, ' ').trim() : calculator,
      href: '/calculators',
      result: resultText.slice(0, 500),
      inputs: input ? { value: input.value } : {},
      unit: ''
    };
    return lastCalculatorRun;
  }

  function mountCalculator() {
    ensureStyle();
    var existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();
    var labels = copy();
    var host = document.createElement('div');
    host.id = HOST_ID;
    var row = document.createElement('div');
    row.className = 'study-save-row';
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = labels.saveResult;
    var msg = document.createElement('div');
    msg.className = 'study-save-msg';
    row.appendChild(button);
    row.appendChild(msg);
    host.appendChild(row);
    var panel = document.querySelector('.calc-panel-head, .calc-panel, .content') || document.body;
    panel.appendChild(host);

    button.addEventListener('click', function () {
      var run = lastCalculatorRun || captureCalculatorRun();
      if (!run || pending) return;
      var api = study();
      if (!api) return;
      pending = true;
      paintSaved(button, labels, true);
      setMsg(msg, '');
      api.saveCalculatorRun(run).then(function () {
        paintSaved(button, labels, true);
      }).catch(function (err) {
        paintSaved(button, labels, false);
        handleError(err, msg, labels);
      }).then(function () {
        pending = false;
      });
    });
  }

  function hookCalculators() {
    document.addEventListener('click', function (event) {
      var btn = event.target && event.target.closest && event.target.closest('.calc-btn-run');
      if (!btn) return;
      setTimeout(captureCalculatorRun, 0);
    }, true);
    ['runMolar', 'runScientific', 'runUnit', 'runIdeal', 'runDilution', 'runPH', 'runStoich', 'runThermo'].forEach(function (name) {
      var original = window[name];
      if (typeof original !== 'function' || original.__atomurusStudyWrapped) return;
      var wrapped = function () {
        var result = original.apply(this, arguments);
        setTimeout(captureCalculatorRun, 0);
        return result;
      };
      wrapped.__atomurusStudyWrapped = true;
      window[name] = wrapped;
    });
  }

  function hookMolecule() {
    if (typeof window.setMolecule !== 'function' || window.setMolecule.__atomurusStudyWrapped) return;
    var original = window.setMolecule;
    window.setMolecule = function (key, skip) {
      var result = original.apply(this, arguments);
      var ctx = detectContext();
      if (ctx && ctx.kind === 'library') mountLibrary(ctx);
      return result;
    };
    window.setMolecule.__atomurusStudyWrapped = true;
  }

  function boot() {
    var ctx = detectContext();
    if (!ctx) return;
    if (ctx.kind === 'calculator') {
      hookCalculators();
      mountCalculator();
      return;
    }
    hookMolecule();
    mountLibrary(ctx);
  }

  window.AtomurusStudySave = {
    boot: boot,
    detectContext: detectContext,
    setLastCalculatorRun: function (run) {
      lastCalculatorRun = run;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
