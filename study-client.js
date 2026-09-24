/* window.AtomurusStudy — classic-script entry kept for app.html and the
   study-boot loader. Since A1.0 the implementation lives in
   src/features/study/study-api.js and every request goes through the core
   API client (timeouts, canonical errors, no automatic write replay). Load
   /assets/core/atomurus-core.js before this file. */
(function () {
  'use strict';

  if (window.AtomurusStudy) return;

  var core = window.AtomurusCore;
  if (core && typeof core.createStudyApi === 'function') {
    window.AtomurusStudy = core.createStudyApi(core.api);
    return;
  }

  /* Core bridge missing (a loader forgot it): fail every call loudly and
     visibly instead of silently hanging or reintroducing direct fetches. */
  function missing() {
    var err = new Error('Atomurus core is not loaded');
    err.status = 0;
    err.code = 'core_missing';
    return Promise.reject(err);
  }
  if (window.console) console.error('[study-client] load /assets/core/atomurus-core.js first');
  window.AtomurusStudy = new Proxy({ invalidate: function () {} }, {
    get: function (target, prop) { return prop in target ? target[prop] : missing; }
  });
})();
