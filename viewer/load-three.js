// ───────────────────────────────────────────────────────────────────
// Atomurus — Lazy Three.js loader for lab viewers
// ───────────────────────────────────────────────────────────────────
// Loads three.min.js only when a viewer canvas is near the viewport,
// so marketing chrome / i18n / first paint are not competing with ~600KB.
// ───────────────────────────────────────────────────────────────────

(function (global) {
  'use strict';

  var DEFAULT_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var pending = null;

  function loadThree(src) {
    if (global.THREE) return Promise.resolve(global.THREE);
    if (pending) return pending;

    pending = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src || DEFAULT_SRC;
      s.async = true;
      s.dataset.atomurusDep = 'three';
      s.onload = function () {
        if (global.THREE) resolve(global.THREE);
        else reject(new Error('Three.js loaded without THREE global'));
      };
      s.onerror = function () {
        pending = null;
        reject(new Error('Failed to load Three.js'));
      };
      document.head.appendChild(s);
    });

    return pending;
  }

  function whenVisible(el, callback, options) {
    if (typeof callback !== 'function') return;
    if (!el) {
      callback();
      return;
    }

    var rootMargin = (options && options.rootMargin) || '240px';

    if (!('IntersectionObserver' in global)) {
      callback();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          io.disconnect();
          callback();
          return;
        }
      }
    }, { rootMargin: rootMargin });

    io.observe(el);
  }

  /**
   * Boot a viewer: wait until `el` is near viewport, then load Three, then run `fn`.
   * Returns a Promise that resolves with fn's return value (waits if fn is thenable).
   */
  function bootViewer(el, fn, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
      whenVisible(el, function () {
        loadThree(options.src).then(function (THREE) {
          Promise.resolve()
            .then(function () { return fn(THREE); })
            .then(resolve, reject);
        }, reject);
      }, options);
    });
  }

  function langIsPt() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  }

  function statusHost(el) {
    if (!el) return null;
    // Prefer .viewer so loading covers model pills and the 3D/2D toggle,
    // not only the WebGL canvas (those controls are live HTML onclick handlers).
    return el.closest('.viewer') ||
      el.closest('.iso-3d-panel') ||
      el.closest('.canvas-wrap') ||
      el.parentElement ||
      el;
  }

  function clearProViewerStatus(el) {
    var host = statusHost(el);
    if (!host) return;
    var box = host.querySelector(':scope > .pro-viewer-status');
    if (box) box.remove();
  }

  function showProViewerStatus(el, kind, message, retryFn) {
    var host = statusHost(el);
    if (!host) return;
    if (host !== el && getComputedStyle(host).position === 'static') host.style.position = 'relative';
    clearProViewerStatus(el);
    if (kind === 'clear') return;
    var box = document.createElement('div');
    box.className = 'pro-viewer-status';
    box.setAttribute('data-kind', kind);
    box.setAttribute('role', 'status');
    box.style.cssText = 'position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;pointer-events:auto;background:rgba(242,239,231,.55)';
    var p = document.createElement('p');
    p.textContent = message;
    p.style.cssText = 'margin:0;font-size:15px;color:inherit';
    box.appendChild(p);
    if (kind === 'error' && typeof retryFn === 'function') {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = langIsPt() ? 'Tentar de novo' : 'Try again';
      btn.style.cssText = 'min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#1E6A50;color:#F8F5EC;font:inherit;font-weight:600;cursor:pointer';
      btn.addEventListener('click', retryFn);
      box.appendChild(btn);
    }
    host.appendChild(box);
  }

  function adsSession() {
    var ads = global.__ATOMURUS_ADS__ || {};
    var auth = global.__ATOMURUS_AUTH__ || {};
    var user = ads.user || auth.user || null;
    return {
      ready: Boolean(ads.ready || auth.ready),
      user: user,
      features: (user && user.features) || {}
    };
  }

  function hasPremiumFeature(featureKey) {
    var session = adsSession();
    if (!session.ready) return false;
    if (!featureKey) return false;
    return Boolean(session.features[featureKey]);
  }

  function whenAdsReady(callback) {
    if (typeof callback !== 'function') return;
    if (adsSession().ready) {
      callback();
      return;
    }
    document.addEventListener('atomurus-ads-ready', function onReady() {
      document.removeEventListener('atomurus-ads-ready', onReady);
      callback();
    });
  }

  /**
   * Boot a Premium viewer only after auth is ready and the feature is true.
   * Locked / pending / failed-auth: do not load Three.js.
   * Loading overlay stays up until `fn` finishes (including returned thenables).
   */
  function bootProViewer(el, featureKey, fn, options) {
    options = options || {};
    var started = false;
    function start() {
      if (started) return;
      started = true;
      showProViewerStatus(
        el,
        'loading',
        langIsPt() ? 'Carregando visualizador 3D…' : 'Loading 3D viewer…'
      );
      bootViewer(el, function (THREE) {
        return fn(THREE);
      }, options).then(function () {
        clearProViewerStatus(el);
      }).catch(function () {
        started = false;
        showProViewerStatus(
          el,
          'error',
          langIsPt() ? 'O visualizador 3D não carregou.' : "3D viewer couldn't load.",
          start
        );
      });
    }
    whenAdsReady(function () {
      if (!hasPremiumFeature(featureKey)) {
        clearProViewerStatus(el);
        return;
      }
      start();
    });
  }

  // HTML onclick handlers exist before Pro runtime boots. Keep them callable
  // so 3D/2D and model pills do not throw `X is not defined`.
  var VIEWER_CONTROL_STUBS = [
    'setViewerMode', 'setMolecule', 'setMoleculeByElement', 'setAtomModel',
    'toggleAutoRotate', 'toggleStatic', 'resetView', 'zoomBy', 'toggleLabels',
    'toggleFullscreen', 'toggle2DAnim', 'toggleMirror', 'changeCharge',
    'resetCharge', 'downloadViewer', 'setAlloElement', 'setAllotrope'
  ];
  VIEWER_CONTROL_STUBS.forEach(function (name) {
    if (typeof global[name] !== 'function') {
      global[name] = function () {};
    }
  });

  // Interactive viewer engines are not in the public HTML. After
  // entitlement, load one allowlisted runtime — never a free-form path.
  var VIEWER_RUNTIME_SRC = {
    'atomic-viewer.js': '/viewer/runtime/atomic-viewer.js?v=202608290200',
    'molecule-viewer.js': '/viewer/runtime/molecule-viewer.js?v=202608290200',
    'allotrope-viewer.js': '/viewer/runtime/allotrope-viewer.js?v=202608290200',
    'isomerism-3d.js': '/viewer/isomerism/isomerism-3d.js?v=202608290200'
  };
  var runtimePending = Object.create(null);

  function loadViewerRuntime(name) {
    var src = VIEWER_RUNTIME_SRC[name];
    if (!src) return Promise.reject(new Error('Unknown viewer runtime'));
    if (runtimePending[name]) return runtimePending[name];
    runtimePending[name] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.atomurusDep = 'viewer-runtime';
      s.dataset.atomurusRuntime = name;
      s.onload = function () { resolve(name); };
      s.onerror = function () {
        runtimePending[name] = null;
        reject(new Error('Failed to load viewer runtime'));
      };
      document.head.appendChild(s);
    });
    return runtimePending[name];
  }

  global.atomurusLoadThree = loadThree;
  global.atomurusWhenVisible = whenVisible;
  global.atomurusBootViewer = bootViewer;
  global.atomurusBootProViewer = bootProViewer;
  global.atomurusLoadViewerRuntime = loadViewerRuntime;
  global.atomurusHasPremiumFeature = hasPremiumFeature;
  global.atomurusShowProViewerError = function (el) {
    showProViewerStatus(
      el,
      'error',
      langIsPt() ? 'O visualizador 3D não carregou.' : "3D viewer couldn't load.",
      function () { location.reload(); }
    );
  };
})(typeof window !== 'undefined' ? window : this);
