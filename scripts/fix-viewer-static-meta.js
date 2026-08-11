// Fix: replace generic static <title>/<meta name="description"> fallbacks on the
// viewer isomerism subpages with the specific localized values from the dict, so
// Google indexes unique, meaningful titles/descriptions even without JS.
const fs = require('fs');
const path = require('path');
const d = require('../assets/i18n/isomerism.json');

const MAP = {
  function: 'funcao',
  chain: 'cadeia',
  position: 'posicao',
  metamerism: 'metameria',
  tautomerism: 'tautomeria',
  geometric: 'geometrica',
  optical: 'optica'
};
const FILES = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.html')) FILES.push(f);
  }
}
walk(path.join(__dirname, '..', 'viewer', 'isomerism'));

let total = 0;
const changed = [];
for (const f of FILES) {
  const base = path.basename(f);
  const name = base.replace(/\.pt\.html$/, '').replace(/\.html$/, '');
  const typeKey = MAP[name];
  if (!typeKey) continue;
  const lang = base.endsWith('.pt.html') ? 'pt' : 'en';
  const meta = d[lang][typeKey];
  if (!meta || !meta.metaTitle) continue;
  let txt = fs.readFileSync(f, 'utf8');
  let c = 0;
  // 1) <title data-i18n="isomerism.<type>.metaTitle">FALLBACK</title> (EN pages)
  const tRe = new RegExp('(<title data-i18n="isomerism\\.' + typeKey + '\\.metaTitle">)([^<]*)(</title>)');
  if (tRe.test(txt)) {
    txt = txt.replace(tRe, '$1' + meta.metaTitle + '$3');
    c++;
  }
  // 2) <title>STATIC</title> without data-i18n (PT pages)
  const tStatic = new RegExp('(<title>)([^<]*)(</title>)');
  if (!tRe.test(txt) && tStatic.test(txt)) {
    txt = txt.replace(tStatic, '$1' + meta.metaTitle + '$3');
    c++;
  }
  // 3) <meta name="description" ...> with data-i18n-attr (EN)
  const dRe = new RegExp('(<meta name="description"[^>]*?content=")([^"]*)("[^>]*?data-i18n-attr="content:isomerism\\.' + typeKey + '\\.metaDesc"[^>]*>)');
  const m2 = txt.match(dRe);
  if (m2) {
    txt = txt.replace(dRe, '$1' + meta.metaDesc + '$3');
    c++;
  }
  // 4) <meta name="description" ...> without data-i18n-attr (PT)
  const dStatic = new RegExp('(<meta name="description"[^>]*?content=")([^"]*)("[^>]*?data-i18n-attr="content:isomerism\\.' + typeKey + '\\.metaDesc"[^>]*>)');
  if (!m2) {
    const dS = txt.match(/<meta name="description"[^>]*?content="([^"]*)"/);
    if (dS) {
      txt = txt.replace(/(<meta name="description"[^>]*?content=")[^"]*(")/, '$1' + meta.metaDesc + '$2');
      c++;
    }
  }
  // 5) og:title fallback — either attribute order
  const ogOrders = [
    '(<meta property="og:title"[^>]*?content=")([^"]*)("[^>]*?data-i18n-attr="content:isomerism\\.' + typeKey + '\\.metaTitle"[^>]*>)',
    '(<meta property="og:title"[^>]*?data-i18n-attr="content:isomerism\\.' + typeKey + '\\.metaTitle"[^>]*?content=")([^"]*)(")'
  ];
  ogOrders.forEach((p) => {
    const re = new RegExp(p);
    if (re.test(txt)) {
      txt = txt.replace(re, '$1' + meta.metaTitle + '$3');
      c++;
    }
  });
  // 6) og:description fallback — either attribute order
  const ogdOrders = [
    '(<meta property="og:description"[^>]*?content=")([^"]*)("[^>]*?data-i18n-attr="content:isomerism\\.' + typeKey + '\\.metaDesc"[^>]*>)',
    '(<meta property="og:description"[^>]*?data-i18n-attr="content:isomerism\\.' + typeKey + '\\.metaDesc"[^>]*?content=")([^"]*)(")'
  ];
  ogdOrders.forEach((p) => {
    const re = new RegExp(p);
    if (re.test(txt)) {
      txt = txt.replace(re, '$1' + meta.metaDesc + '$3');
      c++;
    }
  });
  if (c) {
    fs.writeFileSync(f, txt, 'utf8');
    changed.push(f + ' (' + c + ')');
    total += c;
  }
}
console.log('FILES changed:', changed.length);
changed.forEach((x) => console.log('  ' + x));
console.log('TOTAL replacements:', total);
