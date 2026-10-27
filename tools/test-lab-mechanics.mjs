// Guided Lab mechanics: clean bench, step checks, capacity, vessel limit,
// densities and the corrected guides. Engine only, no DOM.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lab = require('../assets/lab/virtual-lab.js');

const byId = (id) => lab.CREATIONS.find((row) => row.id === id);
const vessel = (session, id) => session.containers.find((row) => row.id === id);

// ── Clean bench ─────────────────────────────────────────────────────────────
{
  const session = lab.emptySession({ title: 'Used', mode: 'bench' });
  assert.equal(lab.benchIsDirty(session), false, 'a new board is clean');
  lab.addVessel(session, 'condenser');
  assert.equal(lab.benchIsDirty(session), false, 'empty glassware is not a leftover');
  lab.addToContainer(session, 'beaker-a', 'water', 60);
  lab.addToContainer(session, 'beaker-a', 'nacl', 10);
  assert.equal(lab.benchIsDirty(session), true);

  const started = lab.startGuide(session, 'solution');
  assert.equal(started.ok, true);
  assert.equal(started.cleaned, true, 'the default is a clean bench');
  assert.equal(lab.benchIsDirty(session), false);
  assert.equal(session.containers.length, 3, 'back to the three pieces a board starts with');
  assert.equal(session.creationId, 'solution');
  assert.equal(session.guide.usedBench, false);
  assert.ok(session.observations.some((row) => /Cleared the bench/.test(row.text)), 'the notebook keeps a line');

  assert.equal(lab.undoSession(session).ok, true, 'Undo brings the bench back');
  assert.equal(vessel(session, 'beaker-a').volumeMl, 60);
  assert.ok(session.containers.some((row) => row.type === 'condenser'));
}

{
  const session = lab.emptySession({ title: 'Kept', mode: 'bench' });
  lab.addToContainer(session, 'beaker-a', 'water', 60);
  const kept = lab.startGuide(session, 'solution', { keepBench: true });
  assert.equal(kept.cleaned, false);
  assert.equal(kept.usedBench, true, 'continuing anyway marks the guide');
  assert.equal(session.guide.usedBench, true);
  assert.equal(vessel(session, 'beaker-a').volumeMl, 60, 'and leaves the bench alone');
  assert.equal(lab.startGuide(session, 'not-a-guide').ok, false);
}

{
  // A clean bench never flags the guide, whatever the option says.
  const session = lab.emptySession({ title: 'Clean', mode: 'bench' });
  const started = lab.startGuide(session, 'ph', { keepBench: true });
  assert.equal(started.cleaned, false);
  assert.equal(started.usedBench, false);
}

// ── Pure verifiers ──────────────────────────────────────────────────────────
{
  const { CHECKS } = lab;
  const session = lab.emptySession({ title: 'Checks', mode: 'bench' });
  lab.addToContainer(session, 'beaker-a', 'water', 50);
  lab.addToContainer(session, 'beaker-a', 'citric_acid', 6);
  const ctx = { session, container: vessel(session, 'beaker-a'), guide: null };

  assert.equal(CHECKS.massEquals('citric_acid', 6, 0.3)(ctx), true);
  assert.equal(CHECKS.massEquals('citric_acid', 7, 0.3)(ctx), false);
  assert.equal(CHECKS.massAbove('citric_acid', 5.9)(ctx), true);
  assert.equal(CHECKS.volumeBetween(45, 55, 'water')(ctx), true);
  assert.equal(CHECKS.volumeBetween(55, 65, 'water')(ctx), false);
  assert.equal(CHECKS.volumeBetween(45, 55)(ctx), true, 'no id: the vessel volume');
  assert.equal(CHECKS.phBetween(1, 3)(ctx), true, 'citric acid in water is acidic');
  assert.equal(CHECKS.phBetween(6.5, 7.5)(ctx), false);
  assert.equal(CHECKS.phBetween(0, 14)({ session, container: vessel(session, 'flask-b') }), false, 'no liquid, no pH');
  assert.equal(CHECKS.hasEquipment(['beaker', 'flask'])(ctx), true);
  assert.equal(CHECKS.hasEquipment(['condenser'])(ctx), false);
  assert.equal(CHECKS.temperatureAtLeast(20)(ctx), true);
  assert.equal(CHECKS.temperatureAtLeast(40)(ctx), false);
  lab.setTemperature(session, 'beaker-a', 50);
  assert.equal(CHECKS.temperatureBetween(24, 40)(ctx), false);
  assert.equal(CHECKS.temperatureAbove(40)(ctx), true);
  assert.equal(CHECKS.measured('ph')(ctx), false);
  lab.measure(session, 'beaker-a', 'ph');
  assert.equal(CHECKS.measured('ph')(ctx), true);
  assert.equal(CHECKS.measured('ph')({ session, container: vessel(session, 'beaker-a'), guide: { measureFrom: 1 } }), false,
    'readings taken before the guide started do not count');

  // Every verifier explains itself in both languages, with a decimal comma in Portuguese.
  const explained = CHECKS.massEquals('citric_acid', 6.5, 0.1).explain(ctx);
  assert.match(explained.en, /Expected 6\.5 g of citric acid; this vessel has 6 g/);
  assert.match(explained.pt, /Esperado: 6,5 g de ácido cítrico; este recipiente tem 6 g/);
  for (const test of [
    CHECKS.volumeBetween(1, 2, 'water'), CHECKS.phBetween(6.5, 7.5), CHECKS.hasEquipment('condenser'),
    CHECKS.temperatureBetween(24, 40), CHECKS.temperatureAtLeast(60), CHECKS.measured('volume'),
    CHECKS.stillAssembled(), CHECKS.refluxAssembled(), CHECKS.massAbove('water', 100)
  ]) {
    const text = test.explain(ctx);
    assert.ok(text.en && text.pt && text.en !== text.pt, 'explain in EN and PT');
  }
  assert.match(CHECKS.phBetween(6.5, 7.5).explain(ctx).pt, /6,5 e 7,5/);
}

