const fs = require('fs');
const p = require('path').join(__dirname, '..', 'i18n.js');
let s = fs.readFileSync(p, 'utf8');

s = s.replace(/metaTitlemetaTitle/g, 'metaTitle');
s = s.replace(/",\},/g, '",');

const nextTypes = ['cadeia', 'posicao', 'metameria', 'tautomeria', 'geometrica', 'optica'];
for (const t of nextTypes) {
  const re = new RegExp(
    `(callout: [^\\n]+)\\n(        ${t}: \\{)`,
    'g'
  );
  s = s.replace(re, '$1,\n        },\n$2');
}

s = s.replace(
  /(bondPlane: [^\n]+),(\})\n      \},/g,
  '$1\n        }\n      },'
);

s = s.replace(/",,/g, '",');
s = s.replace(/',\s*,/g, "',");

fs.writeFileSync(p, s, 'utf8');
console.log('Fixed i18n.js structure');
