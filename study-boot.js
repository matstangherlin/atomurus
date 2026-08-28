(function () {
  'use strict';

  if (window.__atomurusStudyBoot) return;
  window.__atomurusStudyBoot = true;

  var version = '202608280600';
  var files = [
    '/workspace-logic.js?v=' + version,
    '/workspace-ui.js?v=' + version,
    '/study-client.js?v=' + version,
    '/study-save.js?v=' + version,
    '/study-progress.js?v=' + version
  ];

  function loadNext(index) {
    if (index >= files.length) return;
    var src = files[index];
    if (document.querySelector('script[src="' + src + '"]')) {
      loadNext(index + 1);
      return;
    }
    var script = document.createElement('script');
    script.src = src;
    script.onload = function () { loadNext(index + 1); };
    script.onerror = function () { loadNext(index + 1); };
    document.head.appendChild(script);
  }

  loadNext(0);
})();
