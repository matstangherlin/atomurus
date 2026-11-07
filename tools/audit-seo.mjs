#!/usr/bin/env node
// SEO audit of every public page (static HTML, no browser): title and
// description (length, uniqueness, language), canonical, hreflang (targets
// exist and point back), <html lang>, Open Graph / Twitter, JSON-LD, one <h1>,
// image alt text, robots noindex vs sitemap, and broken internal links.
//
//   node tools/audit-seo.mjs            report every finding
//   node tools/audit-seo.mjs --json     machine-readable
// tools/test-seo.mjs runs it and fails on errors.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://atomurus.com';
const SKIP_DIRS = new Set(['node_modules', 'dev', 'propostas', 'templates', 'fixtures', 'docs', 'test-results', 'e2e', 'tools', 'netlify', 'supabase', 'hanzi-logic', 'scripts', 'src', '.git', 'assets', 'playwright-report', 'dist', 'android']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    const st = fs.statSync(full);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(rel.split('/')[0]) && !name.startsWith('.')) walk(full, out); }
    else if (name.endsWith('.html')) out.push(rel);
  }
  return out;
}

/* ── URL ↔ file (netlify.toml: pretty URLs, ?lang=pt-BR → .pt.html,
   element pages ?lang=en → .en.html) ─────────────────────────────── */
