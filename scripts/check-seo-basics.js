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
const skip = /(^|\\)(propostas|hanzi-logic|netlify|scripts|tools)\\|\\propostas\\|\\hanzi-logic\\|\\netlify\\/;
let issues = 0;
for (const f of files) {
  const norm = f.replace(/\//g, '\\');
  if (/\\propostas\\|\\hanzi-logic\\|\\netlify\\|\\tools\\|\\scripts\\/.test(norm)) continue;
  const t = fs.readFileSync(f, 'utf8');
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(t);
  if (noindex) continue;
  const title = (t.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const canonical = /rel="canonical"/.test(t);
  const desc = /<meta name="description"/.test(t);
  const ogTitle = /property="og:title"/.test(t);
  const ogDesc = /property="og:description"/.test(t);
  const ogImage = /property="og:image"/.test(t);
  const h1s = (t.match(/<h1\b/g) || []).length;
  const hreflang = /hreflang=/.test(t);
  const problems = [];
  if (!title) problems.push('NO TITLE');
  else if (title.length < 10) problems.push('TITLE TOO SHORT');
  if (!canonical) problems.push('NO CANONICAL');
  if (!desc) problems.push('NO DESCRIPTION');
  if (!ogTitle) problems.push('NO OG:TITLE');
  if (!ogDesc) problems.push('NO OG:DESC');
  if (!ogImage) problems.push('NO OG:IMAGE');
  if (h1s !== 1) problems.push('H1 COUNT=' + h1s);
  if (!hreflang) problems.push('NO HREFLANG');
  if (problems.length) {
    issues++;
    console.log(f + ' :: ' + problems.join(', '));
  }
}
console.log('PAGES with issues:', issues);
