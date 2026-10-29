// POE in the Lab guides (prompt 27): every exercise walked through the engine
// alone (no DOM). The option that counts as right must be the one the
// chemistry of the step gives, read from the simulation.
//
//   node tools/test-lab-poe.mjs            → assertions
//   node tools/test-lab-poe.mjs --report   → also prints the Markdown table of
//                                            simulated values (docs/lab/poe-depois.md)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { doStep, confirm } from './lab-guide-audit.mjs';

const require = createRequire(import.meta.url);
const lab = require('../assets/lab/virtual-lab.js');
const silence = console.debug;
console.debug = () => {};

const words = (text) => String(text).trim().split(/\s+/).filter(Boolean).length;

// What the chemistry of each step gives, independent of the engine's wording.
const CHEMISTRY = {
  'ph-bicarbonate': { guide: 'ph', answer: 'up', check: (b, a) => b.ph < 3 && a.ph >= 6.5 && a.ph <= 7.5 },
  'ethanol-sugar': { guide: 'ethanol', answer: 'convert', check: (b, a) => a.sucrose < b.sucrose && a.ethanol > b.ethanol && a.fizz },
  'crystal-heat': { guide: 'crystal', answer: 'dissolved', check: (b, a) => !a.crystals && a.temp >= 40 && a.sucrose < a.water * 2 },
  'distil-purity': { guide: 'distillation', answer: 'mostly', check: (b, a) => a.purity > 50 && a.purity < 95.6 && a.water > 0 },
  'reflux-volume': { guide: 'reflux', answer: 'same', check: (b, a) => Math.abs(a.ml - b.ml) <= 1 }
};

function walk(creation, onPredict) {
  const session = lab.emptySession({ title: 'POE', mode: 'bench' });
  lab.startGuide(session, creation.id);
  const memo = { last: '' };
  creation.tutorial.forEach((step) => {
    const all = lab.poeState(session, creation);
    if (all && all.open && all.open.stage === 'predict') onPredict(session, all.open.poe);
    doStep(session, creation, step, 'correct', memo);
    confirm(session, creation);
  });
  return session;
}

const withPoe = lab.CREATIONS.filter((row) => row.poe);
assert.equal(withPoe.length, 5, 'five guides carry a POE');
const ids = new Set();
const rows = [];

for (const creation of withPoe) {
  for (const poe of [].concat(creation.poe)) {
    // ── Content shape ─────────────────────────────────────────────────────
    assert.ok(!ids.has(poe.id), `${poe.id} is unique`);
    ids.add(poe.id);
    const steps = creation.tutorial.map((step) => step.id);
    assert.ok(steps.includes(poe.beforeStep), `${poe.id}: beforeStep is a step of ${creation.id}`);
    if (poe.revealAfter) assert.ok(steps.indexOf(poe.revealAfter) >= steps.indexOf(poe.beforeStep), `${poe.id}: revealAfter comes after`);
    assert.ok(poe.options.length >= 3 && poe.options.length <= 5, `${poe.id}: 2–4 answers plus «Not sure»`);
    assert.ok(poe.options.some((opt) => opt.id === lab.POE_UNSURE), `${poe.id}: offers «Not sure»`);
    assert.equal(typeof poe.expected, 'function', `${poe.id}: the answer is computed from the simulation`);
    assert.equal(typeof poe.measure, 'function');
    for (const lang of ['en', 'pt']) {
      for (const field of ['predict', 'observe', 'explain', 'keyIdea', 'misconception']) {
        assert.ok(poe[field] && String(poe[field][lang] || '').trim(), `${poe.id}: ${field}.${lang}`);
      }
      poe.options.forEach((opt) => assert.ok(String(opt[lang] || '').trim(), `${poe.id}: option ${opt.id}.${lang}`));
      const explainWords = words(poe.explain[lang]) + words(poe.keyIdea[lang]);
      assert.ok(explainWords <= 60, `${poe.id}: explanation ≤ 60 words (${lang}: ${explainWords})`);
      assert.ok(words(poe.keyIdea[lang]) <= 20 && /[.!]$/.test(poe.keyIdea[lang]), `${poe.id}: the key idea is one short sentence (${lang})`);
    }

    // ── The walk: the answer the simulation gives ─────────────────────────
    const chem = CHEMISTRY[poe.id];
    assert.ok(chem && chem.guide === creation.id, `${poe.id}: has a chemistry expectation`);
    for (const pick of poe.options.map((opt) => opt.id)) {
      let asked = 0;
      const session = walk(creation, (s, open) => {
        if (open.id !== poe.id) return;
        asked += 1;
        assert.equal(lab.poePredict(s, creation, poe.id, pick).ok, true);
      });
      assert.equal(asked, 1, `${poe.id}: the card opens once, before ${poe.beforeStep}`);
      const state = lab.tutorialState(session, creation);
      assert.equal(state.complete, true, `${creation.id}: the guide completes with the POE`);
      const item = lab.poeState(session, creation).items.find((row) => row.poe.id === poe.id);
      assert.equal(item.stage, 'explain', `${poe.id}: the comparison is open at the end`);
      const rec = item.record;
      assert.equal(rec.actual, chem.answer, `${poe.id}: the simulation gives «${chem.answer}» (got ${rec.actual})`);
      assert.ok(chem.check(rec.before, rec.after), `${poe.id}: simulated values ${JSON.stringify(rec.before)} → ${JSON.stringify(rec.after)}`);
      assert.equal(rec.correct, pick === chem.answer, `${poe.id}: picking ${pick}`);
      if (pick === poe.options[0].id) {
        rows.push({ guide: creation.id, poe, rec });
      }
    }
  }
}

