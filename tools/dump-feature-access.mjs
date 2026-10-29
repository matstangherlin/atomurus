#!/usr/bin/env node
// Prompt 34, baseline: every feature of netlify/lib/feature-catalog.mjs, the
// access it has today and where it is enforced — on the server (functions
// that call requireFeature or read access.features) and in the browser (the
// presentation gate of the calculator tabs and viewers, and scripts that read
// the session's features).
//
//   node tools/dump-feature-access.mjs          → write docs/product/acesso-antes.md
//   node tools/dump-feature-access.mjs --check  → exit 1 if the file is stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEATURES, LAB_TABS, PAGE_TOOLS } from '../netlify/lib/feature-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = path.join(ROOT, 'docs', 'product', 'acesso-antes.md');
// The catalog's own mirrors are not enforcement points: they are listed through LAB_TABS/PAGE_TOOLS.
const CATALOG_FILES = new Set(['assets/access-policy.js', 'assets/lab-tool-gate.js', 'netlify/lib/lab-tool-access.mjs']);

function walk(dir, exts, out = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'i18n', 'element-content', 'vendor'].includes(entry.name)) walk(rel, exts, out);
    } else if (exts.some((e) => entry.name.endsWith(e))) out.push(rel);
  }
  return out;
}

function serverUses() {
  const uses = {};
  for (const rel of walk('netlify/functions', ['.mjs', '.js']).sort()) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const name = path.basename(rel).replace(/\.m?js$/, '');
    for (const m of src.matchAll(/requireFeature\(\s*request\s*,\s*'(\w+)'/g)) (uses[m[1]] ||= new Set()).add(`${name} (requireFeature)`);
    for (const m of src.matchAll(/features\??\.(\w+)/g)) if (FEATURES[m[1]]) (uses[m[1]] ||= new Set()).add(`${name} (features)`);
  }
  return uses;
}

function clientUses() {
  const uses = {};
  const files = [...walk('assets', ['.js']), ...walk('src', ['.js']), ...walk('viewer', ['.js']),
    ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.js'))].filter((f) => !CATALOG_FILES.has(f)).sort();
  for (const rel of files) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const key of Object.keys(FEATURES)) {
      const re = new RegExp(`features\\??\\.${key}\\b|features\\[['"]${key}['"]\\]|(hasFeature|atomurusHasPremiumFeature)\\([^)]*['"]${key}['"]`);
      if (re.test(src)) (uses[key] ||= new Set()).add(rel);
    }
  }
  return uses;
}

export function collect() {
  const server = serverUses();
  const client = clientUses();
  const gate = {};
  for (const [tab, spec] of Object.entries(LAB_TABS)) if (spec.feature) (gate[spec.feature] ||= []).push(`aba «${tab}» da calculadora`);
  for (const [tool, spec] of Object.entries(PAGE_TOOLS)) (gate[spec.feature] ||= []).push(`página «${tool}»`);
  return Object.entries(FEATURES).map(([key, spec]) => ({
    key,
    category: spec.category,
    access: spec.access,
    server: [...(server[key] || [])].sort(),
    gate: gate[key] || [],
    client: [...(client[key] || [])].sort()
  }));
}

const cell = (list) => (list.length ? list.join('<br>') : '—');

export function render(rows = collect()) {
  const count = (a) => rows.filter((r) => r.access === a).length;
  const lines = [
    '# Acesso aos recursos — linha de base (prompt 34)',
    '',
    'Gerado por `node tools/dump-feature-access.mjs` a partir de `netlify/lib/feature-catalog.mjs`;',
    '`--check` falha se este arquivo ficar desatualizado. Estado **antes** de qualquer decisão do dono',
    'sobre o escopo gratuito (`docs/product/escopo-gratuito-e-plano-escolar.md`); o teste',
    '`tools/test-feature-access-snapshot.mjs` congela o mesmo estado (acesso efetivo por perfil).',
    '',
    `Recursos: ${rows.length} — \`public\` ${count('public')} · \`account\` ${count('account')} · \`pro\` ${count('pro')}.`,
    '',
    '- **Servidor:** funções em `netlify/functions/` que chamam `requireFeature(request, …)` (403',
    '  `feature_locked`) ou leem `access.features`. É o que de fato protege dados e cálculos.',
    '- **Portão do navegador:** `assets/lab-tool-gate.js` cobre a aba ou a página com o aviso «Conta» /',
    '  «PRO» (só apresentação), a partir de `LAB_TABS` e `PAGE_TOOLS` do catálogo.',
    '- **Outros scripts do navegador:** leem `user.features` da sessão (`/api/auth/me`) para mostrar ou',
    '  esconder a interface.',
    '',
    '| Recurso | Categoria | Acesso hoje | Servidor | Portão do navegador | Outros scripts do navegador |',
    '|---|---|---|---|---|---|',
    ...rows.map((r) => `| \`${r.key}\` | ${r.category} | \`${r.access}\` | ${cell(r.server)} | ${cell(r.gate)} | ${cell(r.client.map((f) => '`' + f + '`'))} |`),
    '',
    '## Abas da calculadora e páginas',
    '',
    '| Aba / página | Acesso | Recurso |',
    '|---|---|---|',
    ...Object.entries(LAB_TABS).map(([tab, s]) => `| aba \`${tab}\` | \`${s.access}\` | ${s.feature ? '`' + s.feature + '`' : '—'} |`),
    ...Object.entries(PAGE_TOOLS).map(([tool, s]) => `| página \`${tool}\` | \`${s.access}\` | \`${s.feature}\` |`),
    '',
    'Regras fixas fora do catálogo: `adsFree` acompanha o Pro (`featuresForAccess`) e `adminConsole` só',
    'existe para administradores. Os anúncios continuam desligados (prompt 04).',
    ''
  ];
  return lines.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const md = render();
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== md) {
      console.error('dump-feature-access: docs/product/acesso-antes.md is stale — run node tools/dump-feature-access.mjs');
      process.exit(1);
    }
    console.log(`dump-feature-access: ok (${Object.keys(FEATURES).length} features)`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, md);
    console.log('dump-feature-access: wrote docs/product/acesso-antes.md');
  }
}
