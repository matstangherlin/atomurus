import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyAuthCallback, authCallbackTarget } from '../netlify/lib/auth-recovery-link.mjs';

function classify(hash, search = '') {
  return classifyAuthCallback({ hash, search }).action;
}

assert.equal(classify('#access_token=a&refresh_token=b&type=recovery'), 'reset');
assert.equal(classify('#error=access_denied&error_code=otp_expired&error_description=expired'), 'expired');
assert.equal(classify('', '?token_hash=abc&type=recovery'), 'login-token');
assert.equal(classify(''), 'none');
assert.equal(classify('#%%%'), 'none');
assert.equal(classify('#access_token=a&refresh_token=b&type=signup'), 'none');
assert.equal(classify('#error_code=otp_expired'), 'expired');
assert.equal(classify('#<script>alert(1)</script>'), 'none');

const hostile = classifyAuthCallback({
  hash: '#access_token=<script>alert(1)</script>&refresh_token=b&type=recovery'
});
assert.equal(hostile.action, 'reset');
assert.equal(JSON.stringify(hostile).includes('<script>'), false);

assert.equal(authCallbackTarget('reset', { portuguese: false }), '/reset-password');
assert.equal(authCallbackTarget('reset', { portuguese: true }), '/reset-password?lang=pt-BR');
assert.equal(authCallbackTarget('expired', { portuguese: true }), '/login?lang=pt-BR');
assert.equal(authCallbackTarget('none'), '');

function redirectScript(html) {
  const match = html.match(/<script>\(function\(\)\{var h=location\.hash[\s\S]*?\}\)\(\);<\/script>/);
  assert.ok(match, 'redirect script missing');
  return match[0];
}

const home = redirectScript(readFileSync(new URL('../index.html', import.meta.url), 'utf8'));
const homePt = redirectScript(readFileSync(new URL('../index.pt.html', import.meta.url), 'utf8'));
for (const html of [home, homePt]) {
  assert.match(html, /otp_expired/);
  assert.match(html, /type==='recovery'/);
  assert.match(html, /reset-password/);
  assert.doesNotMatch(html, /console\.log\(/);
}
assert.match(homePt, /lang=pt-BR/);
assert.doesNotMatch(home, /lang=pt-BR/);

console.log('test-auth-recovery: ok');
