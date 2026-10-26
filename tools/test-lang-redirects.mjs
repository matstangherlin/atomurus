// First-match simulation of netlify.toml redirects for sitemap ?lang=pt-BR URLs.
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toml = readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
const sitemap = readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

function parseRedirects(text) {
  const rules = [];
  const blocks = text.split(/\[\[redirects\]\]/).slice(1);
  for (const block of blocks) {
    const body = block.split(/\n\[\[/)[0];
    const rule = { query: null, force: false, status: 200 };
    const from = body.match(/^\s*from\s*=\s*"([^"]+)"/m);
    const to = body.match(/^\s*to\s*=\s*"([^"]+)"/m);
    const status = body.match(/^\s*status\s*=\s*(\d+)/m);
    const force = body.match(/^\s*force\s*=\s*(true|false)/m);
    const query = body.match(/^\s*query\s*=\s*\{\s*lang\s*=\s*"([^"]+)"\s*\}/m);
    const conditions = /^\s*conditions\s*=/m.test(body);
    if (!from || !to) continue;
    rule.from = from[1];
    rule.to = to[1];
    if (status) rule.status = Number(status[1]);
    if (force) rule.force = force[1] === 'true';
    if (query) rule.query = { lang: query[1] };
    if (conditions) rule.conditions = true;
    rules.push(rule);
  }
  return rules;
}

function pathOf(urlPath) {
  const clean = urlPath.split('?')[0].replace(/\/+$/, '') || '/';
  return clean;
}

function ruleMatches(rule, pathname, query) {
  if (rule.conditions) return false;
  if (rule.query && query.lang !== rule.query.lang) return false;
  if (rule.from.endsWith('*')) {
    const prefix = rule.from.slice(0, -1);
    return pathname.startsWith(prefix);
  }
  return rule.from === pathname;
}

function resolve(rules, urlPath) {
  const qIndex = urlPath.indexOf('?');
  const pathname = pathOf(qIndex === -1 ? urlPath : urlPath.slice(0, qIndex));
  const params = new URLSearchParams(qIndex === -1 ? '' : urlPath.slice(qIndex + 1));
  const query = { lang: params.get('lang') };
  for (const rule of rules) {
    if (ruleMatches(rule, pathname, query)) return rule.to;
  }
  return null;
}

function isStub(abs) {
  if (!existsSync(abs)) return false;
  const stat = statSync(abs);
  if (stat.size >= 2000) return false;
  const text = readFileSync(abs, 'utf8');
  return /http-equiv=["']refresh["']/i.test(text) || /location\.replace/.test(text);
}

const rules = parseRedirects(toml);
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const langUrls = locs
  .map((loc) => new URL(loc))
  .filter((url) => url.searchParams.get('lang') === 'pt-BR')
  .map((url) => url.pathname + url.search);

let servedEn = 0;
for (const urlPath of langUrls) {
  const pathname = pathOf(urlPath.split('?')[0]);
  const ptFile = pathname === '/' ? '/index.pt.html' : pathname + '.pt.html';
  const abs = path.join(ROOT, ptFile.replace(/^\//, ''));
  if (!existsSync(abs) || isStub(abs)) continue;
  const dest = resolve(rules, urlPath);
  assert.equal(dest, ptFile, `${urlPath} → ${dest || 'EN default'}, expected ${ptFile}`);
  if (dest !== ptFile) servedEn += 1;
}
assert.equal(servedEn, 0);

for (const urlPath of langUrls) {
  const bare = pathOf(urlPath.split('?')[0]);
  const dest = resolve(rules, bare);
  if (!dest) continue;
  assert.equal(dest.endsWith('.pt.html'), false, `${bare} without query must not rewrite to ${dest}`);
}

for (const rule of rules) {
  if (!rule.to.endsWith('.pt.html')) continue;
  const abs = path.join(ROOT, rule.to.replace(/^\//, ''));
  assert.equal(isStub(abs), false, `rewrite ${rule.from} points at a stub ${rule.to}`);
}

const curriculumSrc = readFileSync(path.join(ROOT, 'assets/study-curriculum.js'), 'utf8');
const { createRequire } = await import('node:module');
const curriculum = createRequire(import.meta.url)('../assets/study-curriculum.js');

function walkEntries(list, out) {
  for (const entry of list || []) {
    out.push(entry);
    if (entry.pages) walkEntries(entry.pages, out);
  }
  return out;
}
const entries = walkEntries(curriculum.PATHS, []);
for (const entry of entries) {
  if (!entry.hrefPt) continue;
  const abs = path.join(ROOT, entry.hrefPt.replace(/^\//, ''));
  assert.equal(existsSync(abs), true, `missing ${entry.hrefPt}`);
  assert.equal(isStub(abs), false, `hrefPt stub ${entry.hrefPt}`);
}
for (const entry of entries) {
  if (!entry.href || !entry.href.endsWith('.html')) continue;
  const pt = entry.href.replace(/\.html$/, '.pt.html');
  const abs = path.join(ROOT, pt.replace(/^\//, ''));
  if (!existsSync(abs) || isStub(abs)) continue;
  if (pt.includes('/viewer/isomerism/') && isStub(abs)) continue;
  assert.equal(entry.hrefPt, pt, `${entry.href} should link ${pt}`);
}
assert.match(curriculumSrc, /hrefPt/);

const pricingPt = rules.findIndex((rule) => rule.from === '/pricing' && rule.to === '/pricing.pt.html');
const pricingEn = rules.findIndex((rule) => rule.from === '/pricing' && rule.to === '/pricing.html');
assert.ok(pricingPt >= 0 && pricingEn >= 0);
assert.ok(pricingPt < pricingEn, 'pt-BR pricing rule must come before the generic one');

console.log(`lang redirects ok (${langUrls.length} sitemap pt-BR urls)`);
