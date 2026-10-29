#!/usr/bin/env node
// Exercise bank (prompt 30): content/exercises/<type>.json → exercises/<type>.html
// and <type>.pt.html, ten exercises each with «Resposta» and «Solução
// comentada» folded away, a «new exercise» mode and an answer key printed only
// on request.
//
//   node tools/build-exercises.mjs           → validate, then write the pages
//   node tools/build-exercises.mjs --check   → exit 1 if a source is invalid or a page is missing, stale or extra
//
// The answers and the steps are never typed in the JSON: the engines
// (assets/calc-core.js) run here in a vm context, from the same files the
// browser loads, and assets/worked-steps.js puts their steps into words.
// Drafts are noindex and stay out of sitemap.xml until a teacher reviews them.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { finishDocPage, stamp } from './build-activity-sheets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SRC_DIR = path.join(ROOT, 'content', 'exercises');
export const OUT_DIR = path.join(ROOT, 'exercises');
const TEMPLATE = path.join(ROOT, 'templates', 'fichas', 'sheet.html');
export const TYPES = ['molar-mass', 'moles-mass', 'dilution', 'ph-strong'];
export const LEVELS = ['basico', 'medio', 'avancado'];
export const MIN_EXERCISES = 10;
export const ENGINE_FILES = ['assets/data/physical-constants.js', 'assets/calc-core.js', 'assets/chemistry/formula-parser.js', 'assets/worked-steps.js', 'assets/exercises.js'];

