/* Atomurus — Identificar pela câmera (Pro).
   Live viewfinder (getUserMedia) with a shutter, gallery fallback, photo →
   /api/vision/identify → green points → ✓/✗ feedback that feeds the next
   analyses. Inside the Android app (window.__ATOMURUS_APP__) there are no
   accounts yet and every feature is open: no gate, analyses free per device,
   feedback stored by device (vision-app.mjs on the server). */
(function () {
  'use strict';
  var root = document.querySelector('[data-vision]');
  if (!root) return;
  var pt = (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  var APP = window.__ATOMURUS_APP__ || null;
  var T = pt ? {
    checking: 'Verificando sua conta…', signIn: 'Entrar', createAccount: 'Criar conta grátis', plans: 'Ver planos Pro',
    gateTitle: 'Identificar pela câmera é um recurso Pro', gateGuest: 'Entre na sua conta para usar. Contas novas ganham 30 dias de Pro.',
    gateFree: 'Sua conta é gratuita. O Pro inclui esta ferramenta, o Laboratório de Reações e as análises avançadas.',
    quota: 'Limite de análises de hoje atingido neste aparelho. Tente de novo amanhã.',
    openCam: 'Abrir câmera', shoot: 'Fotografar', flip: 'Virar', gallery: 'Galeria', closeCam: 'Fechar câmera', noCam: 'Sem acesso à câmera. Use "Galeria" ou permita a câmera nas configurações.',
    analysing: 'Analisando a foto…', again: 'Outra foto', hintLabel: 'Contexto (opcional)', hintPh: 'ex.: panela de cozinha, moeda antiga, fio elétrico',
    noDet: 'Não deu para apontar nenhum elemento com confiança nesta foto. Tente mais luz, mais perto ou outro ângulo.',
    conf: 'confiança', est: 'estimativa pela aparência', right: 'Acertou', wrong: 'Errou', thanks: 'Obrigado! Isso melhora as próximas análises.',
    thanksLocal: 'Obrigado! Este resultado não ficou guardado, então o feedback vale só para você desta vez.',
    which: 'Qual era o elemento?', symbolPh: 'ex.: Fe, Cu, Al', send: 'Enviar', skip: 'Não sei',
    learned: function (e, c) { return e ? 'Memória de acertos: ' + e + ' elementos com histórico · ' + c + ' correções recentes usadas nesta análise.' : 'Primeiras análises: ainda sem histórico de acertos. Seu feedback começa a treinar a precisão.'; },
    err: 'Não foi possível analisar agora. Tente de novo.', tooBig: 'Foto grande demais. Tente outra.', refused: 'O modelo não analisou esta foto.', offline: 'Sem internet. A análise precisa de conexão.'
  } : {
    checking: 'Checking your account…', signIn: 'Sign in', createAccount: 'Create free account', plans: 'See Pro plans',
    gateTitle: 'Identify by camera is a Pro feature', gateGuest: 'Sign in to use it. New accounts get 30 days of Pro.',
    gateFree: 'Your account is free. Pro includes this tool, the Reaction Workbench and the advanced analyses.',
    quota: "Today's analysis limit was reached on this device. Try again tomorrow.",
    openCam: 'Open camera', shoot: 'Shoot', flip: 'Flip', gallery: 'Gallery', closeCam: 'Close camera', noCam: 'No camera access. Use "Gallery" or allow the camera in settings.',
    analysing: 'Analysing the photo…', again: 'Another photo', hintLabel: 'Context (optional)', hintPh: 'e.g. kitchen pan, old coin, electrical wire',
    noDet: 'No element could be pointed out with confidence in this photo. Try more light, closer, or another angle.',
    conf: 'confidence', est: 'estimate from appearance', right: 'Correct', wrong: 'Wrong', thanks: 'Thanks! This improves the next analyses.',
    thanksLocal: 'Thanks! This result was not stored, so the feedback counts only for you this time.',
    which: 'Which element was it?', symbolPh: 'e.g. Fe, Cu, Al', send: 'Send', skip: "Don't know",
    learned: function (e, c) { return e ? 'Accuracy memory: ' + e + ' elements with history · ' + c + ' recent corrections used in this analysis.' : 'First analyses: no accuracy history yet. Your feedback starts training the precision.'; },
    err: 'Could not analyse right now. Try again.', tooBig: 'Photo too large. Try another one.', refused: 'The model did not analyse this photo.', offline: 'No internet. The analysis needs a connection.'
  };

  var $ = function (sel) { return root.querySelector(sel); };
  var img = $('[data-vision-img]'), dots = $('[data-vision-dots]'), list = $('[data-vision-list]'), status = $('[data-vision-status]');
  var gate = $('[data-vision-gate]'), tools = $('[data-vision-tools]'), hint = $('[data-vision-hint]');
  var fileGal = $('[data-vision-file-gallery]'), learnedEl = $('[data-vision-learned]');
  var cam = $('[data-vision-cam]'), video = $('[data-vision-video]'), openCamBtn = $('[data-vision-open-cam]');
  var shootBtn = $('[data-vision-shoot]'), flipBtn = $('[data-vision-flip]'), closeCamBtn = $('[data-vision-close-cam]');
  var current = null, stream = null, facing = 'environment';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function say(text, kind) { status.textContent = text || ''; status.className = 'vision-status' + (kind ? ' is-' + kind : ''); status.hidden = !text; }
  function next() { return encodeURIComponent(location.pathname + location.search); }
  function setMode(mode) { root.setAttribute('data-mode', mode); }

  function showGate(kind) {
    tools.hidden = true;
    var actions = kind === 'guest'
      ? '<a class="rm-btn rm-btn-primary" href="/signup?next=' + next() + '">' + esc(T.createAccount) + '</a><a class="rm-btn" href="/login?next=' + next() + '">' + esc(T.signIn) + '</a>'
      : '<a class="rm-btn rm-btn-primary" href="/pricing">' + esc(T.plans) + '</a>';
    gate.innerHTML = '<h2>' + esc(T.gateTitle) + '</h2><p>' + esc(kind === 'guest' ? T.gateGuest : T.gateFree) + '</p><div class="vision-gate-actions">' + actions + '</div>';
    gate.hidden = false;
  }
  function checkAccess() {
    if (APP) {
      /* App: no accounts yet and every feature is open — straight to the camera. */
      gate.hidden = true; gate.innerHTML = '';
      tools.hidden = false;
      return Promise.resolve(true);
    }
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

  /* ── camera ── */
  function stopCam() {
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (video) video.srcObject = null;
    setMode(current ? 'result' : 'idle');
  }
  function openCam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say(T.noCam, 'warn'); return; }
    stopCam();
    say('');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then(function (s) {
        stream = s; video.srcObject = s; video.setAttribute('playsinline', ''); video.muted = true;
        return video.play().catch(function () {});
      })
      .then(function () { setMode('camera'); current = null; img.removeAttribute('src'); dots.innerHTML = ''; list.innerHTML = ''; })
      .catch(function () { say(T.noCam, 'warn'); setMode('idle'); });
  }
  function shoot() {
    if (!video || !video.videoWidth) return;
    var canvas = document.createElement('canvas');
    var max = 1600, scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    var g = canvas.getContext('2d');
    if (facing === 'user') { g.translate(canvas.width, 0); g.scale(-1, 1); }
    g.drawImage(video, 0, 0, canvas.width, canvas.height);
    cam.classList.add('is-flash'); setTimeout(function () { cam.classList.remove('is-flash'); }, 260);
    var dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    stopCam();
    analyseDataUrl(dataUrl);
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        var max = 1600, scale = Math.min(1, max / Math.max(image.width, image.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      image.src = url;
    });
  }

  /* ── results ── */
  function paint(result) {
    current = result;
    dots.innerHTML = ''; list.innerHTML = '';
    var dets = result.detections || [];
    if (!dets.length) say(T.noDet, 'warn'); else say(result.summary || '', 'ok');
    dets.forEach(function (d, i) {
      var dot = document.createElement('button');
      dot.type = 'button'; dot.className = 'vision-dot';
      dot.style.left = (d.x * 100) + '%'; dot.style.top = (d.y * 100) + '%'; dot.style.animationDelay = (i * 90) + 'ms';
      dot.innerHTML = '<span class="vision-dot-core"></span><span class="vision-dot-tag">' + esc(d.element || '?') + '</span>';
      dot.addEventListener('click', function () { var card = list.querySelector('[data-card="' + i + '"]'); if (card) { card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); card.classList.add('is-hot'); setTimeout(function () { card.classList.remove('is-hot'); }, 900); } });
      dots.appendChild(dot);
      var pct = Math.round(d.confidence * 100);
      var card = document.createElement('article');
      card.className = 'vision-card'; card.setAttribute('data-card', String(i)); card.style.animationDelay = (120 + i * 70) + 'ms';
      card.innerHTML =
        '<div class="vision-card-head"><span class="vision-el">' + esc(d.element || '?') + '</span>' +
        '<div><strong>' + esc(d.label) + '</strong>' + (d.material ? '<small>' + esc(d.material) + '</small>' : '') + '</div>' +
        '<span class="vision-conf" title="' + esc(T.est) + '"><i class="vision-conf-ring" style="--p:' + pct + '"><b>' + pct + '%</b></i><small>' + esc(T.conf) + (d.samples ? ' · ' + d.samples + '✓' : '') + '</small></span></div>' +
        '<p class="vision-reason">' + esc(d.reason) + '</p>' +
        (d.element ? '<a class="vision-link" href="/periodic-table.html?q=' + encodeURIComponent(d.element) + '">' + esc(pt ? 'Ver ' + d.element + ' na tabela →' : 'See ' + d.element + ' in the table →') + '</a>' : '') +
        '<div class="vision-fb" data-fb><button type="button" class="vision-fb-btn is-yes" data-fb-yes>✓ ' + esc(T.right) + '</button><button type="button" class="vision-fb-btn is-no" data-fb-no>✗ ' + esc(T.wrong) + '</button></div>';
      list.appendChild(card);
    });
    if (learnedEl) learnedEl.textContent = result.learned ? T.learned(result.learned.elements, result.learned.corrections) : '';
    setMode('result');
  }

  function sendFeedback(index, correct, correctedElement, box) {
    box.innerHTML = '<span class="vision-fb-wait">…</span>';
    if (!current.scanId) { box.innerHTML = '<span class="vision-fb-done">' + esc(T.thanksLocal) + '</span>'; return Promise.resolve(); }
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

  function analyseDataUrl(dataUrl) {
    img.src = dataUrl;
    setMode('busy');
    dots.innerHTML = ''; list.innerHTML = '';
    say(T.analysing, 'busy');
    fetch('/api/vision/identify', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ image: dataUrl, lang: pt ? 'pt' : 'en', hint: hint ? hint.value.trim() : '' })
    }).then(function (r) { return r.json().then(function (data) { return { status: r.status, data: data }; }); })
      .then(function (res) {
        var data = res.data || {};
        if (!data.ok) {
          setMode('idle');
          if (data.code === 'feature_locked') { showGate('free'); return; }
          if (data.code === 'session_expired') { if (APP) say(T.err, 'warn'); else showGate('guest'); return; }
          if (data.code === 'app_quota') { say(T.quota, 'warn'); return; }
          say(data.code === 'vision_image_too_large' ? T.tooBig : (data.code === 'vision_refused' ? T.refused : (data.error || T.err)), 'warn');
          return;
        }
        paint(data);
      }).catch(function () { setMode('idle'); say(navigator.onLine === false ? T.offline : T.err, 'warn'); });
  }

  if (openCamBtn) openCamBtn.addEventListener('click', openCam);
  if (shootBtn) shootBtn.addEventListener('click', shoot);
  if (flipBtn) flipBtn.addEventListener('click', function () { facing = facing === 'environment' ? 'user' : 'environment'; openCam(); });
  if (closeCamBtn) closeCamBtn.addEventListener('click', stopCam);
  if (fileGal) fileGal.addEventListener('change', function () { var f = fileGal.files[0]; fileGal.value = ''; if (!f) return; stopCam(); fileToDataUrl(f).then(analyseDataUrl).catch(function () { say(T.err, 'warn'); }); });
  var again = root.querySelector('[data-vision-again]');
  if (again) again.addEventListener('click', function () { current = null; img.removeAttribute('src'); dots.innerHTML = ''; list.innerHTML = ''; say(''); setMode('idle'); openCam(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopCam(); });
  window.addEventListener('pagehide', stopCam);

  setMode('idle');
  checkAccess();
})();
