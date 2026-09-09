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
assert.equal(CALC_TAB_POLICY.scientific, 'public');
assert.equal(CALC_TAB_POLICY.unit, 'public');
assert.equal(CALC_TAB_POLICY.ideal, 'public');
assert.equal(CALC_TAB_POLICY.ph, 'public');
assert.equal(CALC_TAB_POLICY.stoich, 'pro');
assert.equal(CALC_TAB_POLICY.thermo, 'pro');
assert.equal(calcTabPolicy('scientific'), 'public');
assert.equal(calcTabPolicy('unknown'), 'public');

assert.equal(pageToolPolicy('/explore/what-is-isomerism').need, 'public');
assert.equal(pageToolPolicy('/explore/viewer/methyl-isocyanate.html').need, 'public');
assert.equal(pageToolPolicy('/periodic-table').need, 'public');
assert.equal(pageToolPolicy('/periodic-table/trends').need, 'public');
assert.equal(pageToolPolicy('/periodic-table/isotopes.html').need, 'public');
assert.equal(pageToolPolicy('/calculators').need, 'public');
assert.equal(pageToolPolicy('/viewer/molecules').need, 'public');
assert.equal(pageToolPolicy('/viewer/molecules.html').tool, 'moleculeViewer');
assert.equal(pageToolPolicy('/viewer/molecules.pt.html').need, 'public');
assert.equal(pageToolPolicy('/viewer/atomic-models').need, 'public');
assert.equal(pageToolPolicy('/viewer/atomic-models/bohr.html').need, 'public');
assert.equal(pageToolPolicy('/viewer/allotropes').need, 'public');
assert.equal(pageToolPolicy('/viewer/isomerism').need, 'public');
assert.equal(pageToolPolicy('/isomerism/constitutional/function.html').need, 'public');
assert.equal(pageToolPolicy('/periodic-table/compare').need, 'public');
assert.equal(pageToolPolicy('/periodic-table/compare.pt.html').need, 'public');

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
  features: { scientificCalculator: true, moleculeViewer: true, publicThermodynamics: false }
};
const pendingPro = {
  signedIn: true,
  isPro: true,
  ready: false,
  features: { moleculeViewer: true, publicThermodynamics: true }
};
const spoofed = { signedIn: true, isPro: true, ready: true, features: {} };
const pro = {
  signedIn: true,
  isPro: true,
  ready: true,
  features: { moleculeViewer: true, publicThermodynamics: true }
};

assert.equal(allowTool('public', guest), true);
assert.equal(allowTool('account', guest), false);
assert.equal(allowTool('login', free), true);
assert.equal(allowTool('public', guest, 'scientificCalculator'), true);
assert.equal(allowTool('pro', guest, 'publicThermodynamics'), false);
assert.equal(allowTool('pro', free, 'publicThermodynamics'), false);
assert.equal(allowTool('pro', pendingPro, 'publicThermodynamics'), false);
assert.equal(allowTool('pro', spoofed, 'publicThermodynamics'), false);
assert.equal(allowTool('pro', pro), false);
assert.equal(allowTool('pro', pro, 'publicThermodynamics'), true);

console.log('lab-tool-access tests passed');