/* The engines in a sandbox, loaded exactly as the page loads them. */
export function engineContext() {
  const ctx = vm.createContext({ URL, URLSearchParams });
  for (const rel of ENGINE_FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  return ctx;
}

export function loadDefs() {
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  const unknown = files.filter((f) => !TYPES.includes(f));
  if (unknown.length) throw new Error('content/exercises: not in TYPES: ' + unknown.join(', '));
  return TYPES.map((t) => JSON.parse(fs.readFileSync(path.join(SRC_DIR, t + '.json'), 'utf8')));
}

const bilingual = (v) => v && typeof v.pt === 'string' && v.pt.trim() && typeof v.en === 'string' && v.en.trim();

/* Structural checks; then every exercise must solve. Returns the problems. */
export function validate(def, ctx = engineContext()) {
  const X = ctx.AtomurusExercises;
  const p = [];
  const where = (s) => `${def.id}: ${s}`;
  if (!TYPES.includes(def.id) || def.type !== def.id) p.push(where('id and type match the file name'));
  if (!['draft', 'published'].includes(def.status)) p.push(where('status is draft or published'));
  if (def.status === 'published' && !def.reviewedBy) p.push(where('published needs reviewedBy (teacher review)'));
  for (const field of ['title', 'summary']) if (!bilingual(def[field])) p.push(where(`${field} in PT and EN`));
  if (!def.tool || !bilingual(def.tool.label) || !Object.values(def.tool.href || {}).every((h) => /^\/[a-z]/.test(h))) p.push(where('tool: label PT/EN and internal links'));
  const templates = def.template && def.template['@by'] ? Object.entries(def.template).filter(([k]) => k !== '@by').map(([, v]) => v) : [def.template];
  if (!templates.length || !templates.every(bilingual)) p.push(where('template in PT and EN'));
  for (const t of templates) {
    if (!bilingual(t)) continue;
    const slots = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    if (slots(t.pt) !== slots(t.en)) p.push(where('template slots differ between PT and EN'));
  }
  if (!def.engine || !X.ENGINES.includes(String(def.engine.fn).replace(/^calc-core\./, ''))) p.push(where('engine.fn is a calc-core engine'));
  for (const e of def.commonErrors || []) {
    if (!X.WRONG[e.wrong]) p.push(where(`commonErrors.${e.id}: unknown wrong-value function ${e.wrong}`));
    if (!bilingual(e.message) || !e.message.pt.includes('{wrong}') || !e.message.en.includes('{wrong}')) p.push(where(`commonErrors.${e.id}: message PT/EN with {wrong}`));
  }
  const list = def.exercises || [];
  if (list.length < MIN_EXERCISES) p.push(where(`at least ${MIN_EXERCISES} exercises`));
  const ids = list.map((e) => e.id);
  if (new Set(ids).size !== ids.length) p.push(where('exercise ids are unique'));
  for (const ex of list) {
    if (!/^[A-Z]{2}\d{2}$/.test(ex.id)) p.push(where(`${ex.id}: id like MM01`));
    if (!LEVELS.includes(ex.level)) p.push(where(`${ex.id}: level ${ex.level}`));
    for (const lang of ['pt', 'en']) {
      let r;
      try { r = X.solve(def, ex.vars, lang); } catch (err) { r = { ok: false, code: err.message }; }
      if (!r.ok) { p.push(where(`${ex.id}: the engine does not solve it (${r.code})`)); continue; }
      if (!r.answer || /NaN|undefined|Infinity|∞/.test(r.answer + r.statement + JSON.stringify(r.steps))) p.push(where(`${ex.id} ${lang}: answer/steps without NaN`));
      if (/\{\w+\}/.test(r.statement)) p.push(where(`${ex.id} ${lang}: unfilled slot in «${r.statement}»`));
    }
  }
  return p;
}

// ── Pages ───────────────────────────────────────────────────────────────────
const L = {
  en: {
    htmlLang: 'en-US', other: 'pt', otherCode: 'PT', langTitle: 'Switch language', home: '→ home',
    kicker: 'Exercises', count: (n) => n + ' exercises', draft: 'Draft — under teacher review. Not published yet.',
    level: 'level', levels: { basico: 'basic', medio: 'intermediate', avancado: 'advanced' }, status: 'status', statusDraft: 'draft', statusPublished: 'published',
    intro: 'Solve them on paper first, then open «Answer» and «Worked solution» to check. Every answer and every step comes from the site\'s calculator.',
    printKey: 'Print with the answer key', exercises: 'Exercises', answer: 'Answer', solution: 'Worked solution',
    newTitle: 'New exercise', newBody: 'Draws another exercise of this kind. The address keeps it, so you can share the same exercise.',
    newBtn: 'Draw an exercise', newLink: 'Link to this exercise', key: 'Answer key',
    showSolution: 'Show worked solution', hideSolution: 'Hide the solution', failed: 'This exercise could not be drawn. Try again.',
    license: 'Licence: [licença: definir]', path: (id) => 'exercises / ' + id
  },
  pt: {
    htmlLang: 'pt-BR', other: 'en', otherCode: 'EN', langTitle: 'Trocar idioma', home: '→ início',
    kicker: 'Exercícios', count: (n) => n + ' exercícios', draft: 'Rascunho — em revisão docente. Ainda não publicado.',
    level: 'nível', levels: { basico: 'básico', medio: 'médio', avancado: 'avançado' }, status: 'situação', statusDraft: 'rascunho', statusPublished: 'publicado',
    intro: 'Resolva primeiro no papel; depois abra «Resposta» e «Solução comentada» para conferir. Cada resposta e cada passo vêm da calculadora do site.',
    printKey: 'Imprimir com o gabarito', exercises: 'Exercícios', answer: 'Resposta', solution: 'Solução comentada',
    newTitle: 'Novo exercício', newBody: 'Sorteia outro exercício do mesmo tipo. O endereço guarda o sorteio, para você compartilhar o mesmo exercício.',
    newBtn: 'Sortear um exercício', newLink: 'Link para este exercício', key: 'Gabarito',
    showSolution: 'Ver solução comentada', hideSolution: 'Esconder a solução', failed: 'Não foi possível sortear este exercício. Tente de novo.',
    license: 'Licença: [licença: definir]', path: (id) => 'exercícios / ' + id
  }
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function fileName(def, lang) {
  return def.id + (lang === 'pt' ? '.pt.html' : '.html');
}

/* Small on purpose: the list, the folded answers and the print rules. */
const PAGE_CSS = `<style>
.fx-draft{margin:14px 0 0;padding:8px 12px;max-width:640px;border:1px dashed var(--lc-amber,#B7791F);border-radius:8px;font-size:13px}
.ex-tools{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.ex-tools a.ui-btn-primary{color:var(--color-on-ink,#fff);text-decoration:none}
.ex-list{padding-left:22px}.ex-item{margin:0 0 18px}.ex-item p{margin:0 0 6px}
.ex-level{font-size:12px;color:var(--lc-ink-2,#58544A);white-space:nowrap}
.ex-item details,.ex-new details{margin:4px 0}.ex-item summary,.ex-new summary,.ex-key summary{cursor:pointer;font-weight:600;min-height:32px}
.ex-error{color:var(--lc-ink-2,#58544A);font-size:13px}.ex-new{margin-top:28px}
.fx-license{color:var(--lc-ink-2,#58544A);font-size:13px;margin-top:18px}
@media print{@page{size:A4;margin:14mm}
:root body :is(.lc-doc-aside,.ex-tools,.ex-new,.lc-statusbar,.lc-footer){display:none!important}
:root body .lc-doc-body{display:block!important;padding:0!important;background:none!important}
.ex-item{break-inside:avoid;margin:0 0 16mm}.ex-item details{display:none!important}
.ex-key{display:none}html.ex-print-key .ex-key{display:block;break-before:page}}
</style>`;

function heroHtml(def, lang) {
  const t = L[lang];
  return '<header class="lc-doc-hero">\n' +
    '  <div class="lc-doc-kicker">\n    <span>' + esc(t.kicker) + '</span>\n' +
    '    <span class="pill">' + esc(t.count(def.exercises.length)) + '</span>\n  </div>\n' +
    '  <h1 class="lc-doc-title">' + esc(def.title[lang]) + '</h1>\n' +
    '  <p class="lc-doc-desc">' + esc(def.summary[lang]) + '</p>\n' +
    (def.status === 'draft' ? '  <p class="fx-draft" role="note">' + esc(t.draft) + '</p>\n' : '') +
    '</header>\n';
}

function asideHtml(def, lang) {
  const t = L[lang];
  const byLevel = LEVELS.map((lv) => [lv, def.exercises.filter((e) => e.level === lv).length]).filter(([, n]) => n);
  return '  <aside class="lc-doc-aside">\n' +
    '    <div><span class="lbl">' + esc(t.level) + '</span><br><span class="v">' + esc(byLevel.map(([lv, n]) => t.levels[lv] + ' ' + n).join(' · ')) + '</span></div>\n    <hr>\n' +
    '    <div><span class="lbl">' + esc(t.status) + '</span><br><span class="v">' + esc(def.status === 'draft' ? t.statusDraft : t.statusPublished) + '</span></div>\n' +
    '  </aside>\n';
}

function stepsHtml(steps) {
  return '<ol class="wsol-steps">' + steps.map((s) =>
    '<li><span class="wsol-text">' + esc(s.text) + '</span> <span class="wsol-expr" translate="no">' + esc(s.expr) + '</span></li>').join('') + '</ol>';
}

export function pageContent(def, lang, ctx) {
  const t = L[lang];
  const X = ctx.AtomurusExercises;
  const solved = def.exercises.map((ex) => ({ ex, r: X.solve(def, ex.vars, lang) }));
  const items = solved.map(({ ex, r }) =>
    '  <li class="ex-item" id="' + esc(ex.id) + '"><p class="ex-statement">' + esc(r.statement) + ' <span class="ex-level">(' + esc(t.levels[ex.level]) + ')</span></p>\n' +
    '    <details class="ex-answer"><summary>' + esc(t.answer) + '</summary><p translate="no">' + esc(r.answer) + '</p></details>\n' +
    '    <details class="ex-solution"><summary>' + esc(t.solution) + '</summary>' + stepsHtml(r.steps) +
    r.errors.map((e) => '<p class="ex-error">' + esc(e) + '</p>').join('') + '</details>\n  </li>\n').join('');
  const key = solved.map(({ ex, r }) => '<li><span translate="no">' + esc(ex.id + ' · ' + r.answer) + '</span></li>').join('');
  return heroHtml(def, lang) +
    '<div class="lc-doc-body ui-root">\n' + asideHtml(def, lang) +
    '  <article class="lc-doc-prose ex-page">\n' +
    '<p>' + esc(t.intro) + '</p>\n' +
    '<p class="ex-tools"><a class="ui-btn ui-btn-primary" href="' + esc(def.tool.href[lang]) + '">' + esc(def.tool.label[lang]) + '</a>' +
    ' <label><input type="checkbox" data-ex-print-key> ' + esc(t.printKey) + '</label></p>\n' +
    '<h2>' + esc(t.exercises) + '</h2>\n<ol class="ex-list">\n' + items + '</ol>\n' +
    '<section class="ex-new" id="novo" data-ex-new-root aria-labelledby="ex-new-title">\n<h2 id="ex-new-title">' + esc(t.newTitle) + '</h2>\n' +
    '<p>' + esc(t.newBody) + '</p>\n' +
    '<p><button type="button" class="ui-btn ui-btn-secondary" data-ex-new>' + esc(t.newBtn) + '</button> <a data-ex-link hidden href="#novo">' + esc(t.newLink) + '</a></p>\n' +
    '<div data-ex-out aria-live="polite"></div>\n</section>\n' +
    '<details class="ex-key" id="gabarito"><summary>' + esc(t.key) + '</summary><ol>' + key + '</ol></details>\n' +
    '<p class="fx-license">' + esc(t.license) + '</p>\n' +
    '  </article>\n</div>\n' +
    // The definition the «new exercise» mode runs; JSON, not script.
    '<script type="application/json" id="ex-def">' + JSON.stringify({
      id: def.id, template: def.template, variables: def.variables, engine: def.engine, answer: def.answer, commonErrors: def.commonErrors,
      labels: { answer: t.answer, showSolution: t.showSolution, hideSolution: t.hideSolution, failed: t.failed }
    }).replace(/</g, '\\u003c') + '</script>';
}

const HEAD = (lang) => PAGE_CSS + '\n' +
  '<link rel="stylesheet" href="/assets/ui/worked-solution.css?v=0">\n' +
  ENGINE_FILES.map((f) => '<script src="/' + f + '?v=0" defer></script>').join('\n').replace('<script src="/assets/exercises.js', '<script src="/assets/worked-solution.js?v=0" defer></script>\n<script src="/assets/exercises.js');

export function renderPage(def, lang, template, version, ctx) {
  const t = L[lang];
  const name = fileName(def, lang);
  const robots = def.status !== 'published' ? 'noindex,nofollow' : 'index,follow';
  const fill = {
    dataPage: 'exercises',
    htmlLang: t.htmlLang,
    robots,
    title: esc(t.kicker + ': ' + def.title[lang] + ' | Atomurus'),
    description: esc(def.summary[lang]),
    headExtra: HEAD(lang),
    otherHref: fileName(def, t.other) + (t.other === 'pt' ? '?lang=pt-BR' : '?lang=en'),
    otherCode: t.otherCode,
    langTitle: t.langTitle,
    content: pageContent(def, lang, ctx),
    statusPath: esc(t.path(def.id)),
    homeLink: esc(t.home)
  };
  let html = template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in fill)) throw new Error('template slot without a value: ' + k);
    return fill[k];
  });
  html = finishDocPage(html, path.join(OUT_DIR, name), lang);
  return { name, html: html.replace(/\?v=\d+/g, '?v=' + version) };
}

