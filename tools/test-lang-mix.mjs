// Prompt 26, B04: the language-mix lint (fixtures), the data-i18n-html bake it
// relies on, and the legal pages themselves (one language per version).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { words, guessLang, extractBlocks, lintHtml, targets, LEGAL_PAGES, DEFAULT_MAX_WORDS } from './lint-lang-mix.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const build = require(path.join(ROOT, 'build-i18n.js'));
const page = (lang, body, head = '') => `<!DOCTYPE html><html lang="${lang}"><head>${head}</head><body>${body}</body></html>`;

// ── words / guessLang ───────────────────────────────────────────────────────
assert.deepEqual(words('Escreva para contato@atomurus.com ou veja https://atomurus.com/privacy e doc.privacy v1.11'), ['escreva', 'para', 'ou', 'veja', 'e']);
assert.deepEqual(words('e-mail, lantanídeos/actinídeos'), ['e-mail', 'lantanídeos', 'actinídeos']);
assert.equal(guessLang('Você pode limpar esses valores a qualquer momento nas configurações do seu navegador.').lang, 'pt');
assert.equal(guessLang('You can clear these at any time through your browser settings.').lang, 'en');
assert.equal(guessLang('Cookies').lang, null);
assert.equal(guessLang('Google Analytics 4').lang, null);
assert.equal(guessLang('Search element').lang, 'en');
assert.equal(guessLang('Buscar elemento').lang, 'pt');

// ── extractBlocks ───────────────────────────────────────────────────────────
{
  const html = page('pt-BR', [
    '<p>Um parágrafo <strong>com</strong> texto.</p>',
    '<script>var t = "the and of";</script><style>.x::after{content:"the and"}</style>',
    '<template><p>the hidden template</p></template><svg><text>the svg text</text></svg>',
    '<!-- the comment is not shown -->',
    '<p>Veja o <code>localStorage of the browser</code> aqui.</p>',
    '<p><span lang="en">Opt-out Browser Add-on for the web</span></p>',
    '<p translate="no">the brand name of the thing</p>',
    '<img alt="Logo of the site"><input placeholder="search the site"><a title="Go to the page" aria-label="Open the menu">x</a>',
    '<nav><a href="#a">Quem somos</a><a href="#b">Seus direitos</a></nav>'
  ].join('\n'), '<title>Política de Privacidade</title><meta name="description" content="Como o Atomurus lida com dados">');
  const blocks = extractBlocks(html, 'pt');
  const texts = blocks.map((b) => b.text);
  assert.ok(texts.includes('Um parágrafo com texto.'), 'inline tags stay in their block');
  assert.ok(texts.includes('Veja o aqui.'), '<code> is skipped');
  assert.ok(!texts.some((t) => /hidden template|svg text|comment|var t|content:/.test(t)), 'scripts, styles, templates, SVG and comments are not text');
  assert.ok(!texts.some((t) => /Opt-out|brand name/.test(t)), 'lang="en" and translate="no" are skipped on a PT page');
  assert.ok(texts.includes('Logo of the site') && texts.includes('search the site') && texts.includes('Go to the page') && texts.includes('Open the menu'), 'alt, placeholder, title, aria-label are checked');
  assert.ok(texts.includes('Política de Privacidade') && texts.includes('Como o Atomurus lida com dados'), 'title and meta description are checked');
  assert.ok(texts.includes('Quem somos Seus direitos'), 'inline siblings are separated by a space');
  assert.ok(blocks.every((b) => b.line >= 1));
  assert.equal(blocks.find((b) => b.text === 'Um parágrafo com texto.').line, 1);
}

// ── lintHtml ────────────────────────────────────────────────────────────────
{
  const mixed = page('pt-BR', '<p>Este parágrafo está em português.</p>\n<p>But this one is in English and it should be flagged by the lint.</p>\n<button>Search element</button>');
  const r = lintHtml(mixed);
  assert.equal(r.lang, 'pt');
  assert.equal(DEFAULT_MAX_WORDS, 0, 'the CI tolerates no block in the other language');
  assert.equal(r.foreign.length, 2, 'the paragraph and the <button>');
  assert.equal(r.offenders.length, 2);
  assert.equal(r.offenders[0].line, 2);
  assert.deepEqual(lintHtml(mixed, { maxWords: 2 }).offenders.map((b) => b.line), [2], '--max-words 2 tolerates the 2-word button');
  const clean = page('en', '<p>This page is written in English only.</p><p><span lang="pt-BR">Isso é português de propósito, marcado.</span></p>');
  assert.equal(lintHtml(clean).foreign.length, 0);
  const enWithPt = page('en-US', '<p>Esta frase ficou em português por engano no meio da página.</p>');
  assert.equal(lintHtml(enWithPt).offenders.length, 1, 'works both ways');
}

