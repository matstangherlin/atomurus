import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const curriculum = require('../assets/study-curriculum.js');
const practice = require('../assets/study-practice.js');

assert.ok(Array.isArray(curriculum.PATHS));
assert.ok(curriculum.PATHS.length >= 8);
assert.ok(curriculum.live().every((row) => row.href && curriculum.isLive(row)));
assert.ok(curriculum.planned().every((row) => row.status === 'planned' && !row.href));
assert.equal(curriculum.label(curriculum.PATHS[0], 'en'), 'Chemistry Foundations');
assert.ok(curriculum.label(curriculum.PATHS[0], 'pt').length > 0);

function hrefFile(href) {
  return path.join(root, String(href || '').split('#')[0].split('?')[0].replace(/^\//, ''));
}

curriculum.live().forEach((entry) => {
  assert.ok(existsSync(hrefFile(entry.href)), 'missing live path ' + entry.href);
  (entry.pages || []).forEach((page) => {
    assert.ok(existsSync(hrefFile(page.href)), 'missing path page ' + page.href);
  });
});

practice.live().forEach((entry) => {
  assert.ok(existsSync(hrefFile(entry.href)), 'missing live practice ' + entry.href);
});
assert.ok(practice.planned().every((row) => row.status === 'planned' && !row.href));
assert.ok(practice.live().length >= 4);
assert.equal(practice.label({ title: { en: 'Molar mass', pt: 'Massa molar' } }, 'en'), 'Molar mass');

const app = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
assert.match(app, /assets\/study-curriculum\.js/);
assert.match(app, /assets\/study-practice\.js/);

const auth = readFileSync(new URL('../auth-app.js', import.meta.url), 'utf8');
assert.match(auth, /data-study-hub/);
assert.match(auth, /Study with Atomurus/);
assert.match(auth, /Save chemistry resources, build sets and continue learning/);
assert.match(auth, /Create free account/);
assert.match(auth, /renderGuestStudyHub/);
assert.doesNotMatch(auth, /Unlock your potential/);
assert.doesNotMatch(auth, /Become a chemistry master/);

const css = readFileSync(new URL('../assets/app-workspace.css', import.meta.url), 'utf8');
assert.match(css, /ws-hub-continue/);
assert.match(css, /ws-hub-review/);
assert.match(css, /ws-hub-practice/);

console.log('study hub tests passed');
