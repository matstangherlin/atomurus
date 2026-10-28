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
close('sin(pi/6)', 0.5, null, 1e-12);
close('cos(0)', 1);
close('tan(0)', 0);
close('abs(-3)', 3);
close('exp(1)', Math.E);
close('sqrt(16)', 4);
close('5!', 120);
close('3!!', 720);
close('factorial(4)', 24);
close('0^0', 1);
close('round(2.5)', 3);
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
fails('1+', /Unexpected token/);
fails('((1)', /Expected "\)"/);
fails('2(3)', /Unexpected token/, null);
fails('2pi', /Unexpected token/);
fails('dilution(1,2)', /expects 3 arguments/);
fails('molarMass("H2O")', /not available/, { molarMass: null });

// Used constants and functions are reported for the chemistry context panel.
const ctx = sci.evaluateScientificExpression('pH(Kw/1e-7)', opts);
assert.deepEqual(ctx.constants, ['Kw']);
assert.deepEqual(ctx.functions, ['pH']);

// The page reads these tables for its suggestions and help text.
assert.ok(sci.SCI_LIBRARY.some((row) => row.name === 'pH'));
assert.ok(sci.SCI_FUNCTION_INFO.pH.en && sci.SCI_FUNCTION_INFO.pH.pt);

console.log('test-sci-core: ok');