// ── bakeDataI18nHtml ────────────────────────────────────────────────────────
{
  const dict = { pt: { x: { aHtml: 'Olá <strong>mundo</strong>', bHtml: 'Fim', cHtml: 'Não' } } };
  const bake = (h) => build.bakeDataI18nHtml(h, 'pt', dict);
  assert.equal(bake('<p data-i18n-html="x.aHtml">Hello <span>a<span>b</span></span> world</p><p>keep</p>'), '<p data-i18n-html="x.aHtml">Olá <strong>mundo</strong></p><p>keep</p>');
  assert.equal(bake('<div data-i18n-html="x.missing">Stay</div>'), '<div data-i18n-html="x.missing">Stay</div>', 'a missing key leaves the source');
  assert.equal(bake('<p data-i18n-html="x.bHtml">Unclosed <p>next paragraph</p><p>more</p>'), '<p data-i18n-html="x.bHtml">Unclosed <p>next paragraph</p><p>more</p>', 'never swallows block markup');
  assert.equal(bake('<span data-i18n-html="x.cHtml">No <span data-i18n="x.other">nested</span></span>'), '<span data-i18n-html="x.cHtml">No <span data-i18n="x.other">nested</span></span>', 'never wipes other keys');
  assert.equal(bake('<li data-i18n-html="x.aHtml">A</li><li data-i18n-html="x.bHtml">B</li>'), '<li data-i18n-html="x.aHtml">Olá <strong>mundo</strong></li><li data-i18n-html="x.bHtml">Fim</li>');
}

// ── The legal pages ─────────────────────────────────────────────────────────
const dict = build.loadDict();
const resolve = (lang, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict[lang]);
for (const name of LEGAL_PAGES) {
  const en = fs.readFileSync(path.join(ROOT, `${name}.html`), 'utf8');
  const pt = fs.readFileSync(path.join(ROOT, `${name}.pt.html`), 'utf8');
  // Every key the page uses exists in both languages.
  const keys = new Set();
  for (const m of en.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) keys.add(m[1]);
  for (const m of en.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(';')) if (pair.includes(':')) keys.add(pair.slice(pair.indexOf(':') + 1).trim());
  for (const key of keys) {
    assert.equal(typeof resolve('en', key), 'string', `${name}.html: ${key} has an EN value`);
    assert.equal(typeof resolve('pt', key), 'string', `${name}.html: ${key} has a PT value`);
  }
  // The committed .pt.html is exactly what the build writes from the EN source.
  assert.equal(pt, build.renderVariant(en, 'pt', dict, `${name}.html`), `${name}.pt.html is current (regenerate it from ${name}.html with build-i18n.js renderVariant)`);
  // Same structure: the same keys in the same order in both versions.
  const order = (h) => [...h.matchAll(/data-i18n(?:-html|-attr)?="([^"]+)"/g)].map((m) => m[1]).join('|');
  assert.equal(order(pt), order(en), `${name}: EN and PT carry the same keys`);
}
// The contents list repeats the section headings.
for (const ns of ['privacy', 'terms']) {
  for (const lang of ['en', 'pt']) {
    for (let i = 1; i <= 13; i += 1) {
      assert.equal(resolve(lang, `${ns}.toc_${i}`), resolve(lang, `${ns}.h2_${i}`).replace(/^\d+\.\s*/, ''), `${lang} ${ns}.toc_${i}`);
    }
  }
}
// The guard itself: 0 blocks in the other language, committed and built.
for (const t of targets()) {
  const r = lintHtml(t.html, { maxWords: 0 });
  assert.deepEqual(r.foreign.map((b) => `${b.line} ${b.text}`), [], `${t.name} has no block in the other language`);
}

console.log('test-lang-mix: ok');
