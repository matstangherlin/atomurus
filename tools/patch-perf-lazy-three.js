#!/usr/bin/env node
/**
 * Wrap Three.js viewer bootstraps so three.min.js loads only when the canvas
 * is near the viewport.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION = '202607081927';
const THREE_TAG_RE =
  /<script\s+src=["']https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js["']\s*><\/script>\s*/i;

const FILES = [
  {
    rel: 'viewer/molecules.html',
    loader: 'load-three.js',
    canvas: 'viewer3d',
    mode: 'wrap-iife',
  },
  {
    rel: 'viewer/molecules.pt.html',
    loader: 'load-three.js',
    canvas: 'viewer3d',
    mode: 'wrap-iife',
  },
  {
    rel: 'viewer/allotropes.html',
    loader: 'load-three.js',
    canvas: 'viewer3d',
    mode: 'wrap-iife',
  },
  {
    rel: 'viewer/allotropes.pt.html',
    loader: 'load-three.js',
    canvas: 'viewer3d',
    mode: 'wrap-iife',
  },
  {
    rel: 'viewer/atomic-models.html',
    loader: 'load-three.js',
    canvas: 'viewer3d',
    mode: 'wrap-iife',
  },
  {
    rel: 'viewer/atomic-models.pt.html',
    loader: 'load-three.js',
    canvas: 'viewer3d',
    mode: 'wrap-iife',
  },
  {
    rel: 'explore/viewer/methyl-isocyanate.html',
    loader: '../../viewer/load-three.js',
    canvas: 'mvwr-canvas',
    mode: 'defer-mol-viewer',
    molViewer: 'mol-viewer.js',
  },
  {
    rel: 'explore/viewer/methyl-isocyanate.pt.html',
    loader: '../../viewer/load-three.js',
    canvas: 'mvwr-canvas',
    mode: 'defer-mol-viewer',
    molViewer: 'mol-viewer.js',
  },
  {
    rel: 'explore/bhopal-disaster.html',
    loader: '../viewer/load-three.js',
    canvas: 'mvwr-canvas',
    mode: 'defer-mol-viewer',
    molViewer: 'viewer/mol-viewer.js',
  },
  {
    rel: 'explore/bhopal-disaster.pt.html',
    loader: '../viewer/load-three.js',
    canvas: 'mvwr-canvas',
    mode: 'defer-mol-viewer',
    molViewer: 'viewer/mol-viewer.js',
  },
];

function wrapIife(html, loaderSrc, canvasId) {
  if (html.includes('atomurusBootViewer(') && html.includes('load-three.js')) {
    return html;
  }
  if (!THREE_TAG_RE.test(html)) {
    throw new Error('three.min.js tag not found');
  }

  let out = html.replace(
    THREE_TAG_RE,
    `<script src="${loaderSrc}?v=${VERSION}"></script>\n`
  );

  // Open wrapper on the first viewer bootstrap IIFE after the loader.
  const openRe = /(<script>\s*)\(function\s*\(\s*\)\s*\{/;
  const idx = out.search(openRe);
  // Prefer the script that mentions viewer3d / THREE soon after loader
  const loaderIdx = out.indexOf(`load-three.js?v=${VERSION}`);
  const searchFrom = loaderIdx >= 0 ? loaderIdx : 0;
  const slice = out.slice(searchFrom);
  const localMatch = slice.match(openRe);
  if (!localMatch) throw new Error('viewer IIFE open not found');
  const absOpen = searchFrom + localMatch.index;
  const openFull = localMatch[0];
  const openPrefix = localMatch[1];

  out =
    out.slice(0, absOpen) +
    `${openPrefix}atomurusBootViewer(document.getElementById('${canvasId}'), function () {\n(function(){` +
    out.slice(absOpen + openFull.length);

  // Close wrapper: find the matching end of this IIFE — last `})();` before
  // the AutoTag script or </body> after the loader.
  const closeSearchStart = absOpen;
  const closeArea = out.slice(closeSearchStart);
  const closeMatch = closeArea.match(/\}\)\(\);\s*<\/script>/);
  if (!closeMatch) throw new Error('viewer IIFE close not found');
  const absClose = closeSearchStart + closeMatch.index;
  out =
    out.slice(0, absClose) +
    '})();\n});\n</script>' +
    out.slice(absClose + closeMatch[0].length);

  return out;
}

function deferMolViewer(html, loaderSrc, canvasId, molViewerSrc) {
  if (html.includes('atomurusBootViewer(') && html.includes('load-three.js')) {
    return html;
  }

  const molTagRe = new RegExp(
    `<script\\s+src=["']${molViewerSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=\\d+["']\\s*><\\/script>`,
    'i'
  );

  if (!THREE_TAG_RE.test(html)) throw new Error('three.min.js tag not found');

  let out = html.replace(THREE_TAG_RE, '');
  out = out.replace(molTagRe, '');

  const boot = `
<script src="${loaderSrc}?v=${VERSION}"></script>
<script>
atomurusBootViewer(document.getElementById('${canvasId}'), function () {
  var s = document.createElement('script');
  s.src = '${molViewerSrc}?v=${VERSION}';
  document.body.appendChild(s);
});
</script>
`;

  if (/atomurusRunAutoTag\(/.test(out)) {
    out = out.replace(
      /(<script[^>]*>\s*atomurusRunAutoTag\()/i,
      `${boot}\n$1`
    );
  } else if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${boot}\n</body>`);
  } else {
    out += boot;
  }

  return out;
}

let ok = 0;
for (const file of FILES) {
  const full = path.join(ROOT, file.rel);
  const original = fs.readFileSync(full, 'utf8');
  let next;
  if (file.mode === 'wrap-iife') {
    next = wrapIife(original, file.loader, file.canvas);
  } else {
    next = deferMolViewer(original, file.loader, file.canvas, file.molViewer);
  }
  if (next !== original) {
    fs.writeFileSync(full, next, 'utf8');
    ok += 1;
    console.log('patched', file.rel);
  } else {
    console.log('unchanged', file.rel);
  }
}
console.log(`Done: ${ok} files`);
