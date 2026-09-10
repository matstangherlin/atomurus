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
assert.ok(lab.CREATIONS.some((row) => row.id === 'diamond'));
assert.ok(lab.CREATIONS.every((row) => Array.isArray(row.stages)));

console.log('virtual lab tests passed');
