const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PAGES = [
  {
    source: 'viewer/isomerism/constitutional/function.html',
    target: 'viewer/isomerism/constitutional/function.pt.html',
    title: 'Isomeria de Função | Atomurus',
    description: 'Isomeria de função: mesma fórmula molecular, grupos funcionais diferentes. Compare etanol e éter dimetílico.',
    canonical: 'https://atomurus.com/viewer/isomerism/constitutional/function?lang=pt-BR',
  },
  {
    source: 'viewer/isomerism/constitutional/chain.html',
    target: 'viewer/isomerism/constitutional/chain.pt.html',
    title: 'Isomeria de Cadeia | Atomurus',
    description: 'Isomeria de cadeia: mesma fórmula molecular com esqueleto carbônico linear vs ramificado. Compare n-butano e isobutano.',
    canonical: 'https://atomurus.com/viewer/isomerism/constitutional/chain?lang=pt-BR',
  },
  {
    source: 'viewer/isomerism/constitutional/position.html',
    target: 'viewer/isomerism/constitutional/position.pt.html',
    title: 'Isomeria de Posição | Atomurus',
    description: 'Isomeria de posição: mesma fórmula molecular e mesmo grupo funcional, com a insaturação ou substituinte em posições diferentes.',
    canonical: 'https://atomurus.com/viewer/isomerism/constitutional/position?lang=pt-BR',
  },
  {
    source: 'viewer/isomerism/constitutional/metamerism.html',
    target: 'viewer/isomerism/constitutional/metamerism.pt.html',
    title: 'Metameria | Atomurus',
    description: 'Metameria em compostos com heteroátomo: mesma fórmula molecular e cadeias laterais diferentes ao redor do átomo central.',
    canonical: 'https://atomurus.com/viewer/isomerism/constitutional/metamerism?lang=pt-BR',
  },
  {
    source: 'viewer/isomerism/constitutional/tautomerism.html',
    target: 'viewer/isomerism/constitutional/tautomerism.pt.html',
    title: 'Tautomeria | Atomurus',
    description: 'Tautomeria: equilíbrio dinâmico entre formas estruturais, como ceto-enol, com interconversão rápida em solução.',
    canonical: 'https://atomurus.com/viewer/isomerism/constitutional/tautomerism?lang=pt-BR',
  },
  {
    source: 'viewer/isomerism/spatial/geometric.html',
    target: 'viewer/isomerism/spatial/geometric.pt.html',
    title: 'Isomeria Geométrica | Atomurus',
    description: 'Isomeria geométrica cis/trans: mesma conectividade com arranjos espaciais diferentes em alcenos e ciclos.',
    canonical: 'https://atomurus.com/viewer/isomerism/spatial/geometric?lang=pt-BR',
  },
  {
    source: 'viewer/isomerism/spatial/optical.html',
    target: 'viewer/isomerism/spatial/optical.pt.html',
    title: 'Isomeria Óptica | Atomurus',
    description: 'Isomeria óptica: enantiômeros R/S, carbono quiral e imagens especulares não sobreponíveis em química orgânica.',
    canonical: 'https://atomurus.com/viewer/isomerism/spatial/optical?lang=pt-BR',
  },
];

function replaceOne(html, pattern, replacement, label) {
  const next = html.replace(pattern, replacement);
  if (next === html) {
    throw new Error(`Could not update ${label}`);
  }
  return next;
}

function buildVariant(page) {
  const sourcePath = path.join(ROOT, page.source);
  const targetPath = path.join(ROOT, page.target);
  let html = fs.readFileSync(sourcePath, 'utf8');

  html = replaceOne(
    html,
    /(<html\b[^>]*)\blang="en-US"/,
    '$1lang="pt-BR"',
    'html lang'
  );
  html = replaceOne(html, /<title[^>]*>[\s\S]*?<\/title>/, `<title>${page.title}</title>`, 'title');
  html = replaceOne(
    html,
    /<meta name="description"[^>]*content="[^"]*"[^>]*>/,
    `<meta name="description" content="${page.description}">`,
    'description'
  );
  html = replaceOne(
    html,
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${page.canonical}">`,
    'canonical'
  );

  html = html.replace(
    /<link rel="alternate" hreflang="en" href="[^"]*">/,
    `<link rel="alternate" hreflang="en" href="${page.canonical.replace('?lang=pt-BR', '?lang=en')}">`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="pt-BR" href="[^"]*">/,
    `<link rel="alternate" hreflang="pt-BR" href="${page.canonical}">`
  );
  html = html.replace(
    /<meta property="og:locale" content="[^"]*">/g,
    '<meta property="og:locale" content="pt_BR">'
  );
  html = html.replace(/What is an isomer\?/g, 'O que é um isômero?');
  html = html.replace(/Read the isomerism article →/g, 'Ler o artigo de isomeria →');

  fs.writeFileSync(targetPath, html, 'utf8');
}

function main() {
  PAGES.forEach(buildVariant);
  console.log(`Generated ${PAGES.length} Portuguese isomerism variants`);
}

main();
