import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lab = require('../assets/lab/virtual-lab.js');

assert.equal(lab.resolveQuery('water').ok, true);
assert.equal(lab.resolveQuery('water').kind, 'substance');
assert.equal(lab.resolveQuery('h2o').id, 'water');
assert.equal(lab.resolveQuery('diamond').kind, 'creation');
assert.equal(lab.resolveQuery('perfume').id, 'fragrance');
assert.equal(lab.resolveQuery('cocaine').ok, false);
assert.equal(lab.resolveQuery('cocaine').reason, 'unavailable');
assert.equal(lab.resolveQuery('cocaina').reason, 'unavailable');
assert.equal(lab.resolveQuery('tnt').reason, 'unavailable');
assert.equal(lab.resolveQuery('unknownium').reason, 'unknown');
assert.equal(lab.resolveQuery('methamphetamine').ok, false);

const denied = lab.searchCatalog('explosivo');
assert.equal(denied.status, 'unavailable');

const unknown = lab.searchCatalog('plutonium-core');
assert.equal(unknown.status, 'unknown');

const allowed = lab.searchCatalog('water');
assert.equal(allowed.status, 'ok');
assert.ok(allowed.items.some((row) => row.type === 'substance' && row.row.id === 'water'));

function findVol(session, id) {
  const row = session.containers.find((item) => item.id === id);
  return row ? Number(row.volumeMl) || 0 : 0;
}

const session = lab.emptySession({ title: 'Open Bench', mode: 'bench' });
assert.equal(session.containers.length, 3);
assert.equal(lab.addToContainer(session, 'beaker-a', 'cocaine', 10).ok, false);
assert.equal(lab.addToContainer(session, 'beaker-a', 'tnt', 1).ok, false);
const added = lab.addToContainer(session, 'beaker-a', 'water', 10);
assert.equal(added.ok, true);
assert.equal(lab.addToContainer(session, 'beaker-a', 'not-a-substance', 5).ok, false);
const poured = lab.pour(session, 'beaker-a', 'flask-b', 5);
assert.equal(poured.ok, true);
assert.equal(findVol(session, 'flask-b') > 0, true);
const extra = lab.addVessel(session, 'beaker');
assert.equal(extra.ok, true);
assert.ok(session.containers.length >= 4);
assert.equal(lab.setTemperature(session, 'beaker-a', 40).ok, true);
const ph = lab.measure(session, 'beaker-a', 'ph');
assert.equal(ph.ok, true);
assert.equal(typeof ph.row.value, 'number');

const mix = lab.emptySession({ title: 'Mix', mode: 'bench' });
assert.equal(lab.addToContainer(mix, 'beaker-a', 'water', 50).ok, true);
assert.ok(lab.visualFillPct(mix.containers[0]) >= 18);
assert.equal(lab.addToContainer(mix, 'beaker-a', 'nacl', 10).ok, true);
assert.equal(mix.containers[0].productId, 'saline');
assert.equal(lab.emptyContainer(mix, 'beaker-a').ok, true);
assert.equal(findVol(mix, 'beaker-a'), 0);

const full = lab.emptySession({ title: 'Full', mode: 'bench' });
assert.equal(lab.addToContainer(full, 'beaker-a', 'water', 250).ok, true);
assert.equal(lab.addToContainer(full, 'beaker-a', 'water', 10).ok, false);
assert.equal(lab.addToContainer(full, 'beaker-a', 'water', 10).reason, 'full');

const fizz = lab.emptySession({ title: 'Fizz', mode: 'bench' });
assert.equal(lab.addToContainer(fizz, 'beaker-a', 'water', 40).ok, true);
assert.equal(lab.addToContainer(fizz, 'beaker-a', 'citric_acid', 10).ok, true);
assert.equal(lab.addToContainer(fizz, 'beaker-a', 'bicarbonate', 10).ok, true);
assert.equal(fizz.containers[0].productId, 'fizz');
assert.equal(fizz.containers[0].fizz, true);

const copper = lab.emptySession({ title: 'Copper', mode: 'bench' });
assert.equal(lab.addToContainer(copper, 'flask-b', 'water', 40).ok, true);
assert.equal(lab.addToContainer(copper, 'flask-b', 'cusulfate', 8).ok, true);
assert.equal(copper.containers.find((row) => row.id === 'flask-b').productId, 'cu-sol');

const saved = lab.saveSession(session);
assert.equal(saved.id, session.id);
assert.ok(Array.isArray(lab.CREATIONS));
assert.equal(lab.resolveQuery('sunscreen').kind, 'creation');
assert.equal(lab.resolveQuery('sunscreen').id, 'sunscreen');
assert.equal(lab.resolveQuery('protetor solar').id, 'sunscreen');
assert.ok(lab.CREATIONS.some((row) => row.id === 'sunscreen' && Array.isArray(row.tutorial)));
assert.equal(lab.canHold({ type: 'beaker', capacityMl: 250 }), true);
assert.equal(lab.canHold({ type: 'bunsen', capacityMl: 0 }), false);
assert.ok(lab.EQUIPMENT['test-tube']);
assert.ok(lab.EQUIPMENT['separatory-funnel']);
assert.ok(lab.READY.some((row) => row.id === 'sunscreen_ready'));

