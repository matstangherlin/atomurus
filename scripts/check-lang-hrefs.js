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
// Only <a ... href="..."> navigation links (not <link>, meta, JSON-LD)
const re = /<a\b[^>]*\bhref="([^"]*\?lang=[^"]*)"/g;
let total = 0;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(txt))) {
    const href = m[1];
    const pathPart = href.split('?')[0];
    const extOk = /\.(html|css|js|png|jpe?g|svg|gif|webp|ico|woff2?|json|txt|xml)$/i.test(pathPart);
    const isRoot = /^\/[^.]*$/.test(pathPart) || pathPart === '';
    if (!extOk && !isRoot) {
      total++;
      console.log(f + ' :: ' + href);
    }
  }
}
console.log('TOTAL bad <a> lang hrefs:', total);
