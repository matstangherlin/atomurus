/* Atomurus — Study journey UI: the path ("Estudo") and the lesson player.
   Data and progress live in study-journey.js (AtomurusJourney). */
(function () {
  'use strict';

  var J = window.AtomurusJourney;
  if (!J) return;

  function lang() {
    var l = (window.I18N && I18N.lang) || document.documentElement.lang || 'en';
    return String(l).toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
  }
  function tx(obj) { if (!obj) return ''; if (typeof obj === 'string') return obj; return lang() === 'pt' ? (obj.pt || obj.en) : obj.en; }
  function c(en, pt) { return lang() === 'pt' ? pt : en; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function localHref(href) {
    if (!href) return '#';
    if (lang() !== 'pt') return href;
    if (/^\/explore\/[^?#]+\.html$/.test(href)) return href.replace(/\.html$/, '.pt.html');
    return href + (href.indexOf('?') >= 0 ? '&' : '?') + 'lang=pt-BR';
  }

  var ICON = {
    check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    lock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    target: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/></svg>',
    flask: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6L4.8 18.2A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.8L14 9V3"/><path d="M7.5 15h9"/></svg>',
    flag: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    fire: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4S9 11.5 11 12c0-4 1-9 1-9z"/></svg>',
    star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2" stroke-linecap="round"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
  };

  var KIND = {
    lesson: ['Lesson', 'Aula'], practice: ['Practice', 'Prática'], bench: ['Bench', 'Bancada'],
    reading: ['Optional reading', 'Leitura opcional'], checkpoint: ['Checkpoint', 'Checkpoint']
  };
  function kindLabel(k) { var r = KIND[k] || ['', '']; return c(r[0], r[1]); }

  /* ── journey ──────────────────────────────────────────────────────── */
  var OFFSETS = [0, 50, 80, 50, 0, -50, -80, -50];
  var openNodeId = '';

  function nodeHtml(unit, node, status, index, state) {
    if (node.kind === 'reading') {
      return '<div class="rm-jn-row rm-jn-row--reading"><a class="rm-jn-reading' + (status === 'done' ? ' is-done' : '') + '" href="' + esc(localHref(node.href)) + '" data-jn-reading="' + esc(node.id) + '">' +
        '<span class="rm-jn-reading-ico">' + ICON.book + '</span>' +
        '<span><span class="rm-jn-reading-k">' + esc(kindLabel('reading')) + ' · +' + J.XP.reading + ' XP</span>' +
        '<strong>' + esc(tx(node.title)) + '</strong><span class="rm-jn-reading-t">' + esc(tx(node.blurb)) + '</span></span></a></div>';
    }
    var off = OFFSETS[index % OFFSETS.length];
    var ico = status === 'done' ? ICON.check : status === 'locked' ? ICON.lock
      : node.kind === 'bench' ? ICON.flask : node.kind === 'checkpoint' ? ICON.flag : node.kind === 'practice' ? ICON.target : ICON.play;
    var need = J.roundsNeeded(node);
    var have = Number(state.rounds[node.id]) || 0;
    var ring = '';
    var badge = '';
    if (status === 'current' && node.kind === 'practice') {
      var pct = Math.round((have / need) * 100);
      ring = ' style="--p:' + pct + '"';
      badge = '<span class="rm-jn-badge">' + have + '/' + need + '</span>';
    }
    if (status !== 'locked' && node.kind !== 'practice' && status === 'current') badge = '<span class="rm-jn-badge">' + esc(c('Start', 'Começar')) + '</span>';
    var pop = openNodeId === node.id ? popHtml(unit, node, status, state) : '';
    return '<div class="rm-jn-row" style="--off:' + off + 'px">' +
      '<button type="button" class="rm-jn-node is-' + status + ' is-' + node.kind + '"' + ring + ' data-jn-node="' + esc(node.id) + '"' +
      (status === 'locked' ? ' aria-disabled="true"' : '') + ' aria-label="' + esc(tx(node.title) + ' · ' + kindLabel(node.kind)) + '">' +
      badge + '<span class="rm-jn-dot">' + ico + '</span></button>' +
      '<span class="rm-jn-name">' + esc(tx(node.title)) + '</span>' +
      '<span class="rm-jn-kind">' + esc(kindLabel(node.kind)) + '</span>' + pop + '</div>';
  }

  function popHtml(unit, node, status, state) {
    if (status === 'locked') {
      return '<div class="rm-jn-pop is-locked" role="dialog"><p class="rm-jn-pop-k">' + esc(kindLabel(node.kind)) + '</p>' +
        '<strong>' + esc(tx(node.title)) + '</strong><p class="rm-jn-pop-t">' + esc(c('Finish the step before this one to unlock it.', 'Termine a etapa anterior para liberar esta.')) + '</p></div>';
    }
    var need = J.roundsNeeded(node);
    var have = Number(state.rounds[node.id]) || 0;
    var k = kindLabel(node.kind);
    if (node.kind === 'practice') k += ' · ' + c('round', 'rodada') + ' ' + Math.min(have + 1, need) + ' ' + c('of', 'de') + ' ' + need;
    var count = node.kind === 'checkpoint' ? 6 : (node.steps || []).filter(function (s) { return s.type === 'choice'; }).length;
    var meta = node.kind === 'bench'
      ? c('Opens the tool in this tab.', 'Abre a ferramenta nesta aba.')
      : count + ' ' + c('exercises', 'exercícios') + ', ' + c('about', 'uns') + ' ' + Math.max(2, Math.round(count / 2)) + ' ' + c('minutes', 'minutos') + '.';
    var label = status === 'done' ? c('Play again', 'Refazer') : (node.kind === 'bench' ? c('Open', 'Abrir') : c('Start', 'Começar'));
    return '<div class="rm-jn-pop" role="dialog"><p class="rm-jn-pop-k">' + esc(k) + '</p>' +
      '<strong>' + esc(tx(node.title)) + '</strong><p class="rm-jn-pop-t">' + esc(meta) + '</p>' +
      '<button type="button" class="rm-jn-go" data-jn-start="' + esc(node.id) + '">' + esc(label) + ' · +' + (J.XP[node.kind] || 10) + ' XP</button></div>';
  }

  function unitHeadHtml(unit, prog, state, isCurrent) {
    var cls = prog.complete ? 'is-done' : isCurrent ? 'is-current' : 'is-locked';
    var k = c('Phase', 'Fase') + ' ' + unit.phase + ' · ' + c('Unit', 'Unidade') + ' ' + unit.id.replace('u', '') + (prog.complete ? ' · ' + c('Complete', 'Concluída') : '');
    var sub = isCurrent && !prog.complete
      ? prog.done + ' ' + c('of', 'de') + ' ' + prog.total + ' ' + c('done', 'concluídas') + ' · ' + c('takes about', 'leva uns') + ' ' + prog.minutes + ' ' + c('minutes', 'minutos')
      : tx(unit.subtitle);
    return '<header class="rm-jn-unit ' + cls + '"><div><p class="rm-jn-unit-k">' + esc(k) + '</p><h2>' + esc(tx(unit.title)) + '</h2><p class="rm-jn-unit-s">' + esc(sub) + '</p>' +
      (isCurrent && !prog.complete ? '<div class="rm-jn-unit-bar"><i style="width:' + Math.round(prog.done / prog.total * 100) + '%"></i></div>' : '') + '</div>' +
      '<a class="rm-jn-guide" href="' + esc(localHref(unit.guide)) + '">' + ICON.book + '<span>' + esc(c('Unit guide', 'Guia da unidade')) + '</span></a></header>';
  }

  function sideHtml(state) {
    var st = J.stats(state);
    var ms = J.missions(state);
    var done = ms.filter(function (m) { return m.value >= m.goal; }).length;
    var reviewN = J.reviewSteps(state).length;
    var guest = Boolean(document.querySelector('#ws-userchip.is-guest-cta, [data-atomurus-account-chip].is-guest-cta'));
    var guestCard = guest
      ? '<section class="rm-jn-card rm-jn-guest"><p>' + esc(c('Your progress stays on this device. Create a free account to keep your study sets, notes and saved work.', 'Seu progresso fica neste aparelho. Crie uma conta grátis para guardar Study Sets, notas e o que você salvar.')) + '</p>' +
        '<a class="ws-btn ws-btn-primary" href="/signup?next=%2Fapp%3Fsection%3Dstudy">' + esc(c('Create free account', 'Criar conta gratuita')) + '</a></section>'
      : '';
    return '<aside class="rm-jn-side">' + guestCard +
      '<div class="rm-jn-stats">' +
      '<div class="rm-jn-stat"><span class="rm-jn-stat-k is-fire">' + ICON.fire + esc(c('Streak', 'Sequência')) + '</span><b>' + st.streak + '<small> ' + esc(st.streak === 1 ? c('day', 'dia') : c('days', 'dias')) + '</small></b></div>' +
      '<div class="rm-jn-stat"><span class="rm-jn-stat-k">' + ICON.star + 'XP</span><b>' + st.xp + '</b></div>' +
      '<div class="rm-jn-stat"><span class="rm-jn-stat-k">' + ICON.clock + esc(c('Today', 'Hoje')) + '</span><b>' + st.today + '<small>/' + st.goal + '</small></b></div>' +
      '</div>' +
      '<section class="rm-jn-card rm-jn-missions"><div class="rm-jn-card-h"><h3>' + esc(c('Daily missions', 'Missões do dia')) + '</h3><span>' + done + '/' + ms.length + '</span></div>' +
      ms.map(function (m) {
        return '<div class="rm-jn-mission"><div><span>' + esc(tx(m.title)) + '</span><span class="rm-jn-mission-n">' + m.value + '/' + m.goal + '</span></div>' +
          '<div class="rm-jn-bar"><i style="width:' + Math.round(Math.min(1, m.value / m.goal) * 100) + '%"></i></div></div>';
      }).join('') + '</section>' +
      '<section class="rm-jn-card rm-jn-review"><p class="rm-jn-review-k">' + esc(c('Smart review', 'Revisão inteligente')) + '</p>' +
      '<p class="rm-jn-review-n"><b>' + reviewN + '</b><span>' + esc(reviewN === 1 ? c('question to review', 'questão para revisar') : c('questions to review', 'questões para revisar')) + '</span></p>' +
      '<p class="rm-jn-review-t">' + esc(c('What you missed comes back at the right time, until it sticks.', 'O que você errou volta na hora certa, até fixar.')) + '</p>' +
      '<button type="button" class="rm-jn-go" data-jn-review' + (reviewN ? '' : ' disabled') + '>' + esc(reviewN ? c('Review now', 'Revisar agora') : c('Nothing to review yet', 'Nada para revisar ainda')) + '</button></section>' +
      '<section class="rm-jn-card rm-jn-free"><div class="rm-jn-card-h"><h3>' + esc(c('Free practice', 'Treino livre')) + '</h3><a href="/app?section=practice">' + esc(c('See all', 'Ver tudo')) + ' →</a></div>' +
      '<button type="button" class="rm-jn-free-item" data-jn-free="blitz"><span class="rm-jn-free-ico">Na</span>' + esc(c('Symbol blitz · 8 questions', 'Blitz de símbolos · 8 questões')) + '</button>' +
      '<button type="button" class="rm-jn-free-item" data-jn-free="molar"><span class="rm-jn-free-ico is-mono">g/mol</span>' + esc(c('Molar mass in a row', 'Massa molar em série')) + '</button>' +
      '<a class="rm-jn-free-item" href="/app?section=sets"><span class="rm-jn-free-ico is-set">Σ</span>' + esc(c('Your Study Sets', 'Seus Study Sets')) + '</a>' +
      '</section></aside>';
  }

  function journeyHtml(state) {
    var statuses = J.statuses(state);
    var html = '';
    var i = 0;
    var currentUnit = null;
    J.UNITS.forEach(function (u) {
      if (!currentUnit && u.nodes.some(function (n) { return statuses[n.id] === 'current'; })) currentUnit = u.id;
    });
    J.UNITS.forEach(function (u) {
      var prog = J.unitProgress(state, u);
      html += '<section class="rm-jn-unitwrap" data-jn-unit="' + esc(u.id) + '">' + unitHeadHtml(u, prog, state, u.id === currentUnit) + '<div class="rm-jn-path">';
      u.nodes.forEach(function (n) { html += nodeHtml(u, n, statuses[n.id], i, state); if (n.kind !== 'reading') i += 1; });
      html += '</div></section>';
    });
    return '<div class="rm-jn" data-journey>' +
      '<header class="lab-hero rm-app-hero"><p class="lab-hero-kicker">' + esc(c('Virtual lab', 'Laboratório virtual')) + '</p>' +
      '<h1 class="lab-hero-title rm-app-hero-title">' + esc(c('Study', 'Estudo')) + '</h1>' +
      '<p class="lab-hero-lead">' + esc(c('One short lesson a day. Lesson, practice and bench, in that order.', 'Uma lição curta por dia. Aula, prática e bancada, nessa ordem.')) + '</p></header>' +
      '<div class="rm-jn-grid"><div class="rm-jn-main">' + html + '</div>' + sideHtml(state) + '</div></div>';
  }

  var mounted = null;
  function mount(container) {
    if (!container) return;
    var state = J.load();
    if (!openNodeId) {
      var st = J.statuses(state);
      openNodeId = Object.keys(st).filter(function (k) { return st[k] === 'current'; })[0] || '';
    }
    var host = container.querySelector('[data-journey-host]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-journey-host', '');
      container.insertBefore(host, container.firstChild);
    }
    host.innerHTML = journeyHtml(state);
    mounted = container;
    container.classList.add('has-journey');
    if (!host.dataset.bound) {
      host.dataset.bound = '1';
      host.addEventListener('click', onClick);
    }
  }
  function refresh() { if (mounted) mount(mounted); }

  function onClick(event) {
    var t = event.target.closest('[data-jn-node], [data-jn-start], [data-jn-review], [data-jn-free], [data-jn-reading]');
    if (!t) return;
    if (t.hasAttribute('data-jn-node')) {
      var id = t.getAttribute('data-jn-node');
      openNodeId = openNodeId === id ? '' : id;
      refresh();
      return;
    }
    if (t.hasAttribute('data-jn-start')) { start(t.getAttribute('data-jn-start')); return; }
    if (t.hasAttribute('data-jn-review')) {
      var steps = J.reviewSteps(J.load(), Date.now() % 997);
      if (steps.length) play(steps, { title: c('Smart review', 'Revisão inteligente'), onDone: function (res) {
        var s = J.load();
        s.mistakes = s.mistakes.filter(function (m) { return res.missed.indexOf(m) >= 0; });
        J.save(s);
        refresh();
      } });
      return;
    }
    if (t.hasAttribute('data-jn-free')) {
      var seed = Date.now() % 997;
      var kind = t.getAttribute('data-jn-free');
      play(kind === 'blitz' ? J.symbolBlitz(seed) : J.molarSeries(seed), { title: kind === 'blitz' ? c('Symbol blitz', 'Blitz de símbolos') : c('Molar mass', 'Massa molar'), onDone: function (res) {
        var s = J.load();
        var key = J.today();
        s.xp += res.correct; s.days[key] = (Number(s.days[key]) || 0) + res.correct;
        if (res.perfect) s.perfectDays[key] = true;
        J.save(s);
        refresh();
      } });
      return;
    }
    if (t.hasAttribute('data-jn-reading')) {
      var s2 = J.load();
      if (!s2.done[t.getAttribute('data-jn-reading')]) { J.finish(s2, t.getAttribute('data-jn-reading'), {}); J.save(s2); }
    }
  }

  function start(nodeId) {
    var row = J.findNode(nodeId);
    if (!row) return;
    var node = row.node;
    if (node.kind === 'bench') {
      var s = J.load();
      J.finish(s, nodeId, {});
      J.save(s);
      location.href = localHref(node.href);
      return;
    }
    var steps = J.stepsFor(nodeId, (Date.now() % 997) + 1);
    play(steps, { title: tx(node.title), onDone: function (res) {
      var st = J.load();
      var out = J.finish(st, nodeId, res);
      J.save(st);
      openNodeId = '';
      refresh();
      return out;
    } });
  }

  /* ── lesson player ────────────────────────────────────────────────── */
  var KIND_CHIP = { identify: ['Identify', 'Identifique'], concept: ['Concept', 'Conceito'], calculate: ['Calculate', 'Calcule'] };

  function play(steps, opts) {
    if (!steps || !steps.length) return;
    opts = opts || {};
    var i = 0;
    var picked = -1;
    var checked = false;
    var correct = 0;
    var questions = steps.filter(function (s) { return s.type === 'choice'; }).length;
    var missed = [];
    var lastFocus = document.activeElement;
    var root = document.createElement('div');
    root.className = 'rm-lesson';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', opts.title || c('Lesson', 'Lição'));
    document.body.appendChild(root);
    document.documentElement.classList.add('rm-lesson-open');

    function close() {
      document.removeEventListener('keydown', onKey, true);
      root.remove();
      document.documentElement.classList.remove('rm-lesson-open');
      try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) {}
    }

    function tileHtml(tile) {
      if (!tile) return '';
      return '<div class="rm-lesson-tile"><span>' + esc(tile.top || '') + '</span><b>' + esc(tile.sym) + '</b><span>' + esc(tile.bottom || '') + '</span></div>';
    }

    function render() {
      var step = steps[i];
      var pct = Math.round((i / steps.length) * 100);
      var head = '<header class="rm-lesson-top"><button type="button" class="rm-lesson-x" data-ls-close aria-label="' + esc(c('Close lesson', 'Fechar lição')) + '">' + ICON.close + '</button>' +
        '<div class="rm-lesson-bar"><i style="width:' + pct + '%"></i></div><span class="rm-lesson-count">' + (i + 1) + ' / ' + steps.length + '</span></header>';
      var body;
      var foot;
      if (step.type === 'teach') {
        body = '<div class="rm-lesson-body"><span class="rm-lesson-chip">' + esc(c('Learn', 'Aprenda')) + '</span>' +
          '<h2 class="rm-lesson-q">' + esc(tx(step.title)) + '</h2>' +
          '<div class="rm-lesson-teach">' + tileHtml(step.tile) + '<p>' + esc(tx(step.body)) + '</p></div></div>';
        foot = '<footer class="rm-lesson-foot"><span></span><button type="button" class="rm-lesson-btn is-primary" data-ls-next>' + esc(c('Continue', 'Continuar')) + '</button></footer>';
      } else {
        var chip = KIND_CHIP[step.kind] || KIND_CHIP.concept;
        var hint = step.tile ? '<div class="rm-lesson-hint">' + tileHtml(step.tile) + '<p>' + esc(checked ? tx(step.explain) : (step.kind === 'identify' ? c('Use what you know about the element.', 'Use o que você sabe sobre o elemento.') : '')) + '</p></div>' : '';
        body = '<div class="rm-lesson-body"><span class="rm-lesson-chip">' + esc(c(chip[0], chip[1])) + '</span>' +
          '<h2 class="rm-lesson-q">' + esc(tx(step.q)) + '</h2>' + hint +
          '<div class="rm-lesson-opts" role="radiogroup">' + step.options.map(function (o, k) {
            var cls = 'rm-lesson-opt';
            if (picked === k) cls += ' is-picked';
            if (checked && k === step.answer) cls += ' is-right';
            if (checked && picked === k && k !== step.answer) cls += ' is-wrong';
            return '<button type="button" class="' + cls + '" role="radio" aria-checked="' + (picked === k) + '" data-ls-opt="' + k + '"' + (checked ? ' disabled' : '') + '>' +
              '<span class="rm-lesson-key">' + 'ABCD'.charAt(k) + '</span><span>' + esc(tx(o)) + '</span></button>';
          }).join('') + '</div></div>';
        if (!checked) {
          foot = '<footer class="rm-lesson-foot"><button type="button" class="rm-lesson-btn" data-ls-skip>' + esc(c('Skip', 'Pular')) + '</button>' +
            '<button type="button" class="rm-lesson-btn is-primary" data-ls-check' + (picked < 0 ? ' disabled' : '') + '>' + esc(c('Check', 'Verificar')) + '</button></footer>';
        } else {
          var ok = picked === step.answer;
          foot = '<footer class="rm-lesson-foot is-' + (ok ? 'ok' : 'bad') + '"><div class="rm-lesson-fb"><b>' + esc(ok ? c('Correct!', 'Correto!') : c('Not quite', 'Quase')) + '</b>' +
            '<span>' + esc(ok ? tx(step.explain) : c('Answer: ', 'Resposta: ') + tx(step.options[step.answer]) + ' — ' + tx(step.explain)) + '</span></div>' +
            '<button type="button" class="rm-lesson-btn is-primary" data-ls-next>' + esc(c('Continue', 'Continuar')) + '</button></footer>';
        }
      }
      root.innerHTML = head + body + foot;
      var focusEl = root.querySelector('[data-ls-next], [data-ls-check]:not([disabled]), [data-ls-opt]');
      if (focusEl) try { focusEl.focus({ preventScroll: true }); } catch (e) {}
    }

    function finishScreen() {
      var res = { correct: correct, total: questions, perfect: questions > 0 && correct === questions, missed: missed };
      var out = opts.onDone ? opts.onDone(res) : null;
      var xp = out && out.xp ? out.xp : correct;
      root.innerHTML = '<div class="rm-lesson-done"><div class="rm-lesson-done-ico">' + ICON.check + '</div>' +
        '<h2>' + esc(c('Lesson complete', 'Lição concluída')) + '</h2>' +
        '<div class="rm-lesson-done-stats"><div><span>XP</span><b>+' + xp + '</b></div>' +
        (questions ? '<div><span>' + esc(c('Accuracy', 'Acertos')) + '</span><b>' + Math.round(correct / questions * 100) + '%</b></div>' : '') + '</div>' +
        '<button type="button" class="rm-lesson-btn is-primary" data-ls-close>' + esc(c('Continue', 'Continuar')) + '</button></div>';
      var b = root.querySelector('[data-ls-close]');
      if (b) try { b.focus(); } catch (e) {}
    }

    function next() {
      i += 1; picked = -1; checked = false;
      if (i >= steps.length) finishScreen(); else render();
    }
    function check() {
      if (picked < 0) return;
      checked = true;
      var step = steps[i];
      if (picked === step.answer) correct += 1;
      else if (step.ref) missed.push(step.ref);
      render();
    }

    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-ls-close], [data-ls-next], [data-ls-check], [data-ls-skip], [data-ls-opt]');
      if (!t) return;
      if (t.hasAttribute('data-ls-close')) { close(); return; }
      if (t.hasAttribute('data-ls-next')) { next(); return; }
      if (t.hasAttribute('data-ls-check')) { check(); return; }
      if (t.hasAttribute('data-ls-skip')) { var st = steps[i]; if (st.ref) missed.push(st.ref); next(); return; }
      if (t.hasAttribute('data-ls-opt') && !checked) { picked = Number(t.getAttribute('data-ls-opt')); render(); }
    });
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      var step = steps[i];
      if (!step) return;
      if (step.type === 'choice' && !checked && /^[1-4a-dA-D]$/.test(e.key)) {
        var k = /\d/.test(e.key) ? Number(e.key) - 1 : 'abcd'.indexOf(e.key.toLowerCase());
        if (k < step.options.length) { picked = k; render(); e.preventDefault(); }
      } else if (e.key === 'Enter' && !e.target.closest('button')) {
        e.preventDefault();
        if (step.type === 'teach' || checked) next(); else check();
      }
    }
    document.addEventListener('keydown', onKey, true);
    render();
  }

  window.AtomurusJourneyUI = { mount: mount, refresh: refresh, play: play, start: start };
  try { if (window.I18N && I18N.onChange) I18N.onChange(function () { refresh(); }); } catch (e) {}
})();
