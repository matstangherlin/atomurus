// Static accessibility checks over the published HTML. No dependencies.
//
//   node tools/a11y-static.mjs                    → summary on stdout
//   node tools/a11y-static.mjs --report <file.md> → also write a Markdown report
//   node tools/a11y-static.mjs --strict           → exit 1 on any failure
//   node tools/a11y-static.mjs --root <dir>       (used by the tests)
//
// Checks (prompt 23, M09):
//   fields   every <select>, <textarea> and <input> (not hidden/submit/button/
//            reset/image) has a name: aria-label, aria-labelledby to an existing
//            id, <label for>, or a wrapping <label>. title alone counts, but is
//            listed as a last resort.
//   name     a button with both aria-label and visible text has an aria-label
//            that contains the visible text (WCAG 2.5.3 label in name). Links with
//            the same problem are counted apart (linkName) and reported, not failed.
//   skip     a page with <main> starts its body with a skip link to an id that exists.
//   dialog   role="dialog" has aria-label, or aria-labelledby to an id that exists
//            and is not empty in the markup (or an aria-label as well).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const at = args.indexOf(name);
  return at !== -1 ? args[at + 1] : fallback;
};

export const SKIP_DIRS = new Set([
  'node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase',
  'hanzi-logic', 'propostas', 'dev', 'docs', 'templates', 'src', 'dist',
  'e2e', 'test-results', 'playwright-report'
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function attr(attrs, name) {
  const m = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(attrs);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? '';
}

function decode(text) {
  return String(text)
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&mdash;/g, '—').replace(/&ndash;/g, '–');
}

export function normalize(text) {
  return decode(text).toLowerCase().replace(/\s+/g, ' ').trim();
}

function strip(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<template\b[\s\S]*?<\/template\s*>/gi, '');
}

