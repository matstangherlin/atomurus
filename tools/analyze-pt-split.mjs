// Static analysis of periodic-table.js (and the files split out of it), no dependencies.
//
//   node tools/analyze-pt-split.mjs                 → sections, sizes, cross-section use
//   node tools/analyze-pt-split.mjs --json out.json
//   node tools/analyze-pt-split.mjs --md out.md     → Markdown tables for docs/perf
//
// What it does:
//   - a small lexer that skips comments, strings, template text and regex literals
//     and tracks brace depth, so it finds the TOP-LEVEL declarations
//     (function / async function / class / const / let / var) and the top-level
//     statements that run when the script loads;
//   - cuts the file into sections by their marker comments;
//   - for every section, which top-level names declared in OTHER sections it uses;
//   - which names the HTML pages call from inline handlers (onclick="…").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

export const PAGES = [
  'periodic-table.html', 'periodic-table/heatmap.html', 'periodic-table/trends.html',
  'periodic-table/compare.html', 'periodic-table/isotopes.html'
];

// Marker comment → section name. Order matters (file order).
export const MARKERS = [
  ['// ════════════ ELEMENT DATA', 'data'],
  ['// ════════════ I18N HELPER', 'i18n-helper'],
  ['// ════════════ MODAL', 'modal'],
  ['// ════════════ PDF — ELEMENT', 'export-pdf'],
  ['// ════════════ PNG — FULL TABLE', 'export-png'],
  ['// ════════════ FULLSCREEN TABLE MODE', 'fullscreen'],
  ['// ════════════ FILTER', 'filter'],
  ['// ════════════ SEARCH', 'search'],
  ['// ════════════ TABS', 'tabs'],
  ['// ─── HEATMAP LOGIC', 'heatmap'],
  ['// ─── COMPARAR LOGIC', 'compare'],
  ['// ─── COMPARE: APPLICATIONS', 'compare/applications'],
  ['// ─── COMPARE: ATOMIC-MODEL VIEW', 'compare/atomic-model'],
  ['// ─── TENDÊNCIAS LOGIC', 'trends'],
  ['// ─── DYNAMIC SCIENTIFIC INSIGHT ENGINE', 'trends/insight'],
  ['// ─── TRENDS TOOLTIP', 'trends/tooltip'],
  ['// ─── TRENDS SCOPE SELECTOR', 'trends/scope'],
  ['// ─── TRENDS CUSTOM SELECT', 'trends/custom-select'],
  ['// ─── TRENDS NAVIGATOR', 'trends/navigator'],
  ['// ─── TRENDS EXPORT', 'trends/export'],
  ['// ─── ISOTOPOS LOGIC', 'isotopes'],
  ['// ─── ATOMIC MODEL ROW', 'isotopes/atomic-model'],
  ['// ─── SCIENTIFIC HERO SUMMARY', 'isotopes/hero'],
  ['// ─── ISOTOPE INSIGHT PANEL', 'isotopes/insight'],
  ['// ─── ISOTOPE APPLICATIONS PANEL', 'isotopes/applications'],
  ['// ─── DECAY-MODE COLOR PALETTE', 'isotopes/decay-palette'],
  ['// ─── DECAY-MODE FILTER CHIPS', 'isotopes/decay-filter'],
  ['// ─── HALF-LIFE LOG CHART', 'isotopes/half-life-chart'],
  ['// ─── ABUNDANCE BAR CHART', 'isotopes/abundance-chart'],
  ['// ─── ISOTOPE TOOLTIP', 'isotopes/tooltip'],
  ['// ════════════ NAVIGATION', 'navigation'],
  ['// ════════════ DARK MODE', 'dark-mode'],
  ['// ════════════ ELEMENT SIZE', 'element-size'],
  ['// ════════════ HEATMAP SELECT', 'heatmap-select'],
  ['// ════════════ F-BLOCK TOGGLE', 'fblock-toggle'],
  ['// ════════════ INIT', 'init'],
  ['// ════════════ F-BLOCK CONNECTOR LINES', 'fblock-lines'],
  ['// ════════════ I18N RE-RENDER', 'i18n-rerender']
];

const KEYWORDS = new Set(('break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield await async of null true false undefined NaN Infinity arguments static get set').split(' '));

