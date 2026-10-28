// assets/sci-core.js — the scientific calculator engine, without a DOM.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sci = require('../assets/sci-core.js');

const opts = { molarMass: (formula) => (formula === 'H2O' ? 18.015 : NaN), syntaxLabel: 'Invalid syntax' };

function value(expr, extra) {
  return sci.evaluateScientificExpression(expr, Object.assign({}, opts, extra || {})).value;
}
function close(expr, expected, extra, tol = 1e-12) {
  const got = value(expr, extra);
  assert.ok(Math.abs(got - expected) <= tol * Math.max(1, Math.abs(expected)), `${expr} = ${got}, expected ${expected}`);
}
function fails(expr, pattern, extra) {
  assert.throws(() => value(expr, extra), pattern, expr);
}

// ── Arithmetic and precedence ───────────────────────────────────────────────
close('1+2*3', 7);
close('(1+2)*3', 9);
close('10/4', 2.5);
close('2^3^2', 512, null);
close('1e3+2', 1002);
close('.5*2', 1);
close('-(-3)', 3);
close('+5', 5);
close('10^2', 100);
close('2^0.5', Math.SQRT2);
close('Kw*1e14', 1);
// The sign applies to the whole power; the exponent may carry a sign; ^ groups right.
close('-2^2', -4);
close('(-2)^2', 4);
close('2^-3', 0.125);
close('-2^2^2', -16);
close('2^-2^2', 1 / 16);
close('-3!', -6);
close('2*-3', -6);
close('-2^-2', -0.25);
close('10^-pH(1e-3)', 1e-3, null, 1e-12);

// ── Functions and constants ─────────────────────────────────────────────────
close('log10(1000)', 3);
close('ln(e)', 1);
close('sin(pi/6)', 0.5, { angleMode: 'rad' }, 1e-12);
close('cos(0)', 1);
close('tan(0)', 0);
close('abs(-3)', 3);
close('exp(1)', Math.E);
close('sqrt(16)', 4);
close('5!', 120);
close('3!!', 720);
close('factorial(4)', 24);
close('0^0', 1);
// round: halves away from zero (school convention); round(x, n) keeps n decimals.
close('round(2.5)', 3);
close('round(-2.5)', -3);
close('round(-0.4)', 0);
close('round(1.005, 2)', 1.01);
close('round(-1.25, 1)', -1.3);
fails('round(1, 1.5)', /whole n/);
assert.equal(sci.roundHalfAway(-2.5, 0), -3);

// log is the base-10 logarithm (Brazilian school use); lg is an alias; ln is natural.
close('log(1000)', 3);
close('lg(100)', 2);
close('log(8, 2)', 3);
close('log10(1000)', 3, null);
fails('log(8, 1)', /base other than 1/);
fails('log(0)', /positive value/);
fails('log()', /expects 1 or 2 arguments/);

// Angles: degrees by default, radians on request.
assert.equal(sci.DEFAULT_ANGLE_MODE, 'deg');
assert.equal(sci.ANGLE_STORAGE_KEY, 'atomurus-sci-angle');
assert.equal(sci.normalizeAngleMode('rad'), 'rad');
assert.equal(sci.normalizeAngleMode('gradians'), 'deg');
const DEG = { angleMode: 'deg' };
const RAD = { angleMode: 'rad' };
close('sin(30)', 0.5, DEG, 1e-12);
close('sin(30)', 0.5, null, 1e-12);
close('sin(pi/6)', 0.5, RAD, 1e-12);
close('sin(30)', Math.sin(30), RAD);
close('cos(60)', 0.5, DEG, 1e-12);
close('tan(45)', 1, DEG, 1e-12);
assert.equal(value('sin(180)', DEG), 0, 'sin(180°) is 0, not 1.2e-16');
close('asin(0.5)', 30, DEG, 1e-12);
close('asin(1)', Math.PI / 2, RAD);
close('acos(0)', 90, DEG, 1e-12);
close('atan(1)', 45, DEG, 1e-12);
fails('asin(2)', /between -1 and 1/);
fails('tan(90)', /undefined at 90°/, DEG);
fails('tan(-270)', /undefined at 90°/, DEG);
close('pH(1e-3)', 3);
close('HfromPH(3)', 0.001);
close('pOH(1e-5)', 5);
close('OHfromPOH(5)', 1e-5, null, 1e-9);
close('molToParticles(1)', 6.02214076e23);
close('particlesToMol(6.02214076e23)', 1);
close('molarMass("H2O")', 18.015);
close('dilution(1,25,0.1)', 250);
close('percentYield(8,10)', 80);
close('idealGas(101325,0.024465,1,298.15)', 8.314325423444576, null, 1e-9);

