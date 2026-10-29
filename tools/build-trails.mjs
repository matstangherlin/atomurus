#!/usr/bin/env node
// Trails (prompt 32): a guided sequence of the site's own pages — article →
// tool → exercises → Lab → sheet — as data, with progress kept only in the
// browser.
//
//   node tools/build-trails.mjs           → write trilhas/<id>(.pt).html, assets/trail-chip.js
//                                           and the worked examples of the draft articles
//   node tools/build-trails.mjs --check   → exit 1 if a source is invalid or anything is stale
//
// content/trilhas/<id>.json: id, status, level, minutes, title/summary {pt,en},
// steps[] { id, type, title {pt,en}, href {pt,en}, estMinutes, optional?, pro?,
// requires? }, review { recap, questions }. Every href must be a page or a
// known route of the site. The worked examples in the draft articles sit
// between <!-- calc:id --> markers and are computed here by calc-core (in a
// vm, the same files the browser loads), never typed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { finishDocPage, stamp } from './build-activity-sheets.mjs';
import { engineContext } from './build-exercises.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SRC_DIR = path.join(ROOT, 'content', 'trilhas');
export const OUT_DIR = path.join(ROOT, 'trilhas');
export const CHIP_FILE = path.join(ROOT, 'assets', 'trail-chip.js');
const TEMPLATE = path.join(ROOT, 'templates', 'fichas', 'sheet.html');
export const STEP_TYPES = ['article', 'tool', 'exercises', 'lab', 'sheet', 'review'];
export const LEVELS = ['basico', 'medio', 'avancado'];
export const DRAFT_ARTICLES = ['explore/what-is-the-mole', 'explore/conservation-of-mass', 'explore/solutions-and-concentration', 'explore/acids-bases-and-ph', 'explore/chemical-equilibrium'];
const ROUTES = { '/': 'index.html', '/app': 'app.html', '/account': 'account.html', '/pricing': 'pricing.html' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const bilingual = (v) => v && typeof v.pt === 'string' && v.pt.trim() && typeof v.en === 'string' && v.en.trim();

/* A link inside the site: the file it lands on, or null. */
export function hrefTarget(href) {
  if (/^#[a-z0-9-]+$/.test(href)) return '#';
  if (!/^\/[^/]/.test(href) && href !== '/') return null;
  const pathname = href.split(/[?#]/)[0];
  const file = ROUTES[pathname] || pathname.replace(/^\//, '');
  return fs.existsSync(path.join(ROOT, file)) ? file : null;
}

export function loadTrails() {
  return fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.json')).sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(SRC_DIR, f), 'utf8')));
}

export function validate(trail) {
  const p = [];
  const where = (s) => `${trail.id}: ${s}`;
  if (!/^[a-z][a-z0-9-]*$/.test(trail.id || '')) p.push(where('id'));
  if (!['draft', 'published'].includes(trail.status)) p.push(where('status is draft or published'));
  if (trail.status === 'published' && !trail.reviewedBy) p.push(where('published needs reviewedBy'));
  if (!LEVELS.includes(trail.level)) p.push(where('level'));
  for (const f of ['title', 'summary']) if (!bilingual(trail[f])) p.push(where(`${f} in PT and EN`));
  const steps = trail.steps || [];
  const main = steps.filter((s) => !s.optional);
  if (main.length < 6 || main.length > 8) p.push(where(`6 to 8 main steps (has ${main.length})`));
  const ids = steps.map((s) => s.id);
  if (new Set(ids).size !== ids.length) p.push(where('step ids are unique'));
  for (const s of steps) {
    if (!STEP_TYPES.includes(s.type)) p.push(where(`${s.id}: type ${s.type}`));
    if (!bilingual(s.title)) p.push(where(`${s.id}: title PT/EN`));
    if (!(s.estMinutes > 0)) p.push(where(`${s.id}: estMinutes`));
    for (const lang of ['pt', 'en']) if (!s.href || !hrefTarget(s.href[lang])) p.push(where(`${s.id}: ${lang} link ${s.href && s.href[lang]} does not exist`));
    for (const r of s.requires || []) if (!ids.includes(r) || ids.indexOf(r) >= ids.indexOf(s.id)) p.push(where(`${s.id}: requires an earlier step (${r})`));
    if (s.pro && !s.optional) p.push(where(`${s.id}: a Pro step can only be an optional extra`));
  }
  const sum = main.reduce((t, s) => t + s.estMinutes, 0);
  if (sum !== trail.minutes) p.push(where(`minutes (${trail.minutes}) = sum of the main steps (${sum})`));
  const r = trail.review || {};
  if (!r.recap || !r.recap.pt || r.recap.pt.length !== (r.recap.en || []).length || r.recap.pt.length < 3) p.push(where('review recap: PT/EN, ≥ 3 items'));
  if (!r.questions || r.questions.length !== 5) p.push(where('review: 5 self-check questions'));
  for (const q of r.questions || []) {
    if (q.kind === 'computed' ? !CALC[q.calc] : !(bilingual(q.prompt) && bilingual(q.answer))) p.push(where(`review ${q.id}`));
  }
  return p;
}

// ── Worked examples, computed by the engines ────────────────────────────────
let ctxCache = null;
function ctx() {
  if (!ctxCache) {
    ctxCache = engineContext();
  }
  return ctxCache;
}
function E() {
  const c = ctx();
  return { calc: c.AtomurusCalcCore, words: c.AtomurusWorkedSteps, formula: c.AtomurusFormula, N_A: c.AtomurusConstants.N_A };
}
const counts = (f) => E().formula.parseFormulaStrict(f).counts;
const M = (f) => E().calc.computeMolarMass(counts(f), E().formula.ATOMIC_WEIGHTS).total;
const F = (n, sig, lang) => E().words.formatNumber(n, sig, lang);
const sub = (f) => E().formula.formatFormulaDisplay(f);
const fixed = (n, d, lang) => { const s = n.toFixed(d); return lang === 'pt' ? s.replace('.', ',') : s; };
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/* Scientific notation with d decimals kept (1.0 × 10⁻³), for data as written. */
const sci = (n, d, lang) => {
  const [m, e] = n.toExponential(d).split('e');
  const exp = (Number(e) < 0 ? '⁻' : '') + String(Math.abs(Number(e))).split('').map((c) => SUP[c]).join('');
  return (lang === 'pt' ? m.replace('.', ',') : m) + ' × 10' + exp;
};
/* Acid–base constants come from calc-core's sourced table, never typed here. */
const acid = (id) => E().calc.ACID_BASE_CONSTANTS.find((a) => a.id === id);

function engineSteps(result, lang, answerStep) {
  const view = E().words.describe(result.steps, { locale: lang, answerStep });
  return { steps: view.steps, answer: view.answer };
}

/* A reaction: each side's mass for the amounts in the equation, in grams. */
function massBalance(left, right, lang) {
  const T = lang === 'pt'
    ? { side: (s) => (s === 'L' ? 'Massa dos reagentes, nas quantidades da equação (em mol):' : 'Massa dos produtos:'), sum: 'Some e compare os dois lados.', L: 'reagentes', R: 'produtos' }
    : { side: (s) => (s === 'L' ? 'Mass of the reactants, for the amounts in the equation (in mol):' : 'Mass of the products:'), sum: 'Add up and compare both sides.', L: 'reactants', R: 'products' };
  const line = ([k, f]) => `${k} × M(${sub(f)}) = ${k} × ${F(M(f), 5, lang)} g/mol = ${F(k * M(f), 5, lang)} g`;
  const total = (side) => side.reduce((t, [k, f]) => t + k * M(f), 0);
  const sumText = (side, sum) => (side.length > 1 ? side.map(([k, f]) => F(k * M(f), 5, lang)).join(' + ') + ' = ' : '') + F(sum, 4, lang) + ' g';
  const L = total(left);
  const R = total(right);
  const steps = [
    { text: T.side('L'), expr: left.map(line).join(' · ') },
    { text: T.side('R'), expr: right.map(line).join(' · ') },
    { text: T.sum, expr: T.L + ': ' + sumText(left, L) + ' · ' + T.R + ': ' + sumText(right, R) }
  ];
  return { steps, answer: F(L, 4, lang) + ' g = ' + F(R, 4, lang) + ' g', left: L, right: R };
}

const eq = (left, right) => left.map(([k, f]) => (k === 1 ? '' : k + ' ') + sub(f)).join(' + ') + ' → ' + right.map(([k, f]) => (k === 1 ? '' : k + ' ') + sub(f)).join(' + ');

export const CALC = {
  'mole-co2': (lang) => ({
    q: lang === 'pt' ? 'Exemplo: a massa molar do CO₂' : 'Example: the molar mass of CO₂',
    ...engineSteps(E().calc.computeMolarMass(counts('CO2'), E().formula.ATOMIC_WEIGHTS), lang)
  }),
  'mole-water': (lang) => ({
    q: lang === 'pt' ? 'Exemplo: quantos mols há em 36 g de água?' : 'Example: how many moles are there in 36 g of water?',
    ...engineSteps(E().calc.computeMolarMass(counts('H2O'), E().formula.ATOMIC_WEIGHTS, { value: 36, unit: 'g' }), lang, 'mm.moles')
  }),
  'mole-particles': (lang) => {
    const n = 36 / M('H2O');
    const N = n * E().N_A;
    const NA = F(E().N_A, 9, lang); // 6.02214076 × 10²³, exact
    const unit = lang === 'pt' ? 'moléculas' : 'molecules';
    return {
      q: lang === 'pt' ? 'Exemplo: quantas moléculas há em 36 g de água?' : 'Example: how many molecules are there in 36 g of water?',
      steps: [
        { text: lang === 'pt' ? 'A quantidade de matéria, do exemplo anterior.' : 'The amount of substance, from the previous example.', expr: `n = 36 g ÷ ${F(M('H2O'), 5, lang)} g/mol = ${F(n, 4, lang)} mol` },
        { text: lang === 'pt' ? 'Multiplique pela constante de Avogadro.' : 'Multiply by the Avogadro constant.', expr: `N = ${F(n, 4, lang)} mol × ${NA} mol⁻¹ = ${F(N, 4, lang)} ${unit}` }
      ],
      answer: `N = ${F(N, 4, lang)} ${unit}`,
      value: N
    };
  },
  'mole-gas': (lang) => ({
    q: lang === 'pt' ? 'Exemplo: o volume de 1 mol de gás ideal a 0 °C (273,15 K) e 101,325 kPa' : 'Example: the volume of 1 mol of an ideal gas at 0 °C (273.15 K) and 101.325 kPa',
    ...engineSteps(E().calc.computeIdealGas({ solve: 'V', P: 101325, Pu: 'Pa', n: 1, T: 273.15, Tu: 'K', Vu: 'L' }), lang)
  }),
  'mass-water': (lang) => {
    const r = massBalance([[2, 'H2'], [1, 'O2']], [[2, 'H2O']], lang);
    return { lead: lang === 'pt' ? 'Exemplo: ' : 'Example: ', eq: eq([[2, 'H2'], [1, 'O2']], [[2, 'H2O']]), ...r };
  },
  'mass-methane': (lang) => {
    const r = massBalance([[1, 'CH4'], [2, 'O2']], [[1, 'CO2'], [2, 'H2O']], lang);
    return { lead: lang === 'pt' ? 'Exemplo: ' : 'Example: ', eq: eq([[1, 'CH4'], [2, 'O2']], [[1, 'CO2'], [2, 'H2O']]), ...r };
  },
  'mass-limestone': (lang) => {
    const n = 10 / M('CaCO3');
    const mCaO = n * M('CaO');
    const mCO2 = n * M('CO2');
    const pt = lang === 'pt';
    return {
      lead: pt ? 'Exemplo: 10 g de CaCO₃ aquecidos: ' : 'Example: 10 g of CaCO₃ heated: ', eq: eq([[1, 'CaCO3']], [[1, 'CaO'], [1, 'CO2']]),
      steps: [
        { text: pt ? 'A quantidade de carbonato de cálcio.' : 'The amount of calcium carbonate.', expr: `n = 10 g ÷ ${F(M('CaCO3'), 5, lang)} g/mol = ${F(n, 4, lang)} mol` },
        { text: pt ? 'A equação dá 1 mol de cada produto por mol de CaCO₃.' : 'The equation gives 1 mol of each product per mol of CaCO₃.', expr: `m(CaO) = ${F(n, 4, lang)} mol × ${F(M('CaO'), 5, lang)} g/mol = ${F(mCaO, 4, lang)} g · m(CO₂) = ${F(n, 4, lang)} mol × ${F(M('CO2'), 5, lang)} g/mol = ${F(mCO2, 4, lang)} g` },
        { text: pt ? 'Some as massas dos produtos.' : 'Add up the masses of the products.', expr: `${F(mCaO, 4, lang)} g + ${F(mCO2, 4, lang)} g = ${fixed(mCaO + mCO2, 2, lang)} g` }
      ],
      answer: `${fixed(mCaO + mCO2, 2, lang)} g = 10${pt ? ',' : '.'}00 g`,
      left: 10, right: mCaO + mCO2
    };
  },
  'moles-co2': (lang) => ({
    q: lang === 'pt' ? 'Quantos mols há em 88 g de CO₂?' : 'How many moles are there in 88 g of CO₂?',
    ...engineSteps(E().calc.computeMolarMass(counts('CO2'), E().formula.ATOMIC_WEIGHTS, { value: 88, unit: 'g' }), lang, 'mm.moles')
  }),
  'mass-h2so4': (lang) => ({
    q: lang === 'pt' ? 'Qual é a massa de 0,5 mol de H₂SO₄?' : 'What is the mass of 0.5 mol of H₂SO₄?',
    ...engineSteps(E().calc.computeMolarMass(counts('H2SO4'), E().formula.ATOMIC_WEIGHTS, { value: 0.5, unit: 'mol' }), lang, 'mm.mass')
  }),

  // ── Trail 2: solutions (prompt 33) ──
  'sol-prep': (lang) => ({
    q: lang === 'pt' ? 'Exemplo: a massa de NaCl para 250 mL de solução 0,1 mol/L' : 'Example: the mass of NaCl for 250 mL of a 0.1 mol/L solution',
    ...engineSteps(E().calc.computeSolutionMass(counts('NaCl'), E().formula.ATOMIC_WEIGHTS, { C: 0.1, V: 250 }), lang)
  }),
  'sol-conc': (lang) => {
    const r = E().calc.computeMolarMass(counts('NaCl'), E().formula.ATOMIC_WEIGHTS, { value: 5.85, unit: 'g' });
    const view = engineSteps(r, lang, 'mm.moles');
    const C = r.moles / 0.5;
    const pt = lang === 'pt';
    return {
      q: pt ? 'Exemplo: 5,85 g de NaCl dissolvidos e completados a 500 mL. Qual é a concentração?' : 'Example: 5.85 g of NaCl dissolved and made up to 500 mL. What is the concentration?',
      steps: view.steps.filter((s) => s.id === 'mm.sum' || s.id === 'mm.moles').concat([
        { text: pt ? 'Divida pelo volume da solução, em litros.' : 'Divide by the volume of the solution, in litres.', expr: `C = ${F(r.moles, 4, lang)} mol ÷ ${fixed(0.5, 3, lang)} L = ${F(C, 4, lang)} mol/L` }
      ]),
      answer: `C = ${F(C, 4, lang)} mol/L`,
      value: C
    };
  },
  'sol-dilute': (lang) => ({
    q: lang === 'pt' ? 'Exemplo: que volume de uma solução estoque 2 mol/L é preciso para preparar 250 mL de solução 0,2 mol/L?' : 'Example: what volume of a 2 mol/L stock solution is needed to make 250 mL of a 0.2 mol/L solution?',
    ...engineSteps(E().calc.computeDilution({ solve: 'V1', C1: 2, C2: 0.2, V2: 250 }), lang)
  }),
  'rev-naoh-mass': (lang) => ({
    q: lang === 'pt' ? 'Que massa de NaOH é preciso pesar para 500 mL de solução 0,2 mol/L?' : 'What mass of NaOH must be weighed for 500 mL of a 0.2 mol/L solution?',
    ...engineSteps(E().calc.computeSolutionMass(counts('NaOH'), E().formula.ATOMIC_WEIGHTS, { C: 0.2, V: 500 }), lang)
  }),
  'rev-dilute-c2': (lang) => ({
    q: lang === 'pt' ? '10 mL de uma solução 1 mol/L são diluídos até 100 mL. Qual é a nova concentração?' : '10 mL of a 1 mol/L solution are diluted to 100 mL. What is the new concentration?',
    ...engineSteps(E().calc.computeDilution({ solve: 'C2', C1: 1, V1: 10, V2: 100 }), lang)
  }),

  // ── Trail 3: acids and bases (prompt 33) ──
  'ab-strong-acid': (lang) => ({
    q: lang === 'pt' ? 'Exemplo: o pH do ácido clorídrico 0,01 mol/L' : 'Example: the pH of 0.01 mol/L hydrochloric acid',
    ...engineSteps(E().calc.computePH({ mode: 'H', value: 0.01 }), lang)
  }),
  'ab-strong-base': (lang) => ({
    q: lang === 'pt' ? 'Exemplo: o pH do hidróxido de sódio 0,001 mol/L' : 'Example: the pH of 0.001 mol/L sodium hydroxide',
    ...engineSteps(E().calc.computePH({ mode: 'OH', value: 0.001 }), lang)
  }),
  'ab-weak-acid': (lang) => {
    const pKa = acid('acetic').pKa[0];
    const C = 0.1;
    const r = E().calc.computeWeakAcidPH({ C, pKa });
    const x = r.alpha * C; // [A⁻] = [H⁺] from the acid
    const pt = lang === 'pt';
    return {
      q: pt ? `Exemplo: o pH do ácido acético 0,10 mol/L (pKa = ${fixed(pKa, 3, lang)} a 25 °C)` : `Example: the pH of 0.10 mol/L acetic acid (pKa = ${fixed(pKa, 3, lang)} at 25 °C)`,
      steps: [
        { text: pt ? 'Ka a partir do pKa.' : 'Ka from the pKa.', expr: `Ka = 10^(−${fixed(pKa, 3, lang)}) = ${F(r.Ka, 4, lang)}` },
        { text: pt ? 'No equilíbrio, [H⁺] = [A⁻] = x e [HA] = C − x; então:' : 'At equilibrium [H⁺] = [A⁻] = x and [HA] = C − x, so:', expr: `Ka = x² ÷ (${fixed(C, 2, lang)} − x) = ${F(r.Ka, 4, lang)}` },
        { text: pt ? 'x é pequeno perto de C, então x ≈ √(Ka × C); resolvendo sem o atalho, o valor quase não muda.' : 'x is small compared with C, so x ≈ √(Ka × C); solving without the shortcut barely changes it.', expr: `x ≈ √(${F(r.Ka, 4, lang)} × ${fixed(C, 2, lang)}) = ${sci(Math.pow(10, -r.shortcutPH), 3, lang)} · x = ${sci(x, 3, lang)} mol/L` },
        { text: pt ? 'Calcule menos o logaritmo decimal.' : 'Take minus the base-10 logarithm.', expr: `pH = −log₁₀(${sci(r.H, 3, lang)}) = ${fixed(r.pH, 2, lang)}` },
        { text: pt ? 'A fração do ácido que se ionizou.' : 'The fraction of the acid that ionized.', expr: `α = x ÷ C = ${sci(x, 3, lang)} ÷ ${fixed(C, 2, lang)} = ${fixed(r.alpha * 100, 1, lang)} %` }
      ],
      answer: `pH = ${fixed(r.pH, 2, lang)}`,
      value: r.pH
    };
  },
  'ab-buffer': (lang) => {
    const pKa = acid('acetic').pKa[0];
    const r = E().calc.computeBufferPH({ acid: 0.1, base: 0.2, pKa });
    const pt = lang === 'pt';
    if (fixed(r.exactPH, 2, lang) !== fixed(r.pH, 2, lang)) throw new Error('ab-buffer: Henderson–Hasselbalch and the charge balance differ');
    return {
      q: pt ? 'Exemplo: o pH de um tampão com ácido acético 0,10 mol/L e acetato de sódio 0,20 mol/L' : 'Example: the pH of a buffer of 0.10 mol/L acetic acid and 0.20 mol/L sodium acetate',
      steps: [
        { text: pt ? 'A razão entre a base conjugada e o ácido.' : 'The ratio of conjugate base to acid.', expr: `[A⁻]/[HA] = ${fixed(0.2, 2, lang)} ÷ ${fixed(0.1, 2, lang)} = ${F(r.ratio, 4, lang)}` },
        { text: 'Henderson–Hasselbalch.', expr: `pH = ${fixed(pKa, 3, lang)} + log₁₀(${F(r.ratio, 4, lang)}) = ${fixed(pKa, 3, lang)} + ${fixed(Math.log10(r.ratio), 3, lang)} = ${fixed(r.pH, 2, lang)}` },
        { text: pt ? `A razão está entre 0,1 e 10, então a equação é uma boa aproximação: o balanço de cargas completo também dá pH ${fixed(r.exactPH, 2, lang)}.` : `The ratio is between 0.1 and 10, so the equation is a good approximation: the full charge balance also gives pH ${fixed(r.exactPH, 2, lang)}.`, expr: `${fixed(0.1, 1, lang)} ≤ ${F(r.ratio, 4, lang)} ≤ 10 ✓` }
      ],
      answer: `pH = ${fixed(r.pH, 2, lang)}`,
      value: r.pH
    };
  },
  'rev-ph-hcl': (lang) => ({
    q: lang === 'pt' ? 'Qual é o pH do ácido clorídrico 0,001 mol/L?' : 'What is the pH of 0.001 mol/L hydrochloric acid?',
    ...engineSteps(E().calc.computePH({ mode: 'H', value: 0.001 }), lang)
  }),
  'rev-buffer-ratio': (lang) => ({
    q: lang === 'pt' ? `Que razão [acetato]/[ácido acético] dá um tampão de pH 5,00 (pKa = ${fixed(acid('acetic').pKa[0], 3, lang)})?` : `What [acetate]/[acetic acid] ratio gives a buffer of pH 5.00 (pKa = ${fixed(acid('acetic').pKa[0], 3, lang)})?`,
    ...engineSteps(E().calc.computeBufferRatio({ pKa: acid('acetic').pKa[0], pH: 5 }), lang)
  }),

  // ── Chemical equilibrium (prompt 33) ──
  'eq-ice': (lang) => {
    const pKa = acid('acetic').pKa[0];
    const C = 0.1;
    const r = E().calc.computeWeakAcidPH({ C, pKa });
    const x = r.alpha * C;
    const pt = lang === 'pt';
    const c = fixed(C, 2, lang);
    return {
      lead: pt ? 'Exemplo: tabela de equilíbrio do ácido acético 0,10 mol/L: ' : 'Example: an ICE table for 0.10 mol/L acetic acid: ', eq: 'CH₃COOH ⇌ H⁺ + CH₃COO⁻',
      steps: [
        { text: pt ? 'Início, antes da ionização, em mol/L.' : 'Initial (I), before any ionization, in mol/L.', expr: `[CH₃COOH] = ${c} · [H⁺] ≈ 0 · [CH₃COO⁻] = 0` },
        { text: pt ? 'Reage: x mol/L do ácido se ioniza.' : 'Change (C): x mol/L of the acid ionizes.', expr: '−x · +x · +x' },
        { text: pt ? 'Equilíbrio: o que resta do ácido e o que se formou.' : 'Equilibrium (E): what is left of the acid and what has formed.', expr: `[CH₃COOH] = ${c} − x · [H⁺] = x · [CH₃COO⁻] = x` },
        { text: pt ? `Leve a linha do equilíbrio para K (Ka a 25 °C, de pKa = ${fixed(pKa, 3, lang)}).` : `Put the equilibrium row into K (Ka at 25 °C, from pKa = ${fixed(pKa, 3, lang)}).`, expr: `Ka = x² ÷ (${c} − x) = ${F(r.Ka, 4, lang)}` },
        { text: pt ? 'Resolva a única incógnita: a raiz positiva de x² + Ka·x − Ka·C = 0.' : 'Solve for the one unknown: the positive root of x² + Ka·x − Ka·C = 0.', expr: `x = ${sci(x, 3, lang)} mol/L` },
        { text: pt ? 'As concentrações no equilíbrio.' : 'The equilibrium concentrations.', expr: `[CH₃COOH] = ${F(C - x, 4, lang)} mol/L · [H⁺] = [CH₃COO⁻] = ${sci(x, 3, lang)} mol/L` }
      ],
      answer: `x = ${sci(x, 3, lang)} mol/L · pH = ${fixed(r.pH, 2, lang)}`,
      value: x
    };
  },
  'eq-common-ion': (lang) => {
    const pKa = acid('acetic').pKa[0];
    const before = E().calc.computeWeakAcidPH({ C: 0.1, pKa });
    const after = E().calc.computeBufferPH({ acid: 0.1, base: 0.1, pKa });
    const H = after.H; // Henderson–Hasselbalch: Ka × [HA] ÷ [A⁻]
    const pt = lang === 'pt';
    return {
      q: pt ? 'Exemplo: acetato de sódio é adicionado ao ácido acético 0,10 mol/L até o acetato chegar a 0,10 mol/L. O que acontece com a ionização?' : 'Example: sodium acetate is added to 0.10 mol/L acetic acid until the acetate reaches 0.10 mol/L. What happens to the ionization?',
      steps: [
        { text: pt ? 'Antes: só o ácido, como na tabela de equilíbrio.' : 'Before: the acid alone, as in the ICE table.', expr: `[H⁺] = ${sci(before.H, 3, lang)} mol/L · pH = ${fixed(before.pH, 2, lang)} · α = ${fixed(before.alpha * 100, 1, lang)} %` },
        { text: pt ? 'O acetato adicionado deixa Q maior que K: a reação inversa avança até Q = K de novo.' : 'The added acetate makes Q larger than K: the reverse reaction goes on until Q = K again.', expr: 'Q > Ka → H⁺ + CH₃COO⁻ ⟶ CH₃COOH' },
        { text: pt ? 'No novo equilíbrio, com o mesmo Ka e as duas concentrações perto de 0,10 mol/L: [H⁺] = Ka × [CH₃COOH] ÷ [CH₃COO⁻].' : 'At the new equilibrium, with the same Ka and both concentrations close to 0.10 mol/L: [H⁺] = Ka × [CH₃COOH] ÷ [CH₃COO⁻].', expr: `[H⁺] = ${F(after.Ka, 4, lang)} × ${fixed(0.1, 2, lang)} ÷ ${fixed(0.1, 2, lang)} = ${sci(H, 3, lang)} mol/L · pH = ${fixed(after.pH, 2, lang)}` },
        { text: pt ? 'A fração ionizada cai; K não mudou.' : 'The fraction ionized drops; K has not changed.', expr: `α = ${sci(H, 3, lang)} ÷ ${fixed(0.1, 2, lang)} = ${F(H / 0.1 * 100, 2, lang)} %` }
      ],
      answer: `pH ${fixed(before.pH, 2, lang)} → ${fixed(after.pH, 2, lang)} · α ${fixed(before.alpha * 100, 1, lang)} % → ${F(H / 0.1 * 100, 2, lang)} %`,
      value: after.pH
    };
  },
  'eq-q': (lang) => {
    const Ka = Math.pow(10, -acid('acetic').pKa[0]);
    const ion = 1e-3;
    const HA = 0.1;
    const Q = ion * ion / HA;
    const pt = lang === 'pt';
    const forward = Q < Ka;
    return {
      q: pt ? `Exemplo: uma mistura tem ácido acético ${fixed(HA, 2, lang)} mol/L e ${sci(ion, 1, lang)} mol/L de H⁺ e de acetato. Para que lado ela reage?` : `Example: a mixture holds ${fixed(HA, 2, lang)} mol/L acetic acid and ${sci(ion, 1, lang)} mol/L each of H⁺ and acetate. Which way does it react?`,
      steps: [
        { text: pt ? 'Q tem a mesma forma de K, com as concentrações deste momento.' : 'Q has the same form as K, with the concentrations as they are now.', expr: `Q = [H⁺][CH₃COO⁻] ÷ [CH₃COOH] = (${sci(ion, 1, lang)})² ÷ ${fixed(HA, 2, lang)} = ${sci(Q, 1, lang)}` },
        { text: pt ? 'Compare Q com K na mesma temperatura (25 °C).' : 'Compare Q with K at the same temperature (25 °C).', expr: `Q = ${sci(Q, 1, lang)} ${forward ? '<' : '>'} Ka = ${F(Ka, 4, lang)}` },
        forward
          ? { text: pt ? 'Há menos produto do que no equilíbrio: a reação segue no sentido direto (mais ácido se ioniza) até Q = K.' : 'There is less product than at equilibrium: the net reaction goes forward (more acid ionizes) until Q = K.', expr: 'Q < K → CH₃COOH ⟶ H⁺ + CH₃COO⁻' }
          : { text: pt ? 'Há mais produto do que no equilíbrio: a reação segue no sentido inverso até Q = K.' : 'There is more product than at equilibrium: the net reaction goes in reverse until Q = K.', expr: 'Q > K → H⁺ + CH₃COO⁻ ⟶ CH₃COOH' }
      ],
      answer: forward ? 'Q < K' : 'Q > K',
      tail: forward ? (pt ? ' — sentido direto: mais ácido se ioniza.' : ' — forward: more acid ionizes.') : (pt ? ' — sentido inverso.' : ' — in reverse.'),
      value: Q
    };
  }
};

function stepsHtml(steps) {
  return '<ol class="wsol-steps">' + steps.map((s) =>
    '<li><span class="wsol-text">' + esc(s.text) + '</span> <span class="wsol-expr" translate="no">' + esc(s.expr) + '</span></li>').join('') + '</ol>';
}

export function workedBlock(id, lang) {
  const r = CALC[id](lang);
  // An equation is not a sentence of either language.
  const q = r.eq ? esc(r.lead) + '<span translate="no">' + esc(r.eq) + '</span>' : esc(r.q);
  return '<p class="aw-q">' + q + '</p>' + stepsHtml(r.steps) +
    '<p class="aw-a">' + esc((lang === 'pt' ? 'Resposta: ' : 'Answer: ')) + '<span translate="no">' + esc(r.answer) + '</span>' + esc(r.tail || '') + '</p>';
}

/* Fill every <!-- calc:id --> … <!-- /calc:id --> block of a page. */
export function fillWorked(html, lang) {
  return html.replace(/<!-- calc:([a-z0-9-]+) -->[\s\S]*?<!-- \/calc:\1 -->/g, (m, id) => {
    if (!CALC[id]) throw new Error('unknown worked example ' + id);
    return `<!-- calc:${id} -->\n${workedBlock(id, lang)}\n<!-- /calc:${id} -->`;
  });
}

// ── Trail pages ─────────────────────────────────────────────────────────────
/* TODO(owner): the public name («Trilha», «Percurso»…) is the owner's call. */
const L = {
  en: {
    htmlLang: 'en-US', other: 'pt', otherCode: 'PT', langTitle: 'Switch language', home: '→ home',
    label: 'Trail', draft: 'Draft — under teacher review. Not published yet.', steps: (n) => n + ' steps', minutes: 'min',
    level: { basico: 'basic', medio: 'intermediate', avancado: 'advanced' },
    types: { article: 'Article', tool: 'Tool', exercises: 'Exercises', lab: 'Lab', sheet: 'Activity sheet', review: 'Review' },
    count: '{n} of {total} steps done', done: 'Done', undone: 'Mark as done', doneOn: 'Done ✓', optional: 'optional', pro: 'extra (Pro)', after: 'after: ',
    local: 'Your progress stays in this browser only: no account, nothing sent.', reset: 'Start over',
    open: 'Open', review: 'Review', recap: 'What to remember', check: 'Check yourself', answer: 'Answer', license: 'Licence: [licença: definir]',
    path: (id) => 'trails / ' + id
  },
  pt: {
    htmlLang: 'pt-BR', other: 'en', otherCode: 'EN', langTitle: 'Trocar idioma', home: '→ início',
    label: 'Trilha', draft: 'Rascunho — em revisão docente. Ainda não publicado.', steps: (n) => n + ' etapas', minutes: 'min',
    level: { basico: 'básico', medio: 'médio', avancado: 'avançado' },
    types: { article: 'Artigo', tool: 'Ferramenta', exercises: 'Exercícios', lab: 'Lab', sheet: 'Ficha', review: 'Revisão' },
    count: '{n} de {total} etapas concluídas', done: 'Concluí', undone: 'Marcar como concluída', doneOn: 'Concluída ✓', optional: 'opcional', pro: 'extra (Pro)', after: 'depois de: ',
    local: 'Seu progresso fica só neste navegador: sem conta, nada é enviado.', reset: 'Recomeçar',
    open: 'Abrir', review: 'Revisão', recap: 'O que lembrar', check: 'Teste você mesmo', answer: 'Resposta', license: 'Licença: [licença: definir]',
    path: (id) => 'trilhas / ' + id
  }
};
const ICONS = {
  article: '<path d="M4 2.5h6l2.5 2.5v8.5h-8.5zM6 7h5M6 9.5h5M6 12h3"/>',
  tool: '<rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5 5h6M5.5 8h1M9.5 8h1M5.5 11h1M9.5 11h1"/>',
  exercises: '<path d="M3 4h10M3 8h10M3 12h6M12 11l1.5 1.5L16 10"/>',
  lab: '<path d="M6 2v4l-3.5 7h11L10 6V2M5 2h6"/>',
  sheet: '<rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5.5 5h5M5.5 7.5h5M5.5 10h3"/>',
  review: '<path d="M8 2.5l1.7 3.4 3.8.6-2.7 2.7.6 3.8L8 11.2 4.6 13l.6-3.8-2.7-2.7 3.8-.6z"/>'
};

export function fileName(trail, lang) {
  return trail.id + (lang === 'pt' ? '.pt.html' : '.html');
}

export function stepHref(trail, step, index, lang) {
  const href = step.href[lang];
  if (href.startsWith('#')) return href;
  const [base, hash] = href.split('#');
  return base + (base.includes('?') ? '&' : '?') + 'trail=' + trail.id + '&step=' + (index + 1) + (hash ? '#' + hash : '');
}

const PAGE_CSS = `<style>
.fx-draft{margin:14px 0 0;padding:8px 12px;max-width:640px;border:1px dashed var(--lc-amber,#B7791F);border-radius:8px;font-size:13px}
.lc-doc-prose .tr-steps{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.lc-doc-prose .tr-steps>.tr-step{display:grid;grid-template-columns:32px 1fr auto;gap:12px;align-items:center;margin:0;padding:12px 14px;border:1px solid var(--lc-rule,#D8D2BF);border-radius:12px}
.lc-doc-prose .tr-steps>.tr-step::before{content:none}
.tr-step.is-done{border-color:var(--lc-green,#1E6A50);background:color-mix(in oklab,var(--lc-green,#1E6A50) 7%,transparent)}
.tr-step svg{width:22px;height:22px}.tr-step a{font-weight:600}.tr-meta{display:block;font-size:12px;color:var(--lc-ink-2,#58544A)}
.tr-step .ui-btn{min-height:40px}.tr-progress{font-weight:600}.tr-note{font-size:13px;color:var(--lc-ink-2,#58544A)}
.tr-q{margin:0 0 12px}.tr-q summary{cursor:pointer;font-weight:600;min-height:32px}
@media (max-width:560px){.tr-step{grid-template-columns:28px 1fr}.tr-step .ui-btn{grid-column:2}}
@media print{:root body :is(.lc-doc-aside,.lc-statusbar,.lc-footer,.tr-step .ui-btn,.tr-tools){display:none!important}}
</style>`;

function stepsList(trail, lang) {
  const t = L[lang];
  return trail.steps.map((s, i) => {
    const meta = [t.types[s.type], s.estMinutes + ' ' + t.minutes];
    if (s.optional) meta.push(s.pro ? t.pro : t.optional);
    if (s.requires && s.requires.length) meta.push(t.after + s.requires.map((r) => trail.steps.find((x) => x.id === r).title[lang]).join(', '));
    return '  <li class="tr-step" data-step="' + esc(s.id) + '">' +
      '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none">' + ICONS[s.type] + '</g></svg>' +
      '<div><a href="' + esc(stepHref(trail, s, i, lang)) + '">' + esc((s.optional ? '' : (i + 1) + '. ') + s.title[lang]) + '</a>' +
      '<span class="tr-meta">' + esc(meta.join(' · ')) + '</span></div>' +
      '<button type="button" class="ui-btn ui-btn-secondary" data-trail-done="' + esc(s.id) + '"' + (s.optional ? ' data-optional' : '') +
      ' aria-pressed="false" data-label-off="' + esc(t.done) + '" data-label-on="' + esc(t.doneOn) + '" aria-label="' + esc(t.undone + ': ' + s.title[lang]) + '">' + esc(t.done) + '</button></li>\n';
  }).join('');
}

function reviewHtml(trail, lang) {
  const t = L[lang];
  const qs = trail.review.questions.map((q) => {
    let prompt;
    let answer;
    if (q.kind === 'computed') {
      const r = CALC[q.calc](lang);
      prompt = esc(r.q);
      answer = '<span translate="no">' + esc(r.answer) + '</span>' + esc(r.tail || '') + stepsHtml(r.steps);
    } else {
      prompt = esc(q.prompt[lang]);
      answer = esc(q.answer[lang]);
    }
    return '<li class="tr-q"><p>' + prompt + '</p><details><summary>' + esc(t.answer) + '</summary><p>' + answer + '</p></details></li>';
  }).join('\n');
  return '<section id="revisao" aria-labelledby="tr-review-title">\n<h2 id="tr-review-title">' + esc(t.review) + '</h2>\n' +
    '<h3>' + esc(t.recap) + '</h3>\n<ul>' + trail.review.recap[lang].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>\n' +
    '<h3>' + esc(t.check) + '</h3>\n<ol>\n' + qs + '\n</ol>\n</section>\n';
}

export function pageContent(trail, lang) {
  const t = L[lang];
  const main = trail.steps.filter((s) => !s.optional).length;
  return '<header class="lc-doc-hero">\n  <div class="lc-doc-kicker">\n    <span>' + esc(t.label) + '</span>\n' +
    '    <span class="pill">' + esc(t.steps(main) + ' · ≈ ' + trail.minutes + ' ' + t.minutes) + '</span>\n  </div>\n' +
    '  <h1 class="lc-doc-title">' + esc(t.label + ': ' + trail.title[lang]) + '</h1>\n' +
    '  <p class="lc-doc-desc">' + esc(trail.summary[lang]) + '</p>\n' +
    (trail.status === 'draft' ? '  <p class="fx-draft" role="note">' + esc(t.draft) + '</p>\n' : '') + '</header>\n' +
    '<div class="lc-doc-body ui-root">\n  <aside class="lc-doc-aside">\n' +
    '    <div><span class="lbl">' + esc(lang === 'pt' ? 'nível' : 'level') + '</span><br><span class="v">' + esc(t.level[trail.level]) + '</span></div>\n    <hr>\n' +
    '    <div><span class="lbl">' + esc(lang === 'pt' ? 'duração' : 'duration') + '</span><br><span class="v">' + esc('≈ ' + trail.minutes + ' ' + t.minutes) + '</span></div>\n  </aside>\n' +
    '  <article class="lc-doc-prose" data-trail="' + esc(trail.id) + '">\n' +
    '<p class="tr-progress" data-trail-count data-template="' + esc(t.count) + '" aria-live="polite">' + esc(t.count.replace('{n}', '0').replace('{total}', main)) + '</p>\n' +
    '<ol class="tr-steps">\n' + stepsList(trail, lang) + '</ol>\n' +
    '<p class="tr-note tr-tools">' + esc(t.local) + ' <button type="button" class="ui-btn ui-btn-ghost" data-trail-reset>' + esc(t.reset) + '</button></p>\n' +
    reviewHtml(trail, lang) +
    '<p class="fx-license">' + esc(t.license) + '</p>\n  </article>\n</div>';
}

export function renderPage(trail, lang, template, version) {
  const t = L[lang];
  const name = fileName(trail, lang);
  const fill = {
    dataPage: 'trail',
    htmlLang: t.htmlLang,
    robots: trail.status !== 'published' ? 'noindex,nofollow' : 'index,follow',
    title: esc(t.label + ': ' + trail.title[lang] + ' | Atomurus'),
    description: esc(trail.summary[lang]),
    headExtra: PAGE_CSS + '\n<link rel="stylesheet" href="/assets/ui/worked-solution.css?v=0">\n<script src="/assets/trail-progress.js?v=0" defer></script>',
    otherHref: fileName(trail, t.other) + (t.other === 'pt' ? '?lang=pt-BR' : '?lang=en'),
    otherCode: t.otherCode,
    langTitle: t.langTitle,
    content: pageContent(trail, lang),
    statusPath: esc(t.path(trail.id)),
    homeLink: esc(t.home)
  };
  let html = template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in fill)) throw new Error('template slot without a value: ' + k);
    return fill[k];
  });
  html = finishDocPage(html, path.join(OUT_DIR, name), lang);
  return { name, html: html.replace(/\?v=\d+/g, '?v=' + version) };
}

/* The chip «Trilha: Estequiometria — etapa 2/8» on step pages that carry
   ?trail=…&step=… . Generated, with the trails' names baked in. */
export function chipScript(trails) {
  const data = {};
  for (const tr of trails) {
    data[tr.id] = {
      t: tr.title, n: tr.steps.filter((s) => !s.optional).length, // optional extras carry no step number in the chip
      h: { pt: '/trilhas/' + fileName(tr, 'pt'), en: '/trilhas/' + fileName(tr, 'en') }
    };
  }
  return '/* Generated by tools/build-trails.mjs — do not edit. Shows «' + L.pt.label + ': … — etapa n/N» when the page\n' +
    '   was opened from a trail (?trail=…&step=…). No storage, no network. */\n' +
    '(function () {\n  var T = ' + JSON.stringify(data) + ';\n' +
    '  try {\n    var q = new URLSearchParams(location.search);\n    var tr = T[q.get(\'trail\')];\n    var step = Number(q.get(\'step\'));\n' +
    '    if (!tr || !(step >= 1 && step <= tr.n)) return;\n' +
    '    var pt = (document.documentElement.lang || \'\').toLowerCase().indexOf(\'pt\') === 0;\n    var l = pt ? \'pt\' : \'en\';\n' +
    '    var main = document.querySelector(\'main\');\n    if (!main || document.querySelector(\'.trail-chip\')) return;\n' +
    '    var p = document.createElement(\'p\');\n    p.className = \'trail-chip\';\n    var a = document.createElement(\'a\');\n    a.href = tr.h[l];\n' +
    '    a.textContent = (pt ? \'' + L.pt.label + ': \' : \'' + L.en.label + ': \') + tr.t[l] + (pt ? \' — etapa \' : \' — step \') + step + \'/\' + tr.n;\n' +
    '    p.appendChild(a);\n    main.insertBefore(p, main.firstChild);\n  } catch (e) {}\n})();\n';
}

export function renderAll(version = stamp()) {
  const trails = loadTrails();
  const problems = trails.flatMap(validate);
  if (problems.length) throw new Error('build-trails: ' + problems.join('; '));
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const pages = [];
  for (const tr of trails) for (const lang of ['en', 'pt']) pages.push(renderPage(tr, lang, template, version));
  const articles = DRAFT_ARTICLES.flatMap((base) => ['en', 'pt'].map((lang) => {
    const rel = base + (lang === 'pt' ? '.pt.html' : '.html');
    return { rel, html: fillWorked(fs.readFileSync(path.join(ROOT, rel), 'utf8'), lang) };
  }));
  return { trails, pages, articles, chip: chipScript(trails) };
}

const unstamp = (s) => s.replace(/\?v=\d+/g, '?v=0');

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  let out;
  try {
    out = renderAll();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  if (process.argv.includes('--check')) {
    const problems = [];
    for (const page of out.pages) {
      const file = path.join(OUT_DIR, page.name);
      if (!fs.existsSync(file)) problems.push('missing trilhas/' + page.name);
      else if (unstamp(fs.readFileSync(file, 'utf8')) !== unstamp(page.html)) problems.push('stale trilhas/' + page.name);
    }
    const known = new Set(out.pages.map((p) => p.name));
    if (fs.existsSync(OUT_DIR)) for (const f of fs.readdirSync(OUT_DIR)) if (!known.has(f)) problems.push('not generated: trilhas/' + f);
    for (const a of out.articles) if (fs.readFileSync(path.join(ROOT, a.rel), 'utf8') !== a.html) problems.push('worked examples stale in ' + a.rel);
    if (!fs.existsSync(CHIP_FILE) || fs.readFileSync(CHIP_FILE, 'utf8') !== out.chip) problems.push('stale assets/trail-chip.js');
    if (problems.length) {
      console.error('build-trails: ' + problems.join('; ') + ' — run node tools/build-trails.mjs');
      process.exit(1);
    }
    console.log(`build-trails: ok (${out.trails.length} trail(s), ${out.pages.length} pages, ${out.articles.length} articles)`);
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const page of out.pages) fs.writeFileSync(path.join(OUT_DIR, page.name), page.html);
    for (const a of out.articles) fs.writeFileSync(path.join(ROOT, a.rel), a.html);
    fs.writeFileSync(CHIP_FILE, out.chip);
    console.log(`build-trails: wrote ${out.pages.length} pages, ${out.articles.length} articles' worked examples and assets/trail-chip.js`);
  }
}