// ── A guide only completes when the state is right ──────────────────────────
// The same walk as tools/lab-guide-audit.mjs: the action of every step, but
// with 1 g / 1 mL instead of the asked amount.
function sloppySolution() {
  const session = lab.emptySession({ title: 'Sloppy', mode: 'bench' });
  lab.startGuide(session, 'solution');
  lab.addToContainer(session, 'beaker-a', 'water', 1);
  lab.addToContainer(session, 'beaker-a', 'nacl', 1);
  session.stirred = true;
  lab.measure(session, 'beaker-a', 'volume');
  return session;
}
{
  const solution = byId('solution');
  const sloppy = sloppySolution();
  const state = lab.tutorialState(sloppy, solution);
  assert.equal(state.complete, false, 'wrong amounts never complete the practice');
  assert.equal(state.current, 1, 'it stops at the water step');
  assert.ok(state.feedback, 'and says why');
  assert.match(state.feedback.en, /Expected 55–65 mL of water; this vessel has 1 mL/);
  assert.match(state.feedback.pt, /55–65 mL de água/);

  const right = lab.emptySession({ title: 'Right', mode: 'bench' });
  lab.startGuide(right, 'solution');
  lab.addToContainer(right, 'beaker-a', 'water', 60);
  assert.equal(lab.tutorialState(right, solution).current, 2);
  lab.addToContainer(right, 'beaker-a', 'nacl', 10);
  right.stirred = true;
  const reading = lab.tutorialState(right, solution);
  assert.equal(reading.current, 3, 'the last step waits for a reading');
  assert.match(reading.feedback.en, /Measure the volume/);
  lab.measure(right, 'beaker-a', 'volume');
  assert.equal(lab.tutorialState(right, solution).complete, true);
}

// Every guide, walked with the wrong amounts, stops with feedback.
{
  const sloppy = [];
  for (const creation of lab.CREATIONS) {
    const session = lab.emptySession({ title: 'Sloppy ' + creation.id, mode: 'bench' });
    lab.startGuide(session, creation.id);
    let host = vessel(session, 'beaker-a');
    for (const step of creation.tutorial) {
      (step.needEquipment || []).forEach((type) => { if (!lab.firstOfType(session, type)) lab.addVessel(session, type); });
      if (step.action !== 'addMaterial') continue;
      if (step.into) {
        if (!lab.firstOfType(session, step.into)) lab.addVessel(session, step.into);
        host = lab.firstOfType(session, step.into);
      }
      const ids = step.need ? Object.keys(step.need) : step.needAny.slice(0, 1);
      ids.forEach((id) => lab.addToContainer(session, host.id, id, 1));
    }
    const state = lab.tutorialState(session, creation);
    assert.equal(state.complete, false, `${creation.id} completes with 1 g / 1 mL`);
    if (state.feedback) sloppy.push(creation.id);
  }
  assert.equal(sloppy.length, lab.CREATIONS.length, 'each of the guides explains the first wrong amount: ' + sloppy.join(', '));
}

