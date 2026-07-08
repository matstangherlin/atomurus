const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OLD = "setTimeout(function(){document.documentElement.classList.remove('lang-pt-pending');},600)";
const NEW = "setTimeout(function(){document.documentElement.classList.remove('lang-pt-pending');},120)";

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let touched = 0;
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(OLD)) continue;
  fs.writeFileSync(file, src.split(OLD).join(NEW), 'utf8');
  touched++;
}

console.log(`Updated timeout in ${touched} HTML files.`);
