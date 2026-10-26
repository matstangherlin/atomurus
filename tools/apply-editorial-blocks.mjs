// Insert level chip + "you will learn" into the nine articles. Idempotent.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = path.join(ROOT, 'tools/editorial-config.json');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderBlocks(article, lang, config) {
  const level = article.level;
  const label = config.levels[level][lang];
  const title = config.learnTitle[lang];
  const items = article.learn[lang].map((item) => `    <li>${escapeHtml(item)}</li>`).join('\n');
  const reviewer = config.reviewerName
    ? `\n<span class="article-reviewer">Revisão: ${escapeHtml(config.reviewerName)}</span>`
    : '';
  return `<!-- ed:level -->
<p class="article-level"><span class="article-level-chip" data-i18n="article.level.${level}">${escapeHtml(label)}</span></p>
<!-- /ed:level -->
<!-- ed:learn -->
<aside class="article-learn" aria-labelledby="article-learn-title">
  <h2 id="article-learn-title" data-i18n="article.learn.title">${escapeHtml(title)}</h2>
  <ul>
${items}
  </ul>
</aside>${reviewer}
<!-- /ed:learn -->
`;
}

export function applyReviewerJsonLd(html, reviewerName) {
  const without = html.replace(/\n[ \t]*"reviewedBy": \{[^}]*\},?/g, '');
  if (!reviewerName) return without;
  const field = `"reviewedBy": { "@type": "Person", "name": ${JSON.stringify(reviewerName)} }`;
  if (without.includes('"author"')) {
    return without.replace(/("author": \{[^}]*\})/, `$1,\n      ${field}`);
  }
  return without.replace(/("inLanguage": "[^"]+")/, `$1,\n  ${field}`);
}

export function applyEditorial(html, article, lang, config) {
  const block = renderBlocks(article, lang, config);
  const marker = /<!-- ed:level -->[\s\S]*?<!-- \/ed:learn -->\n?/;
  let next = html;
  if (marker.test(next)) next = next.replace(marker, block);
  else {
    const meta = next.indexOf('class="art-meta"');
    if (meta >= 0) {
      const headerEnd = next.indexOf('</header>', meta);
      next = next.slice(0, headerEnd) + block + next.slice(headerEnd);
    } else {
      const dek = next.indexOf('class="mvwr-dek"');
      const close = dek >= 0 ? next.indexOf('</p>', dek) : -1;
      if (close < 0) throw new Error('no editorial anchor');
      const at = close + 4;
      next = next.slice(0, at) + '\n' + block + next.slice(at);
    }
  }
  return applyReviewerJsonLd(next, config.reviewerName);
}

function langOf(file) {
  return file.endsWith('.pt.html') ? 'pt' : 'en';
}

function pairPath(file, lang) {
  if (lang === 'en') return file;
  return file.replace(/\.html$/, '.pt.html');
}

export function applyConfigToTree(config, read, write) {
  for (const [file, article] of Object.entries(config.articles)) {
    for (const lang of ['en', 'pt']) {
      const rel = pairPath(file, lang);
      const html = read(rel);
      write(rel, applyEditorial(html, article, lang, config));
    }
  }
}

function main() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  applyConfigToTree(
    config,
    (rel) => readFileSync(path.join(ROOT, rel), 'utf8'),
    (rel, html) => writeFileSync(path.join(ROOT, rel), html)
  );
}

if (process.argv[1] && process.argv[1].endsWith('apply-editorial-blocks.mjs')) main();
