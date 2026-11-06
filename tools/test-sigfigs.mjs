import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../assets/chem/sigfigs.js');

const sig = (s) => S.countSig(s).sig;
assert.equal(sig('0.00250'), 3);
assert.equal(sig('12.0'), 3);
assert.equal(sig('1200'), 2);
assert.equal(S.countSig('1200').ambiguous, true);
assert.equal(sig('1200.'), 4);
assert.equal(sig('1.20e3'), 3);
assert.equal(sig('6.022e23'), 4);
assert.equal(sig('2,50'), 3);              // decimal comma
assert.equal(S.countSig('25.0').decimals, 1);
assert.equal(S.product(['2.0', '25.0', '0.50']), 2);
assert.equal(S.sum(['12.11', '18.0', '1.013']), 1);
assert.equal(S.round(0.101966, 3), 0.102);
assert.equal(S.format(0.101966, 3, 'pt'), '0,102');
assert.equal(S.format(0.101966, 3, 'en'), '0.102');
assert.equal(S.format(100, 2, 'pt'), '1,0 × 10²');      // 2 sig figs can't be written as "100"
assert.equal(S.format(6.14053e22, 3, 'pt'), '6,14 × 10²²');
assert.equal(S.format(22.414, 4, 'en'), '22.41');
assert.equal(S.logDecimals('0.00250'), 3);              // pH 2.602
console.log('sigfigs ok');
