const d = require('../assets/i18n/isomerism.json');
const types = ['funcao', 'cadeia', 'posicao', 'metameria', 'tautomeria', 'geometrica', 'optica'];
for (const type of types) {
  const en = (d.en[type] || {});
  const pt = (d.pt[type] || {});
  console.log(type + ' | EN: ' + en.metaTitle + ' | DESC: ' + (en.metaDesc || '').slice(0, 70));
  console.log('      PT: ' + pt.metaTitle + ' | DESC: ' + (pt.metaDesc || '').slice(0, 70));
}
