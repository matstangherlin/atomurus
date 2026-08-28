import assert from 'node:assert/strict';
import {
  allowTool,
  calcTabPolicy,
  calcTabFeature,
  pageToolPolicy,
  CALC_TAB_POLICY,
  PAGE_TOOL_FEATURE
} from '../netlify/lib/lab-tool-access.mjs';

assert.equal(CALC_TAB_POLICY.molar, 'public');
assert.equal(CALC_TAB_POLICY.dilute, 'public');
assert.equal(CALC_TAB_POLICY.scientific, 'login');
assert.equal(CALC_TAB_POLICY.unit, 'login');
assert.equal(CALC_TAB_POLICY.ideal, 'login');
assert.equal(CALC_TAB_POLICY.ph, 'login');
assert.equal(CALC_TAB_POLICY.stoich, 'pro');
assert.equal(CALC_TAB_POLICY.thermo, 'pro');
assert.equal(calcTabPolicy('scientific'), 'login');
assert.equal(calcTabPolicy('unknown'), 'public');

assert.equal(pageToolPolicy('/explore/what-is-isomerism').need, 'public');
assert.equal(pageToolPolicy('/explore/viewer/methyl-isocyanate.html').need, 'public');
assert.equal(pageToolPolicy('/periodic-table').need, 'public');
assert.equal(pageToolPolicy('/periodic-table/trends').need, 'public');
assert.equal(pageToolPolicy('/periodic-table/isotopes.html').need, 'public');
assert.equal(pageToolPolicy('/calculators').need, 'public');
assert.equal(pageToolPolicy('/viewer/molecules').need, 'pro');
assert.equal(pageToolPolicy('/viewer/molecules.html').tool, 'moleculeViewer');
assert.equal(pageToolPolicy('/viewer/molecules.pt.html').need, 'pro');
assert.equal(pageToolPolicy('/viewer/atomic-models').need, 'pro');
assert.equal(pageToolPolicy('/viewer/atomic-models/bohr.html').need, 'pro');
assert.equal(pageToolPolicy('/viewer/allotropes').need, 'pro');
assert.equal(pageToolPolicy('/viewer/isomerism').need, 'pro');
assert.equal(pageToolPolicy('/isomerism/constitutional/function.html').need, 'pro');
assert.equal(pageToolPolicy('/periodic-table/compare').need, 'pro');
assert.equal(pageToolPolicy('/periodic-table/compare.pt.html').need, 'pro');

assert.equal(calcTabFeature('scientific'), 'scientificCalculator');
assert.equal(calcTabFeature('thermo'), 'publicThermodynamics');
assert.equal(pageToolPolicy('/viewer/molecules').feature, 'moleculeViewer');
assert.equal(pageToolPolicy('/viewer/atomic-models').feature, 'atomicModelViewer');
assert.equal(PAGE_TOOL_FEATURE.isomerism, 'isomerismViewer');

const guest = { signedIn: false, isPro: false, ready: true, features: {} };
const free = {
  signedIn: true,
  isPro: false,
  ready: true,
  features: { scientificCalculator: true, moleculeViewer: false }
};
const pendingPro = {
  signedIn: true,
  isPro: true,
  ready: false,
  features: { moleculeViewer: true }
};
const spoofed = { signedIn: true, isPro: true, ready: true, features: {} };
const pro = {
  signedIn: true,
  isPro: true,
  ready: true,
  features: { moleculeViewer: true, publicThermodynamics: true }
};

assert.equal(allowTool('public', guest), true);
assert.equal(allowTool('login', guest), false);
assert.equal(allowTool('login', free), true);
assert.equal(allowTool('login', free, 'scientificCalculator'), true);
assert.equal(allowTool('pro', guest, 'moleculeViewer'), false);
assert.equal(allowTool('pro', free, 'moleculeViewer'), false);
assert.equal(allowTool('pro', pendingPro, 'moleculeViewer'), false);
assert.equal(allowTool('pro', spoofed, 'moleculeViewer'), false);
assert.equal(allowTool('pro', pro), false);
assert.equal(allowTool('pro', pro, 'moleculeViewer'), true);

console.log('lab-tool-access tests passed');
