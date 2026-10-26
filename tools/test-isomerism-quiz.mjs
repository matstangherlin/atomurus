import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { shuffleOptions } = require('../assets/isomerism-quiz.js');
const chem = JSON.parse(readFileSync(path.join(ROOT, 'scripts/isomerism-chem-enhancements.json'), 'utf8'));
const html = readFileSync(path.join(ROOT, 'isomerism/constitutional/function.html'), 'utf8');

const correct = { q1: 'b', q2: 'c', q3: 'a' };
const letters = Object.values(correct);
assert.equal(new Set(letters).size > 1, true);

for (const lang of ['en', 'pt']) {
  const quiz = chem.quiz[lang];
  for (const q of ['q1', 'q2', 'q3']) {
    for (const opt of ['a', 'b', 'c']) {
      const text = quiz[q + opt];
      const exp = quiz[q + opt + 'Exp'];
      assert.equal(typeof text, 'string');
      assert.equal(typeof exp, 'string');
      assert.ok(exp.length > 0 && exp.length <= 140, lang + ' ' + q + opt + ' ' + exp.length);
    }
  }
}

for (const q of ['1', '2', '3']) {
  const block = html.match(new RegExp(`data-quiz="${q}" data-answer="([abc])"([\\s\\S]*?)</div>\\s*<p class="iso-quiz-feedback"`));
  assert.ok(block, 'quiz ' + q);
  assert.equal(block[1], correct['q' + q]);
  const label = chem.quiz.en['q' + q + block[1]];
  assert.match(block[2], new RegExp(`data-opt="${block[1]}"[^>]*>${label}<`));
}

const seq = [0.1, 0.9, 0.2];
let n = 0;
const rng = () => seq[n++];
const input = ['a', 'b', 'c'];
n = 0;
const first = shuffleOptions(input, rng);
n = 0;
const second = shuffleOptions(input, rng);
assert.deepEqual(first, second);
assert.deepEqual(first.slice().sort(), input.slice().sort());
assert.deepEqual(input, ['a', 'b', 'c']);
assert.match(html, /AtomurusIsoQuiz/);
assert.match(html, /aria-live="polite"/);
assert.doesNotMatch(readFileSync(path.join(ROOT, 'scripts/restore-isomerism-subpages.js'), 'utf8'), /data-answer="a"[\s\S]{0,400}data-answer="a"[\s\S]{0,400}data-answer="a"/);

console.log('isomerism quiz ok', first.join(''));
