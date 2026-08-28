(function () {
  'use strict';

  var STYLE_ID = 'atomurus-study-save-style';
  var HOST_ID = 'atomurus-study-save';
  var STUDY_WAIT_MS = 8000;
  var lastCalculatorRun = null;
  var pending = false;
  var savedItem = null;

  function study() {
    return window.AtomurusStudy;
  }

  function withStudy(cb) {
    var api = study();
    if (api) {
      try { return Promise.resolve(cb(api)); } catch (err) { return Promise.reject(err); }
    }
    return new Promise(function (resolve, reject) {
      var started = Date.now();
      function tick() {
        var ready = study();
        if (ready) {
          try { resolve(cb(ready)); } catch (err) { reject(err); }
          return;
        }
        if (Date.now() - started > STUDY_WAIT_MS) {
          resolve(null);
          return;
        }
        setTimeout(tick, 50);
      }
      tick();
    });
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
      addToSet: t('addToSet', pt ? 'Adicionar ao Study Set' : 'Add to Study Set'),
      newSet: t('newSet', pt ? '+ Novo Study Set' : '+ New Study Set'),
      generate: t('generate', pt ? 'Gerar cards' : 'Generate cards'),
      review: t('review', pt ? 'Revisar' : 'Review'),
      setName: t('setName', pt ? 'Nome do set' : 'Set title'),
      createSet: t('createSet', pt ? 'Criar' : 'Create'),
      addedTo: t('addedTo', pt ? 'Adicionado a' : 'Added to'),
      cardsCreated: t('cardsCreated', pt ? 'flashcards criados' : 'flashcards created'),
      cardsNoneNeeded: t('cardsNoneNeeded', pt ? 'Nenhum card novo era necessário. Esses flashcards já existem neste Study Set.' : 'No new cards were needed. These flashcards already exist in this Study Set.'),
      signIn: t('signIn', pt ? 'Entre para salvar no Study Cloud.' : 'Sign in to save to Study Cloud.'),
      proOnly: t('proOnly', pt ? 'A Biblioteca é um recurso Pro' : 'Study Library is a Pro feature'),
      upgrade: t('upgrade', pt ? 'Assinar o Pro' : 'Upgrade to Pro'),
      login: t('login', pt ? 'Entrar' : 'Sign in'),
      createAccount: t('createAccount', pt ? 'Criar conta' : 'Create account'),
      saveTitle: t('saveTitle', pt ? 'Salve isto na sua Biblioteca' : 'Save this to your Study Library'),
      saveBody: t('saveBody', pt ? 'Crie uma conta Atomurus e comece seu trial Pro de 30 dias para salvar e sincronizar material de estudo.' : 'Create an Atomurus account and start your 30-day Pro trial to save and sync study material.'),
      lockedBody: t('lockedBody', pt ? 'Salve materiais, notas e progresso de estudo em todos os dispositivos.' : 'Save materials, notes and study progress across devices.'),
      proBadge: t('proBadge', 'PRO'),
      couldNotSave: t('couldNotSave', pt ? 'Não foi possível salvar. Tente de novo.' : 'Could not save. Try again.'),
      nothingToSave: t('nothingToSave', pt ? 'Execute a calculadora primeiro e depois salve o resultado.' : 'Run the calculator first, then save the result.'),
      genPartial: t('genPartial', pt ? 'Adicionado ao Study Set, mas não foi possível gerar os flashcards.' : 'Added to Study Set, but flashcards could not be generated.'),
      tryGenerate: t('tryGenerate', pt ? 'Tentar gerar novamente' : 'Try generating again')
    };
  }

  function currentPath() {
    return location.pathname + location.search;
  }

  function pagePath() {
    return location.pathname.replace(/\.html$/i, '').replace(/\/$/, '').toLowerCase() || '/';
  }

  function isCalculatorsPage() {
    return pagePath() === '/calculators';
  }

  function isMoleculesPage() {
    return pagePath() === '/viewer/molecules';
  }

  function loginHref() {
    var client = window.AtomurusAuth;
    if (client && typeof client.loginUrl === 'function') return client.loginUrl(currentPath());
    return '/login?next=' + encodeURIComponent(currentPath());
  }

  function signupHref() {
    return '/signup?next=' + encodeURIComponent(currentPath());
  }

  function sessionHint() {
    var ads = window.__ATOMURUS_ADS__;
    if (ads && ads.ready) {
      return { signedIn: Boolean(ads.signedIn), isPro: Boolean(ads.user && ads.user.isPro), user: ads.user };
    }
    var managed = window.__ATOMURUS_AUTH__;
    if (managed && managed.ready) {
      return { signedIn: Boolean(managed.signedIn), isPro: Boolean(managed.user && managed.user.isPro), user: managed.user };
    }
    return { signedIn: false, isPro: false, user: null };
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
      '.calc-panel > #atomurus-study-save{margin:0 0 16px;grid-column:1/-1}',
      '#atomurus-study-save .study-save-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}',
      '#atomurus-study-save button{font:inherit;letter-spacing:.02em;text-transform:none;font-size:13px;font-weight:650;padding:8px 12px;border:1px solid var(--lc-rule,rgba(30,106,80,.35));background:transparent;color:inherit;border-radius:8px;cursor:pointer;min-height:40px}',
      '#atomurus-study-save button[disabled]{opacity:.6;cursor:wait}',
      '#atomurus-study-save button.saved{color:var(--lc-green,#1E6A50);border-color:color-mix(in oklab,var(--lc-green,#1E6A50) 40%,transparent)}',
      '#atomurus-study-save .study-pro-badge{margin-left:6px;font-family:var(--lc-mono,ui-monospace,monospace);font-size:9px;letter-spacing:.12em;color:var(--lc-green,#1E6A50)}',
      '#atomurus-study-save .study-save-msg{font-size:11.5px;letter-spacing:.02em;color:var(--lc-ink-3,#667)}',
      '#atomurus-study-save .study-save-msg a{color:inherit}',
      '#atomurus-study-save .study-save-fields{display:none;margin-top:10px;max-width:420px}',
      '#atomurus-study-save.open .study-save-fields{display:grid;gap:8px}',
      '#atomurus-study-save label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--lc-ink-3,#667)}',
      '#atomurus-study-save input,#atomurus-study-save textarea{font:inherit;width:100%;padding:8px;border:1px solid var(--lc-rule,rgba(0,0,0,.12));background:transparent;color:inherit;border-radius:2px}',
      '#atomurus-study-save textarea{min-height:72px;resize:vertical}',
      '#atomurus-study-save .study-set-box{display:none;margin-top:10px;max-width:420px}',
      '#atomurus-study-save.has-saved .study-set-box{display:block}',
      '#atomurus-study-save .study-set-menu{display:none;margin-top:8px;padding:8px;border:1px solid var(--lc-rule,rgba(0,0,0,.12));border-radius:2px;gap:6px}',
      '#atomurus-study-save .study-set-menu.open{display:grid}',
      '#atomurus-study-save .study-set-choice,#atomurus-study-save .study-set-new{text-transform:none;letter-spacing:.02em;font-size:12px;text-align:left}',
      '#atomurus-study-save .study-set-create{display:none;grid-template-columns:1fr auto;gap:6px;margin-top:6px}',
      '#atomurus-study-save .study-set-create.open{display:grid}'
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

    var path = pagePath();
    if (path === '/calculators') {
      return { kind: 'calculator' };
    }

    if (path === '/viewer/molecules') {
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
    return document.querySelector('.lc-el-header-l, .content-inner, .lc-doc-prose, article, .main') || document.body;
  }

  function setMsg(node, text, href, hrefLabel) {
    if (!node) return;
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
    setMsg(msgNode, labels.couldNotSave || (langIsPt() ? 'Não foi possível salvar. Tente de novo.' : 'Could not save. Try again.'));
  }

  function paintSaved(button, labels, on) {
    if (!button) return;
    button.classList.toggle('saved', on);
    var base = on
      ? labels.saved
      : (isCalculatorsPage() ? labels.saveResult : labels.save);
    while (button.firstChild) button.removeChild(button.firstChild);
    var mark = document.createElement('span');
    mark.className = 'study-save-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = on ? '✓' : '♡';
    button.appendChild(mark);
    button.appendChild(document.createTextNode(' ' + base));
    if (!on && !sessionHint().isPro) {
      var badge = document.createElement('span');
      badge.className = 'study-pro-badge';
      badge.textContent = labels.proBadge;
      button.appendChild(badge);
    }
  }

  function openSaveGate(labels, hint) {
    var ui = window.AtomurusWorkspaceUI;
    if (!ui || typeof ui.openDialog !== 'function') {
      if (!hint.signedIn) location.assign(signupHref());
      else location.assign('/pricing');
      return;
    }
    if (!hint.signedIn) {
      ui.openDialog({
        title: labels.saveTitle,
        body: labels.saveBody,
        actions: [
          { label: labels.createAccount, kind: 'ws-btn-primary', href: signupHref() },
          { label: labels.login, kind: 'ws-btn-ghost', href: loginHref() }
        ]
      });
      return;
    }
    ui.openDialog({
      title: labels.proOnly,
      body: labels.lockedBody,
      actions: [
        { label: labels.upgrade, kind: 'ws-btn-primary', href: '/pricing' }
      ]
    });
  }

  function readFields(host) {
    var note = host.querySelector('[data-study-note]');
    var tags = host.querySelector('[data-study-tags]');
    return {
      note: note ? note.value : '',
      tags: tags ? tags.value.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean) : []
    };
  }

  function fillFields(host, item) {
    if (!host || !item) return;
    var note = host.querySelector('[data-study-note]');
    var tags = host.querySelector('[data-study-tags]');
    if (note) note.value = item.note || '';
    if (tags) tags.value = Array.isArray(item.tags) ? item.tags.join(', ') : '';
  }

  function markSavedHost(host, on) {
    if (!host) return;
    host.classList.toggle('has-saved', Boolean(on));
  }

  function setCanGenerate(ctx) {
    return ctx && (ctx.itemType === 'element' || ctx.itemType === 'molecule');
  }

  function hydrateLibrary(ctx, host, button, labels) {
    if (!ctx || ctx.kind !== 'library') return;
    if (!sessionHint().isPro) return;
    withStudy(function (api) {
      if (!api) return null;
      return api.items({ type: ctx.itemType, itemKey: ctx.itemKey, limit: 1 }).then(function (data) {
        var item = data && data.items && data.items[0];
        if (!item) return;
        savedItem = item;
        fillFields(host, item);
        paintSaved(button, labels, true);
        markSavedHost(host, true);
        if (item.note || (item.tags && item.tags.length)) host.classList.add('open');
      }).catch(function () { /* unsigned / locked */ });
    });
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
    paintSaved(button, labels, false);
    var details = document.createElement('button');
    details.type = 'button';
    details.textContent = labels.note;
    var msg = document.createElement('div');
    msg.className = 'study-save-msg';
    var fields = document.createElement('div');
    fields.className = 'study-save-fields';
    var noteLabel = document.createElement('label');
    noteLabel.setAttribute('for', 'study-save-note');
    noteLabel.textContent = labels.note;
    var note = document.createElement('textarea');
    note.id = 'study-save-note';
    note.setAttribute('data-study-note', '1');
    note.maxLength = 5000;
    var tagsLabel = document.createElement('label');
    tagsLabel.setAttribute('for', 'study-save-tags');
    tagsLabel.textContent = labels.tags;
    var tags = document.createElement('input');
    tags.id = 'study-save-tags';
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

    var setBox = document.createElement('div');
    setBox.className = 'study-set-box';
    var setRow = document.createElement('div');
    setRow.className = 'study-save-row';
    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'study-add-set';
    addBtn.textContent = labels.addToSet;
    addBtn.setAttribute('aria-haspopup', 'menu');
    addBtn.setAttribute('aria-expanded', 'false');
    var genBtn = document.createElement('button');
    genBtn.type = 'button';
    genBtn.textContent = labels.generate;
    genBtn.hidden = !setCanGenerate(ctx);
    genBtn.disabled = true;
    var setStatus = document.createElement('div');
    setStatus.className = 'study-save-msg';
    setRow.appendChild(addBtn);
    if (setCanGenerate(ctx)) setRow.appendChild(genBtn);
    setRow.appendChild(setStatus);
    var menu = document.createElement('div');
    menu.className = 'study-set-menu';
    menu.setAttribute('role', 'menu');
    var createRow = document.createElement('div');
    createRow.className = 'study-set-create';
    var createInput = document.createElement('input');
    createInput.maxLength = 120;
    createInput.placeholder = labels.setName;
    var createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.textContent = labels.createSet;
    createRow.appendChild(createInput);
    createRow.appendChild(createBtn);
    setBox.appendChild(setRow);
    setBox.appendChild(menu);
    setBox.appendChild(createRow);
    host.appendChild(setBox);

    var parent = hostParent();
    parent.insertBefore(host, parent.firstChild);

    var lastSet = null;

    function requireSavedItem() {
      if (savedItem && savedItem.id) return Promise.resolve(savedItem);
      return withStudy(function (api) {
        if (!api) return null;
        return api.saveItem({
          itemType: ctx.itemType,
          itemKey: ctx.itemKey,
          title: ctx.title,
          href: ctx.href,
          note: readFields(host).note,
          tags: readFields(host).tags
        }).then(function (data) {
          savedItem = data.item || null;
          markSavedHost(host, true);
          paintSaved(button, labels, true);
          return savedItem;
        });
      });
    }

    function fillSetMenu(sets) {
      menu.textContent = '';
      (sets || []).forEach(function (set) {
        var choice = document.createElement('button');
        choice.type = 'button';
        choice.className = 'study-set-choice';
        choice.textContent = set.title || labels.newSet.replace(/^\+\s*/, '') || 'Study Set';
        choice.addEventListener('click', function () {
          choice.disabled = true;
          addToSet(set);
        });
        menu.appendChild(choice);
      });
      var newer = document.createElement('button');
      newer.type = 'button';
      newer.className = 'study-set-new';
      newer.textContent = labels.newSet;
      newer.addEventListener('click', function () {
        createRow.classList.add('open');
        createInput.focus();
      });
      menu.appendChild(newer);
    }

    function addedMessage(set, extra) {
      lastSet = set;
      setStatus.textContent = '';
      setStatus.appendChild(document.createTextNode(labels.addedTo + ' ' + (set.title || labels.newSet.replace(/^\+\s*/, '')) + ' ✓'));
      if (extra) {
        setStatus.appendChild(document.createTextNode(' ' + extra));
      }
      if (set && set.id) {
        var link = document.createElement('a');
        link.href = '/app?section=review&start=1&set=' + encodeURIComponent(set.id);
        link.textContent = labels.review;
        setStatus.appendChild(document.createTextNode(' '));
        setStatus.appendChild(link);
      }
      genBtn.disabled = false;
    }

    function addToSet(set) {
      requireSavedItem().then(function (item) {
        if (!item) return;
        return withStudy(function (api) {
          if (!api) return null;
          return api.addSetItem({ setId: set.id, itemId: item.id }).then(function (data) {
            closeSetMenu();
            addedMessage({ id: set.id, title: data.setTitle || set.title });
          });
        });
      }).catch(function (err) {
        handleError(err, setStatus, labels);
      });
    }

    function closeSetMenu() {
      menu.classList.remove('open');
      createRow.classList.remove('open');
      addBtn.setAttribute('aria-expanded', 'false');
    }

    addBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      var hint = sessionHint();
      if (!hint.isPro) {
        openSaveGate(labels, hint);
        return;
      }
      setStatus.textContent = '';
      withStudy(function (api) {
        if (!api) return null;
        return api.listSets().then(function (data) {
          fillSetMenu(data.sets || []);
          menu.classList.add('open');
          addBtn.setAttribute('aria-expanded', 'true');
          var first = menu.querySelector('button');
          if (first) first.focus();
        });
      }).catch(function (err) {
        handleError(err, setStatus, labels);
      });
    });

    createBtn.addEventListener('click', function () {
      var title = (createInput.value || '').trim();
      if (!title) return;
      createBtn.disabled = true;
      withStudy(function (api) {
        if (!api) return null;
        return api.createSet({ title: title }).then(function (data) {
          createRow.classList.remove('open');
          createInput.value = '';
          createBtn.disabled = false;
          return addToSet(data.set);
        });
      }).catch(function (err) {
        createBtn.disabled = false;
        handleError(err, setStatus, labels);
      });
    });

    genBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      if (!lastSet || !lastSet.id) {
        addBtn.click();
        return;
      }
      if (genBtn.disabled) return;
      genBtn.disabled = true;
      requireSavedItem().then(function (item) {
        if (!item) {
          genBtn.disabled = false;
          return;
        }
        return withStudy(function (api) {
          if (!api) return null;
          return api.generateCards({ setId: lastSet.id, itemId: item.id }).then(function (data) {
            var created = Number(data.created) || 0;
            var skipped = Number(data.skipped) || 0;
            if (created > 0) addedMessage(lastSet, String(created) + ' ' + labels.cardsCreated);
            else if (skipped > 0) setStatus.textContent = labels.cardsNoneNeeded;
            else addedMessage(lastSet, '0 ' + labels.cardsCreated);
          });
        });
      }).catch(function (err) {
        setStatus.textContent = labels.genPartial;
        var retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'study-set-choice';
        retry.textContent = labels.tryGenerate;
        retry.addEventListener('click', function () { genBtn.click(); });
        setStatus.appendChild(document.createTextNode(' '));
        setStatus.appendChild(retry);
        void err;
      }).then(function () {
        genBtn.disabled = false;
      });
    });

    details.addEventListener('click', function () {
      host.classList.toggle('open');
    });

    button.addEventListener('click', function () {
      var hint = sessionHint();
      if (!hint.isPro) {
        openSaveGate(labels, hint);
        return;
      }
      if (pending) return;
      pending = true;
      paintSaved(button, labels, true);
      setMsg(msg, '');
      var fieldsValue = readFields(host);
      var payload = {
        itemType: ctx.itemType,
        itemKey: ctx.itemKey,
        title: ctx.title,
        href: ctx.href,
        note: fieldsValue.note,
        tags: fieldsValue.tags
      };
      withStudy(function (api) {
        if (!api) {
          pending = false;
          paintSaved(button, labels, false);
          setMsg(msg, labels.couldNotSave);
          return null;
        }
        return api.saveItem(payload).then(function (data) {
          savedItem = data.item || null;
          paintSaved(button, labels, true);
          markSavedHost(host, true);
        }).catch(function (err) {
          paintSaved(button, labels, false);
          handleError(err, msg, labels);
        }).then(function () {
          pending = false;
        });
      });
    });

    hydrateLibrary(ctx, host, button, labels);
    bindSetMenuDismiss();
  }

  function resultLooksEmpty(tab) {
    if (!tab) return true;
    if (tab.querySelector('.calc-result-empty') && !tab.querySelector('.calc-result-v')) return true;
    var result = tab.querySelector('.calc-result-v.big, .calc-result-v');
    if (!result) return true;
    var text = result.textContent.replace(/\s+/g, ' ').trim();
    return !text;
  }

  function captureCalculatorRun() {
    var tab = document.querySelector('.calc-tab.active') || document;
    if (resultLooksEmpty(tab)) {
      lastCalculatorRun = null;
      return null;
    }
    var result = tab.querySelector('.calc-result-v.big, .calc-result-v');
    var titleNode = tab.querySelector('.calc-panel-title, h2');
    var input = tab.querySelector('input:not([type="hidden"]), textarea');
    var resultText = result.textContent.replace(/\s+/g, ' ').trim();
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

  function mountCalculatorHost(host) {
    var panel = document.querySelector('.calc-panel');
    if (panel) {
      if (host.parentNode !== panel) panel.insertBefore(host, panel.firstChild);
      return true;
    }
    var fallback = document.querySelector('.calc-shell, .content-inner, .content') || document.body;
    if (host.parentNode !== fallback) fallback.insertBefore(host, fallback.firstChild);
    return false;
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
    paintSaved(button, labels, false);
    var msg = document.createElement('div');
    msg.className = 'study-save-msg';
    row.appendChild(button);
    row.appendChild(msg);
    host.appendChild(row);
    mountCalculatorHost(host);
    captureCalculatorRun();

    button.addEventListener('click', function () {
      var hint = sessionHint();
      if (!hint.isPro) {
        openSaveGate(labels, hint);
        return;
      }
      var run = lastCalculatorRun || captureCalculatorRun();
      if (!run) {
        setMsg(msg, labels.nothingToSave);
        return;
      }
      if (pending) return;
      pending = true;
      paintSaved(button, labels, true);
      setMsg(msg, '');
      withStudy(function (api) {
        if (!api) {
          pending = false;
          paintSaved(button, labels, false);
          setMsg(msg, labels.couldNotSave);
          return null;
        }
        return api.saveCalculatorRun(run).then(function () {
          paintSaved(button, labels, true);
        }).catch(function (err) {
          paintSaved(button, labels, false);
          handleError(err, msg, labels);
        }).then(function () {
          pending = false;
        });
      });
    });
  }

  function wrapCalcFns() {
    ['runMolar', 'runScientific', 'runUnit', 'runIdeal', 'runDilution', 'runPH', 'runStoich', 'runThermo'].forEach(function (name) {
      var original = window[name];
      if (typeof original !== 'function' || original.__atomurusStudyWrapped) return;
      var wrapped = function () {
        var result = original.apply(this, arguments);
        setTimeout(function () {
          captureCalculatorRun();
          var button = document.querySelector('#atomurus-study-save button');
          if (button) paintSaved(button, copy(), false);
        }, 0);
        return result;
      };
      wrapped.__atomurusStudyWrapped = true;
      window[name] = wrapped;
    });
  }

  function hookCalculators() {
    document.addEventListener('click', function (event) {
      var btn = event.target && event.target.closest && event.target.closest('.calc-btn-run');
      if (btn) setTimeout(captureCalculatorRun, 0);
      var tab = event.target && event.target.closest && event.target.closest('.calc-menu-item[data-target]');
      if (!tab || tab.disabled) return;
      setTimeout(function () {
        var host = document.getElementById(HOST_ID);
        if (host) mountCalculatorHost(host);
        lastCalculatorRun = null;
        captureCalculatorRun();
        var button = document.querySelector('#atomurus-study-save button');
        var msg = document.querySelector('#atomurus-study-save .study-save-msg');
        if (button) paintSaved(button, copy(), false);
        if (msg) setMsg(msg, '');
      }, 0);
    }, true);
    wrapCalcFns();
    var tries = 0;
    var timer = setInterval(function () {
      wrapCalcFns();
      tries += 1;
      if (tries > 40) clearInterval(timer);
    }, 250);
  }

  function hookMolecule() {
    if (!isMoleculesPage()) return;
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

  function bindSetMenuDismiss() {
    if (bindSetMenuDismiss.bound) return;
    bindSetMenuDismiss.bound = true;
    document.addEventListener('click', function (event) {
      var host = document.getElementById(HOST_ID);
      if (!host || host.contains(event.target)) return;
      var menu = host.querySelector('.study-set-menu');
      var create = host.querySelector('.study-set-create');
      if (menu) menu.classList.remove('open');
      if (create) create.classList.remove('open');
      var expander = host.querySelector('.study-add-set');
      if (expander) expander.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      var host = document.getElementById(HOST_ID);
      if (!host) return;
      var menu = host.querySelector('.study-set-menu');
      var create = host.querySelector('.study-set-create');
      var addBtn = host.querySelector('[data-study-add-set], .study-add-set, button');
      var wasOpen = (menu && menu.classList.contains('open')) || (create && create.classList.contains('open'));
      if (menu) menu.classList.remove('open');
      if (create) create.classList.remove('open');
      var expander = host.querySelector('.study-add-set');
      if (expander) expander.setAttribute('aria-expanded', 'false');
      if (wasOpen && addBtn && typeof addBtn.focus === 'function') addBtn.focus();
    });
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