const extraGlass = lab.emptySession({ title: 'Glass', mode: 'bench' });
assert.equal(lab.addVessel(extraGlass, 'test-tube').ok, true);
assert.equal(lab.addVessel(extraGlass, 'bunsen').ok, true);
assert.equal(lab.addToContainer(extraGlass, extraGlass.containers.find((row) => row.type === 'bunsen').id, 'water', 10).ok, false);

const lotion = lab.emptySession({ title: 'Sunscreen', mode: 'bench', creationId: 'sunscreen' });
assert.equal(lab.addToContainer(lotion, 'beaker-a', 'water', 20).ok, true);
assert.equal(lab.addToContainer(lotion, 'beaker-a', 'oil', 15).ok, true);
assert.equal(lab.addToContainer(lotion, 'beaker-a', 'zno', 8).ok, true);
assert.equal(lotion.containers[0].productId, 'sunscreen');
lotion.creationId = 'sunscreen';
const sunscreen = lab.CREATIONS.find((row) => row.id === 'sunscreen');
lotion.stirred = true;
const guide = lab.tutorialState(lotion, sunscreen);
assert.equal(guide.complete, true);

const ready = lab.emptySession({ title: 'Ready', mode: 'bench' });
assert.equal(lab.addReady(ready, 'saline_ready', 'beaker-a').ok, true);
assert.equal(ready.containers[0].productId, 'saline');

assert.equal(lab.addToContainer(session, 'beaker-a', 'cocaine', 10).ok, false);

assert.equal(session.schemaVersion, 2);
assert.ok(session.board && session.board.camera);
assert.ok(Array.isArray(session.board.objects));
assert.ok(session.board.objects.some((row) => row.id === 'beaker-a'));
assert.ok(lab.PROCESSES.pour.allowed);
assert.equal(lab.hasCap({ type: 'beaker' }, 'contain'), true);
assert.equal(lab.hasCap({ type: 'bunsen' }, 'contain'), false);
assert.ok(lab.EQUIPMENT['round-flask']);
assert.ok(lab.EQUIPMENT.pestle);
assert.ok(lab.EQUIPMENT['heating-gauze'].labelEn.indexOf('Ceramic') !== -1);

const pip = lab.emptySession({ title: 'Pipette' });
assert.equal(lab.addVessel(pip, 'pipette-volumetric').ok, true);
const pipetteId = pip.containers.find((row) => row.type === 'pipette-volumetric').id;
assert.equal(lab.addToContainer(pip, 'beaker-a', 'water', 40).ok, true);
assert.equal(lab.aspirate(pip, pipetteId, 'beaker-a').ok, true);
assert.equal(findVol(pip, pipetteId) > 0, true);
assert.equal(lab.dispense(pip, pipetteId, 'flask-b').ok, true);
assert.equal(findVol(pip, 'flask-b') > 0, true);

const board = lab.emptySession({ title: 'Board' });
lab.ensureBoard(board);
lab.duplicateObject(board, 'beaker-a');
assert.ok(board.containers.length >= 4);
assert.equal(lab.undoSession(board).ok, true);
assert.equal(lab.redoSession(board).ok, true);

const mortar = lab.emptySession({ title: 'Grind' });
assert.equal(lab.addVessel(mortar, 'mortar').ok, true);
const mortarId = mortar.containers.find((row) => row.type === 'mortar').id;
assert.equal(lab.addToContainer(mortar, mortarId, 'nacl', 5).ok, true);
assert.equal(lab.grind(mortar, mortarId).ok, true);

const link = lab.emptySession({ title: 'Connect' });
assert.equal(lab.addVessel(link, 'round-flask').ok, true);
assert.equal(lab.addVessel(link, 'condenser').ok, true);
const roundId = link.containers.find((row) => row.type === 'round-flask').id;
const condId = link.containers.find((row) => row.type === 'condenser').id;
assert.equal(lab.connectPorts(link, roundId, 'neck', condId, 'inlet').ok, true);
assert.ok(link.board.connections.length >= 1);

const burette = lab.emptySession({ title: 'Burette' });
assert.equal(lab.addVessel(burette, 'burette').ok, true);
const burId = burette.containers.find((row) => row.type === 'burette').id;
assert.equal(lab.addToContainer(burette, burId, 'water', 10).ok, true);
assert.equal(lab.drop(burette, burId, 'beaker-a').ok, true);
assert.equal(findVol(burette, 'beaker-a'), 1);
assert.equal(findVol(burette, burId), 9);
assert.equal(lab.drop(burette, 'beaker-a', burId).ok, false);
assert.equal(lab.addToContainer(burette, 'beaker-a', 'cocaine', 1).ok, false);