// Using a material up later does not undo a step that was done right.
{
  const brewGuide = byId('ethanol');
  const session = lab.emptySession({ title: 'Brew', mode: 'bench' });
  lab.startGuide(session, 'ethanol');
  const flask = vessel(session, 'flask-b');
  lab.addToContainer(session, flask.id, 'water', 100);
  lab.addToContainer(session, flask.id, 'sucrose', 25);
  lab.addToContainer(session, flask.id, 'yeast', 3);
  lab.setTemperature(session, flask.id, 28);
  assert.equal(lab.tutorialState(session, brewGuide).current, 4);
  assert.equal(lab.ferment(session, flask.id).ok, true);
  assert.equal(lab.ferment(session, flask.id).ok, true, 'a second round eats more sugar');
  assert.equal(lab.tutorialState(session, brewGuide).complete, true, 'the sugar step stays done');
  assert.deepEqual(session.guide.passed, brewGuide.tutorial.map((step) => step.id));
  // …and Undo takes the record back with the bench.
  lab.undoSession(session);
  lab.undoSession(session);
  assert.equal(lab.tutorialState(session, brewGuide).complete, false);
}

// ── Common mistakes get their own explanation, without a penalty ────────────
{
  const phGuide = byId('ph');
  const session = lab.emptySession({ title: 'Overshoot', mode: 'bench' });
  lab.startGuide(session, 'ph');
  lab.addToContainer(session, 'beaker-a', 'water', 50);
  lab.addToContainer(session, 'beaker-a', 'citric_acid', 6);
  lab.addToContainer(session, 'beaker-a', 'bicarbonate', 8.5);
  const state = lab.tutorialState(session, phGuide);
  assert.equal(state.current, 1);
  assert.match(state.feedback.en, /Past 7\.87 g/);
  assert.match(state.feedback.pt, /Depois de 7,87 g/);
  lab.undoSession(session);
  lab.addToContainer(session, 'beaker-a', 'bicarbonate', 7.3);
  assert.equal(lab.tutorialState(session, phGuide).current, 2, 'fixing it moves the guide on');
  lab.measure(session, 'beaker-a', 'volume');
  assert.match(lab.tutorialState(session, phGuide).feedback.en, /pH reading/, 'a volume is not a pH reading');
  lab.measure(session, 'beaker-a', 'ph');
  assert.equal(lab.tutorialState(session, phGuide).complete, true);
}
{
  const brewGuide = byId('ethanol');
  const session = lab.emptySession({ title: 'Hot yeast', mode: 'bench' });
  lab.startGuide(session, 'ethanol');
  lab.addToContainer(session, 'flask-b', 'water', 100);
  lab.addToContainer(session, 'flask-b', 'sucrose', 25);
  lab.addToContainer(session, 'flask-b', 'yeast', 3);
  lab.setTemperature(session, 'flask-b', 60);
  const state = lab.tutorialState(session, brewGuide);
  assert.equal(state.current, 3, 'too hot does not count as warm');
  assert.match(state.feedback.en, /Too hot for yeast/);
  assert.match(state.feedback.pt, /Quente demais para a levedura/);
}
{
  // The right material in the wrong vessel is named as such.
  const stillGuide = byId('distillation');
  const session = lab.emptySession({ title: 'Wrong glass', mode: 'bench' });
  lab.startGuide(session, 'distillation');
  for (const type of ['round-flask', 'condenser', 'receiving-flask', 'heating-mantle']) lab.addVessel(session, type);
  lab.addToContainer(session, 'beaker-a', 'water', 60);
  lab.addToContainer(session, 'beaker-a', 'ethanol', 40);
  session.selectedId = 'beaker-a';
  const state = lab.tutorialState(session, stillGuide);
  assert.equal(state.current, 4);
  assert.match(state.feedback.en, /wrong vessel: this step uses the round-bottom flask/);
}

// ── Automatic processes wait for «I observed it» ────────────────────────────
{
  const diamond = byId('diamond');
  const session = lab.emptySession({ title: 'Diamond', mode: 'bench' });
  lab.startGuide(session, 'diamond');
  lab.addToContainer(session, 'beaker-a', 'c', 10);
  const waiting = lab.tutorialState(session, diamond);
  assert.equal(waiting.awaitingObserve, true);
  assert.equal(waiting.complete, false);
  assert.equal(lab.confirmObserved(session, diamond).ok, true);
  assert.equal(lab.tutorialState(session, diamond).complete, true);
  assert.equal(lab.confirmObserved(session, diamond).ok, false, 'nothing left to observe');
  assert.equal(lab.confirmObserved(lab.emptySession({}), diamond).ok, false, 'only the active guide');
}

