(function () {
  'use strict';

  if (window.__atomurusStudyBoot) return;
  window.__atomurusStudyBoot = true;

  var version = '202608280130';
  var files = [
    '/study-client.js?v=' + version,
    '/study-save.js?v=' + version,
    '/study-progress.js?v=' + version
  ];

  files.forEach(function (src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
})();
