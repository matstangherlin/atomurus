// Printable activity sheets with a commented answer key (prompt 28).
//
//   node tools/build-activity-sheets.mjs           → write fichas/<id>.html, <id>.pt.html,
//                                                    <id>-gabarito.html, <id>-gabarito.pt.html
//   node tools/build-activity-sheets.mjs --check   → exit 1 if a page is missing, stale or extra
//                                                    (?v= cache stamps are ignored)
//
// Sources: content/fichas/<id>.json. Every numeric answer is computed here by
// the engines the site itself runs: the calculator's formula parser and atomic
// weights (assets/chemistry/formula-parser.js), the pH engine
// (assets/calc-core.js), the periodic table data (elements-data.js) and the
// Lab simulation (assets/lab/virtual-lab.js). Nothing numeric is typed in the
// JSON, so if an engine changes the key follows it.
//
// The page shell is templates/fichas/sheet.html (the docs layout, absolute
// paths, no ad or consent scripts). The chrome injector is applied here, so
// tools/inject-ui-chrome.js leaves the pages as they are, and the PT chrome is
// baked with the same helpers as build-i18n.js. `npm run build` runs this last
// so the pages carry the build's cache stamp.
//
// While a sheet is `draft`: noindex,nofollow, a «Draft — under review» band,
// and no sitemap or menu entry. The answer key is always noindex,nofollow.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SRC_DIR = path.join(ROOT, 'content', 'fichas');
export const OUT_DIR = path.join(ROOT, 'fichas');
const TEMPLATE = path.join(ROOT, 'templates', 'fichas', 'sheet.html');

const formula = require('../assets/chemistry/formula-parser.js');
const calc = require('../assets/calc-core.js');
const build = require('../build-i18n.js');
const chrome = require('./inject-ui-chrome.js');

// ── Engines ─────────────────────────────────────────────────────────────────
let elementsCache = null;
export function loadElements() {
  if (elementsCache) return elementsCache;
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8') + ';this.__E = { ELEMENTS, _elNamesEN };', ctx);
  elementsCache = ctx.__E;
  return elementsCache;
}

let dictCache = null;
function dict() {
  if (!dictCache) dictCache = build.loadDict();
  return dictCache;
}

// Halves away from zero on the decimal value, not on its binary neighbour
// (18.015 → 18.02, as on paper).
export function round(n, d) {
  return Number(Math.round(Number(Number(n).toPrecision(12) + 'e' + d)) + 'e-' + d);
}

export function fmtNum(n, d, lang) {
  const s = round(n, d).toFixed(d);
  return lang === 'pt' ? s.replace('.', ',') : s;
}

function plain(n, lang) {
  const s = String(n);
  return lang === 'pt' ? s.replace('.', ',') : s;
}

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');

export function fmtSci(n, lang) {
  const exp = Math.floor(Math.log10(n) + 1e-9);
  const mant = round(n / Math.pow(10, exp), 1);
  return fmtNum(mant, 1, lang) + ' × 10' + sup(exp);
}

export function molarMass(text) {
  const parsed = formula.parseFormulaStrict(text);
  if (!parsed.ok) throw new Error('formula: ' + text);
  const terms = Object.keys(parsed.counts).map((sym) => {
    const w = formula.ATOMIC_WEIGHTS[sym];
    if (w == null) throw new Error('no atomic weight for ' + sym);
    return { sym, count: parsed.counts[sym], w };
  });
  return { total: terms.reduce((sum, t) => sum + t.w * t.count, 0), terms, display: formula.formatFormulaDisplay(text) };
}

function sumText(m, lang) {
  return m.terms.map((t) => (t.count > 1 ? t.count + ' × ' : '') + plain(t.w, lang)).join(' + ');
}

function categoryLabel(cat, lang) {
  const key = 'cat' + cat.charAt(0).toUpperCase() + cat.slice(1);
  const value = dict()[lang].ptable[key];
  if (!value) throw new Error('no label for category ' + cat);
  return value;
}

