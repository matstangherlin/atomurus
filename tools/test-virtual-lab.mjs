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
// A mortar alone grinds nothing: the pestle has to be fitted into it.
assert.equal(lab.grind(mortar, mortarId).reason, 'no-pestle');
assert.equal(lab.addVessel(mortar, 'pestle').ok, true);
const pestleId = mortar.containers.find((row) => row.type === 'pestle').id;
assert.equal(lab.attachTool(mortar, pestleId, mortarId).kind, 'grind');
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

// Every piece is drawn, and every container declares a real inner cavity.
const holders = Object.keys(lab.EQUIPMENT).filter((id) => lab.canHold({ type: id, capacityMl: lab.EQUIPMENT[id].capacityMl }));
assert.ok(holders.length >= 15);
for (const id of Object.keys(lab.EQUIPMENT)) {
  const drawn = lab.VESSEL_ART[id];
  assert.ok(drawn, `${id} has no drawing`);
  assert.ok(drawn.glass.indexOf('<') === 0, `${id} glass must be svg markup`);
  assert.ok(drawn.fillBottom > drawn.fillTop, `${id} cavity must have height`);
  if (holders.includes(id)) {
    assert.ok(drawn.cavity.indexOf('<') === 0, `${id} must declare a cavity to clip liquid to`);
  }
}

// Fill maps onto the cavity, clamped at both ends and monotonic in between.
for (const id of holders) {
  const drawn = lab.VESSEL_ART[id];
  const empty = lab.fillGeometry(id, 0);
  const full = lab.fillGeometry(id, 100);
  assert.equal(empty.height, 0, `${id} empty`);
  assert.equal(Math.round(full.y), Math.round(drawn.fillTop), `${id} full reaches the cavity top`);
  assert.equal(lab.fillGeometry(id, -50).height, 0, `${id} clamps below zero`);
  assert.equal(lab.fillGeometry(id, 500).height, full.height, `${id} clamps above full`);
  let previous = -1;
  for (let pct = 0; pct <= 100; pct += 10) {
    const step = lab.fillGeometry(id, pct).height;
    assert.ok(step >= previous, `${id} fill must not go backwards`);
    previous = step;
  }
}

// A sphere is symmetric, so half its volume is half its height, but a quarter
// of the volume sits well above a quarter of the height.
const bulbSpan = lab.VESSEL_ART['round-flask'].fillBottom - lab.VESSEL_ART['round-flask'].fillTop;
assert.equal(Math.round(lab.fillGeometry('round-flask', 50).height / bulbSpan * 100), 50);
assert.ok(lab.fillGeometry('round-flask', 25).height / bulbSpan > 0.3);
assert.ok(lab.fillGeometry('round-flask', 25).height / bulbSpan < 0.36);
// A straight-walled vessel stays linear.
const beakerSpan = lab.VESSEL_ART.beaker.fillBottom - lab.VESSEL_ART.beaker.fillTop;
assert.equal(Math.round(lab.fillGeometry('beaker', 25).height / beakerSpan * 100), 25);

// The rendered piece clips liquid to that cavity and reports its level.
const glassSession = lab.emptySession({ title: 'Glass', mode: 'bench' });
const emptyBeaker = lab.vesselSvg(glassSession.containers[0], {});
assert.ok(emptyBeaker.indexOf('lab-liquid') === -1, 'an empty vessel draws no liquid');
assert.ok(emptyBeaker.indexOf('lab-svg-glass') !== -1);
lab.addToContainer(glassSession, 'beaker-a', 'water', 120);
const wet = lab.vesselSvg(glassSession.containers[0], { warm: true, sediment: 10 });
assert.ok(wet.indexOf('clipPath') !== -1, 'liquid is clipped to the cavity');
assert.ok(wet.indexOf('clip-path="url(#labv-beaker-a-cav)"') !== -1);
assert.ok(/data-fill="\d+"/.test(wet), 'level is readable from the markup');
assert.ok(wet.indexOf('lab-svg-vapor') !== -1, 'a warm vessel steams');
assert.ok(wet.indexOf('lab-svg-sediment') !== -1);

