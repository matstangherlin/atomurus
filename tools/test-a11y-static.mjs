// tools/a11y-static.mjs — fixtures with and without names, skip links and dialog names.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { checkPage, audit, normalize } from './a11y-static.mjs';

const page = (body) => `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;

// ── Fields ──────────────────────────────────────────────────────────────────
{
  const r = checkPage(page(`
    <main id="main-content">
      <label for="a">A</label><select id="a"><option>1</option></select>
      <select id="b" aria-label="Unit"><option>1</option></select>
      <span id="lbl">Mass</span><input id="c" type="number" aria-labelledby="lbl">
      <label>Wrapped <input type="text"></label>
      <input type="hidden" name="x"><input type="submit" value="Go">
      <select id="d"><option>1</option></select>
      <input id="e" type="number">
      <textarea id="f"></textarea>
      <input id="g" type="text" aria-labelledby="missing">
      <select id="h" title="Only a title"><option>1</option></select>
    </main>`));
  assert.deepEqual(r.fields, ['select#d', 'input#e[type=number]', 'textarea#f', 'input#g[type=text]']);
  assert.deepEqual(r.titleOnly, ['select#h']);
}

// Markup inside comments, scripts and templates is not checked.
{
  const r = checkPage(page(`<!-- <select id="x"></select> --><script>const s = '<select id="y">';</script>
    <template><input id="z"></template>`));
  assert.deepEqual(r.fields, []);
}

// ── Label in name (WCAG 2.5.3) ──────────────────────────────────────────────
{
  const r = checkPage(page(`
    <button aria-label="Switch language"><span>PT</span></button>
    <button aria-label="PT — Switch language"><span data-i18n-toggle-label>PT</span></button>
    <button aria-label="Close"><svg><text>x</text></svg></button>
    <button aria-label="Add to compare">comparar</button>
    <button aria-label="Fechar">✕</button>
    <button aria-label="Open menu"><span aria-hidden="true">≡</span> Open <span class="sr-only">extra</span>menu</button>
    <a href="/x" aria-label="Follow us on X">X / Twitter</a>`));
  assert.deepEqual(r.name.map((n) => n.label), ['Switch language', 'Add to compare']);
  assert.deepEqual(r.linkName.map((n) => n.text), ['x / twitter']);
}
assert.equal(normalize('  PT&nbsp;—  Switch\nlanguage '), 'pt — switch language');

// ── Skip link ───────────────────────────────────────────────────────────────
{
  const ok = checkPage(page('<a class="skip-link" href="#main-content">Skip</a><nav><a href="/">Home</a></nav><main id="main-content"></main>'));
  assert.deepEqual(ok.skip, { ok: true, href: '#main-content' });
  assert.equal(ok.hasMain, true);
  const missingTarget = checkPage(page('<a class="skip-link" href="#main-content">Skip</a><main id="other"></main>'));
  assert.equal(missingTarget.skip.ok, false);
  const notFirst = checkPage(page('<nav><a href="/">Home</a></nav><a class="skip-link" href="#m">Skip</a><main id="m"></main>'));
  assert.equal(notFirst.skip.ok, false);
  const plainAnchor = checkPage(page('<a href="#m">Top</a><main id="m"></main>'));
  assert.equal(plainAnchor.skip.ok, false, 'a link to #id is a skip link only when it says so');
}

// ── Dialogs ─────────────────────────────────────────────────────────────────
{
  const r = checkPage(page(`
    <div role="dialog" id="d1" aria-label="Settings"></div>
    <div role="dialog" id="d2" aria-labelledby="t2"><h2 id="t2">Element</h2></div>
    <div role="dialog" id="d3" aria-labelledby="t3"><h2 id="t3"></h2></div>
    <div role="dialog" id="d4" aria-labelledby="t3" aria-label="Element details"></div>
    <div role="alertdialog" id="d5" aria-labelledby="nope"></div>
    <div role="dialog" id="d6"></div>`));
  assert.deepEqual(r.dialogs.map((d) => [d.id, d.ok]), [['d1', true], ['d2', true], ['d3', false], ['d4', true], ['d5', false], ['d6', false]]);
  assert.match(r.dialogs[2].why, /empty until script fills it/);
  assert.match(r.dialogs[4].why, /missing #nope/);
}

// ── audit() walks a tree and skips non-published folders ───────────────────
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-static-'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.mkdirSync(path.join(root, 'sub'));
  fs.writeFileSync(path.join(root, 'index.html'), page('<a class="skip-link" href="#main-content">Skip</a><main id="main-content"><select id="s"></select></main>'));
  fs.writeFileSync(path.join(root, 'sub', 'b.html'), page('<main><button aria-label="Language">EN</button></main>'));
  fs.writeFileSync(path.join(root, 'docs', 'ignored.html'), page('<main><select></select></main>'));
  const r = audit(root);
  assert.equal(r.totals.pages, 2);
  assert.equal(r.totals.fields, 1);
  assert.equal(r.totals.name, 1);
  assert.equal(r.totals.withMain, 2);
  assert.equal(r.totals.skipMissing, 1);
  fs.rmSync(root, { recursive: true, force: true });
}

// ── The PT build bakes translated names into the static HTML ───────────────
{
  const require = createRequire(import.meta.url);
  const { bakeDataI18nAttrs } = require('../build-i18n.js');
  const dict = { pt: { common: { langToggle: 'Trocar idioma', searchAria: 'Buscar & achar' } } };
  const html = '<button data-i18n-attr="title:common.langToggle; aria-label:common.langToggle" title="Switch language" aria-label="Switch language">PT</button>' +
    '<input data-i18n-attr="placeholder:common.searchAria" placeholder="x">' +
    '<i data-i18n-attr="aria-label:common.missing" aria-label="kept"></i>' +
    '<meta name="description" data-i18n-attr="content:common.langToggle" content="untouched">';
  const out = bakeDataI18nAttrs(html, 'pt', dict);
  assert.match(out, /title="Trocar idioma" aria-label="Trocar idioma"/);
  assert.match(out, /placeholder="Buscar &amp; achar"/);
  assert.match(out, /aria-label="kept"/);
  assert.match(out, /content="untouched"/);
  assert.equal(bakeDataI18nAttrs(out, 'pt', dict), out, 'idempotent');
}

// ── Language button: the name starts with the visible code ────────────────
{
  const require = createRequire(import.meta.url);
  const { normalizeLangToggles } = require('./inject-ui-chrome.js');
  const { bakeLangToggle } = require('../build-i18n.js');
  const src = '<button class="theme-btn" data-i18n-toggle\n  data-i18n-attr="aria-label:common.langToggle; title:common.langToggle"\n  aria-label="Switch language" title="Switch language">\n  <span data-i18n-toggle-label>PT</span>\n</button>' +
    '<button onclick="location.href=\'x.html?lang=en\'" data-i18n-attr="aria-label:common.langToggle" aria-label="Mudar idioma"><span>EN</span></button>' +
    '<button aria-label="Close">EN</button>';
  const en = normalizeLangToggles(src);
  assert.match(en, /data-i18n-attr="title:common\.langToggle"\n  aria-label="PT — Switch language"/);
  assert.match(en, /<button onclick="location\.href='x\.html\?lang=en'" aria-label="EN — Mudar idioma"><span>EN<\/span><\/button>/);
  assert.match(en, /<button aria-label="Close">EN<\/button>/, 'other buttons are left alone');
  assert.equal(normalizeLangToggles(en), en, 'idempotent');
  assert.deepEqual(checkPage(page(en)).name.map((n) => n.label), ['Close']);
  const pt = bakeLangToggle(en, 'pt', { pt: { common: { langToggle: 'Trocar idioma' } } });
  assert.match(pt, /aria-label="EN — Trocar idioma"[^>]*>\n  <span data-i18n-toggle-label>EN<\/span>/);
  assert.deepEqual(checkPage(page(pt)).name.map((n) => n.label), ['Close']);
}

console.log('test-a11y-static: ok');
