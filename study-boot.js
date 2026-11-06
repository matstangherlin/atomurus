(function () {
  'use strict';

  if (window.__atomurusStudyBoot) return;
  window.__atomurusStudyBoot = true;

  var version = '202611061355';
  var files = [
    '/workspace-logic.js?v=' + version,
    '/workspace-ui.js?v=' + version,
    '/assets/core/atomurus-core.js?v=' + version,
    '/study-client.js?v=' + version,
    '/study-save.js?v=' + version,
    '/study-progress.js?v=' + version
  ];

  /* Download all six in parallel; async = false keeps execution in this order
     (each file depends on the ones before it). Loading them one after another
     cost a full round trip per file on every page. */
  files.forEach(function (src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  });
})();