// A burner only shows a lit flame when it is actually lit.
const burner = lab.emptySession({ title: 'Burner', mode: 'bench' });
lab.addVessel(burner, 'bunsen');
const bunsenRow = burner.containers.find((row) => row.type === 'bunsen');
assert.ok(lab.vesselSvg(bunsenRow, { lit: false }).indexOf('is-off') !== -1);
assert.ok(lab.vesselSvg(bunsenRow, { lit: true }).indexOf('is-lit') !== -1);

// Colour comes from stored state, so it is sanitised before reaching the SVG.
const tampered = lab.vesselSvg(glassSession.containers[0], { color: '"/><script>alert(1)</script>' });
assert.ok(tampered.indexOf('<script') === -1, 'stored colour cannot inject markup');
assert.ok(tampered.indexOf('fill="#7EB6D9"') !== -1, 'a rejected colour falls back');

// Oil over water is drawn as two layers, not one blended block.
const twoPhase = lab.emptySession({ title: 'Phases', mode: 'bench' });
lab.addToContainer(twoPhase, 'beaker-a', 'water', 40);
lab.addToContainer(twoPhase, 'beaker-a', 'oil', 30);
const phased = twoPhase.containers[0];
assert.equal(phased.phases.length, 2);
assert.ok(lab.vesselSvg(phased, { phases: phased.phases }).indexOf('lab-svg-phase') !== -1);

// Reactions are registry entries, matched on reactants and state.
assert.ok(lab.REACTIONS['fe-cu'] && lab.REACTIONS['fe-cu'].equation.includes('CuSO'));
for (const id of Object.keys(lab.REACTIONS)) {
  const model = lab.REACTIONS[id];
  assert.ok(model.equation && model.en && model.pt, `${id} needs an equation and copy`);
  assert.ok(model.reactants.length >= 2, `${id} needs reactants`);
  for (const reactant of model.reactants) {
    assert.ok(lab.SUBSTANCES[reactant], `${id} names unknown reactant ${reactant}`);
  }
}
// A dry mixture does not react; the same reactants in water do.
assert.equal(lab.reactionFor({ contents: [{ id: 'fe', amount: 5 }, { id: 'cusulfate', amount: 5 }], volumeMl: 0 }), null);
const wetPair = { contents: [{ id: 'fe', amount: 5 }, { id: 'cusulfate', amount: 5 }], volumeMl: 40 };
assert.equal(lab.reactionFor(wetPair).id, 'fe-cu');

// Adding the last reactant reports the reaction once, with the equation logged.
const react = lab.emptySession({ title: 'React', mode: 'bench' });
lab.addToContainer(react, 'beaker-a', 'water', 60);
lab.addToContainer(react, 'beaker-a', 'cusulfate', 8);
assert.equal(react.containers[0].reactionId, '');
const fired = lab.addToContainer(react, 'beaker-a', 'fe', 5);
assert.equal(fired.reaction.id, 'fe-cu');
assert.equal(react.containers[0].reactionId, 'fe-cu');
assert.equal(react.containers[0].color, '#8FA98A', 'the blue solution fades');
// The vessel is renamed after what the reaction actually leaves behind.
assert.equal(react.containers[0].productId, 'feso4');
assert.ok(react.containers[0].appearance.includes('copper'));
// Reactions that only recolour keep the mixture's own name.
assert.equal(lab.REACTIONS['indicator-acid'].product, undefined);
assert.ok(react.observations.some((row) => row.text.includes('Fe + CuSO')));
// A second addition of the same reactant does not re-announce it.
assert.equal(lab.addToContainer(react, 'beaker-a', 'fe', 1).reaction, null);

// Heating is bounded by the equipment under the vessel.
const still = lab.emptySession({ title: 'Still', mode: 'bench' });
for (const type of ['round-flask', 'condenser', 'receiving-flask', 'heating-mantle']) {
  assert.equal(lab.addVessel(still, type).ok, true);
}
const stillFlask = still.containers.find((row) => row.type === 'round-flask');
assert.equal(lab.maxTemperatureFor(still, still.containers[0]), 95, 'a bench vessel stays virtual-safe');
assert.equal(lab.distillSetup(still, stillFlask.id), null, 'unconnected glassware is not a still');

