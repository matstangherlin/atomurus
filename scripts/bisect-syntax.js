const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'i18n.js');
const src = fs.readFileSync(file, 'utf8');

function ok(n) {
  try {
    // Wrap in Function so partial JS can still be checked.
    // Add a newline to avoid ending in // comment.
    // eslint-disable-next-line no-new-func
    new Function(src.slice(0, n) + '\n');
    return true;
  } catch (_) {
    return false;
  }
}

let lo = 0;
let hi = src.length;
if (ok(hi)) {
  console.log('No syntax error detected.');
  process.exit(0);
}

while (hi - lo > 1) {
  const mid = Math.floor((lo + hi) / 2);
  if (ok(mid)) lo = mid;
  else hi = mid;
}

const pos = hi;
const before = src.lastIndexOf('\n', pos);
const before2 = src.lastIndexOf('\n', before - 1);
const after = src.indexOf('\n', pos);

console.log('First failing char index:', pos);
console.log('Context:\n---');
console.log(src.slice(Math.max(0, before2), after === -1 ? pos + 120 : after));
console.log('---');