function joinSymbols(rows) {
  return rows.map((e) => e.sym).join(', ');
}

const ENGINES = {
  'formula.molarMass'(input, ans, lang) {
    const m = molarMass(input);
    const value = fmtNum(m.total, ans.decimals, lang) + ' g/mol';
    return { value, number: m.total, work: 'M(' + m.display + ') = ' + sumText(m, lang) + ' = ' + value };
  },
  'formula.moles'(input, ans, lang) {
    const m = molarMass(input.formula);
    const mm = fmtNum(m.total, 2, lang);
    const n = input.grams / round(m.total, 2);
    const value = fmtNum(n, ans.decimals, lang) + ' mol';
    return { value, number: n, work: 'n = m / M = ' + plain(input.grams, lang) + ' g ÷ ' + mm + ' g/mol = ' + value };
  },
  'formula.mass'(input, ans, lang) {
    const m = molarMass(input.formula);
    const mm = fmtNum(m.total, 2, lang);
    const g = input.moles * round(m.total, 2);
    const value = fmtNum(g, ans.decimals, lang) + ' g';
    return { value, number: g, work: 'm = n × M = ' + plain(input.moles, lang) + ' mol × ' + mm + ' g/mol = ' + value };
  },
  // Prompt 33 (F4): preparing and diluting a solution, through calc-core.
  'solution.amount'(input, ans, lang) {
    const n = input.C * (input.V / 1000);
    const value = fmtNum(n, ans.decimals, lang) + ' mol';
    return { value, number: n, work: 'n = C × V = ' + plain(input.C, lang) + ' mol/L × ' + plain(input.V / 1000, lang) + ' L = ' + value };
  },
  'solution.mass'(input, ans, lang) {
    const r = calc.computeSolutionMass(formula.parseFormulaStrict(input.formula).counts, formula.ATOMIC_WEIGHTS, { C: input.C, V: input.V });
    if (!r.ok) throw new Error('solution.mass ' + JSON.stringify(input));
    const value = fmtNum(r.mass, ans.decimals, lang) + ' g';
    return { value, number: r.mass, work: 'm = C × V × M = ' + plain(input.C, lang) + ' mol/L × ' + plain(r.L, lang) + ' L × ' + fmtNum(r.M, 2, lang) + ' g/mol = ' + value };
  },
  'calc.dilution'(input, ans, lang) {
    const r = calc.computeDilution(input);
    if (!r.ok) throw new Error('calc.dilution ' + JSON.stringify(input));
    const name = { C1: 'C₁', V1: 'V₁', C2: 'C₂', V2: 'V₂' };
    const value = fmtNum(r.value, ans.decimals, lang) + ' ' + r.unit;
    const known = ['C1', 'V1', 'C2', 'V2'].filter((k) => k !== input.solve).map((k) => name[k] + ' = ' + plain(input[k], lang)).join(', ');
    return { value, number: r.value, work: 'C₁V₁ = C₂V₂; ' + known + ' → ' + name[input.solve] + ' = ' + value };
  },
  'calc.pH'(input, ans, lang) {
    const r = calc.computePH({ mode: input.mode, value: input.value });
    if (!r.ok) throw new Error('calc.pH ' + JSON.stringify(input));
    const value = fmtNum(r.pH, ans.decimals, lang);
    const c = plain(input.value, lang);
    const work = input.mode === 'H'
      ? '[H⁺] = ' + c + ' mol/L → pH = −log ' + c + ' = ' + value
      : '[OH⁻] = ' + c + ' mol/L → pOH = −log ' + c + ' = ' + fmtNum(r.pOH, ans.decimals, lang) + ' → pH = 14 − ' + fmtNum(r.pOH, ans.decimals, lang) + ' = ' + value;
    return { value, number: r.pH, work };
  },
  'calc.H'(input, ans, lang) {
    const r = calc.computePH({ mode: 'pH', value: input.pH });
    const value = fmtSci(r.H, lang) + ' mol/L';
    return { value, number: r.H, work: '[H⁺] = 10' + sup(-input.pH) + ' mol/L' };
  },
  'calc.ratioH'(input, ans, lang) {
    const a = calc.computePH({ mode: 'pH', value: input.from }).H;
    const b = calc.computePH({ mode: 'pH', value: input.to }).H;
    const ratio = round(a / b, 0);
    const value = (lang === 'pt' ? ratio + ' vezes' : ratio + ' times');
    return { value, number: ratio, work: '10' + sup(-input.from) + ' ÷ 10' + sup(-input.to) + ' = 10' + sup(input.to - input.from) + ' = ' + ratio };
  },
  'elements.position'(input, ans, lang) {
    const e = loadElements().ELEMENTS.find((row) => row.sym === input.symbol);
    if (!e) throw new Error('no element ' + input.symbol);
    const value = lang === 'pt' ? 'grupo ' + e.group + ', período ' + e.period : 'group ' + e.group + ', period ' + e.period;
    return { value, number: [e.group, e.period] };
  },
  'elements.members'(input, ans, lang) {
    const rows = loadElements().ELEMENTS.filter((e) => e.cat === input.category).sort((a, b) => a.z - b.z);
    const groups = [...new Set(rows.map((e) => e.group))];
    let head = String(rows.length);
    if (input.withGroup) {
      head += groups.length === 1
        ? (lang === 'pt' ? ', no grupo ' + groups[0] : ', in group ' + groups[0])
        : (lang === 'pt' ? ', nos grupos ' + groups.join(', ') : ', in groups ' + groups.join(', '));
    }
    return { value: head + ': ' + joinSymbols(rows), symbols: joinSymbols(rows), number: rows.length };
  },
  'elements.identify'(input, ans, lang) {
    const { ELEMENTS, _elNamesEN } = loadElements();
    const e = ELEMENTS.find((row) => row.z === input.z);
    const name = lang === 'pt' ? e.name : _elNamesEN[e.z - 1];
    return { value: name + ' (' + e.sym + ') — ' + categoryLabel(e.cat, lang), number: e.z };
  },
  'elements.where'(input, ans, lang) {
    const rows = loadElements().ELEMENTS
      .filter((e) => e.period === input.period && input.categories.includes(e.cat))
      .sort((a, b) => a.z - b.z);
    return { value: rows.length + ': ' + joinSymbols(rows), symbols: joinSymbols(rows), number: rows.length };
  },
  'lab.phChallenge'(input, ans, lang) {
    const lab = require('../assets/lab/virtual-lab.js');
    const quiet = console.debug;
    console.debug = () => {};
    try {
      const guide = lab.CREATIONS.find((row) => row.id === 'ph');
      const acid = guide.tutorial.find((step) => step.id === 'acid').amounts;
      const base = guide.tutorial.find((step) => step.id === 'base').amounts;
      const session = lab.emptySession({ title: 'Activity sheet', mode: 'bench' });
      lab.startGuide(session, 'ph');
      const beaker = session.containers.find((row) => row.type === 'beaker');
      lab.addToContainer(session, beaker.id, 'water', acid.water);
      lab.addToContainer(session, beaker.id, 'citric_acid', acid.citric_acid);
      const before = lab.measure(session, beaker.id, 'ph').row.value;
      lab.addToContainer(session, beaker.id, 'bicarbonate', base.bicarbonate);
      const after = lab.measure(session, beaker.id, 'ph').row.value;
      const value = lang === 'pt'
        ? 'O pH sobe: de cerca de ' + fmtNum(before, 1, lang) + ' (só o ácido cítrico) para cerca de ' + fmtNum(after, 1, lang) + ' depois de ' + plain(base.bicarbonate, lang) + ' g de bicarbonato (simulação do Lab).'
        : 'The pH rises: from about ' + fmtNum(before, 1, lang) + ' (citric acid only) to about ' + fmtNum(after, 1, lang) + ' after ' + plain(base.bicarbonate, lang) + ' g of bicarbonate (Lab simulation).';
      return { value, number: [before, after] };
    } finally {
      console.debug = quiet;
    }
  }
};

