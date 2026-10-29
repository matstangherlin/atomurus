// Walks every guided creation of the Virtual Lab through the engine alone
// (no DOM) and prints a Markdown table: does «Practice complete» appear when
// the objective is not met, and does a used bench leak into the guide?
//
//   node tools/lab-guide-audit.mjs                     → table on stdout
//   node tools/lab-guide-audit.mjs --engine <file.js>  → same, for another copy
//                                                         of the engine (e.g. the
//                                                         one from main)
//
// Three walks per guide:
//   correct — every step done as the plan says (amounts from the step).
//   sloppy  — every step's action done, but with 1 g / 1 mL instead of the
//             planned amount and a volume reading instead of the asked one.
//   dirty   — the guide is started on a bench that still holds the residue
//             of an earlier practice.
// The script feature-detects the newer engine API (startGuide,
// confirmObserved) so the same file measures the before and the after.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const engineAt = process.argv.indexOf('--engine');
const lab = require(engineAt !== -1 ? path.resolve(process.argv[engineAt + 1]) : '../assets/lab/virtual-lab.js');

function holdable(session) {
  return (session.containers || []).filter((row) => lab.canHold(row) && lab.hasCap(row, 'contain'));
}

function vesselFor(session, step, memo) {
  if (step.into) {
    let host = lab.firstOfType(session, step.into);
    if (!host) {
      lab.addVessel(session, step.into, { confirmed: true });
      host = lab.firstOfType(session, step.into);
    }
    memo.last = host.id;
    return host;
  }
  if (memo.last) {
    const last = session.containers.find((row) => row.id === memo.last);
    if (last) return last;
  }
  const first = holdable(session)[0];
  memo.last = first.id;
  return first;
}

function wetVessel(session, memo) {
  const pick = session.containers.find((row) => row.id === memo.last && (Number(row.volumeMl) || 0) > 0);
  if (pick) return pick;
  return session.containers.find((row) => row.type !== 'funnel' && (Number(row.volumeMl) || 0) > 0) ||
    session.containers.find((row) => row.id === memo.last) || holdable(session)[0];
}

export function doStep(session, creation, step, mode, memo) {
  if (step.needEquipment) {
    step.needEquipment.forEach((type) => {
      if (!lab.firstOfType(session, type)) lab.addVessel(session, type, { confirmed: true });
    });
  }
  if (step.action === 'addMaterial') {
    const host = vesselFor(session, step, memo);
    const ids = step.need ? Object.keys(step.need) : (step.needAny || []).slice(0, 1);
    ids.forEach((id) => {
      const planned = (step.amounts && step.amounts[id]) || 10;
      lab.addToContainer(session, host.id, id, mode === 'sloppy' ? 1 : planned);
    });
    if (step.stir) session.stirred = true;
    return;
  }
  if (step.action === 'mix') {
    session.stirred = true;
    return;
  }
  if (step.action === 'connect') {
    lab.assembleRig(session);
    return;
  }
  if (step.action === 'reflux-connect') {
    lab.assembleReflux(session);
    return;
  }
  if (step.action === 'heat') {
    const host = wetVessel(session, memo);
    lab.setTemperature(session, host.id, Number(step.heatTo) || 45);
    return;
  }
  if (step.action === 'distill') {
    const pot = lab.firstOfType(session, 'round-flask') || wetVessel(session, memo);
    lab.distill(session, pot.id);
    return;
  }
  if (step.action === 'reflux') {
    const pot = lab.firstOfType(session, 'round-flask') || wetVessel(session, memo);
    lab.reflux(session, pot.id);
    return;
  }
  if (step.action === 'ferment') {
    lab.ferment(session, wetVessel(session, memo).id);
    return;
  }
  if (step.action === 'crystallise') {
    lab.crystallise(session, wetVessel(session, memo).id);
    return;
  }
  if (step.action === 'filter') {
    const source = wetVessel(session, memo);
    if (!lab.filterSetup(session, source.id)) lab.assembleFilter(session, source.id);
    lab.filterThrough(session, source.id);
    const filtrate = session.containers.find((row) => row.type !== 'funnel' && row.id !== source.id && (Number(row.volumeMl) || 0) > 0);
    if (filtrate) memo.last = filtrate.id;
    return;
  }
  if (step.action === 'measure') {
    const host = wetVessel(session, memo);
    session.selectedId = host.id;
    lab.measure(session, host.id, mode === 'sloppy' ? 'volume' : 'ph');
    return;
  }
  if (step.action === 'inspect') {
    // The panel's only button on a reading step is «Read the vessel» (volume).
    const host = wetVessel(session, memo);
    session.selectedId = host.id;
    lab.measure(session, host.id, 'volume');
  }
}