const place = lab.emptySession({ title: 'Place' });
assert.equal(lab.addVessel(place, 'burette').ok, true);
assert.equal(lab.addVessel(place, 'condenser').ok, true);
const condObj = place.board.objects.find((row) => row.type === 'condenser') || place.containers.find((row) => row.type === 'condenser');
assert.ok(Number(condObj.y) >= 200 || Number(condObj.x) < 560);

assert.equal(lab.addToContainer(session, 'beaker-a', 'cocaine', 10).ok, false);

// Guided step plans drive the step-by-step panel.
const solution = lab.CREATIONS.find((row) => row.id === 'solution');
const waterStep = lab.stepPlan(solution, 1);
assert.equal(waterStep.action, 'addMaterial');
assert.equal(waterStep.materials.length, 1);
assert.equal(waterStep.materials[0].id, 'water');
assert.equal(waterStep.materials[0].amount, 60);
assert.equal(waterStep.materials[0].unit, 'mL');
assert.equal(waterStep.hints.length, 3);
assert.ok(waterStep.hints.every((hint) => hint.en && hint.pt));

const saltStep = lab.stepPlan(solution, 2);
assert.equal(saltStep.materials[0].id, 'nacl');
assert.equal(saltStep.materials[0].unit, 'g');
assert.equal(saltStep.needsStir, true);

const glassStep = lab.stepPlan(solution, 0);
assert.equal(glassStep.equipment[0].type, 'beaker');
assert.ok(glassStep.equipment[0].labelPt);

// needAny steps expose every approved alternative.
const lotionStep = lab.stepPlan(lab.CREATIONS.find((row) => row.id === 'sunscreen'), 1);
assert.deepEqual(lotionStep.options.map((row) => row.id), ['zno', 'tio2']);
assert.equal(lotionStep.materials.length, 0);

// Every catalog step must be renderable and stay inside the allowlist.
for (const creation of lab.CREATIONS) {
  for (let i = 0; i < creation.tutorial.length; i += 1) {
    const plan = lab.stepPlan(creation, i);
    assert.ok(plan, `${creation.id} step ${i}`);
    assert.ok(plan.text.en && plan.text.pt, `${creation.id} step ${i} copy`);
    assert.equal(plan.hints.length, 3);
    for (const row of plan.materials.concat(plan.options)) {
      assert.ok(lab.SUBSTANCES[row.id], `${creation.id} uses unknown ${row.id}`);
      assert.ok(row.amount > 0);
    }
    for (const row of plan.equipment) {
      assert.ok(lab.EQUIPMENT[row.type], `${creation.id} uses unknown equipment ${row.type}`);
    }
  }
}
assert.equal(lab.stepPlan(solution, 99), null);
assert.equal(lab.stepPlan(null, 0), null);

// Following a plan actually advances the guide.
const guided = lab.emptySession({ title: 'Guided', mode: 'guided', creationId: 'solution' });
assert.equal(lab.tutorialState(guided, solution).current, 1);
lab.addToContainer(guided, 'beaker-a', 'water', waterStep.materials[0].amount);
assert.equal(lab.tutorialState(guided, solution).current, 2);
lab.addToContainer(guided, 'beaker-a', 'nacl', saltStep.materials[0].amount);
guided.stirred = true;
assert.ok(lab.tutorialState(guided, solution).current >= 3);

// Sound preference is a stored toggle, never an autoplaying loop.
assert.equal(lab.SOUND_KEY, 'atomurus-lab-sound');
assert.equal(lab.soundEnabled(), true);
assert.ok(lab.SOUNDS.place && lab.SOUNDS.deny && lab.SOUNDS.step);
Object.keys(lab.SOUNDS).forEach((key) => {
  const cue = lab.SOUNDS[key];
  assert.ok(cue.dur > 0 && cue.dur <= 0.6, `${key} cue must be short`);
  assert.ok(cue.gain > 0 && cue.gain <= 0.2, `${key} cue must stay quiet`);
});
// No Web Audio in Node: playSound degrades to a no-op instead of throwing.
assert.equal(lab.playSound('place'), false);
assert.equal(lab.playSound('not-a-cue'), false);

// Mute round-trips through the same storage the UI toggle writes.
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key)
};
try {
  assert.equal(lab.soundEnabled(), true, 'sound defaults to on');
  assert.equal(lab.setSoundEnabled(false), false);
  assert.equal(store.get(lab.SOUND_KEY), '0');
  assert.equal(lab.soundEnabled(), false);
  assert.equal(lab.playSound('place'), false, 'muted cues never reach the mixer');
  assert.equal(lab.setSoundEnabled(true), true);
  assert.equal(lab.soundEnabled(), true);
} finally {
  delete globalThis.localStorage;
}

console.log('virtual lab tests passed');
