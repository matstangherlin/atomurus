#!/usr/bin/env node
// A1.0 — packaged application output: dist/app (the future Capacitor webDir).
//
// NOT the repository root. The site keeps publishing from Netlify as before;
// this is a separate, versioned artifact containing only what the app needs:
//
//   index.html            app shell entry — no SEO, OG, JSON-LD, ads, crawler helpers
//   app/app-[hash].js     bootstrap (core + shell + router), ES modules
//   app/chunks/*.js       one lazy chunk per feature (code splitting)
//   app/styles-[hash].css tokens + components + app-shell layout
//   vendor/three/         Three.js packaged locally (loaded only by viewers)
//   assets/app/           element index (cacheable static data)
//   assets/fonts/         Instrument Serif, Inter Tight, JetBrains Mono only
//   build-manifest.json   sizes, initial vs lazy JS, per-feature chunks
//
// The API stays remote (https://atomurus.com/api via the runtime config).
import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist/app');
const APP_FONTS = new Set(['Instrument Serif', 'Inter Tight', 'JetBrains Mono']);

function copy(from, to) {
  mkdirSync(path.dirname(path.join(OUT, to)), { recursive: true });
  cpSync(path.join(ROOT, from), path.join(OUT, to));
}

function appFontsCss() {
  const css = readFileSync(path.join(ROOT, 'assets/fonts/fonts.css'), 'utf8');
  const blocks = css.match(/@font-face\s*\{[^}]*\}/g) || [];
  const kept = blocks.filter((b) => APP_FONTS.has((b.match(/font-family:\s*'([^']+)'/) || [])[1]));
  const files = kept.map((b) => (b.match(/url\(\/assets\/fonts\/([^)]+)\)/) || [])[1]).filter(Boolean);
  return { css: `/* App subset of assets/fonts/fonts.css */\n${kept.join('\n')}\n`, files };
}

function html({ js, css }) {
  return `<!DOCTYPE html>
<html lang="en" class="app-root" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#F2EFE7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0D0C" media="(prefers-color-scheme: dark)">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://atomurus.com; base-uri 'self'; object-src 'none'">
<title>Atomurus</title>
<link rel="icon" href="assets/icons/icon-192.png">
<link rel="stylesheet" href="assets/fonts/fonts.css">
<link rel="stylesheet" href="${css}">
<script type="module" src="${js}"></script>
</head>
<body>
<div id="app"></div>
</body>
</html>
`;
}

export async function buildAppBundle() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const result = await build({
    entryPoints: {
      app: path.join(ROOT, 'src/app/bootstrap/app-main.js'),
      styles: path.join(ROOT, 'src/ui/app.css')
    },
    outdir: path.join(OUT, 'app'),
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020', 'chrome90', 'safari14'],
    minify: true,
    entryNames: '[name]-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
    assetNames: 'assets/[name]-[hash]',
    metafile: true,
    legalComments: 'none',
    logLevel: 'silent'
  });

  const outputs = result.metafile.outputs;
  const relOut = (p) => path.relative(OUT, path.join(ROOT, p)).split(path.sep).join('/');
  const entryJs = Object.keys(outputs).find((p) => outputs[p].entryPoint && outputs[p].entryPoint.endsWith('app-main.js'));
  const entryCss = Object.keys(outputs).find((p) => p.endsWith('.css') && outputs[p].entryPoint && outputs[p].entryPoint.endsWith('app.css'));

  /* Initial JS = the entry plus everything it imports statically. */
  const initial = new Set();
  (function visit(p) {
    if (initial.has(p)) return;
    initial.add(p);
    for (const imp of outputs[p].imports || []) if (imp.kind === 'import-statement') visit(imp.path);
  })(entryJs);

  const size = (p) => {
    const buf = readFileSync(path.join(ROOT, p));
    return { bytes: buf.length, gzip: gzipSync(buf).length };
  };
  const chunks = Object.keys(outputs).filter((p) => p.endsWith('.js')).map((p) => ({
    file: relOut(p),
    initial: initial.has(p),
    ...size(p),
    sources: Object.keys(outputs[p].inputs || {}).map((i) => i.replace(/^src\//, '')).filter((i) => i.startsWith('features/') || i.startsWith('app/') || i.startsWith('core/')).slice(0, 40)
  }));

  writeFileSync(path.join(OUT, 'index.html'), html({ js: relOut(entryJs), css: relOut(entryCss) }));

  const fonts = appFontsCss();
  mkdirSync(path.join(OUT, 'assets/fonts'), { recursive: true });
  writeFileSync(path.join(OUT, 'assets/fonts/fonts.css'), fonts.css.replaceAll('url(/assets/fonts/', 'url(./'));
  for (const f of fonts.files) copy(`assets/fonts/${f}`, `assets/fonts/${f}`);
  copy('assets/app/elements.json', 'assets/app/elements.json');
  for (const icon of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) copy(`assets/icons/${icon}`, `assets/icons/${icon}`);
  copy('node_modules/three/build/three.module.js', 'vendor/three/three.module.js');

  const initialJs = chunks.filter((c) => c.initial);
  const manifest = {
    wave: 'A1.0',
    note: 'Packaged app output (future Capacitor webDir). Not deployed by Netlify.',
    entry: relOut(entryJs),
    stylesheet: relOut(entryCss),
    initialJs: {
      files: initialJs.map((c) => c.file),
      bytes: initialJs.reduce((s, c) => s + c.bytes, 0),
      gzip: initialJs.reduce((s, c) => s + c.gzip, 0)
    },
    css: size(entryCss),
    lazyChunks: chunks.filter((c) => !c.initial),
    vendor: { three: size('dist/app/vendor/three/three.module.js') }
  };
  writeFileSync(path.join(OUT, 'build-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (!existsSync(path.join(ROOT, 'node_modules/three/build/three.module.js'))) {
    console.error('three@0.128.0 (devDependency) is missing — run npm ci');
    process.exit(1);
  }
  const m = await buildAppBundle();
  console.log(`dist/app built: initial JS ${m.initialJs.bytes} B (${m.initialJs.gzip} B gz), CSS ${m.css.bytes} B, ${m.lazyChunks.length} lazy chunks, three ${m.vendor.three.bytes} B (lazy)`);
  void statSync;
}