// Assembling connects the train and puts the mantle under the flask.
const rigged = lab.assembleRig(still);
assert.equal(rigged.ok, true);
assert.ok(lab.distillSetup(still, stillFlask.id), 'the train is now a still');
assert.equal(lab.maxTemperatureFor(still, stillFlask), 250, 'a mantle reaches distillation heat');

// A still needs a mixture and enough heat before it runs.
assert.equal(lab.distill(still, stillFlask.id).reason, 'single');
lab.addToContainer(still, stillFlask.id, 'water', 60);
lab.addToContainer(still, stillFlask.id, 'ethanol', 40);
assert.equal(lab.distill(still, stillFlask.id).reason, 'cold');
assert.equal(lab.setTemperature(still, stillFlask.id, 80).ok, true);
assert.equal(stillFlask.temperatureC, 80);

// The lower-boiling component comes across, capped by the azeotrope.
const run = lab.distill(still, stillFlask.id);
assert.equal(run.ok, true);
assert.equal(run.bp, 78, 'ethanol leads');
assert.ok(run.moved > 0);
assert.ok(run.carry > 0, 'water is carried over');
assert.ok(run.purity > 90 && run.purity <= 95.5, `simple distillation cannot beat the azeotrope, got ${run.purity}`);
const receiver = still.containers.find((row) => row.type === 'receiving-flask');
assert.ok(receiver.contents.some((row) => row.id === 'ethanol'));
assert.ok(receiver.contents.some((row) => row.id === 'water'));
assert.ok(stillFlask.volumeMl < 100, 'the still pot loses what came over');
assert.ok(still.observations.some((row) => row.text.toLowerCase().includes('azeotrop') || row.text.toLowerCase().includes('azeótropo')));

// Mass balance: nothing is created or destroyed by the transfer.
const total = stillFlask.volumeMl + receiver.volumeMl;
assert.ok(Math.abs(total - 100) < 0.5, `volume should be conserved, got ${total}`);

// The guided distillation walks the same apparatus.
const stillGuide = lab.CREATIONS.find((row) => row.id === 'distillation');
assert.ok(stillGuide && stillGuide.tutorial.length === 8);
assert.equal(lab.stepPlan(stillGuide, 4).into, 'round-flask', 'the charge goes into the flask, not any beaker');
assert.equal(lab.stepPlan(stillGuide, 5).needsConnect, true);
assert.equal(lab.stepPlan(stillGuide, 6).heatTo, 80);
assert.equal(lab.stepPlan(stillGuide, 7).needsDistill, true);
const walk = lab.emptySession({ title: 'Walk', mode: 'guided', creationId: 'distillation' });
assert.equal(lab.tutorialState(walk, stillGuide).current, 0);
for (const type of ['round-flask', 'condenser', 'receiving-flask', 'heating-mantle']) lab.addVessel(walk, type);
assert.equal(lab.tutorialState(walk, stillGuide).current, 4);
const walkFlask = walk.containers.find((row) => row.type === 'round-flask');
lab.addToContainer(walk, walkFlask.id, 'water', 60);
lab.addToContainer(walk, walkFlask.id, 'ethanol', 40);
assert.equal(lab.tutorialState(walk, stillGuide).current, 5);
lab.assembleRig(walk);
assert.equal(lab.tutorialState(walk, stillGuide).current, 6);
lab.setTemperature(walk, walkFlask.id, 80);
assert.equal(lab.tutorialState(walk, stillGuide).current, 7);
assert.equal(lab.distill(walk, walkFlask.id).ok, true);
assert.equal(lab.tutorialState(walk, stillGuide).complete, true);