function visibleText(inner) {
  const noHidden = inner
    .replace(/<([a-z0-9-]+)\b[^>]*\b(?:aria-hidden=["']true["']|hidden\b|class=["'][^"']*\b(?:sr-only|lc-sr-only|visually-hidden)\b[^"']*["'])[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
  return normalize(noHidden.replace(/<[^>]+>/g, ' '));
}

export function checkPage(html) {
  const clean = strip(html);
  const ids = new Set([...clean.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
  const labelsFor = new Set([...clean.matchAll(/<label\b[^>]*\sfor\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
  const result = { fields: [], titleOnly: [], name: [], linkName: [], skip: null, dialogs: [], hasMain: /<main\b/i.test(clean) };

  // Controls inside a <label>…</label> are named by it.
  const wrapped = [];
  for (const m of clean.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)) wrapped.push([m.index, m.index + m[0].length]);
  const inLabel = (pos) => wrapped.some(([a, b]) => pos > a && pos < b);

  for (const m of clean.matchAll(/<(select|textarea|input)\b([^>]*)>/gi)) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    const type = (attr(attrs, 'type') || '').toLowerCase();
    if (tag === 'input' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
    const id = attr(attrs, 'id');
    const label = attr(attrs, 'aria-label');
    const labelledby = attr(attrs, 'aria-labelledby');
    const named = (label && label.trim()) ||
      (labelledby && labelledby.split(/\s+/).every((ref) => ids.has(ref))) ||
      (id && labelsFor.has(id)) ||
      inLabel(m.index);
    if (named) continue;
    const ref = tag + (id ? '#' + id : '') + (type ? '[type=' + type + ']' : '');
    if ((attr(attrs, 'title') || '').trim()) result.titleOnly.push(ref);
    else result.fields.push(ref);
  }

  for (const m of clean.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const label = attr(m[2], 'aria-label');
    if (!label) continue;
    const text = visibleText(m[3]);
    if (!text || text.length < 2) continue;
    if (normalize(label).includes(text)) continue;
    (m[1].toLowerCase() === 'button' ? result.name : result.linkName).push({ label: decode(label), text });
  }

  const body = /<body\b[^>]*>([\s\S]*)$/i.exec(clean);
  if (body) {
    const first = /<(a|button|input|select|textarea)\b([^>]*)>([\s\S]*?)(?:<\/\1>)?/i.exec(body[1]);
    const href = first && first[1].toLowerCase() === 'a' ? attr(first[2], 'href') : null;
    const isSkip = Boolean(href && href.startsWith('#') && /skip/i.test((attr(first[2], 'class') || '') + ' ' + (attr(first[2], 'id') || '')));
    result.skip = { ok: Boolean(isSkip && ids.has(href.slice(1))), href: href || '' };
  }

  for (const m of clean.matchAll(/<([a-z0-9-]+)\b([^>]*\srole\s*=\s*["'](?:dialog|alertdialog)["'][^>]*)>/gi)) {
    const attrs = m[2];
    const label = (attr(attrs, 'aria-label') || '').trim();
    const labelledby = attr(attrs, 'aria-labelledby');
    let ok = Boolean(label);
    let why = ok ? '' : 'no aria-label';
    if (!ok && labelledby) {
      const refs = labelledby.split(/\s+/);
      const missing = refs.filter((ref) => !ids.has(ref));
      if (missing.length) why = 'aria-labelledby → missing #' + missing.join(', #');
      else {
        const empty = refs.filter((ref) => {
          const target = new RegExp('<([a-z0-9-]+)\\b[^>]*\\sid\\s*=\\s*["\']' + ref.replace(/[-]/g, '\\-') + '["\'][^>]*>([\\s\\S]*?)<\\/\\1>', 'i').exec(clean);
          return !target || !visibleText(target[2]);
        });
        ok = !empty.length;
        why = ok ? '' : 'aria-labelledby → #' + empty.join(', #') + ' is empty until script fills it';
      }
    }
    result.dialogs.push({ id: attr(attrs, 'id') || m[1], ok, why });
  }
  return result;
}

export function audit(root) {
  const pages = walk(root).map((file) => {
    const rel = path.relative(root, file).split(path.sep).join('/');
    return { rel, ...checkPage(fs.readFileSync(file, 'utf8')) };
  });
  const sum = (fn) => pages.reduce((a, p) => a + fn(p), 0);
  return {
    pages,
    totals: {
      pages: pages.length,
      fields: sum((p) => p.fields.length),
      fieldPages: pages.filter((p) => p.fields.length).length,
      titleOnly: sum((p) => p.titleOnly.length),
      name: sum((p) => p.name.length),
      namePages: pages.filter((p) => p.name.length).length,
      linkName: sum((p) => p.linkName.length),
      withMain: pages.filter((p) => p.hasMain).length,
      skipMissing: pages.filter((p) => p.hasMain && !(p.skip && p.skip.ok)).length,
      dialogs: sum((p) => p.dialogs.length),
      dialogsBad: sum((p) => p.dialogs.filter((d) => !d.ok).length)
    }
  };
}

function report(result) {
  const t = result.totals;
  const lines = [];
  lines.push('| Check | Result |');
  lines.push('|---|---|');
  lines.push(`| Pages checked | ${t.pages} |`);
  lines.push(`| Form fields without a name | ${t.fields} on ${t.fieldPages} pages |`);
  lines.push(`| Fields named only by \`title\` | ${t.titleOnly} |`);
  lines.push(`| Buttons whose \`aria-label\` does not contain the visible text | ${t.name} on ${t.namePages} pages |`);
  lines.push(`| Links with the same mismatch (reported, not failed) | ${t.linkName} |`);
  lines.push(`| Pages with \`<main>\` and no skip link | ${t.skipMissing} of ${t.withMain} |`);
  lines.push(`| \`role="dialog"\` without a usable name | ${t.dialogsBad} of ${t.dialogs} |`);
  lines.push('');
  const focus = result.pages.filter((p) => /^calculators(\.pt)?\.html$|^periodic-table(\.pt)?\.html$/.test(p.rel));
  focus.forEach((p) => {
    lines.push(`### ${p.rel}`);
    lines.push('');
    lines.push(`- Fields without a name: ${p.fields.length ? p.fields.map((f) => '`' + f + '`').join(', ') : '0'}`);
    lines.push(`- Named by \`title\` only: ${p.titleOnly.length ? p.titleOnly.map((f) => '`' + f + '`').join(', ') : '0'}`);
    lines.push(`- Name ≠ visible text: ${p.name.length ? p.name.map((n) => '«' + n.label + '» vs «' + n.text + '»').join('; ') : '0'}`);
    lines.push(`- Skip link: ${p.skip && p.skip.ok ? 'yes (' + p.skip.href + ')' : 'no'}`);
    lines.push(`- Dialogs: ${p.dialogs.length ? p.dialogs.map((d) => '#' + d.id + (d.ok ? ' ok' : ' — ' + d.why)).join('; ') : 'none'}`);
    lines.push('');
  });
  const mismatch = new Map();
  result.pages.forEach((p) => p.name.concat(p.linkName).forEach((n) => {
    const key = n.label + ' | ' + n.text;
    mismatch.set(key, (mismatch.get(key) || 0) + 1);
  }));
  if (mismatch.size) {
    lines.push('### Name ≠ visible text, all pages');
    lines.push('');
    lines.push('| aria-label | Visible text | Pages |');
    lines.push('|---|---|---|');
    [...mismatch.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([key, n]) => {
      const [label, text] = key.split(' | ');
      lines.push(`| ${label} | ${text} | ${n} |`);
    });
    lines.push('');
  }
  const noSkip = result.pages.filter((p) => p.hasMain && !(p.skip && p.skip.ok)).map((p) => p.rel);
  lines.push(`Pages with \`<main>\` and no skip link: ${noSkip.length}${noSkip.length ? ' (first 10: ' + noSkip.slice(0, 10).join(', ') + ')' : ''}.`);
  lines.push('');
  return lines.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(arg('--root', path.join(HERE, '..')));
  const result = audit(root);
  const t = result.totals;
  console.log(`a11y-static: ${t.pages} pages · fields without name ${t.fields} · title-only ${t.titleOnly} · button name≠text ${t.name} · link name≠text ${t.linkName} · no skip link ${t.skipMissing}/${t.withMain} · dialogs without name ${t.dialogsBad}/${t.dialogs}`);
  const out = arg('--report', '');
  if (out) {
    const title = arg('--title', 'Acessibilidade — checagem estática');
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, `# ${title}\n\nGerado por \`node tools/a11y-static.mjs\` (sem dependências).\n\n` + report(result));
  }
  const failing = t.fields + t.name + t.skipMissing + t.dialogsBad;
  if (args.includes('--strict') && failing) {
    console.error('a11y-static: failing checks (see --report for detail)');
    process.exit(1);
  }
}
