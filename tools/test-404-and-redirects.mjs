// Prompt 26, B03: the 404 page works at any depth and in both languages; the
// /element/N short URLs are generated, current and point at real pages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRules, renderBlock, currentBlock, BEGIN, END } from './build-element-redirects.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── 404.html ────────────────────────────────────────────────────────────────
const html = read('404.html');
const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => m.replace(/>[\s\S]*<\/script>/, '></script>'));
const refs = [...markup.matchAll(/\s(src|href)="([^"]*)"/g)].map((m) => m[2]);
assert.ok(refs.length > 20);
const relative = refs.filter((r) => !/^(\/|https?:|#|mailto:|data:|tel:)/.test(r));
assert.deepEqual(relative, [], 'every src/href in 404.html is absolute, so /element/999 still loads the CSS');
for (const css of ['/assets/critical-lab.css', '/atomurus-lab-console.css', '/assets/public-shell.css', '/assets/layouts/docs.css', '/assets/print.css']) {
  assert.ok(html.includes(`href="${css}?v=`), `404 loads ${css}`);
}
assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
assert.match(html, /<html[^>]*\slang="mul"/, 'without JS both languages show');
assert.match(html, /data-nf-lang="pt" lang="pt-BR"/);
assert.match(html, /data-nf-lang="en" lang="en"/);
for (const text of ['Página não encontrada', 'Page not found', '>Início<', '>Tabela periódica<', '>Calculadoras<', '>Home<', '>Periodic Table<', '>Calculators<']) {
  assert.ok(html.includes(text), `404 has «${text}»`);
}
const docsCss = read('assets/layouts/docs.css');
assert.match(docsCss, /html\[lang\^="pt"\] \.nf-lang\[data-nf-lang="en"\]/);
assert.match(docsCss, /html\[lang\^="en"\] \.nf-lang\[data-nf-lang="pt"\]/);

// ── /element/N ──────────────────────────────────────────────────────────────
const toml = read('netlify.toml');
const block = currentBlock(toml);
assert.ok(block, 'netlify.toml has the element-redirects block');
const { rules } = buildRules();
assert.equal(block, renderBlock(rules), 'block is current (node tools/build-element-redirects.mjs --check)');
const parsed = [...block.matchAll(/from\s*=\s*"([^"]+)"\s*\n\s*to\s*=\s*"([^"]+)"\s*\n\s*status\s*=\s*(\d+)/g)].map((m) => ({ from: m[1], to: m[2], status: Number(m[3]) }));
assert.equal(parsed.length, rules.length);
assert.ok(parsed.length <= 400, 'keep the rule count reasonable');
assert.ok(parsed.every((r) => r.status === 301));
const froms = new Set(parsed.map((r) => r.from));
assert.equal(froms.size, parsed.length, 'no duplicate sources');
for (let z = 1; z <= 118; z += 1) assert.ok(froms.has(`/element/${z}`), `/element/${z}`);
assert.ok(!froms.has('/element/0') && !froms.has('/element/119') && !froms.has('/element/999'));
for (const r of parsed) {
  const [pathname, query] = r.to.split('?');
  const file = pathname.replace(/^\//, '') + (query === 'lang=en' ? '.en.html' : '.html');
  assert.ok(fs.existsSync(path.join(ROOT, file)), `${r.from} → ${r.to}: ${file} exists`);
}
const byFrom = Object.fromEntries(parsed.map((r) => [r.from, r.to]));
assert.equal(byFrom['/element/26'], '/periodic-table/ferrum');
assert.equal(byFrom['/element/ferro'], '/periodic-table/ferrum');
assert.equal(byFrom['/element/iron'], '/periodic-table/ferrum?lang=en');
assert.equal(byFrom['/element/hidrogenio'], '/periodic-table/hydrogenium');
// No catch-all that would hide real 404s, and the block sits before the /*.html rule.
assert.doesNotMatch(toml, /from\s*=\s*"\/element\/\*"/);
assert.ok(toml.indexOf(BEGIN) < toml.indexOf('from   = "/*.html"'), 'block comes before the .html → pretty-URL rule');
assert.ok(toml.indexOf(END) > toml.indexOf(BEGIN));

console.log(`test-404-and-redirects: ok (${parsed.length} element redirects)`);
