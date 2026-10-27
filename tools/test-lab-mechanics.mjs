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

console.log('test-lab-mechanics: ok');
