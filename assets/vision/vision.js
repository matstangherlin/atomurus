/* Atomurus — Identificar pela câmera (Pro).
   Photo → /api/vision/identify → green points on the photo → ✓/✗ feedback
   that feeds the next analyses. Works in the browser and inside the app
   WebView (input capture opens the camera). */
(function () {
  'use strict';
  var root = document.querySelector('[data-vision]');
  if (!root) return;
  var pt = (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  var T = pt ? {
    checking: 'Verificando sua conta…', signIn: 'Entrar', createAccount: 'Criar conta grátis', plans: 'Ver planos Pro',
    gateTitle: 'Identificar pela câmera é um recurso Pro', gateGuest: 'Entre na sua conta para usar. Contas novas ganham 30 dias de Pro.',
    gateFree: 'Sua conta é gratuita. O Pro inclui esta ferramenta, o Laboratório de Reações e as análises avançadas.',
    take: 'Tirar foto', choose: 'Escolher da galeria', analysing: 'Analisando a foto…', again: 'Outra foto',
    hintLabel: 'Contexto (opcional)', hintPh: 'ex.: panela de cozinha, moeda antiga, fio elétrico',
    noDet: 'Não deu para apontar nenhum elemento com confiança nesta foto. Tente mais luz, mais perto ou outro ângulo.',
    conf: 'confiança', est: 'estimativa pela aparência', right: 'Acertou', wrong: 'Errou', thanks: 'Obrigado! Isso melhora as próximas análises.',
    which: 'Qual era o elemento?', symbolPh: 'ex.: Fe, Cu, Al', send: 'Enviar', skip: 'Não sei',
    learned: function (e, c) { return e ? 'Memória de acertos: ' + e + ' elementos com histórico · ' + c + ' correções recentes usadas nesta análise.' : 'Primeiras análises: ainda sem histórico de acertos. Seu feedback começa a treinar a precisão.'; },
    err: 'Não foi possível analisar agora. Tente de novo.', tooBig: 'Foto grande demais. Tente outra.', refused: 'O modelo não analisou esta foto.'
  } : {
    checking: 'Checking your account…', signIn: 'Sign in', createAccount: 'Create free account', plans: 'See Pro plans',
    gateTitle: 'Identify by camera is a Pro feature', gateGuest: 'Sign in to use it. New accounts get 30 days of Pro.',
    gateFree: 'Your account is free. Pro includes this tool, the Reaction Workbench and the advanced analyses.',
    take: 'Take a photo', choose: 'Choose from gallery', analysing: 'Analysing the photo…', again: 'Another photo',
    hintLabel: 'Context (optional)', hintPh: 'e.g. kitchen pan, old coin, electrical wire',
    noDet: 'No element could be pointed out with confidence in this photo. Try more light, closer, or another angle.',
    conf: 'confidence', est: 'estimate from appearance', right: 'Correct', wrong: 'Wrong', thanks: 'Thanks! This improves the next analyses.',
    which: 'Which element was it?', symbolPh: 'e.g. Fe, Cu, Al', send: 'Send', skip: "Don't know",
    learned: function (e, c) { return e ? 'Accuracy memory: ' + e + ' elements with history · ' + c + ' recent corrections used in this analysis.' : 'First analyses: no accuracy history yet. Your feedback starts training the precision.'; },
    err: 'Could not analyse right now. Try again.', tooBig: 'Photo too large. Try another one.', refused: 'The model did not analyse this photo.'
  };

  var stage = root.querySelector('[data-vision-stage]');
  var img = root.querySelector('[data-vision-img]');
  var dots = root.querySelector('[data-vision-dots]');
  var list = root.querySelector('[data-vision-list]');
  var status = root.querySelector('[data-vision-status]');
  var gate = root.querySelector('[data-vision-gate]');
  var tools = root.querySelector('[data-vision-tools]');
  var hint = root.querySelector('[data-vision-hint]');
  var fileCam = root.querySelector('[data-vision-file-camera]');
  var fileGal = root.querySelector('[data-vision-file-gallery]');
  var learnedEl = root.querySelector('[data-vision-learned]');
  var current = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function say(text, kind) { status.textContent = text || ''; status.className = 'vision-status' + (kind ? ' is-' + kind : ''); status.hidden = !text; }
  function next() { return encodeURIComponent(location.pathname + location.search); }

  function showGate(kind) {
    tools.hidden = true;
    var actions = kind === 'guest'
      ? '<a class="rm-btn rm-btn-primary" href="/signup?next=' + next() + '">' + esc(T.createAccount) + '</a><a class="rm-btn" href="/login?next=' + next() + '">' + esc(T.signIn) + '</a>'
      : '<a class="rm-btn rm-btn-primary" href="/pricing">' + esc(T.plans) + '</a>';
    gate.innerHTML = '<h2>' + esc(T.gateTitle) + '</h2><p>' + esc(kind === 'guest' ? T.gateGuest : T.gateFree) + '</p><div class="vision-gate-actions">' + actions + '</div>';
    gate.hidden = false;
  }

  function checkAccess() {
    say(T.checking);
    return fetch('/api/auth/me', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) {
        say('');
        var user = data && data.user;
        var features = (user && user.features) || (data && data.features) || {};
        if (!user) { showGate('guest'); return false; }
        if (!features.visionIdentify) { showGate('free'); return false; }
        gate.hidden = true; tools.hidden = false; return true;
      })
      .catch(function () { say(''); showGate('guest'); return false; });
  }

  /* Downscale on the phone: ~1600px on the long side keeps details and stays
     under the upload limit. */
  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        var max = 1600;
        var scale = Math.min(1, max / Math.max(image.width, image.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      image.src = url;
    });
  }

  function paint(result) {
    current = result;
    dots.innerHTML = '';
    list.innerHTML = '';
    var dets = result.detections || [];
    if (!dets.length) { say(T.noDet, 'warn'); }
    else say(result.summary || '', 'ok');
    dets.forEach(function (d, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'vision-dot';
      dot.style.left = (d.x * 100) + '%';
      dot.style.top = (d.y * 100) + '%';
      dot.style.animationDelay = (i * 90) + 'ms';
      dot.setAttribute('data-det', String(i));
      dot.innerHTML = '<span class="vision-dot-core"></span><span class="vision-dot-tag">' + esc(d.element || '?') + '</span>';
      dot.addEventListener('click', function () { var card = list.querySelector('[data-card="' + i + '"]'); if (card) { card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); card.classList.add('is-hot'); setTimeout(function () { card.classList.remove('is-hot'); }, 900); } });
      dots.appendChild(dot);
      var pct = Math.round(d.confidence * 100);
      var card = document.createElement('article');
      card.className = 'vision-card';
      card.setAttribute('data-card', String(i));
      card.innerHTML =
        '<div class="vision-card-head"><span class="vision-el">' + esc(d.element || '?') + '</span>' +
        '<div><strong>' + esc(d.label) + '</strong>' + (d.material ? '<small>' + esc(d.material) + '</small>' : '') + '</div>' +
        '<span class="vision-conf" title="' + esc(T.est) + '">' + pct + '% <small>' + esc(T.conf) + (d.samples ? ' · ' + d.samples + '✓' : '') + '</small></span></div>' +
        '<p class="vision-reason">' + esc(d.reason) + '</p>' +
        (d.element ? '<a class="vision-link" href="/periodic-table.html?q=' + encodeURIComponent(d.element) + '">' + esc(pt ? 'Ver ' + d.element + ' na tabela →' : 'See ' + d.element + ' in the table →') + '</a>' : '') +
        '<div class="vision-fb" data-fb><button type="button" class="vision-fb-btn is-yes" data-fb-yes>✓ ' + esc(T.right) + '</button><button type="button" class="vision-fb-btn is-no" data-fb-no>✗ ' + esc(T.wrong) + '</button></div>';
      list.appendChild(card);
    });
    if (learnedEl && result.learned) learnedEl.textContent = T.learned(result.learned.elements, result.learned.corrections);
  }

  function sendFeedback(index, correct, correctedElement, box) {
    box.innerHTML = '<span class="vision-fb-wait">…</span>';
    return fetch('/api/vision/feedback', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ scanId: current.scanId, detectionIndex: index, correct: correct, correctedElement: correctedElement || '' })
    }).then(function (r) { return r.json(); }).then(function (data) {
      box.innerHTML = '<span class="vision-fb-done">' + esc(data && data.ok ? T.thanks : T.err) + '</span>';
    }).catch(function () { box.innerHTML = '<span class="vision-fb-done">' + esc(T.err) + '</span>'; });
  }

  list.addEventListener('click', function (e) {
    var card = e.target.closest('[data-card]'); if (!card || !current) return;
    var index = Number(card.getAttribute('data-card'));
    var box = card.querySelector('[data-fb]');
    if (e.target.closest('[data-fb-yes]')) { sendFeedback(index, true, '', box); return; }
    if (e.target.closest('[data-fb-no]')) {
      box.innerHTML = '<label class="vision-fb-ask">' + esc(T.which) + ' <input type="text" maxlength="2" autocapitalize="characters" placeholder="' + esc(T.symbolPh) + '" data-fb-el></label>' +
        '<button type="button" class="vision-fb-btn" data-fb-send>' + esc(T.send) + '</button><button type="button" class="vision-fb-btn is-ghost" data-fb-skip>' + esc(T.skip) + '</button>';
      box.querySelector('[data-fb-el]').focus();
      return;
    }
    if (e.target.closest('[data-fb-send]')) { sendFeedback(index, false, box.querySelector('[data-fb-el]').value.trim(), box); return; }
    if (e.target.closest('[data-fb-skip]')) { sendFeedback(index, false, '', box); }
  });

  function analyse(file) {
    if (!file) return;
    root.classList.add('has-photo');
    dots.innerHTML = ''; list.innerHTML = '';
    say(T.analysing, 'busy');
    fileToDataUrl(file).then(function (dataUrl) {
      img.src = dataUrl;
      return fetch('/api/vision/identify', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ image: dataUrl, lang: pt ? 'pt' : 'en', hint: hint ? hint.value.trim() : '' })
      });
    }).then(function (r) { return r.json().then(function (data) { return { status: r.status, data: data }; }); })
      .then(function (res) {
        var data = res.data || {};
        if (!data.ok) {
          if (data.code === 'feature_locked') { showGate('free'); return; }
          if (data.code === 'session_expired') { showGate('guest'); return; }
          say(data.code === 'vision_image_too_large' ? T.tooBig : (data.code === 'vision_refused' ? T.refused : (data.error || T.err)), 'warn');
          return;
        }
        paint(data);
      }).catch(function () { say(T.err, 'warn'); });
  }

  if (fileCam) fileCam.addEventListener('change', function () { analyse(fileCam.files[0]); fileCam.value = ''; });
  if (fileGal) fileGal.addEventListener('change', function () { analyse(fileGal.files[0]); fileGal.value = ''; });
  var again = root.querySelector('[data-vision-again]');
  if (again) again.addEventListener('click', function () { root.classList.remove('has-photo'); img.removeAttribute('src'); dots.innerHTML = ''; list.innerHTML = ''; say(''); current = null; });

  checkAccess();
})();
