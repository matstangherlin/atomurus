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

assert.equal(lab.addToContainer(session, 'beaker-a', 'cocaine', 10).ok, false);

console.log('virtual lab tests passed');
