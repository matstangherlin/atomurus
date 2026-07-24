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
   * Returns a Promise that resolves with fn's return value.
   */
  function bootViewer(el, fn, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
      whenVisible(el, function () {
        loadThree(options.src).then(function (THREE) {
          try {
            resolve(fn(THREE));
          } catch (err) {
            reject(err);
          }
        }, reject);
      }, options);
    });
  }

  global.atomurusLoadThree = loadThree;
  global.atomurusWhenVisible = whenVisible;
  global.atomurusBootViewer = bootViewer;
})(typeof window !== 'undefined' ? window : this);
