// Count font-size declarations below 12px in the CSS (prompt 23, M09).
//
//   node tools/check-font-sizes.mjs              → count per file
//   node tools/check-font-sizes.mjs --detail     → every declaration under 12px in periodic-table.css
//   node tools/check-font-sizes.mjs --max <n>    → exit 1 if periodic-table.css has more than n
//
// px values are read as is; rem/em are taken at 16px; calc()/clamp()/var() are
// counted only when every px inside them is below 12. Declarations listed in
// CELL_EXCEPTIONS (text inside the element cells, where 12px does not fit in
// an 18-column grid) are counted apart.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

export const FILES = [
  'periodic-table.css', 'atomurus-lab-console.css', 'assets/app-workspace.css',
  'explore-article.css', 'assets/critical-lab.css', 'assets/public-shell.css'
];

// Inside a cell of the 18-column table (≈ 52–60 px wide on desktop, and on
// phones the grid scrolls inside its own frame) the corner labels stay under
// 12 px; the symbol is ≥ 17 px. See docs/a11y/a11y-depois.md.
export const CELL_EXCEPTIONS = /(^|[\s,>])\.el-(z|shells|mass|name|state)\b|\.el\s|\.fblock-row|\.ptable-mini|\.mini-el|\.el-ph\b/;

// Blank out comments but keep every character's offset, so line numbers match the file.
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
}

export function pxOf(value) {
  const v = String(value).trim().toLowerCase();
  const nums = [...v.matchAll(/(-?[\d.]+)(px|rem|em)\b/g)].map((m) => parseFloat(m[1]) * (m[2] === 'px' ? 1 : 16));
  if (!nums.length) return null;
  return Math.max(...nums);
}

function lineAt(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

export function declarations(css) {
  const out = [];
  const clean = stripComments(css);
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    const selector = m[1].trim().replace(/\s+/g, ' ').replace(/^.*@media[^{]*$/, '');
    const bodyAt = m.index + m[1].length + 1;
    for (const d of m[2].matchAll(/font-size\s*:\s*([^;]+)/gi)) {
      const px = pxOf(d[1]);
      if (px == null) continue;
      const line = lineAt(clean, bodyAt + d.index);
      out.push({ selector, value: d[1].trim(), px, line });
    }
    // font shorthand: font: 600 11px/1.2 …
    for (const d of m[2].matchAll(/(?:^|;)\s*font\s*:\s*([^;]+)/gi)) {
      const size = /(\d[\d.]*)(px|rem|em)\s*(?:\/|\s)/.exec(d[1]);
      if (!size) continue;
      const px = parseFloat(size[1]) * (size[2] === 'px' ? 1 : 16);
      const line = lineAt(clean, bodyAt + d.index);
      out.push({ selector, value: d[1].trim(), px, line });
    }
  }
  return out;
}

export function count(file) {
  const all = declarations(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const small = all.filter((d) => d.px < 12);
  const cell = small.filter((d) => CELL_EXCEPTIONS.test(d.selector));
  return { file, total: all.length, small: small.length, cell: cell.length, other: small.length - cell.length, list: small };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const rows = FILES.map(count);
  console.log('| File | font-size declarations | < 12 px | of which inside element cells |');
  console.log('|---|---|---|---|');
  rows.forEach((r) => console.log(`| ${r.file} | ${r.total} | ${r.small} | ${r.cell} |`));
  if (args.includes('--detail')) {
    const pt = rows[0];
    console.log('\nperiodic-table.css under 12 px:');
    pt.list.forEach((d) => console.log(`  L${d.line} ${d.px}px ${CELL_EXCEPTIONS.test(d.selector) ? '[cell] ' : ''}${d.selector.slice(0, 90)}`));
  }
  const max = args.indexOf('--max');
  if (max !== -1) {
    const limit = Number(args[max + 1]);
    if (rows[0].small > limit) {
      console.error(`check-font-sizes: periodic-table.css has ${rows[0].small} declarations under 12px (max ${limit})`);
      process.exit(1);
    }
  }
}
