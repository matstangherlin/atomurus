// Physical constants from one source (prompt 29, B05): the generated copies are
// current, the exact SI relations hold, every engine uses the same numbers and
// no rounded copy of R or of the mmHg is left in the code.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as ESM from '../netlify/lib/physical-constants.mjs';
import { GAS_R, KW_25C, solveIdealGas } from '../netlify/lib/chemistry-calc.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const C = require('../assets/data/physical-constants.js');
const calc = require('../assets/calc-core.js');
const sci = require('../assets/sci-core.js');

const check = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'build-physical-constants.mjs'), '--check'], { encoding: 'utf8' });
assert.equal(check.status, 0, check.stderr || check.stdout);

// Both copies say the same thing.
for (const key of ['N_A', 'k_B', 'e', 'h', 'c', 'R', 'F', 'T0', 'atm', 'bar', 'torr', 'mmHg', 'Kw25']) {
  assert.equal(ESM[key], C[key], key);
  assert.ok(C.SOURCES[key] && C.SOURCES[key].source.length > 10, `${key} cites its source`);
}
assert.ok(Object.isFrozen(C));

// 2019 SI: exact defining constants, exact derived R and F.
assert.equal(C.N_A, 6.02214076e23);
assert.equal(C.k_B, 1.380649e-23);
assert.equal(C.e, 1.602176634e-19);
assert.equal(C.R, C.N_A * C.k_B);
assert.equal(C.F, C.N_A * C.e);
assert.equal(C.R.toPrecision(10), '8.314462618', 'CODATA 2018: 8.314 462 618… J/(mol·K)');
assert.equal(C.F.toPrecision(10), '96485.33212');
assert.equal(C.torr, C.atm / 760);
assert.equal(C.mmHg.toFixed(9), '133.322387415');
assert.notEqual(C.torr, C.mmHg, 'the torr and the conventional mmHg differ in the 7th digit');

// Molar volume is never a typed constant: R·T/P, with the condition named.
const vm = (T, P) => (C.R * T / P) * 1000;
assert.equal(vm(C.T0, C.atm).toFixed(3), '22.414', '273.15 K and 101.325 kPa');
assert.equal(vm(C.T0, C.bar).toFixed(3), '22.711', '273.15 K and 100 kPa');

// Every engine runs on the same numbers.
assert.equal(GAS_R, C.R);
assert.equal(KW_25C, C.Kw25);
assert.equal(calc.R_IDEAL, C.R);
assert.equal(calc.KW, C.Kw25);
assert.equal(calc.ABS_ZERO_C, -C.T0);
assert.equal(calc.convertUnit({ cat: 'pressure', value: 1, from: 'atm', to: 'Torr' }).value, 760);
assert.equal(calc.convertUnit({ cat: 'pressure', value: 1, from: 'mmHg', to: 'Pa' }).value, C.mmHg);
assert.equal(sci.SCI_CONSTANTS.R, C.R);
assert.equal(sci.SCI_CONSTANTS.NA, C.N_A);
assert.equal(sci.SCI_CONSTANTS.F, C.F);
const server = solveIdealGas({ solve: 'V', P: 1, PUnit: 'atm', n: 1, T: 0, TUnit: 'C', VUnit: 'L' });
assert.equal(server.solved, vm(C.T0, C.atm));
assert.equal(server.R, C.R);

// The calculator pages load the constants before the engines that need them.
for (const page of ['calculators.html', 'calculators.pt.html']) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const at = (src) => html.indexOf(src);
  assert.ok(at('/assets/data/physical-constants.js') !== -1 && at('/assets/data/physical-constants.js') < at('/assets/calc-core.js') && at('/assets/calc-core.js') < at('/assets/sci-core.js'), page);
  // Prompt 30: PV = nRT is solved in calc-core (R_IDEAL = PHYS.R), not on the page.
  assert.match(html, /core\.computeIdealGas\(/, `${page}: the ideal-gas solver is calc-core's`);
  assert.doesNotMatch(html, /n\*R\*Tk|\(R\*Tk\)/, `${page}: no copy of the gas-law arithmetic on the page`);
}

// No rounded copy left: 8.314 / 133.322 only in the source, the generated
// copies, docs and the test data that computes R from its own inputs.
const SKIP = /^(node_modules|dist|docs|\.git|test-results)\//;
const ALLOWED = new Set(['assets/data/physical-constants.json', 'assets/data/physical-constants.js', 'netlify/lib/physical-constants.mjs', 'tools/test-physical-constants.mjs']);
const offenders = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (SKIP.test(rel + '/') || entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) { walk(rel); continue; }
    if (!/\.(m?js|html)$/.test(entry.name) || ALLOWED.has(rel)) continue;
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/\b8[.,]314(?![0-9])|\b133[.,]322(?![0-9])/.test(text)) offenders.push(rel);
  }
}
walk('');
assert.deepEqual(offenders, [], 'rounded R or mmHg left in: ' + offenders.join(', '));

console.log('test-physical-constants: ok');
