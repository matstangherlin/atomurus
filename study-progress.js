(function () {
  'use strict';

  var sent = 0;
  var timer = null;
  var disabled = false;

  function study() {
    return window.AtomurusStudy;
  }

  function prettyPath() {
    return location.pathname.replace(/\.html$/i, '') + location.search;
  }

  function context() {
    if (window.AtomurusStudySave && typeof window.AtomurusStudySave.detectContext === 'function') {
      var detected = window.AtomurusStudySave.detectContext();
      if (detected && detected.kind === 'library') {
        return {
          contentType: detected.itemType,
          contentKey: detected.itemKey,
          lastPosition: detected.href || prettyPath()
        };
      }
    }
    if (typeof window.PAGE_Z === 'number' && window.PAGE_Z > 0) {
      var path = location.pathname.replace(/\.html$/i, '').replace(/\/$/, '');
      return {
        contentType: 'element',
        contentKey: path.split('/').pop(),
        lastPosition: prettyPath()
      };
    }
    return null;
  }

  function progressFromScroll() {
    var doc = document.documentElement;
    var max = Math.max(1, (doc.scrollHeight || 1) - (window.innerHeight || 1));
    var ratio = Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop || 0) / max));
    return Math.round(ratio * 100);
  }

  function put(progress) {
    if (disabled) return;
    var api = study();
    var ctx = context();
    if (!api || !ctx) return;
    if (progress <= sent && sent > 0) return;
    sent = progress;
    api.putProgress({
      contentType: ctx.contentType,
      contentKey: ctx.contentKey,
      progress: progress,
      lastPosition: ctx.lastPosition
    }).catch(function (err) {
      if (err && (err.status === 401 || err.status === 403 || err.code === 'feature_locked' || err.code === 'session_expired')) {
        disabled = true;
        return;
      }
      sent = Math.min(sent, progress - 1);
    });
  }

  function schedule() {
    if (disabled) return;
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      put(progressFromScroll());
    }, 1200);
  }

  function boot() {
    var ctx = context();
    if (!ctx) return;
    setTimeout(function () { put(Math.max(5, progressFromScroll())); }, 8000);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pagehide', function () {
      put(Math.max(sent, progressFromScroll()));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