export const ENGINE_NAMES = Object.keys(ENGINES);

export function answerFor(question, lang) {
  const ans = question.answer;
  if (ans.kind === 'text') return { value: ans.value[lang], source: ans.source ? ans.source[lang] : '' };
  if (ans.kind !== 'computed' || !ENGINES[ans.engine]) throw new Error(question.id + ': unknown answer ' + JSON.stringify(ans));
  return ENGINES[ans.engine](ans.input, ans, lang);
}

// ── Pages ───────────────────────────────────────────────────────────────────
const L = {
  en: {
    htmlLang: 'en-US', other: 'pt', otherCode: 'PT', langTitle: 'Switch language', home: '→ home',
    sheet: 'Activity sheet', key: 'Answer key', keyTitle: 'answer key', minutes: 'min',
    keyDesc: 'For the teacher. Do not hand it out before the activity.',
    draft: 'Draft — under teacher review. Not published yet.',
    duration: 'duration', level: 'level', status: 'status', statusDraft: 'draft', statusPublished: 'published',
    name: 'Name', klass: 'Class', date: 'Date',
    objectives: 'Objectives', questions: 'Questions', materials: 'Materials', plan: 'Lesson plan',
    answer: 'Answer', answers: 'Answers', working: 'Working', source: 'Source', errors: 'Common errors', notes: 'Notes for the teacher',
    points: (n) => (n === 1 ? '1 pt' : n + ' pts'), toSheet: '→ Student sheet', toKey: '→ Answer key',
    license: 'Licence: [licença: definir]', path: (id, key) => 'sheets / ' + id + (key ? ' / answer key' : '')
  },
  pt: {
    htmlLang: 'pt-BR', other: 'en', otherCode: 'EN', langTitle: 'Trocar idioma', home: '→ início',
    sheet: 'Ficha de atividade', key: 'Gabarito comentado', keyTitle: 'gabarito', minutes: 'min',
    keyDesc: 'Para o professor. Não distribua aos alunos antes da atividade.',
    draft: 'Rascunho — em revisão docente. Ainda não publicado.',
    duration: 'duração', level: 'nível', status: 'situação', statusDraft: 'rascunho', statusPublished: 'publicada',
    name: 'Nome', klass: 'Turma', date: 'Data',
    objectives: 'Objetivos', questions: 'Questões', materials: 'Material', plan: 'Plano da aula',
    answer: 'Resposta', answers: 'Respostas', working: 'Cálculo', source: 'Fonte', errors: 'Erros comuns', notes: 'Notas para o professor',
    points: (n) => (n === 1 ? '1 ponto' : n + ' pontos'), toSheet: '→ Ficha do aluno', toKey: '→ Gabarito',
    license: 'Licença: [licença: definir]', path: (id, key) => 'fichas / ' + id + (key ? ' / gabarito' : '')
  }
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function fileName(sheet, lang, key) {
  return sheet.id + (key ? '-gabarito' : '') + (lang === 'pt' ? '.pt.html' : '.html');
}

/* Kept small (prompt: ≤ 2 KB): answer lines, the draft band and A4 print. */
const SHEET_CSS = `<style>
.fx-draft{margin:14px 0 0;padding:8px 12px;max-width:640px;border:1px dashed var(--lc-amber,#B7791F);border-radius:8px;font-size:13px}
.fx-fields{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin:0 0 14px}
.fx-fields span{border-bottom:1px solid var(--lc-ink-3,#8E8978);padding:14px 0 2px;font-size:12px}
.fx-questions{padding-left:20px}.fx-q{margin:0 0 12px;break-inside:avoid}.fx-q p{margin:0 0 4px}
.fx-pts{font-size:12px;color:var(--lc-ink-2,#58544A);white-space:nowrap}
.fx-lines{height:calc(var(--n,1)*26px);background:repeating-linear-gradient(transparent 0 25px,var(--lc-ink-3,#8E8978) 25px 26px)}
.fx-work{font-family:var(--lc-mono,monospace);font-size:.9em;color:var(--lc-ink-2,#58544A)}
.fx-note,.fx-license{color:var(--lc-ink-2,#58544A);font-size:13px}.fx-license{margin-top:18px}
.fx-tools{display:flex;flex-wrap:wrap;gap:8px}.fx-tools a.ui-btn-primary{color:var(--color-on-ink,#fff);text-decoration:none}
@media print{@page{size:A4;margin:12mm}
:root body :is(.lc-doc-aside,.fx-tools,.lc-statusbar,.lc-footer){display:none!important}
:root body .lc-doc-body{display:block!important;padding:0!important;background:none!important}
:root body .lc-doc-hero{padding:0!important;margin:0 0 3mm!important}
body{font-size:10pt}.fx-key{font-size:9pt}.lc-doc-title{font-size:18pt!important;margin:0!important}.lc-doc-desc{font-size:9.5pt!important;margin:1mm 0 0!important}
:root body .lc-doc-prose :is(h2,ol,ul){margin-top:2mm!important;margin-bottom:1mm!important}:root body .lc-doc-prose h2{font-size:12pt!important}
:root body .lc-doc-prose :is(li,p){margin-top:0!important;margin-bottom:1mm!important;line-height:1.3!important}
.fx-draft{margin:2mm 0 0;padding:1.5mm 3mm}.fx-fields span{padding-top:3mm}.fx-q{margin:0 0 2mm!important}
.fx-pair{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.fx-lines{height:calc(var(--n,1)*8mm);background:repeating-linear-gradient(#fff 0 calc(8mm - 1px),#777 calc(8mm - 1px) 8mm);-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>`;

function heroHtml(sheet, lang, key) {
  const t = L[lang];
  return '<header class="lc-doc-hero">\n' +
    '  <div class="lc-doc-kicker">\n    <span>' + esc((key ? t.key : t.sheet) + ' · ' + sheet.id) + '</span>\n' +
    '    <span class="pill">' + esc(sheet.minutes + ' ' + t.minutes) + '</span>\n  </div>\n' +
    '  <h1 class="lc-doc-title">' + esc(sheet.title[lang] + (key ? ' — ' + t.keyTitle : '')) + '</h1>\n' +
    '  <p class="lc-doc-desc">' + esc(key ? t.keyDesc : sheet.summary[lang]) + '</p>\n' +
    (sheet.status === 'draft' ? '  <p class="fx-draft" role="note">' + esc(t.draft) + '</p>\n' : '') +
    '</header>\n';
}

function asideHtml(sheet, lang, key) {
  const t = L[lang];
  const link = key
    ? '<a href="' + esc(fileName(sheet, lang, false)) + '" style="text-transform:none;letter-spacing:.04em">' + esc(t.toSheet) + '</a>\n'
    : '';
  return '  <aside class="lc-doc-aside">\n' +
    '    <div><span class="lbl">' + esc(t.duration) + '</span><br><span class="v">' + esc(sheet.minutes + ' ' + t.minutes) + '</span></div>\n    <hr>\n' +
    '    <div><span class="lbl">' + esc(t.level) + '</span><br><span class="v">' + esc(sheet.level[lang]) + '</span></div>\n    <hr>\n' +
    '    <div><span class="lbl">' + esc(t.status) + '</span><br><span class="v">' + esc(sheet.status === 'draft' ? t.statusDraft : t.statusPublished) + '</span></div>\n' +
    (link ? '    <hr>\n    ' + link : '') +
    '  </aside>\n';
}

function toolsHtml(sheet, lang) {
  const tools = [sheet.tool, sheet.tool2].filter(Boolean);
  return '<p class="fx-tools">' + tools.map((tool) =>
    '<a class="ui-btn ui-btn-primary" href="' + esc(tool.href[lang]) + '">' + esc(tool.label[lang]) + '</a>'
  ).join(' ') + '</p>\n';
}

// Element symbols and formulas are not words of either language.
function valueHtml(a) {
  if (!a.symbols || !a.value.endsWith(a.symbols)) return esc(a.value);
  return esc(a.value.slice(0, a.value.length - a.symbols.length)) + '<span translate="no">' + esc(a.symbols) + '</span>';
}

function list(items) {
  return '<ul>\n' + items.map((item) => '  <li>' + esc(item) + '</li>\n').join('') + '</ul>\n';
}

export function studentContent(sheet, lang) {
  const t = L[lang];
  const questions = sheet.questions.map((q) =>
    '  <li class="fx-q"><p>' + esc(q.prompt[lang]) + ' <span class="fx-pts">(' + esc(t.points(q.points)) + ')</span></p>' +
    '<div class="fx-lines" style="--n:' + (Number(q.lines) || 1) + '" aria-hidden="true"></div></li>\n'
  ).join('');
  return heroHtml(sheet, lang, false) +
    '<div class="lc-doc-body ui-root">\n' + asideHtml(sheet, lang, false) +
    '  <article class="lc-doc-prose fx-sheet">\n' +
    '<p class="fx-fields"><span>' + esc(t.name) + ':</span><span>' + esc(t.klass) + ':</span><span>' + esc(t.date) + ':</span></p>\n' +
    '<h2>' + esc(t.objectives) + '</h2>\n' + list(sheet.objectives[lang]) +
    toolsHtml(sheet, lang) +
    '<h2>' + esc(t.questions) + '</h2>\n<ol class="fx-questions">\n' + questions + '</ol>\n' +
    '<p class="fx-license">' + esc(t.license) + '</p>\n' +
    '  </article>\n</div>';
}

export function keyContent(sheet, lang) {
  const t = L[lang];
  const steps = sheet.steps.map((s) => '  <li>' + esc(s.minutes + ' ' + t.minutes + ' — ' + s[lang]) + '</li>\n').join('');
  const answers = sheet.questions.map((q) => {
    const a = answerFor(q, lang);
    return '  <li class="fx-q"><p>' + esc(q.prompt[lang]) + ' <span class="fx-pts">(' + esc(t.points(q.points)) + ')</span></p>\n' +
      '    <p class="fx-answer"><strong>' + esc(t.answer) + ':</strong> ' + valueHtml(a) +
      (a.work ? ' · <span class="fx-work" translate="no">' + esc(a.work) + '</span>' : '') + '</p>\n' +
      (q.comment ? '    <p class="fx-note">' + esc(q.comment[lang]) + '</p>\n' : '') +
      (a.source ? '    <p class="fx-note">' + esc(t.source + ': ' + a.source) + '</p>\n' : '') +
      '  </li>\n';
  }).join('');
  return heroHtml(sheet, lang, true) +
    '<div class="lc-doc-body ui-root">\n' + asideHtml(sheet, lang, true) +
    '  <article class="lc-doc-prose fx-key">\n' +
    '<div class="fx-pair">\n<section><h2>' + esc(t.plan + ' (' + sheet.minutes + ' ' + t.minutes + ')') + '</h2>\n<ol>\n' + steps + '</ol></section>\n' +
    '<section><h2>' + esc(t.materials) + '</h2>\n' + list(sheet.materials[lang]) + '</section>\n</div>\n' +
    '<h2>' + esc(t.answers) + '</h2>\n<ol class="fx-questions">\n' + answers + '</ol>\n' +
    '<div class="fx-pair">\n<section><h2>' + esc(t.errors) + '</h2>\n' + list(sheet.commonErrors.map((row) => row[lang])) + '</section>\n' +
    '<section><h2>' + esc(t.notes) + '</h2>\n<p>' + esc(sheet.teacherNotes[lang]) + '</p></section>\n</div>\n' +
    '<p class="fx-license">' + esc(t.license) + '</p>\n' +
    '  </article>\n</div>';
}

export function stamp() {
  const m = /\?v=(\d+)/.exec(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  return m ? m[1] : '0';
}

export function renderPage(sheet, lang, key, template, version) {
  const t = L[lang];
  const name = fileName(sheet, lang, key);
  const twin = fileName(sheet, t.other, key) + (t.other === 'pt' ? '?lang=pt-BR' : '?lang=en');
  const title = sheet.title[lang] + ' — ' + (key ? t.key : t.sheet) + ' ' + sheet.id + ' | Atomurus';
  const robots = key || sheet.status !== 'published' ? 'noindex,nofollow' : 'index,follow';
  const fill = {
    dataPage: 'activity-sheet',
    htmlLang: t.htmlLang,
    robots,
    title: esc(title),
    description: esc(key ? t.keyDesc : sheet.summary[lang]),
    headExtra: SHEET_CSS,
    otherHref: twin,
    otherCode: t.otherCode,
    langTitle: t.langTitle,
    content: key ? keyContent(sheet, lang) : studentContent(sheet, lang),
    statusPath: esc(t.path(sheet.id, key)),
    homeLink: esc(t.home)
  };
  let html = template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in fill)) throw new Error('template slot without a value: ' + k);
    return fill[k];
  });
  html = finishDocPage(html, path.join(OUT_DIR, name), lang);
  return { name, html: html.replace(/\?v=\d+/g, '?v=' + version) };
}