// Petroleum stays a conceptual separation, and gasoline resolves to it.
const crude = lab.CREATIONS.find((row) => row.id === 'petroleum');
assert.equal(crude.safetyClass, 'conceptual');
assert.ok(/not a procedure/i.test(crude.lede.en));
assert.equal(lab.resolveQuery('gasolina').id, 'petroleum');
assert.equal(lab.resolveQuery('petroleum').kind, 'creation');
assert.equal(lab.resolveQuery('alcool').id, 'ethanol');
assert.ok(lab.READY.some((row) => row.id === 'crude_ready'));
// The tower is stored bottom-up, the way the column is fed and drawn off.
assert.equal(crude.fractions.length, 6);
assert.deepEqual(crude.fractions.map((row) => row.id),
  ['residue', 'lubricant', 'fuel-oil', 'kerosene', 'gasoline', 'gas']);
for (let i = 1; i < crude.fractions.length; i += 1) {
  assert.ok(crude.fractions[i].bpFrom < crude.fractions[i - 1].bpFrom,
    'fractions must climb the tower as their boiling range falls');
}
assert.ok(crude.fractions.every((row) => row.en && row.pt));
// Still deny-by-default after all the new vocabulary.
assert.equal(lab.resolveQuery('moonshine').ok, false);
assert.equal(lab.addToContainer(still, stillFlask.id, 'gasoline', 10).ok, false);

// Tools clip onto hosts by rule, not by proximity alone.
const fitSession = lab.emptySession({ title: 'Fit', mode: 'bench' });
for (const type of ['mortar', 'pestle', 'funnel', 'thermometer', 'ph-meter', 'pipette-volumetric', 'pipettor']) {
  assert.equal(lab.addVessel(fitSession, type).ok, true);
}
const pick = (type) => fitSession.containers.find((row) => row.type === type);
assert.equal(lab.attachRuleFor('pestle', pick('mortar')).kind, 'grind');
assert.equal(lab.attachRuleFor('pestle', fitSession.containers[0]), null, 'a pestle does not clip into a beaker');
assert.equal(lab.attachRuleFor('thermometer', fitSession.containers[0]).reads, 'temperature');
assert.equal(lab.attachRuleFor('thermometer', pick('pestle')), null, 'a probe needs something that holds a sample');
assert.equal(lab.attachRuleFor('funnel', pick('pestle')), null);
assert.equal(lab.attachRuleFor('pipettor', pick('pipette-volumetric')).kind, 'filler');
for (const rule of lab.ATTACH_RULES) {
  assert.ok(lab.EQUIPMENT[rule.tool], `attach rule names unknown tool ${rule.tool}`);
  if (rule.host) assert.ok(lab.EQUIPMENT[rule.host], `attach rule names unknown host ${rule.host}`);
}

// Attaching records the link and moves the tool onto its host.
assert.equal(lab.attachTool(fitSession, pick('pestle').id, fitSession.containers[0].id).ok, false);
const fitted = lab.attachTool(fitSession, pick('thermometer').id, fitSession.containers[0].id);
assert.equal(fitted.ok, true);
assert.equal(lab.attachmentOf(fitSession, pick('thermometer').id).kind, 'probe');
assert.equal(lab.attachmentsOn(fitSession, fitSession.containers[0].id).length, 1);
const hostObj = fitSession.board.objects.find((row) => row.id === fitSession.containers[0].id);
const toolObj = fitSession.board.objects.find((row) => row.id === pick('thermometer').id);
const probeRule = lab.ATTACH_RULES.find((row) => row.tool === 'thermometer');
assert.equal(toolObj.x - hostObj.x, probeRule.dx);
assert.equal(toolObj.y - hostObj.y, probeRule.dy);
// A tool only fits one host at a time.
assert.equal(lab.attachTool(fitSession, pick('thermometer').id, fitSession.containers[1].id).ok, true);
assert.equal(lab.attachmentsOn(fitSession, fitSession.containers[0].id).length, 0);
assert.equal(lab.detachTool(fitSession, pick('thermometer').id), true);
assert.equal(lab.attachmentOf(fitSession, pick('thermometer').id), null);

