// Prompt 28, part B: every explore article, in both languages, has «Common
// misconceptions» and «Key takeaways», numbered sections in order, the recap
// last before the closing callout, and in-page links that resolve.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'explore');
const HEADS = {
  en: { mis: 'Common misconceptions', recap: 'Key takeaways' },
  pt: { mis: 'Equívocos comuns', recap: 'O que você precisa lembrar' }
};
// Written for prompts 28, 32 and 33; the older sections keep their own length.
const NEW_MISCONCEPTIONS = new Set(['what-is-isomerism', 'what-is-the-periodic-table', 'bhopal-disaster', 'what-is-the-mole', 'conservation-of-mass',
  'solutions-and-concentration', 'acids-bases-and-ph', 'chemical-equilibrium']);

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const words = (html) => text(html).split(' ').filter(Boolean).length;

export function articleStructure(html) {
  const a = html.indexOf('id="art-body"');
  const b = html.indexOf('<section class="art-refs">', a);
  assert.ok(a !== -1 && b !== -1, 'article body and references');
  const body = html.slice(a, b);
  const sections = [...body.matchAll(/<h2([^>]*)><span class="h-no">§ (\d+)<\/span>\s*([^<]*)<\/h2>/g)]
    .map((m) => ({ attrs: m[1], n: Number(m[2]), title: m[3].trim(), at: m.index, end: m.index + m[0].length }));
  sections.forEach((s, i) => { s.html = body.slice(s.end, i + 1 < sections.length ? sections[i + 1].at : body.length); });
  return { body, sections };
}

const slugs = fs.readdirSync(DIR).filter((f) => f.endsWith('.html') && !f.endsWith('.pt.html')).map((f) => f.replace(/\.html$/, '')).sort();
assert.equal(slugs.length, 13, 'thirteen explore articles (drafts: two from prompt 32, three from prompt 33)');

let checked = 0;
for (const slug of slugs) {
  const shape = {};
  for (const lang of ['en', 'pt']) {
    const file = `explore/${slug}${lang === 'pt' ? '.pt' : ''}.html`;
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const { body, sections } = articleStructure(html);
    const nums = sections.map((s) => s.n);
    assert.deepEqual(nums, nums.map((_, i) => i + 1), `${file}: § numbering runs 1…${nums.length} in order`);

    const mis = sections.filter((s) => s.title === HEADS[lang].mis);
    assert.equal(mis.length, 1, `${file}: one «${HEADS[lang].mis}» section`);
    const pairs = [...mis[0].html.matchAll(/<h3>("[^<]+")<\/h3>\s*<p>([\s\S]*?)<\/p>/g)];
    assert.ok(pairs.length >= 2, `${file}: at least two misconceptions («claim» + correction)`);
    if (NEW_MISCONCEPTIONS.has(slug)) {
      pairs.forEach((p) => assert.ok(words(p[2]) <= 70, `${file}: a correction stays within 70 words (${words(p[2])})`));
    }

    const recap = sections[sections.length - 1];
    assert.equal(recap.title, HEADS[lang].recap, `${file}: «${HEADS[lang].recap}» is the last numbered section`);
    const items = [...recap.html.matchAll(/<li>([\s\S]*?)<\/li>/g)];
    assert.ok(/<ul class="art-recap">/.test(recap.html) && items.length >= 3 && items.length <= 5, `${file}: 3–5 takeaways`);
    assert.match(recap.html.slice(recap.html.indexOf('</ul>')), /^<\/ul>\s*<div class="art-callout">/, `${file}: the recap sits right before the closing callout`);

    // In-page links point at ids that exist; the contents list is built from
    // these h2 elements, so their ids (when set) must be unique.
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const m of body.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(m[1]), `${file}: #${m[1]} exists`);
    const h2ids = sections.map((s) => (/\sid="([^"]+)"/.exec(s.attrs) || [])[1]).filter(Boolean);
    assert.equal(new Set(h2ids).size, h2ids.length, `${file}: section ids are unique`);

    shape[lang] = {
      sections: nums.length,
      misconceptions: pairs.length,
      takeaways: items.length,
      misWords: words(mis[0].html),
      recapWords: words(recap.html)
    };
    checked += 1;
  }
  const { en, pt } = shape;
  assert.equal(pt.sections, en.sections, `${slug}: same sections in PT and EN`);
  assert.equal(pt.misconceptions, en.misconceptions, `${slug}: same misconceptions`);
  assert.equal(pt.takeaways, en.takeaways, `${slug}: same takeaways`);
  for (const k of ['misWords', 'recapWords']) {
    const ratio = pt[k] / en[k];
    assert.ok(ratio >= 0.9 && ratio <= 1.3, `${slug}: PT/EN word ratio of ${k} is ${ratio.toFixed(2)}`);
  }
}

console.log(`test-articles-structure: ok (${checked} pages)`);
