#!/usr/bin/env node
// Build step: make every public page's head consistent for search engines and
// link previews. Runs after the language variants are generated.
//   - <title> and meta / og / twitter descriptions that carry an i18n key get
//     the dictionary text in the page's language (a Portuguese description
//     had leaked into an English og:description).
//   - og:url = canonical; og:type (article for articles), og:title,
//     og:description, og:image, og:locale and twitter:card are added when
//     missing. Nothing is added to noindex pages.
// Idempotent. tools/audit-seo.mjs checks the result.
'use strict';

const fs = require('fs');
const path = require('path');
const { DICT } = require('./i18n-dict-source');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://atomurus.com';
const SKIP = new Set(['node_modules', 'dev', 'propostas', 'templates', 'fixtures', 'docs', 'test-results', 'e2e', 'tools', 'netlify', 'supabase', 'hanzi-logic', 'scripts', 'src', 'assets', 'dist', 'playwright-report']);
const DEFAULT_IMAGE = ORIGIN + '/assets/og-site.png';

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (fs.statSync(full).isDirectory()) { if (!SKIP.has(rel.split('/')[0])) walk(full, out); }
    else if (name.endsWith('.html')) out.push(rel);
  }
  return out;
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decode = (s) => String(s || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function dictValue(lang, key) {
  const v = key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), DICT[lang]);
  return typeof v === 'string' ? v : null;
}

function isPortuguese(rel, html) {
  if (/\.pt\.html$/.test(rel)) return true;
  if (/\.en\.html$/.test(rel)) return false;
  const lang = (/<html\b[^>]*\slang="([^"]*)"/i.exec(html) || [])[1] || '';
  return /^pt/i.test(lang);
}

const PT_WORDS = /\b(o|a|os|as|de|da|do|das|dos|e|é|em|para|com|uma|um|que|não|você|função|cadeia|isomeria)\b/gi;
const EN_WORDS = /\b(the|and|of|is|what|with|for|your|how|you)\b/gi;
function wrongLanguage(text, pagePt) {
  const en = (text.match(EN_WORDS) || []).length, ptw = (text.match(PT_WORDS) || []).length;
  return pagePt ? (en >= 2 && en > ptw) : (ptw >= 2 && ptw > en);
}

function getMeta(html, attr, name) {
  const re = new RegExp('<meta\\b[^>]*\\s' + attr + '="' + name.replace(/[:]/g, '\\:') + '"[^>]*>', 'i');
  const m = re.exec(html);
  if (!m) return null;
  const c = /\scontent="([^"]*)"/i.exec(m[0]);
  return { tag: m[0], content: c ? decode(c[1]) : '' };
}
function setContent(tag, value) {
  return /\scontent="[^"]*"/i.test(tag) ? tag.replace(/\scontent="[^"]*"/i, ' content="' + escAttr(value) + '"') : tag.replace(/\s*\/?>$/, ' content="' + escAttr(value) + '">');
}

function normalize(rel, html) {
  const head = /<head\b[^>]*>[\s\S]*?<\/head>/i.exec(html);
  if (!head) return html;
  let h = head[0];
  if (/<meta\b[^>]*name="robots"[^>]*noindex/i.test(h)) return html;
  const pt = isPortuguese(rel, html);
  const lang = pt ? 'pt' : 'en';

  // 1. dictionary text for keyed <title> and descriptions
  h = h.replace(/(<title\b[^>]*\sdata-i18n(?:-html)?="([^"]+)"[^>]*>)([^<]*)(<\/title>)/i, (m, open, key, cur, close) => {
    const v = dictValue(lang, key);
    return v ? open + escText(v) + close : m;
  });
  h = h.replace(/<meta\b[^>]*data-i18n-attr="content:([^";]+)"[^>]*>/gi, (tag, key) => {
    const v = dictValue(lang, key.trim());
    return v ? setContent(tag, v) : tag;
  });

  const title = decode(((/<title\b[^>]*>([^<]*)<\/title>/i.exec(h) || [])[1] || '').trim());
  const desc = (getMeta(h, 'name', 'description') || {}).content || '';
  const canon = (/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i.exec(h) || /<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/i.exec(h) || [])[1] || '';
  const isArticle = /^explore\/[^/]+\.html$/.test(rel);

  // 2. og / twitter
  const add = [];
  function ensure(attr, name, value, replace) {
    if (!value) return;
    const cur = getMeta(h, attr, name);
    if (!cur) add.push(`<meta ${attr}="${name}" content="${escAttr(value)}">`);
    else if (replace && cur.content !== value) h = h.replace(cur.tag, setContent(cur.tag, value));
  }
  ensure('property', 'og:url', decode(canon), true);
  ensure('property', 'og:type', isArticle ? 'article' : 'website', false);
  // a preview title / description in the other language falls back to the page's own
  const ogT = getMeta(h, 'property', 'og:title'), ogD = getMeta(h, 'property', 'og:description');
  ensure('property', 'og:title', title, !!(ogT && wrongLanguage(ogT.content, pt)));
  ensure('property', 'og:description', desc, !!(ogD && wrongLanguage(ogD.content, pt)));
  const twT = getMeta(h, 'name', 'twitter:title'), twD = getMeta(h, 'name', 'twitter:description');
  if (twT && wrongLanguage(twT.content, pt)) h = h.replace(twT.tag, setContent(twT.tag, title));
  if (twD && wrongLanguage(twD.content, pt)) h = h.replace(twD.tag, setContent(twD.tag, desc));
  ensure('property', 'og:image', DEFAULT_IMAGE, false);
  ensure('property', 'og:locale', pt ? 'pt_BR' : 'en_US', true);
  ensure('name', 'twitter:card', 'summary_large_image', false);
  if (add.length) {
    const anchor = /<link\b[^>]*rel="canonical"[^>]*>/i.exec(h) || /<meta\b[^>]*name="description"[^>]*>/i.exec(h) || /<title\b[^>]*>[^<]*<\/title>/i.exec(h);
    if (anchor) h = h.replace(anchor[0], anchor[0] + '\n' + add.join('\n'));
    else h = h.replace(/<\/head>/i, add.join('\n') + '\n</head>');
  }
  return html.replace(head[0], h);
}

function main() {
  let changed = 0;
  for (const rel of walk(ROOT, [])) {
    const file = path.join(ROOT, rel);
    const html = fs.readFileSync(file, 'utf8');
    const out = normalize(rel, html);
    if (out !== html) { fs.writeFileSync(file, out); changed++; }
  }
  console.log(`seo-normalize: ${changed} pages updated`);
}

if (require.main === module) main();
module.exports = { normalize };
