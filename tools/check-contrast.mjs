// WCAG contrast of the colour tokens (text × background) in light and dark.
// No dependencies; reads the custom properties straight from the CSS.
//
//   node tools/check-contrast.mjs            → table of every pair, exit 1 if one fails
//   node tools/check-contrast.mjs --suggest  → for failing pairs, the closest colour with
//                                              the same hue and saturation that passes
//   node tools/check-contrast.mjs --quiet    → only failures and the summary (CI)
//   node tools/check-contrast.mjs --json
//
// Which pairs: the secondary/tertiary text tokens on the backgrounds they sit on,
// and the element-cell text on each category colour (symbol at full strength,
// the small number/shells/mass/name at --el-meta-opacity). Normal text needs
// 4.5:1, large text 3:1 (WCAG 1.4.3). Category, brand and background colours are
// read, never suggested for change.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const CATEGORIES = ['nonmetal', 'noble', 'alkali', 'alkaline', 'metalloid', 'polyatomic', 'posttrans', 'transition', 'lanthanide', 'actinide'];

// file → token sources (later wins, like the cascade on the page) and pairs.
export const SUITES = [
  {
    name: 'periodic-table.css',
    files: ['periodic-table.css'],
    base: '--bg',
    pairs: [
      ['--text-1', '--bg'], ['--text-2', '--bg'], ['--text-3', '--bg'],
      ['--text-2', '--surface'], ['--text-3', '--surface'],
      ['--text-2', '--surface-2'], ['--text-3', '--surface-2'],
      ...CATEGORIES.flatMap((c) => [
        [`--c-${c}-t`, `--c-${c}`, { note: 'symbol' }],
        // Before --el-meta-opacity existed the faintest of these was .el-shells at .58.
        [`--c-${c}-t`, `--c-${c}`, { alpha: '--el-meta-opacity', fallback: 0.58, note: 'number, shells, mass, name' }]
      ])
    ]
  },
  {
    name: 'periodic-table.css + atomurus-lab-console.css (as loaded on /periodic-table)',
    files: ['periodic-table.css', 'atomurus-lab-console.css'],
    base: '--bg',
    pairs: [['--text-2', '--bg'], ['--text-3', '--bg'], ['--text-3', '--surface'], ['--lc-ink-3', '--bg']]
  },
  {
    name: 'atomurus-lab-console.css (tokens used by public-shell.css, app-workspace.css, explore-article.css)',
    files: ['atomurus-lab-console.css'],
    base: '--lc-bg',
    pairs: ['--lc-ink', '--lc-ink-2', '--lc-ink-3', '--lc-ink-4'].flatMap((fg) => [[fg, '--lc-bg'], [fg, '--lc-paper'], [fg, '--lc-surface']])
      .concat([['--lc-green', '--lc-paper', { note: 'links' }], ['--lc-green', '--lc-bg', { note: 'links' }]])
  },
  {
    name: 'assets/app-workspace.css',
    files: ['atomurus-lab-console.css', 'assets/app-workspace.css'],
    scope: '.ws-body',
    base: '--lc-bg',
    pairs: [['--ws-danger', '--lc-bg'], ['--ws-danger', '--lc-paper'], ['--ws-info', '--lc-paper'], ['--ws-locked', '--lc-paper']]
  }
];

// ── CSS custom properties per theme ─────────────────────────────────────────
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function blocks(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) out.push({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2] });
  return out;
}

function props(body) {
  const map = {};
  for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);?/gi)) map[m[1]] = m[2].trim();
  return map;
}

const LIGHT = new Set([':root', 'html']);
const DARK = new Set(['[data-theme="dark"]', ':root[data-theme="dark"]', 'html[data-theme="dark"]']);

export function readTokens(files, scope) {
  const light = {};
  const dark = {};
  for (const rel of files) {
    const css = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    for (const b of blocks(css)) {
      // Only top-level theme blocks (not inside @media), in source order.
      const selectors = b.selector.split(',').map((s) => s.trim());
      const isLight = selectors.some((s) => LIGHT.has(s) || s === scope);
      const isDark = selectors.some((s) => DARK.has(s) || (scope && s === `[data-theme="dark"] ${scope}`));
      if (isLight) Object.assign(light, props(b.body));
      if (isDark) Object.assign(dark, props(b.body));
    }
  }
  return { light, dark: Object.assign({}, light, dark) };
}

