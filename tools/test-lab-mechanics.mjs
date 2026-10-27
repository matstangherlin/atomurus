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

// ── Density and volume ──────────────────────────────────────────────────────
{
  const S = lab.SUBSTANCES;
  assert.equal(S.water.density, 1.00);
  assert.equal(S.ethanol.density, 0.789);
  assert.equal(S.oil.density, 0.91);
  assert.equal(S.limonene.state, 'liquid');
  assert.equal(S.limonene.densityEstimate, true, 'fragrance densities are marked as estimates');
  assert.equal(S.vanillin.state, 'solid', 'vanillin is a solid at room temperature');
  assert.equal(S.sucrose.density, undefined, 'solid sugar does not count as liquid volume');

  // Citrus accord: 18 g of material is no longer 0 mL.
  const accord = lab.emptySession({ title: 'Accord', mode: 'bench' });
  assert.equal(lab.addReady(accord, 'accord_ready', 'beaker-a').ok, true);
  const glass = vessel(accord, 'beaker-a');
  assert.ok(glass.volumeMl > 15 && glass.volumeMl < 18, `accord volume from density, got ${glass.volumeMl} mL`);
  assert.equal(glass.contents.find((row) => row.id === 'limonene').unit, 'mL');
  const mass = lab.measure(accord, 'beaker-a', 'mass').row.value;
  assert.ok(Math.abs(mass - 18) < 0.2, `accord mass stays 18 g, got ${mass}`);
  assert.equal(glass.productId, 'accord');
  assert.ok(accord.observations.some((row) => /estimated from typical densities/.test(row.text)));

  // Oil is not 1 g/mL any more: 20 mL water + 15 mL oil + 8 g ZnO.
  const lotion = lab.emptySession({ title: 'Lotion', mode: 'bench' });
  lab.addReady(lotion, 'sunscreen_ready', 'beaker-a');
  const lotionMass = lab.measure(lotion, 'beaker-a', 'mass').row.value;
  assert.ok(Math.abs(lotionMass - (20 + 15 * 0.91 + 8)) < 0.1, `got ${lotionMass} g`);
  assert.equal(vessel(lotion, 'beaker-a').volumeMl, 35);

  // A saved row from before the change (fragrance weighed in g) keeps its mass.
  const legacy = lab.emptySession({ title: 'Legacy', mode: 'bench' });
  vessel(legacy, 'beaker-a').contents.push({ id: 'limonene', amount: 8, unit: 'g' });
  assert.equal(lab.measure(legacy, 'beaker-a', 'mass').row.value, 8);

  // The fragrance guide asks for the solid note in grams.
  const fragrance = byId('fragrance');
  const base = lab.stepPlan(fragrance, 2);
  assert.equal(base.materials[0].unit, 'g');
  assert.match(fragrance.tutorial[2].en, /4 g/);
  assert.match(fragrance.tutorial[0].pt, /8 mL/, 'the Portuguese step names the amount too');
}

