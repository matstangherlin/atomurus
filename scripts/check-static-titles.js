const fs = require('fs');
const files = [
  'viewer/isomerism/constitutional/chain.html',
  'viewer/isomerism/constitutional/chain.pt.html',
  'viewer/isomerism/constitutional/function.html',
  'viewer/isomerism/constitutional/function.pt.html',
  'viewer/isomerism/constitutional/position.html',
  'viewer/isomerism/constitutional/metamerism.html',
  'viewer/isomerism/constitutional/tautomerism.html',
  'viewer/isomerism/spatial/geometric.html',
  'viewer/isomerism/spatial/optical.html',
  'viewer/molecules.html',
  'viewer/molecules.pt.html',
  'viewer/isomerism.html',
  'viewer/isomerism.pt.html'
];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  const title = (t.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '';
  const descM = t.match(/<meta name="description"[^>]*content="([^"]+)"/);
  const desc = descM ? descM[1] : '';
  console.log(f + '\n  TITLE: ' + title + '\n  DESC: ' + desc.slice(0, 70));
}
