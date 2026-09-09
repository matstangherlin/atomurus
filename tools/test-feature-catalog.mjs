import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { FEATURES, LAB_TABS, PAGE_TOOLS, featureAccess, featuresForAccess } from '../netlify/lib/feature-catalog.mjs';

const src = readFileSync(new URL('../assets/access-policy.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(src, sandbox);
const client = sandbox.window.ATOMURUS_ACCESS;
assert.ok(client, 'access-policy.js must set window.ATOMURUS_ACCESS');

const serverKeys = Object.keys(FEATURES).sort();
const clientKeys = Object.keys(client.FEATURES).sort();
assert.deepEqual(clientKeys, serverKeys);

for (const key of serverKeys) {
  assert.equal(client.FEATURES[key].access, FEATURES[key].access, key);
  assert.equal(client.FEATURES[key].category, FEATURES[key].category, key);
}

assert.deepEqual(Object.keys(client.LAB_TABS).sort(), Object.keys(LAB_TABS).sort());
for (const tab of Object.keys(LAB_TABS)) {
  assert.equal(client.LAB_TABS[tab].access, LAB_TABS[tab].access, tab);
  assert.equal(client.LAB_TABS[tab].feature, LAB_TABS[tab].feature, tab);
}

assert.equal(featureAccess('moleculeViewer'), 'public');
assert.equal(featureAccess('studyCloud'), 'account');
assert.equal(featureAccess('reactionWorkbench'), 'pro');
assert.equal(featureAccess('automatedPractice'), 'pro');

const guest = featuresForAccess({});
assert.equal(guest.moleculeViewer, true);
assert.equal(guest.scientificCalculator, true);
assert.equal(guest.studyCloud, false);
assert.equal(guest.smartReview, false);
assert.equal(guest.automatedPractice, false);

const free = featuresForAccess({ signedIn: true, isPro: false });
assert.equal(free.studyCloud, true);
assert.equal(free.studySets, true);
assert.equal(free.flashcards, true);
assert.equal(free.smartReview, false);
assert.equal(free.automatedPractice, false);
assert.equal(free.reactionWorkbench, false);
assert.equal(free.adsFree, false);

const pro = featuresForAccess({ signedIn: true, isPro: true });
assert.equal(pro.smartReview, true);
assert.equal(pro.automatedPractice, true);
assert.equal(pro.adsFree, true);

assert.equal(PAGE_TOOLS.moleculeViewer.access, 'public');
assert.equal(LAB_TABS.stoich.access, 'pro');
assert.equal(LAB_TABS.scientific.access, 'public');

console.log('feature-catalog tests passed');