// ── Every step explains itself ──────────────────────────────────────────────
for (const creation of lab.CREATIONS) {
  creation.tutorial.forEach((step, i) => {
    assert.ok(step.why && step.why.en && step.why.pt, `${creation.id}/${step.id} has a why`);
    const plan = lab.stepPlan(creation, i);
    assert.notEqual(plan.hints[0].en, step.en, `${creation.id}/${step.id}: hint 1 explains instead of repeating the step`);
    assert.notEqual(plan.hints[0].pt, step.pt);
    if (step.feedback) assert.ok(step.feedback.en && step.feedback.pt);
    (step.errors || []).forEach((row) => {
      assert.equal(typeof row.when, 'function');
      assert.ok(row.feedback.en && row.feedback.pt, `${creation.id}/${step.id} error copy in both languages`);
    });
    [].concat(step.check || []).forEach((test) => assert.equal(typeof test.explain, 'function'));
  });
}

// ── Capacity: liquids fill up to capacityMl and stop ────────────────────────
{
  const session = lab.emptySession({ title: 'Capacity', mode: 'bench' });
  const beaker = vessel(session, 'beaker-a');
  assert.equal(beaker.capacityMl, lab.EQUIPMENT.beaker.capacityMl);
  const clicks = [];
  for (let i = 0; i < 6; i += 1) clicks.push(lab.addToContainer(session, 'beaker-a', 'water', 50));
  assert.ok(clicks.slice(0, 5).every((row) => row.ok), 'five 50 mL additions fit a 250 mL beaker');
  assert.equal(clicks[4].full, true, 'the fifth one fills it, and says so');
  assert.equal(clicks[5].ok, false);
  assert.equal(clicks[5].reason, 'full');
  assert.equal(clicks[5].capacityMl, 250);
  assert.equal(beaker.volumeMl, 250, 'nothing passes capacityMl');

  const partial = lab.emptySession({ title: 'Partial', mode: 'bench' });
  lab.addToContainer(partial, 'beaker-a', 'water', 230);
  const topUp = lab.addToContainer(partial, 'beaker-a', 'water', 50);
  assert.equal(topUp.ok, true, 'a 50 mL chip on 230 mL fills to the limit instead of being refused');
  assert.equal(topUp.capped, true);
  assert.equal(topUp.added, 20);
  assert.equal(vessel(partial, 'beaker-a').volumeMl, 250);
  assert.equal(vessel(partial, 'beaker-a').contents.find((row) => row.id === 'water').amount, 250);
  assert.ok(partial.observations.some((row) => /full \(250 mL\): only 20 mL went in/.test(row.text)));
  partial.lang = 'pt';
  lab.emptyContainer(partial, 'beaker-a');
  lab.addToContainer(partial, 'beaker-a', 'water', 240);
  lab.addToContainer(partial, 'beaker-a', 'water', 12.5);
  assert.ok(partial.observations.some((row) => /cheio \(250 mL\): só entraram 10 mL/.test(row.text)));

  // Solids do not take liquid volume, and a small vessel keeps its own limit.
  const tube = lab.emptySession({ title: 'Tube', mode: 'bench' });
  lab.addVessel(tube, 'test-tube');
  const tubeId = tube.containers.find((row) => row.type === 'test-tube').id;
  assert.equal(lab.addToContainer(tube, tubeId, 'water', 50).added, 20);
  assert.equal(lab.addToContainer(tube, tubeId, 'nacl', 5).ok, true);

  // A ready mix goes in whole or not at all.
  const ready = lab.emptySession({ title: 'Ready', mode: 'bench' });
  lab.addToContainer(ready, 'beaker-a', 'water', 230);
  const kit = lab.addReady(ready, 'saline_ready', 'beaker-a');
  assert.equal(kit.ok, false);
  assert.equal(kit.reason, 'full');
  assert.equal(vessel(ready, 'beaker-a').volumeMl, 230, 'and a refused kit changes nothing');
}

// ── Soft limit on one piece of glassware ────────────────────────────────────
{
  assert.equal(lab.SOFT_VESSEL_LIMIT, 6);
  const session = lab.emptySession({ title: 'Beakers', mode: 'bench' });
  const results = [];
  for (let i = 0; i < 8; i += 1) results.push(lab.addVessel(session, 'beaker'));
  const beakers = () => session.containers.filter((row) => row.type === 'beaker').length;
  assert.equal(results.filter((row) => row.ok).length, 5, 'one beaker comes with the board, five more go in without asking');
  assert.equal(beakers(), 6);
  assert.equal(results[5].reason, 'confirm', 'the 7th asks first');
  assert.equal(results[5].count, 6);
  assert.equal(lab.addVessel(session, 'beaker', { confirmed: true }).ok, true, 'and goes in once confirmed');
  assert.equal(beakers(), 7);
  assert.equal(lab.addVessel(session, 'flask').ok, true, 'the limit counts one piece at a time');
  assert.equal(lab.MAX_VESSELS, 120, 'the hard ceiling does not move');
  assert.equal(lab.duplicateObject(session, 'beaker-a').ok, true, 'duplicating a chosen piece is already a decision');
}

console.log('test-lab-mechanics: ok');
