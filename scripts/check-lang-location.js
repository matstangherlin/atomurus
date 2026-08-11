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
// location.href = '...?lang=...' / location.assign / location.replace with lang query
const re = /location\.(?:href\s*=\s*|replace\(|assign\()\s*['"]([^'"]*\?lang=[^'"]*)['"]/g;
let total = 0;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(txt))) {
    const url = m[1];
    const pathPart = url.split('?')[0];
    const extOk = /\.(html|css|js|png|jpe?g|svg|gif|webp|ico|woff2?|json|txt|xml)$/i.test(pathPart);
    const isAbs = /^[a-z]+:\/\//i.test(pathPart) || pathPart.charAt(0) === '/';
    if (!extOk && !isAbs && pathPart !== '') {
      total++;
      console.log(f + ' :: ' + url);
    }
  }
}
console.log('TOTAL bad location lang hrefs:', total);
