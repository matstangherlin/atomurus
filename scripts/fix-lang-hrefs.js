// Fix: add .html to <a href="slug?lang=..."> links inside explore/* article pages
// when slug.html exists in the same directory. Safe: only touches verified targets.
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
const re = /(<a\b[^>]*\bhref=")([^"]*\?lang=[^"]*)(")/g;
let fixedTotal = 0;
const changed = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const dir = path.dirname(f);
  let changedCount = 0;
  const updated = txt.replace(re, (full, pre, href, post) => {
    const q = href.indexOf('?');
    const pathPart = href.slice(0, q);
    const query = href.slice(q);
    const extOk = /\.(html|css|js|png|jpe?g|svg|gif|webp|ico|woff2?|json|txt|xml)$/i.test(pathPart);
    const isAbs = /^[a-z]+:\/\//i.test(pathPart) || pathPart.charAt(0) === '/';
    if (extOk || isAbs) return full;
    const candidate = path.join(dir, pathPart + '.html');
    if (fs.existsSync(candidate)) {
      changedCount++;
      return pre + pathPart + '.html' + query + post;
    }
    return full;
  });
  if (updated !== txt) {
    fs.writeFileSync(f, updated, 'utf8');
    changed.push(f + ' (' + changedCount + ' links)');
    fixedTotal += changedCount;
  }
}
console.log('FILES changed:');
changed.forEach((c) => console.log('  ' + c));
console.log('TOTAL links fixed:', fixedTotal);
