/* window.AtomurusProLabApi — classic-script entry loaded by pro-lab.js.
   Since A1.0 the implementation lives in src/features/pro-lab/pro-lab-api.js
   on top of the core API client. pro-lab.js loads
   /assets/core/atomurus-core.js before this file. */
(function () {
  'use strict';

  if (window.AtomurusProLabApi) return;

  var core = window.AtomurusCore;
  if (core && typeof core.createProLabApi === 'function') {
    window.AtomurusProLabApi = core.createProLabApi(core.api);
    return;
  }

  function missing() {
    var err = new Error('Atomurus core is not loaded');
    err.status = 0;
    err.code = 'core_missing';
    return Promise.reject(err);
  }
  if (window.console) console.error('[pro-lab-client] load /assets/core/atomurus-core.js first');
  window.AtomurusProLabApi = new Proxy({}, { get: function () { return missing; } });
})();