// Snapping only reaches a host that is actually near.
const snapSession = lab.emptySession({ title: 'Snap', mode: 'bench' });
lab.addVessel(snapSession, 'mortar');
lab.addVessel(snapSession, 'pestle');
const snapMortar = snapSession.containers.find((row) => row.type === 'mortar');
const snapPestle = snapSession.containers.find((row) => row.type === 'pestle');
const mortarObj = snapSession.board.objects.find((row) => row.id === snapMortar.id);
const pestleObj = snapSession.board.objects.find((row) => row.id === snapPestle.id);
pestleObj.x = mortarObj.x + 600;
pestleObj.y = mortarObj.y;
assert.equal(lab.snapTargetFor(snapSession, snapPestle.id), null, 'far away is no snap');
pestleObj.x = mortarObj.x + 10;
pestleObj.y = mortarObj.y - 24;
const near = lab.snapTargetFor(snapSession, snapPestle.id);
assert.ok(near && near.host.id === snapMortar.id);
assert.ok(near.distance < 20);

// A funnel is a route: what goes in lands in the vessel under it.
const route = lab.emptySession({ title: 'Route', mode: 'bench' });
lab.addVessel(route, 'funnel');
const routeFunnel = route.containers.find((row) => row.type === 'funnel');
assert.equal(lab.routeTarget(route, routeFunnel).id, routeFunnel.id, 'an unattached funnel keeps what it gets');
assert.equal(lab.attachTool(route, routeFunnel.id, 'flask-b').kind, 'funnel');
assert.equal(lab.routeTarget(route, routeFunnel).id, 'flask-b');
assert.equal(lab.addToContainer(route, routeFunnel.id, 'water', 30).ok, true);
assert.equal(Number(routeFunnel.volumeMl) || 0, 0, 'nothing stays in the funnel');
assert.equal(route.containers.find((row) => row.id === 'flask-b').volumeMl, 30);
// Removing the host takes the attachment with it.
assert.equal(lab.removeObject(route, 'flask-b').ok, true);
assert.equal(lab.attachmentOf(route, routeFunnel.id), null);

// A volumetric pipette takes its nominal volume or refuses, and says so.
const exact = lab.emptySession({ title: 'Exact', mode: 'bench' });
assert.equal(lab.addVessel(exact, 'pipette-volumetric').ok, true);
const exactPip = exact.containers.find((row) => row.type === 'pipette-volumetric');
const nominal = lab.EQUIPMENT['pipette-volumetric'].nominalVolumeMl;
assert.ok(nominal > 0);
assert.equal(lab.addToContainer(exact, 'beaker-a', 'water', nominal - 5).ok, true);
const short = lab.aspirate(exact, exactPip.id, 'beaker-a');
assert.equal(short.ok, false);
assert.equal(short.reason, 'short');
assert.equal(short.need, nominal);
assert.equal(lab.addToContainer(exact, 'beaker-a', 'water', 20).ok, true);
const exactDraw = lab.aspirate(exact, exactPip.id, 'beaker-a', 13.42);
assert.equal(exactDraw.ok, true);
assert.equal(exactPip.volumeMl, nominal, 'it takes the nominal volume, never 13.42 mL');

// A fitted instrument is drawn as the part that goes in the vessel.
const probeArt = lab.VESSEL_ART.thermometer;
assert.ok(probeArt.fitted && probeArt.fitted !== probeArt.glass);
const loose = lab.emptySession({ title: 'Probe', mode: 'bench' });
lab.addVessel(loose, 'thermometer');
const probePiece = loose.containers.find((row) => row.type === 'thermometer');
assert.notEqual(lab.vesselSvg(probePiece, { fitted: true }), lab.vesselSvg(probePiece, { fitted: false }));
assert.ok(lab.vesselSvg(probePiece, { fitted: true }).indexOf('lab-svg-marks') === -1,
  'a fitted probe drops the scale it cannot show at that size');
for (const id of ['thermometer', 'ph-meter', 'funnel']) {
  assert.ok(lab.VESSEL_ART[id].fitted, `${id} needs a fitted drawing`);
}

// Filtering keeps what will not dissolve and lets the rest run through.
assert.equal(lab.passesFilter(lab.SUBSTANCES.water), true);
assert.equal(lab.passesFilter(lab.SUBSTANCES.nacl), true, 'salt dissolves and passes');
assert.equal(lab.passesFilter(lab.SUBSTANCES.sucrose), true);
assert.equal(lab.passesFilter(lab.SUBSTANCES.fe), false, 'iron stays on the filter');
assert.equal(lab.passesFilter(lab.SUBSTANCES.zno), false);