export function renderAll(version = stamp()) {
  const ctx = engineContext();
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const defs = loadDefs();
  const problems = defs.flatMap((def) => validate(def, ctx));
  if (problems.length) throw new Error('build-exercises: ' + problems.join('; '));
  const pages = [];
  for (const def of defs) for (const lang of ['en', 'pt']) pages.push(renderPage(def, lang, template, version, ctx));
  return pages;
}

const unstamp = (s) => s.replace(/\?v=\d+/g, '?v=0');

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  let pages;
  try {
    pages = renderAll();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  if (process.argv.includes('--check')) {
    const problems = [];
    for (const page of pages) {
      const file = path.join(OUT_DIR, page.name);
      if (!fs.existsSync(file)) problems.push('missing ' + page.name);
      else if (unstamp(fs.readFileSync(file, 'utf8')) !== unstamp(page.html)) problems.push('stale ' + page.name);
    }
    const known = new Set(pages.map((p) => p.name));
    if (fs.existsSync(OUT_DIR)) {
      for (const f of fs.readdirSync(OUT_DIR)) if (!known.has(f)) problems.push('not generated: exercises/' + f);
    }
    if (problems.length) {
      console.error('build-exercises: ' + problems.join('; ') + ' — run node tools/build-exercises.mjs');
      process.exit(1);
    }
    console.log(`build-exercises: ok (${pages.length} pages)`);
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const page of pages) fs.writeFileSync(path.join(OUT_DIR, page.name), page.html);
    console.log(`build-exercises: wrote ${pages.length} pages to exercises/`);
  }
}