export function confirm(session, creation) {
  if (typeof lab.confirmObserved !== 'function') return;
  for (let i = 0; i < 4; i += 1) {
    const state = lab.tutorialState(session, creation);
    if (!state || !state.awaitingObserve) return;
    lab.confirmObserved(session, creation);
  }
}

export function start(session, creationId, keepBench) {
  if (typeof lab.startGuide === 'function') {
    lab.startGuide(session, creationId, { keepBench: Boolean(keepBench) });
  } else {
    session.creationId = creationId;
    session.mode = 'guided';
  }
}

function walk(creation, mode) {
  const session = lab.emptySession({ title: 'Audit', mode: 'bench' });
  start(session, creation.id);
  const memo = { last: '' };
  creation.tutorial.forEach((step) => {
    doStep(session, creation, step, mode, memo);
    confirm(session, creation);
  });
  const state = lab.tutorialState(session, creation);
  return { complete: Boolean(state && state.complete), current: state ? state.current : 0, feedback: state && state.feedback };
}

function dirty(creation) {
  const session = lab.emptySession({ title: 'Used bench', mode: 'bench' });
  lab.addToContainer(session, 'beaker-a', 'water', 60);
  lab.addToContainer(session, 'beaker-a', 'nacl', 10);
  lab.addToContainer(session, 'flask-b', 'water', 50);
  lab.addToContainer(session, 'flask-b', 'citric_acid', 6);
  lab.addToContainer(session, 'flask-b', 'bicarbonate', 7.3);
  lab.measure(session, 'flask-b', 'ph');
  session.stirred = true;
  // «Continue anyway» on a used bench (before the fix: the only way there was).
  const kept = JSON.parse(JSON.stringify(session));
  start(kept, creation.id, true);
  const before = lab.tutorialState(kept, creation);
  const opensAt = before ? before.current : 0;
  start(session, creation.id);
  const after = lab.tutorialState(session, creation);
  const residue = session.containers.some((row) => (row.contents || []).length > 0);
  return { opensAtWithoutCleaning: opensAt, opensAt: after ? after.current : 0, residue };
}

// Imported by tools/test-lab-poe.mjs for the step walker; prints only when run.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const rows = !isMain ? [] : lab.CREATIONS.map((creation) => {
  const ok = walk(creation, 'correct');
  const bad = walk(creation, 'sloppy');
  const used = dirty(creation);
  const objectives = Boolean(creation.learningObjectives && creation.learningObjectives.en && creation.learningObjectives.pt);
  const missingWhy = creation.tutorial.filter((step) => !step.why).length;
  return {
    id: creation.id,
    steps: creation.tutorial.length,
    correct: ok.complete,
    sloppy: bad.complete,
    sloppyAt: bad.current,
    opensAtWithoutCleaning: used.opensAtWithoutCleaning,
    opensAt: used.opensAt,
    residue: used.residue,
    objectives,
    missingWhy
  };
});

const yes = (value) => (value ? 'sim' : 'não');
if (isMain) console.log('| Guia | Passos | Correto conclui? | Sem cumprir o objetivo conclui? | Para no passo | Bancada usada, sem limpar: abre no passo | Bancada usada, opção padrão: abre no passo | Resíduo fica na bancada? | `learningObjectives` | Passos sem `why` |');
if (isMain) console.log('|---|---|---|---|---|---|---|---|---|---|');
rows.forEach((row) => {
  console.log(`| ${row.id} | ${row.steps} | ${yes(row.correct)} | ${yes(row.sloppy)} | ${row.sloppy ? '—' : row.sloppyAt + 1} | ${row.opensAtWithoutCleaning + 1} | ${row.opensAt + 1} | ${yes(row.residue)} | ${yes(row.objectives)} | ${row.missingWhy} |`);
});

if (isMain && process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