const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
const ptRewrites = new Map();
for (const b of toml.split('[[redirects]]')) {
  const from = /from\s*=\s*"([^"]+)"/.exec(b), to = /to\s*=\s*"([^"]+)"/.exec(b), q = /query\s*=\s*\{([^}]*)\}/.exec(b);
  if (from && to && q && /lang\s*=\s*"pt-BR"/.test(q[1]) && to[1].endsWith('.pt.html')) ptRewrites.set(from[1], to[1].replace(/^\//, ''));
}
const isElement = (f) => /^periodic-table\/[a-z]+(\.en)?\.html$/.test(f) && !/^periodic-table\/(heatmap|trends|compare|isotopes)/.test(f);

function fileForUrl(u) {
  let url;
  try { url = new URL(u, ORIGIN + '/'); } catch { return null; }
  if (url.origin !== ORIGIN) return null;
  let p = decodeURIComponent(url.pathname).replace(/^\//, '');
  const lang = url.searchParams.get('lang');
  if (p === '' || p.endsWith('/')) p += 'index';
  p = p.replace(/\.html$/, '');
  if (lang && /^pt/i.test(lang)) {
    const viaRewrite = ptRewrites.get('/' + (p === 'index' ? '' : p));
    if (viaRewrite) return viaRewrite;
    if (fs.existsSync(path.join(ROOT, p + '.pt.html'))) return null; // a .pt.html exists but nothing serves it
  }
  if (lang && /^en/i.test(lang) && fs.existsSync(path.join(ROOT, p + '.en.html')) && isElement(p + '.html')) return p + '.en.html';
  if (fs.existsSync(path.join(ROOT, p + '.html'))) return p + '.html';
  if (fs.existsSync(path.join(ROOT, p, 'index.html'))) return p + '/index.html';
  if (fs.existsSync(path.join(ROOT, p)) && fs.statSync(path.join(ROOT, p)).isFile()) return p;
  return null;
}

/* ── tiny HTML readers ──────────────────────────────────────────── */
const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
function attr(tag, name) { const m = new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i').exec(tag); return m ? decode(m[2] != null ? m[2] : m[3]) : null; }
function metas(html) {
  const out = [];
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) out.push(m[0]);
  return out;
}
function meta(html, key, val) { return metas(html).filter((t) => (attr(t, key) || '').toLowerCase() === val.toLowerCase()).map((t) => attr(t, 'content')); }
function links(html, rel) { return [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((t) => (attr(t, 'rel') || '').toLowerCase() === rel); }
function stripTags(s) { return decode(String(s).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(); }

const PT_WORDS = /\b(o|a|os|as|de|da|do|das|dos|e|é|em|para|com|uma|um|que|não|você)\b/gi;
const EN_WORDS = /\b(the|and|of|is|what|with|for|your|how|you)\b/gi;
function looksEnglish(s) { const en = (s.match(EN_WORDS) || []).length, pt = (s.match(PT_WORDS) || []).length; return en >= 2 && en > pt; }
function looksPortuguese(s) { const en = (s.match(EN_WORDS) || []).length, pt = (s.match(PT_WORDS) || []).length; return pt >= 3 && pt > en + 1; }

export function audit() {
  const files = walk(ROOT).sort();
  const pages = {};
  for (const f of files) pages[f] = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const findings = [];
  const add = (level, file, rule, msg) => findings.push({ level, file, rule, msg });

  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const sitemapSet = new Set(sitemapLocs);

  const titles = new Map(), descs = new Map(), info = {};
  // a page whose canonical is another file (alias) shares its title on purpose
  const aliasOf = (f) => {
    const c = (links(pages[f], 'canonical')[0] || '');
    const t = c ? fileForUrl(attr(c, 'href')) : null;
    return t && t !== f;
  };
  for (const f of files) {
    const html = pages[f];
    const isPt = /\.pt\.html$/.test(f) || (isElement(f) && !/\.en\.html$/.test(f));
    const robots = (meta(html, 'name', 'robots')[0] || '').toLowerCase();
    const noindex = /noindex/.test(robots);
    const title = stripTags((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '');
    const desc = meta(html, 'name', 'description')[0] || '';
    const canon = links(html, 'canonical').map((t) => attr(t, 'href'));
    const htmlLang = attr((/<html\b[^>]*>/i.exec(html) || [''])[0], 'lang') || '';
    info[f] = { isPt, noindex, title, desc, canon: canon[0] || '', htmlLang };

    // <html lang>
    if (isPt && !/^pt/i.test(htmlLang)) add('error', f, 'lang', `Portuguese page with <html lang="${htmlLang}">`);
    if (!isPt && /^pt/i.test(htmlLang)) add('error', f, 'lang', `English page with <html lang="${htmlLang}">`);

    if (noindex) continue; // the rest is about pages search engines index

    // title
    if (!title) add('error', f, 'title', 'missing <title>');
    else {
      if (title.length > 65) add('warn', f, 'title-long', `title ${title.length} chars (> 65, truncated in results): "${title}"`);
      if (title.length < 15) add('warn', f, 'title-short', `title ${title.length} chars: "${title}"`);
      if (isPt && looksEnglish(title)) add('error', f, 'title-lang', `Portuguese page, English title: "${title}"`);
      if (!isPt && looksPortuguese(title)) add('error', f, 'title-lang', `English page, Portuguese title: "${title}"`);
      if (!aliasOf(f)) (titles.get(title) || titles.set(title, []).get(title)).push(f);
    }
    // description
    if (!desc) add('error', f, 'desc', 'missing meta description');
    else {
      if (desc.length > 160) add('warn', f, 'desc-long', `description ${desc.length} chars (> 160)`);
      if (desc.length < 70) add('warn', f, 'desc-short', `description ${desc.length} chars (< 70): "${desc}"`);
      if (isPt && looksEnglish(desc)) add('error', f, 'desc-lang', `Portuguese page, English description: "${desc.slice(0, 80)}…"`);
      if (!isPt && looksPortuguese(desc)) add('error', f, 'desc-lang', `English page, Portuguese description: "${desc.slice(0, 80)}…"`);
      if (!aliasOf(f)) (descs.get(desc) || descs.set(desc, []).get(desc)).push(f);
    }
    // canonical (an "alias" page points its canonical at another page on purpose:
    // the legacy isomerism pages consolidate into /viewer/isomerism/…)
    let alias = false;
    if (canon.length !== 1) add('error', f, 'canonical', `${canon.length} canonical links`);
    else {
      const c = canon[0];
      if (!c.startsWith(ORIGIN + '/')) add('error', f, 'canonical', `not absolute https: ${c}`);
      const target = fileForUrl(c);
      if (!target) add('error', f, 'canonical', `canonical does not resolve to a page: ${c}`);
      else if (target !== f) alias = true;
      if (/\.html(\?|$)/.test(c)) add('warn', f, 'canonical', `canonical keeps .html: ${c}`);
    }
    info[f].alias = alias;
    // hreflang
    const alts = links(html, 'alternate').filter((t) => attr(t, 'hreflang'));
    const langs = alts.map((t) => attr(t, 'hreflang'));
    for (const need of ['en', 'pt-BR', 'x-default']) if (!langs.includes(need)) add('error', f, 'hreflang', `missing hreflang="${need}"`);
    for (const t of alts) {
      const href = attr(t, 'href');
      const target = fileForUrl(href);
      if (!target) add('error', f, 'hreflang', `hreflang="${attr(t, 'hreflang')}" → ${href} serves nothing`);
      else if (pages[target] && !alias) {
        const back = links(pages[target], 'alternate').map((x) => fileForUrl(attr(x, 'href')));
        if (!back.includes(f)) add('error', f, 'hreflang', `${target} does not link back (hreflang="${attr(t, 'hreflang')}")`);
      }
    }
    // social
    const og = (k) => meta(html, 'property', k)[0];
    for (const k of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) if (!og(k)) add('warn', f, 'og', `missing ${k}`);
    const ogImg = og('og:image');
    if (ogImg) {
      if (!/^https:\/\//.test(ogImg)) add('error', f, 'og', `og:image not absolute: ${ogImg}`);
      else { const t = fileForUrl(ogImg); if (!t) add('error', f, 'og', `og:image file missing: ${ogImg}`); }
    }
    if (og('og:url') && canon[0] && og('og:url') !== canon[0]) add('warn', f, 'og', `og:url ≠ canonical (${og('og:url')} vs ${canon[0]})`);
    if (isPt && og('og:title') && looksEnglish(og('og:title'))) add('error', f, 'og-lang', `Portuguese page, English og:title: "${og('og:title')}"`);
    if (isPt && og('og:description') && looksEnglish(og('og:description'))) add('error', f, 'og-lang', `Portuguese page, English og:description`);
    if (!isPt && og('og:description') && looksPortuguese(og('og:description'))) add('error', f, 'og-lang', `English page, Portuguese og:description`);
    if (!isPt && og('og:title') && looksPortuguese(og('og:title'))) add('error', f, 'og-lang', `English page, Portuguese og:title: "${og('og:title')}"`);
    if (!meta(html, 'name', 'twitter:card')[0]) add('warn', f, 'twitter', 'missing twitter:card');
    // JSON-LD
    for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(m[1]); } catch (e) { add('error', f, 'jsonld', 'invalid JSON-LD: ' + e.message.slice(0, 80)); }
    }
    // headings
    const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]));
    if (h1.length !== 1) add('warn', f, 'h1', `${h1.length} <h1> elements`);
    else if (!h1[0]) add('warn', f, 'h1', 'empty <h1>');
    // images
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) if (attr(m[0], 'alt') == null) add('warn', f, 'img-alt', `img without alt: ${(attr(m[0], 'src') || '').slice(0, 60)}`);
    // sitemap
    if (canon[0] && !alias && !sitemapSet.has(canon[0])) add('warn', f, 'sitemap', `canonical not in sitemap: ${canon[0]}`);
  }
  // duplicates
  for (const [t, fs_] of titles) if (fs_.length > 1) add('warn', fs_[0], 'title-dup', `same title on ${fs_.length} pages: "${t}" (${fs_.slice(0, 4).join(', ')})`);
  for (const [d, fs_] of descs) if (fs_.length > 1) add('warn', fs_[0], 'desc-dup', `same description on ${fs_.length} pages (${fs_.slice(0, 4).join(', ')})`);
  // sitemap entries
  for (const loc of sitemapLocs) {
    const t = fileForUrl(loc);
    if (!t) { add('error', 'sitemap.xml', 'sitemap', `URL serves nothing: ${loc}`); continue; }
    if (info[t] && info[t].noindex) add('error', 'sitemap.xml', 'sitemap', `noindex page listed: ${loc}`);
    if (info[t] && info[t].canon && info[t].canon !== loc) add('error', 'sitemap.xml', 'sitemap', `${loc} has canonical ${info[t].canon}`);
  }
  // internal links
  const seen = new Set();
  for (const f of files) {
    if (info[f].noindex && /^(404|app|account|login)/.test(f)) continue;
    for (const m of pages[f].matchAll(/<a\b[^>]*\shref="([^"#][^"]*)"/gi)) {
      const href = decode(m[1]);
      if (/^(https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(href) && !href.startsWith(ORIGIN)) continue;
      if (/^\/(api|\.netlify|signup|login|forgot-password|reset-password|account|app|pricing|contact|dev)(\b|\/|\?|$)/.test(href)) continue;
      const base = ORIGIN + '/' + f.replace(/[^/]*$/, '');
      const abs = new URL(href, base).href;
      const key = abs.split('#')[0];
      if (seen.has(key)) continue;
      seen.add(key);
      const u = new URL(abs);
      if (u.pathname.match(/\.(png|jpe?g|svg|webp|pdf|xml|txt|json|js|css|ico)$/)) {
        if (!fs.existsSync(path.join(ROOT, decodeURIComponent(u.pathname)))) add('error', f, 'link', `broken asset link ${href}`);
        continue;
      }
      if (!fileForUrl(abs)) add('error', f, 'link', `broken link ${href}`);
    }
  }
  return { findings, pages: files.length, indexable: files.filter((f) => !info[f].noindex).length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = audit();
  if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 1)); process.exit(0); }
  const byRule = {};
  for (const x of r.findings) (byRule[x.level + ' ' + x.rule] = byRule[x.level + ' ' + x.rule] || []).push(x);
  console.log(`pages: ${r.pages} (${r.indexable} indexable) · findings: ${r.findings.length}`);
  for (const k of Object.keys(byRule).sort()) {
    console.log(`\n## ${k} (${byRule[k].length})`);
    byRule[k].slice(0, 12).forEach((x) => console.log(`  ${x.file}: ${x.msg}`));
    if (byRule[k].length > 12) console.log(`  … +${byRule[k].length - 12}`);
  }
}