// ── Errors ──────────────────────────────────────────────────────────────────
fails('sqrt(-1)', /non-negative/);
fails('(-1)!', /non-negative integer/);
fails('density(10,0)', /volume > 0/);
fails('foo(1)', /Unknown function "foo"/);
fails('bar', /Unknown constant "bar"/);
fails('2 $ 3', /Invalid syntax: \$/);
fails('1+', /Unexpected end/);
fails('((1)', /Expected "\)"/);
fails('2(3)', /Unexpected token/, null);
fails('2pi', /Unexpected token/);
fails('dilution(1,2)', /expects 3 arguments/);
fails('molarMass("H2O")', /not available/, { molarMass: null });

// ── Typed errors: the page says them in its own language ─────────────────────
function code(expr, extra) {
  try { value(expr, extra); } catch (err) { return [err.code, err.params]; }
  return null;
}
assert.deepEqual(code('1/0'), ['div0', {}]);
assert.deepEqual(code('0/0'), ['div0', {}]);
assert.deepEqual(code('sqrt(-1)'), ['domain', { fn: 'sqrt()' }]);
assert.deepEqual(code('asin(2)'), ['domain', { fn: 'asin()' }]);
assert.deepEqual(code('log(-1)'), ['domain', { fn: 'log()' }]);
assert.deepEqual(code('density(10,0)'), ['domain', { fn: 'density()' }]);
assert.deepEqual(code('1+'), ['incomplete', {}]);
assert.deepEqual(code('((1)'), ['incomplete', {}]);
assert.deepEqual(code('2 $ 3'), ['syntax', { token: '$' }]);
assert.deepEqual(code('1 2'), ['syntax', { token: '2' }]);
assert.deepEqual(code('foo(1)'), ['unknownFn', { name: 'foo' }]);
assert.deepEqual(code('bar'), ['unknownConst', { name: 'bar' }]);
assert.deepEqual(code('dilution(1,2)'), ['arity', { fn: 'dilution()', n: '3' }]);
assert.deepEqual(code('log()'), ['arity', { fn: 'log()', n: '1/2' }]);
assert.deepEqual(code('(-1)!'), ['factorial', {}]);
assert.deepEqual(code('171!'), ['factorial', {}]);
assert.deepEqual(code('"x"'), ['notNumber', {}]);
assert.deepEqual(code('10^400'), ['overflow', {}]);
assert.deepEqual(code('molarMass("H2O")', { molarMass: null }), ['unavailable', { fn: 'molarMass()' }]);

// Every code has a message in both languages in the dictionary.
const { DICT } = require('./i18n-dict-source.js');
for (const c of ['div0', 'domain', 'incomplete', 'syntax', 'unknownFn', 'unknownConst', 'arity', 'factorial', 'notNumber', 'overflow', 'unavailable']) {
  const key = 'sciErr' + c.charAt(0).toUpperCase() + c.slice(1);
  assert.ok(DICT.en.calc[key] && DICT.pt.calc[key] && DICT.en.calc[key] !== DICT.pt.calc[key], `${key} in EN and PT`);
}
assert.equal(DICT.pt.calc.sciErrDiv0, 'Divisão por zero');
assert.equal(DICT.en.calc.sciErrDiv0, 'Division by zero');

// Used constants and functions are reported for the chemistry context panel.
const ctx = sci.evaluateScientificExpression('pH(Kw/1e-7)', opts);
assert.deepEqual(ctx.constants, ['Kw']);
assert.deepEqual(ctx.functions, ['pH']);

// The page reads these tables for its suggestions and help text.
assert.ok(sci.SCI_LIBRARY.some((row) => row.name === 'pH'));
assert.ok(sci.SCI_FUNCTION_INFO.pH.en && sci.SCI_FUNCTION_INFO.pH.pt);

console.log('test-sci-core: ok');
