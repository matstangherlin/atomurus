const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');

let line = 1;
let col = 0;
let depth = 0;
let inS = false, inD = false, inT = false;
let inLineComment = false, inBlockComment = false;
let esc = false;

function bump(ch) {
  if (ch === '\n') { line++; col = 0; } else col++;
}

let nextReport = 200;
for (let i = 0; i < src.length; i++) {
  const ch = src[i];
  const next = src[i + 1];

  if (inLineComment) {
    if (ch === '\n') inLineComment = false;
    bump(ch);
    continue;
  }
  if (inBlockComment) {
    if (ch === '*' && next === '/') { inBlockComment = false; bump(ch); bump(next); i++; continue; }
    bump(ch);
    continue;
  }

  // Enter comments (only when not in string)
  if (!inS && !inD && !inT) {
    if (ch === '/' && next === '/') { inLineComment = true; bump(ch); bump(next); i++; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; bump(ch); bump(next); i++; continue; }
  }

  // Strings
  if (inS || inD || inT) {
    if (esc) { esc = false; bump(ch); continue; }
    if (ch === '\\') { esc = true; bump(ch); continue; }
    if (inS && ch === "'") inS = false;
    else if (inD && ch === '"') inD = false;
    else if (inT && ch === '`') inT = false;
    bump(ch);
    continue;
  } else {
    if (ch === "'") { inS = true; bump(ch); continue; }
    if (ch === '"') { inD = true; bump(ch); continue; }
    if (ch === '`') { inT = true; bump(ch); continue; }
  }

  if (ch === '{') depth++;
  if (ch === '}') depth--;

  if (ch === '\n' && line >= nextReport) {
    // eslint-disable-next-line no-console
    console.log(`LINE ${line} depth=${depth}`);
    nextReport += 200;
  }

  bump(ch);
}

console.log('Final depth =', depth);
console.log('String states:', { inS, inD, inT, inLineComment, inBlockComment });