// ── Guides that taught something wrong ──────────────────────────────────────
{
  // Fermentation: sucrose equation, and the yield computed from it.
  // 15 g / 342.30 g/mol = 0.04382 mol; × 4 × 46.07 = 8.08 g of ethanol ≈ 10.2 mL;
  // × 4 × 44.01 = 7.71 g of CO₂; water used by the hydrolysis 0.79 g.
  const brew = lab.emptySession({ title: 'Yield', mode: 'bench' });
  lab.addToContainer(brew, 'flask-b', 'water', 100);
  lab.addToContainer(brew, 'flask-b', 'sucrose', 25);
  lab.addToContainer(brew, 'flask-b', 'yeast', 3);
  lab.setTemperature(brew, 'flask-b', 28);
  const run = lab.ferment(brew, 'flask-b');
  assert.equal(run.used, 15);
  assert.equal(run.ethanolG, 8.1);
  assert.equal(run.made, 10.2, 'mL of ethanol, through 0.789 g/mL');
  assert.equal(run.co2G, 7.7);
  const flask = vessel(brew, 'flask-b');
  assert.equal(flask.contents.find((row) => row.id === 'water').amount, 99.2, 'the hydrolysis uses 0.8 mL of water');
  assert.equal(flask.volumeMl, 109.4);
  assert.ok(brew.observations.some((row) => /Theoretical yield: 8\.1 g of virtual ethanol \(≈ 10\.2 mL\) and 7\.7 g of CO₂/.test(row.text)));
  const brewPt = lab.emptySession({ title: 'Rendimento', mode: 'bench', lang: 'pt' });
  lab.addToContainer(brewPt, 'flask-b', 'water', 100);
  lab.addToContainer(brewPt, 'flask-b', 'sucrose', 25);
  lab.addToContainer(brewPt, 'flask-b', 'yeast', 3);
  lab.setTemperature(brewPt, 'flask-b', 28);
  lab.ferment(brewPt, 'flask-b');
  assert.ok(brewPt.observations.some((row) => /Rendimento teórico: 8,1 g de etanol virtual \(≈ 10,2 mL\)/.test(row.text)));
  assert.match(byId('ethanol').learningObjectives.en, /C₁₂H₂₂O₁₁ \+ H₂O → 2 C₆H₁₂O₆ → 4 C₂H₅OH \+ 4 CO₂/);

  // Crystals: 20 g in 60 mL is concentrated, not saturated (≈ 200 g per 100 mL at 20 °C).
  const crystal = byId('crystal');
  assert.match(crystal.tutorial[0].why.en, /not a saturated one/);
  assert.match(crystal.tutorial[0].why.pt, /não saturada/);
  assert.match(crystal.tutorial[0].why.en, /about 120 g/);
  const pan = lab.emptySession({ title: 'Pan', mode: 'bench' });
  lab.addToContainer(pan, 'beaker-a', 'water', 60);
  lab.addToContainer(pan, 'beaker-a', 'sucrose', 20);
  lab.setTemperature(pan, 'beaker-a', 70);
  const boiled = lab.crystallise(pan, 'beaker-a');
  assert.equal(boiled.ok, true);
  const left = vessel(pan, 'beaker-a').contents.find((row) => row.id === 'water').amount;
  assert.ok(20 / left > 2.0, `crystals only once past saturation: 20 g in ${left} mL`);
  assert.ok(pan.observations.some((row) => /past the ≈ 200 g per 100 mL/.test(row.text)));

  // Sunscreen: no emulsifier, said plainly.
  const sunscreen = byId('sunscreen');
  const stir = sunscreen.tutorial.find((row) => row.id === 'stir');
  assert.match(stir.en, /no emulsifier/);
  assert.match(stir.pt, /Sem emulsificante/);
  assert.match(stir.why.en, /emulsifier/);

  // Distillation: realistic purity, the azeotrope in % by mass, a temperature profile.
  const still = lab.emptySession({ title: 'Still', mode: 'bench' });
  for (const type of ['round-flask', 'condenser', 'receiving-flask', 'heating-mantle']) lab.addVessel(still, type);
  const pot = lab.firstOfType(still, 'round-flask');
  lab.addToContainer(still, pot.id, 'water', 60);
  lab.addToContainer(still, pot.id, 'ethanol', 40);
  lab.assembleRig(still);
  lab.setTemperature(still, pot.id, 80);
  const distilled = lab.distill(still, pot.id);
  assert.equal(distilled.ok, true);
  assert.ok(distilled.purity >= 90 && distilled.purity <= 93, `simple distillation ≈ 90–93%, got ${distilled.purity}`);
  assert.deepEqual(distilled.profile.map((row) => row.c), [22, 78, 78, 100]);
  assert.ok(still.observations.some((row) => /95\.6% ethanol by mass/.test(row.text)));
  assert.ok(lab.firstOfType(still, 'round-flask').distillProfile);
}

// ── Dilute HCl: a prepared solution with a safety note, never the concentrate ─
{
  for (const query of ['HCl 1 mol/L 100 mL', 'HCl 1 mol/L', 'HCl diluído', 'ácido clorídrico', 'hydrochloric acid']) {
    const hit = lab.resolveQuery(query);
    assert.equal(hit.ok, true, query);
    assert.equal(hit.id, 'hcl_dilute', query);
  }
  assert.equal(lab.searchCatalog('HCl 1 mol/L 100 mL').status, 'ok');
  assert.equal(lab.resolveQuery('HCl concentrado').ok, false, 'the concentrated acid is not offered');
  assert.equal(lab.resolveQuery('ácido clorídrico concentrado').ok, false);
  assert.equal(lab.resolveQuery('cocaine').reason, 'unavailable', 'the deny list is untouched');
  const acid = lab.SUBSTANCES.hcl_dilute;
  assert.equal(acid.prepared, true);
  assert.equal(acid.chem.molarity, 1);
  assert.ok(acid.safety.en.includes('acid to water') && acid.safety.pt.includes('ácido à água'));

  const session = lab.emptySession({ title: 'HCl', mode: 'bench' });
  const added = lab.addToContainer(session, 'beaker-a', 'hcl_dilute', 10);
  assert.equal(added.ok, true);
  assert.ok(added.safety, 'adding it returns the safety line');
  assert.ok(session.observations.some((row) => /acid to water/.test(row.text)));
  assert.equal(vessel(session, 'beaker-a').ph, 0, '1 mol/L strong acid reads pH 0');
  lab.addToContainer(session, 'beaker-a', 'water', 90);
  assert.equal(vessel(session, 'beaker-a').ph, 1, 'diluted tenfold, pH 1');
}

// ── Objectives and safety on every guide that needs them ────────────────────
for (const creation of lab.CREATIONS) {
  assert.ok(creation.learningObjectives && creation.learningObjectives.en && creation.learningObjectives.pt, `${creation.id} has learning objectives`);
}
for (const id of ['solution', 'ph']) {
  const creation = byId(id);
  assert.ok(creation.safety && creation.safety.en && creation.safety.pt, `${id} carries a safety note`);
}

console.log('test-lab-mechanics: ok');