// ── Colour maths (WCAG 2.x) ─────────────────────────────────────────────────
export function parseColor(value) {
  const v = String(value).trim().toLowerCase();
  let m = /^#([0-9a-f]{3,8})$/.exec(v);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(v);
  if (m) {
    const a = m[4] == null ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  return null;
}

function resolve(map, token, depth = 0) {
  const raw = map[token];
  if (raw == null || depth > 8) return null;
  const ref = /^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)$/i.exec(raw);
  if (ref) return resolve(map, ref[1], depth + 1) ?? (ref[2] ? ref[2].trim() : null);
  return raw;
}

export function over(fg, bg) {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function channel(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(c) {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function hex(c) {
  return '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function toHsl({ r, g, b }) {
  const R = r / 255; const G = g / 255; const B = b / 255;
  const max = Math.max(R, G, B); const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: h / 6, s, l };
}

function fromHsl({ h, s, l }) {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255, a: 1 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return { r: Math.round(f(h + 1 / 3) * 255), g: Math.round(f(h) * 255), b: Math.round(f(h - 1 / 3) * 255), a: 1 };
}

// Closest colour with the same hue and saturation that reaches `min` on every bg.
export function suggest(fg, bgs, min) {
  const hsl = toHsl(fg);
  const ok = (l) => bgs.every((bg) => ratio(fromHsl({ ...hsl, l }), bg) >= min);
  if (bgs.every((bg) => ratio(fg, bg) >= min)) return fg;
  const darker = luminance(bgs[0]) > 0.18;
  for (let step = 1; step <= 1000; step += 1) {
    const l = darker ? hsl.l - step / 1000 : hsl.l + step / 1000;
    if (l < 0 || l > 1) break;
    if (ok(l)) return fromHsl({ ...hsl, l });
  }
  return null;
}

// ── Run ─────────────────────────────────────────────────────────────────────
export function check(suites = SUITES) {
  const rows = [];
  for (const suite of suites) {
    const tokens = readTokens(suite.files, suite.scope);
    for (const theme of ['light', 'dark']) {
      const map = tokens[theme];
      const baseRaw = resolve(map, suite.base);
      const base = baseRaw && parseColor(baseRaw);
      for (const [fgTok, bgTok, opts = {}] of suite.pairs) {
        const fgRaw = resolve(map, fgTok);
        const bgRaw = resolve(map, bgTok);
        let fg = fgRaw && parseColor(fgRaw);
        let bg = bgRaw && parseColor(bgRaw);
        if (!fg || !bg) {
          rows.push({ suite: suite.name, theme, fg: fgTok, bg: bgTok, note: opts.note || '', error: 'unresolved' });
          continue;
        }
        if (bg.a < 1 && base) bg = over(bg, base);
        let alpha = 1;
        if (opts.alpha) {
          alpha = parseFloat(resolve(map, opts.alpha));
          if (!Number.isFinite(alpha)) alpha = opts.fallback ?? 1;
        }
        const solid = over({ ...fg, a: fg.a * alpha }, bg);
        const min = opts.large ? 3 : 4.5;
        const value = ratio(solid, bg);
        rows.push({
          suite: suite.name, theme, fg: fgTok, bg: bgTok, note: opts.note || '',
          alpha: opts.alpha ? `${opts.alpha} = ${alpha}` : '',
          fgHex: hex(fg), bgHex: hex(bg), shownHex: hex(solid),
          ratio: Math.round(value * 100) / 100, min, pass: value >= min,
          suggestion: value >= min || opts.alpha ? null : (() => { const s = suggest(fg, [bg], min); return s && hex(s); })()
        });
      }
    }
  }
  return rows;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const rows = check();
  if (args.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    let suite = '';
    for (const r of rows) {
      if (r.suite !== suite && !(args.includes('--quiet') && r.pass)) {
        suite = r.suite;
        console.log(`\n${suite}`);
      }
      if (r.error) {
        console.log(`  ${r.theme.padEnd(5)} ${r.fg} on ${r.bg}: ${r.error}`);
        continue;
      }
      if (r.pass && args.includes('--quiet')) continue;
      const mark = r.pass ? 'ok  ' : 'FAIL';
      const extra = [r.note, r.alpha].filter(Boolean).join(' · ');
      const sug = !r.pass && args.includes('--suggest') && r.suggestion ? ` → try ${r.suggestion}` : '';
      console.log(`  ${mark} ${r.theme.padEnd(5)} ${r.fg} ${r.fgHex} on ${r.bg} ${r.bgHex}: ${r.ratio.toFixed(2)}:1 (min ${r.min})${extra ? ' — ' + extra : ''}${sug}`);
    }
  }
  const failing = rows.filter((r) => r.error || !r.pass);
  if (!args.includes('--json')) console.log(`\ncheck-contrast: ${rows.length - failing.length}/${rows.length} pairs pass`);
  if (failing.length) process.exit(1);
}