const filterSession = lab.emptySession({ title: 'Filter', mode: 'bench' });
assert.equal(lab.addVessel(filterSession, 'funnel').ok, true);
const filterFunnel = filterSession.containers.find((row) => row.type === 'funnel');
assert.equal(lab.filterSetup(filterSession, 'beaker-a'), null, 'a loose funnel is not a filter rig');
assert.equal(lab.attachTool(filterSession, filterFunnel.id, 'flask-b').kind, 'funnel');
assert.ok(lab.filterSetup(filterSession, 'beaker-a'));
assert.equal(lab.filterThrough(filterSession, 'beaker-a').reason, 'empty');
lab.addToContainer(filterSession, 'beaker-a', 'water', 60);
lab.addToContainer(filterSession, 'beaker-a', 'nacl', 5);
assert.equal(lab.filterThrough(filterSession, 'beaker-a').reason, 'nothing-to-retain');
lab.addToContainer(filterSession, 'beaker-a', 'fe', 8);
const filtered = lab.filterThrough(filterSession, 'beaker-a');
assert.equal(filtered.ok, true);
assert.deepEqual(filtered.retained.map((row) => row.id), ['fe']);
assert.deepEqual(filterFunnel.contents.map((row) => row.id), ['fe'], 'the residue is on the filter');
const filtrate = filterSession.containers.find((row) => row.id === 'flask-b');
assert.equal(filtrate.volumeMl, 60);
assert.ok(filtrate.contents.some((row) => row.id === 'nacl'), 'dissolved salt goes through with the water');
assert.ok(!filtrate.contents.some((row) => row.id === 'fe'));
assert.equal(filterSession.containers[0].volumeMl, 0, 'the source is poured out');
assert.ok(filterSession.observations.some((row) => /Filtered|Filtrou/.test(row.text)));
// Filtering into a vessel with no room is refused rather than overfilled.
const tight = lab.emptySession({ title: 'Tight', mode: 'bench' });
lab.addVessel(tight, 'funnel');
const tightFunnel = tight.containers.find((row) => row.type === 'funnel');
lab.attachTool(tight, tightFunnel.id, 'cylinder-c');
lab.addToContainer(tight, 'beaker-a', 'water', 200);
lab.addToContainer(tight, 'beaker-a', 'fe', 5);
assert.equal(lab.filterThrough(tight, 'beaker-a').reason, 'receiver-full');
assert.equal(tight.containers[0].volumeMl, 200, 'a refused filter changes nothing');

// The board holds a full bench, not an arbitrary handful.
const roomy = lab.emptySession({ title: 'Roomy', mode: 'bench' });
let seated = 0;
while (lab.addVessel(roomy, 'test-tube').ok) seated += 1;
assert.ok(roomy.containers.length >= 100, `the board should take 100 pieces, took ${roomy.containers.length}`);
assert.equal(lab.addVessel(roomy, 'beaker').reason, 'limit', 'and still has a ceiling');

// One pass finds every cuppedSet heater, instead of one pass per heater.
const heat = lab.emptySession({ title: 'Heat', mode: 'bench' });
lab.addVessel(heat, 'round-flask');
lab.addVessel(heat, 'heating-mantle');
lab.addVessel(heat, 'bunsen');
const heatFlask = heat.containers.find((row) => row.type === 'round-flask');
const mantlePiece = heat.containers.find((row) => row.type === 'heating-mantle');
const idleBurner = heat.containers.find((row) => row.type === 'bunsen');
const flaskObj = heat.board.objects.find((row) => row.id === heatFlask.id);
const mantleObj = heat.board.objects.find((row) => row.id === mantlePiece.id);
mantleObj.x = flaskObj.x;
mantleObj.y = flaskObj.y + 34;
const cuppedSet = lab.cuppedHeaterIds(heat);
assert.equal(cuppedSet[mantlePiece.id], true, 'the mantle under the flask is cuppedSet');
assert.equal(cuppedSet[idleBurner.id], undefined, 'the idle burner is not');

console.log('virtual lab tests passed');