// Tokenise: returns identifiers (with offset, whether preceded by '.'), and brace depth per offset.
export function lex(src) {
  const ids = [];
  const depthAt = new Int32Array(src.length + 1);
  let depth = 0;
  let i = 0;
  let lastSignificant = '';
  let lastSigAt = -1; // offset of the last code character (comments and blanks skipped)
  const templateStack = [];
  const n = src.length;
  const isIdStart = (c) => /[A-Za-z_$]/.test(c);
  const isId = (c) => /[\w$]/.test(c);
  const regexAllowed = () => !lastSignificant || /[(,=:[!&|?{};+\-*%<>~^]$/.test(lastSignificant) || /^(return|typeof|case|do|else|in|of|new|delete|void|throw)$/.test(lastSignificant);
  while (i < n) {
    const c = src[i];
    depthAt[i] = depth;
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') { depthAt[i] = depth; i += 1; } continue; }
    if (c === '/' && src[i + 1] === '*') { const end = src.indexOf('*/', i + 2); const stop = end === -1 ? n : end + 2; while (i < stop) { depthAt[i] = depth; i += 1; } continue; }
    if (c === '\'' || c === '"') {
      i += 1;
      while (i < n && src[i] !== c) { if (src[i] === '\\') i += 1; if (src[i] === '\n') break; i += 1; }
      i += 1; lastSignificant = 'str'; continue;
    }
    if (c === '`') {
      i += 1;
      for (;;) {
        if (i >= n) break;
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '`') { i += 1; break; }
        if (src[i] === '$' && src[i + 1] === '{') { templateStack.push(depth); depth += 1; i += 2; lastSignificant = '{'; break; }
        i += 1;
      }
      if (src[i - 1] === '`' || i >= n) lastSignificant = 'str';
      continue;
    }
    if (c === '}' && templateStack.length && templateStack[templateStack.length - 1] === depth - 1) {
      // back into template text
      templateStack.pop(); depth -= 1; i += 1;
      for (;;) {
        if (i >= n) break;
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '`') { i += 1; break; }
        if (src[i] === '$' && src[i + 1] === '{') { templateStack.push(depth); depth += 1; i += 2; break; }
        i += 1;
      }
      lastSignificant = 'str';
      continue;
    }
    if (c === '/' && regexAllowed()) {
      i += 1;
      let cls = false;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '[') cls = true; else if (src[i] === ']') cls = false;
        else if (src[i] === '/' && !cls) break;
        else if (src[i] === '\n') break;
        i += 1;
      }
      i += 1;
      while (i < n && /[a-z]/i.test(src[i])) i += 1;
      lastSignificant = 'regex';
      continue;
    }
    if (c === '{' || c === '(' || c === '[') { depth += c === '{' ? 1 : 0; lastSignificant = c; i += 1; continue; }
    if (c === '}') { depth -= 1; lastSignificant = '}'; i += 1; continue; }
    if (isIdStart(c)) {
      let j = i + 1;
      while (j < n && isId(src[j])) j += 1;
      const word = src.slice(i, j);
      // a.b is a property, not a reference to a global b; ...b (spread) is.
      const dotted = lastSigAt >= 0 && src[lastSigAt] === '.' && src[lastSigAt - 1] !== '.';
      ids.push({ word, at: i, depth, dotted });
      for (let x = i; x < j; x += 1) depthAt[x] = depth;
      lastSignificant = word;
      lastSigAt = j - 1;
      i = j;
      continue;
    }
    if (!/\s/.test(c)) { lastSignificant = c; lastSigAt = i; }
    i += 1;
  }
  depthAt[n] = depth;
  return { ids, depthAt, endDepth: depth };
}

export function topLevel(src) {
  const { ids, endDepth } = lex(src);
  const decls = [];
  for (let k = 0; k < ids.length; k += 1) {
    const t = ids[k];
    if (t.depth !== 0 || t.dotted) continue;
    const next = ids[k + 1];
    if (!next) continue;
    if ((t.word === 'function' || t.word === 'class') && next.depth === 0 &&
        /^\s*\*?\s*$/.test(src.slice(t.at + t.word.length, next.at))) {
      // `function name(` / `function* name(` / `class Name` — not `function (item)`
      decls.push({ name: next.word, kind: t.word, at: t.at });
    } else if (['const', 'let', 'var'].includes(t.word)) {
      // const a = 1, b = 2;  — take names right after the keyword or after a depth-0 comma
      decls.push({ name: next.word, kind: t.word, at: t.at });
      let m = k + 2;
      const lineEnd = src.indexOf(';', next.at);
      while (m < ids.length && ids[m].at < (lineEnd === -1 ? src.length : lineEnd)) {
        const between = src.slice(ids[m - 1].at + ids[m - 1].word.length, ids[m].at);
        if (ids[m].depth === 0 && /,\s*$/.test(between) && /^\s*=/.test(src.slice(ids[m].at + ids[m].word.length))) {
          decls.push({ name: ids[m].word, kind: t.word, at: ids[m].at });
        }
        m += 1;
      }
    }
  }
  return { decls, ids, endDepth };
}