/* The site chrome (build-time injection) and, for PT, the baked dictionary:
   shared with tools/build-exercises.mjs. */
export function finishDocPage(html, abs, lang) {
  html = chrome.injectHtml(html, abs).html;
  html = chrome.applyA11yChrome(html, abs);
  if (lang === 'pt') {
    const d = dict();
    html = build.bakeDataI18nText(html, 'pt', d);
    html = build.bakeDataI18nHtml(html, 'pt', d);
    html = build.bakeDataI18nAttrs(html, 'pt', d);
    html = build.bakeSkipLink(html, 'pt', d);
    // The injected account chip names itself in English; i18n.js renames it
    // once it runs, this gives the static page the same name.
    html = html.replace(/(<a\b[^>]*\bdata-atomurus-account-chip\b[^>]*\saria-label=")[^"]*(")/, (m, a, b) => a + esc(d.pt.common.auth.createAccount) + b);
  }
  return html;
}

export function loadSheets() {
  return fs.readdirSync(SRC_DIR).filter((f) => /^F\d+\.json$/.test(f)).sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(SRC_DIR, f), 'utf8')));
}

export function renderAll(version = stamp()) {
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const pages = [];
  for (const sheet of loadSheets()) {
    for (const lang of ['en', 'pt']) {
      for (const key of [false, true]) pages.push(renderPage(sheet, lang, key, template, version));
    }
  }
  return pages;
}

const unstamp = (s) => s.replace(/\?v=\d+/g, '?v=0');

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const pages = renderAll();
  if (process.argv.includes('--check')) {
    const problems = [];
    for (const page of pages) {
      const file = path.join(OUT_DIR, page.name);
      if (!fs.existsSync(file)) problems.push('missing ' + page.name);
      else if (unstamp(fs.readFileSync(file, 'utf8')) !== unstamp(page.html)) problems.push('stale ' + page.name);
    }
    const known = new Set(pages.map((p) => p.name));
    if (fs.existsSync(OUT_DIR)) {
      for (const f of fs.readdirSync(OUT_DIR)) if (!known.has(f)) problems.push('not generated: fichas/' + f);
    }
    if (problems.length) {
      console.error('build-activity-sheets: ' + problems.join('; ') + ' — run node tools/build-activity-sheets.mjs');
      process.exit(1);
    }
    console.log(`build-activity-sheets: ok (${pages.length} pages)`);
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const page of pages) fs.writeFileSync(path.join(OUT_DIR, page.name), page.html);
    console.log(`build-activity-sheets: wrote ${pages.length} pages to fichas/`);
  }
}