// ── expected() follows the simulation, not a fixed key ───────────────────────
{
  const poe = (id) => withPoe.map((row) => row.poe).find((row) => row.id === id);
  assert.equal(poe('ph-bicarbonate').expected({ ph: 1.2 }, { ph: 2 }), 'down');
  assert.equal(poe('ph-bicarbonate').expected({ ph: 2.1 }, { ph: 2 }), 'same');
  assert.equal(poe('ph-bicarbonate').expected({ ph: 8.3 }, { ph: 1.7 }), 'up', 'overshooting still raises the pH');
  assert.equal(poe('ethanol-sugar').expected({ sucrose: 25, ethanol: 0 }, { sucrose: 25, ethanol: 0 }), 'nothing');
  assert.equal(poe('ethanol-sugar').expected({ sucrose: 25, ethanol: 0, crystals: true }, { sucrose: 25, ethanol: 0 }), 'solid');
  assert.equal(poe('crystal-heat').expected({ crystals: true }), 'crystals');
  assert.equal(poe('distil-purity').expected({ ethanol: 10, water: 0, purity: 100 }), 'pure');
  assert.equal(poe('distil-purity').expected({ ethanol: 2, water: 10, purity: 16.7 }), 'water');
  assert.equal(poe('distil-purity').expected({ ethanol: 0, water: 0, purity: 0 }), '', 'nothing collected, nothing to compare');
  assert.equal(poe('reflux-volume').expected({ ml: 60 }, { ml: 80 }), 'drops');
  assert.equal(poe('reflux-volume').expected({ ml: 90 }, { ml: 80 }), 'rises');
}

// ── A step that is not met keeps the comparison closed ──────────────────────
{
  // Too much bicarbonate: the guide asks to undo, so the pH reading step does
  // not pass and the POE waits on «observe» instead of comparing early.
  const creation = withPoe.find((row) => row.id === 'ph');
  const session = lab.emptySession({ title: 'POE overshoot', mode: 'bench' });
  lab.startGuide(session, 'ph');
  const beaker = session.containers.find((row) => row.type === 'beaker');
  lab.addToContainer(session, beaker.id, 'water', 50);
  lab.addToContainer(session, beaker.id, 'citric_acid', 6);
  assert.equal(lab.poeState(session, creation).open.stage, 'predict');
  assert.equal(lab.poePredict(session, creation, 'ph-bicarbonate', 'up').ok, true);
  lab.addToContainer(session, beaker.id, 'bicarbonate', 9);
  lab.measure(session, beaker.id, 'ph');
  assert.equal(lab.poeState(session, creation).open.stage, 'observe');
}

// ── The summary to copy: plain text, both languages, simulated values ──────
{
  const creation = withPoe.find((row) => row.id === 'reflux');
  const before = lab.emptySession({ title: 'POE summary', mode: 'bench' });
  lab.startGuide(before, 'reflux');
  assert.equal(lab.poeSummaryText(before, creation, 'pt'), '', 'nothing answered, nothing to copy');
  const session = walk(creation, (s, open) => lab.poePredict(s, creation, open.id, 'drops'));
  const pt = lab.poeSummaryText(session, creation, 'pt');
  assert.equal(pt, [
    'Atomurus Lab · Aquecer sem perder solvente — previsões (POE, virtual)',
    '',
    '1. A mistura vai ferver por 10 minutos com o condensador na vertical e sem coletor. O que acontece com o volume no balão?',
    '   Previsto: Diminui: o vapor escapa',
    '   Aconteceu: Fica praticamente igual (80 mL → 80 mL)',
    '   Ideia-chave: O refluxo aquece por muito tempo sem perder solvente; a destilação leva o vapor embora.',
    '',
    'Previsões que bateram com a simulação: 0 de 1.'
  ].join('\n'));
  const en = lab.poeSummaryText(session, creation, 'en');
  assert.match(en, /^Atomurus Lab · Heat Without Losing Solvent — predictions \(POE, virtual\)/);
  assert.match(en, /Happened: It stays about the same \(80 mL → 80 mL\)/);
  assert.match(en, /Predictions that matched the simulation: 0 of 1\.$/);
  assert.doesNotMatch(pt + en, /<|>/, 'plain text, no markup');
  // A skipped exercise is not in the summary.
  const skipped = walk(creation, (s, open) => lab.poeSkip(s, creation, open.id));
  assert.equal(lab.poeSummaryText(skipped, creation, 'pt'), '');
}

console.debug = silence;

if (process.argv.includes('--report')) {
  const pick = (poe, id, lang) => (poe.options.find((opt) => opt.id === id) || {})[lang] || '—';
  console.log('| Guia | Pergunta (PT) | Antes da previsão → depois do passo (simulado) | Alternativa que a simulação dá |');
  console.log('|---|---|---|---|');
  rows.forEach(({ guide, poe, rec }) => {
    const reading = poe.reading(rec.after, rec.before, 'pt');
    console.log(`| \`${guide}\` | ${poe.predict.pt} | ${reading} | ${pick(poe, rec.actual, 'pt')} |`);
  });
}

console.log(`test-lab-poe: ok (${ids.size} exercises, ${rows.length} guides walked)`);