export function sections(src, markers = MARKERS) {
  const found = markers.map(([needle, name]) => ({ name, at: src.indexOf(needle) })).filter((s) => s.at !== -1);
  if (found.length && found[0].at > 0) found.unshift({ name: 'preamble', at: 0 });
  return found.map((s, idx) => ({ ...s, end: idx + 1 < found.length ? found[idx + 1].at : src.length }));
}

const lineOf = (src, at) => src.slice(0, at).split('\n').length;

export function analyze(file = 'periodic-table.js') {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const { decls, ids } = topLevel(src);
  const secs = sections(src);
  const secOf = (at) => secs.find((s) => at >= s.at && at < s.end)?.name || '?';
  const owner = new Map();
  decls.forEach((d) => { if (!owner.has(d.name)) owner.set(d.name, secOf(d.at)); });
  const uses = new Map(secs.map((s) => [s.name, new Map()]));
  for (const t of ids) {
    if (t.dotted || KEYWORDS.has(t.word) || !owner.has(t.word)) continue;
    const from = secOf(t.at);
    const to = owner.get(t.word);
    if (from === to) continue;
    const m = uses.get(from);
    if (!m.has(to)) m.set(to, new Set());
    m.get(to).add(t.word);
  }
  // Load-time statements: depth-0 lines that are not declarations, comments or closers.
  const loadTime = [];
  const lines = src.split('\n');
  let offset = 0;
  const depthInfo = lex(src).depthAt;
  for (let li = 0; li < lines.length; li += 1) {
    const line = lines[li];
    const atDepth = depthInfo[offset];
    const trimmed = line.trim();
    if (atDepth === 0 && trimmed && line === line.trimStart() &&
        !/^(\/\/|\/\*|\*|function\b|async function\b|class\b|const\b|let\b|var\b|\}|\)|\]|'use strict')/.test(trimmed)) {
      loadTime.push({ line: li + 1, section: secOf(offset), text: trimmed.slice(0, 100) });
    }
    offset += line.length + 1;
  }
  return {
    file,
    bytes: Buffer.byteLength(src),
    lines: lines.length,
    sections: secs.map((s) => ({
      name: s.name,
      firstLine: lineOf(src, s.at),
      lastLine: lineOf(src, Math.max(s.at, s.end - 1)),
      bytes: Buffer.byteLength(src.slice(s.at, s.end)),
      declares: decls.filter((d) => secOf(d.at) === s.name).map((d) => d.name),
      uses: Object.fromEntries([...uses.get(s.name).entries()].map(([k, v]) => [k, [...v].sort()]))
    })),
    owner: Object.fromEntries(owner),
    duplicates: decls.map((d) => d.name).filter((name, idx, all) => all.indexOf(name) !== idx),
    loadTime
  };
}

export function inlineHandlers(pages = PAGES, owner = {}) {
  const out = {};
  for (const page of pages) {
    for (const variant of [page, page.replace(/\.html$/, '.pt.html')]) {
      const file = path.join(ROOT, variant);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      const names = new Set();
      for (const m of html.matchAll(/\son[a-z]+="([^"]*)"/g)) {
        for (const id of m[1].matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) if (owner[id[1]]) names.add(id[1]);
      }
      out[variant] = [...names].sort().map((name) => ({ name, section: owner[name] }));
    }
  }
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = analyze();
  const handlers = inlineHandlers(PAGES, a.owner);
  const result = { ...a, handlers };
  const jsonOut = args[args.indexOf('--json') + 1];
  if (args.includes('--json')) fs.writeFileSync(jsonOut, JSON.stringify(result, null, 2) + '\n');
  if (args.includes('--md')) {
    const out = args[args.indexOf('--md') + 1];
    const md = [];
    md.push('| Section | Lines | KB | Top-level names | Uses names from |');
    md.push('|---|---|---|---|---|');
    a.sections.forEach((s) => md.push(`| ${s.name} | ${s.firstLine}–${s.lastLine} | ${(s.bytes / 1024).toFixed(1)} | ${s.declares.length} | ${Object.entries(s.uses).map(([k, v]) => `${k} (${v.length})`).join(', ') || '—'} |`));
    fs.writeFileSync(out, md.join('\n') + '\n');
  }
  console.log(`${a.file}: ${a.lines} lines, ${(a.bytes / 1024).toFixed(1)} KB, ${Object.keys(a.owner).length} top-level names, ${a.duplicates.length} duplicates`);
  a.sections.forEach((s) => console.log(`  ${s.name.padEnd(26)} L${s.firstLine}–${s.lastLine}  ${(s.bytes / 1024).toFixed(1).padStart(6)} KB  ${String(s.declares.length).padStart(3)} names  → ${Object.entries(s.uses).map(([k, v]) => `${k}(${v.length})`).join(' ') || '—'}`));
  console.log(`load-time statements: ${a.loadTime.length}`);
}
