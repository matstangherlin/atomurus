// Fix 2: Add og:title / og:description meta tags (with i18n keys) to pages
// that lack them (viewer pages, config). Keys mirror the existing
// <title data-i18n="..."> and <meta name="description" data-i18n-attr="...">.
const fs = require('fs');
const path = require('path');
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(f);
    } else if (e.name.endsWith('.html')) files.push(f);
  }
}
walk('.');
let total = 0;
const changed = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  if (/property="og:title"/.test(txt)) continue; // already has it
  // title: <title data-i18n="NS.KEY">Fallback</title>
  const tMatch = txt.match(/<title([^>]*)>([^<]*)<\/title>/);
  if (!tMatch) continue;
  const titleAttrs = tMatch[1];
  const titleText = tMatch[2].trim();
  const titleKey = (titleAttrs.match(/data-i18n="([^"]+)"/) || [])[1] || '';
  // description meta
  const dMatch = txt.match(/<meta name="description"([^>]*)>/);
  const descAttrs = dMatch ? dMatch[1] : '';
  const descKey = (descAttrs.match(/data-i18n-attr="content:([^";]+)/) || [])[1] || '';
  const descText = (descAttrs.match(/content="([^"]+)"/) || [])[1] || '';
  // Insert after the description meta (or after title if no description meta)
  let insert = '';
  if (titleKey) {
    insert += '\n<meta property="og:title" data-i18n-attr="content:' + titleKey + '" content="' + titleText.replace(/"/g, '&quot;') + '">';
  } else {
    insert += '\n<meta property="og:title" content="' + titleText.replace(/"/g, '&quot;') + '">';
  }
  if (descKey) {
    insert += '\n<meta property="og:description" data-i18n-attr="content:' + descKey + '" content="' + descText.replace(/"/g, '&quot;') + '">';
  } else if (descText) {
    insert += '\n<meta property="og:description" content="' + descText.replace(/"/g, '&quot;') + '">';
  }
  let updated;
  if (dMatch) {
    updated = txt.replace(/<meta name="description"([^>]*)>/, '<meta name="description"' + '$1' + insert);
  } else {
    updated = txt.replace(/(<title[^>]*>[^<]*<\/title>)/, '$1' + insert);
  }
  if (updated !== txt) {
    fs.writeFileSync(f, updated, 'utf8');
    changed.push(f);
    total++;
  }
}
console.log('FILES changed:', changed.length);
changed.forEach((c) => console.log('  ' + c));
console.log('TOTAL pages with og:title/desc added:', total);
