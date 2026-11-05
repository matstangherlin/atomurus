// Study journey: every question is well formed, the path unlocks in order,
// and progress/XP/missions/review behave.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const J = require('../assets/study-journey.js');

function memStore() { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; }

let questions = 0;
for (const { node } of J.allNodes()) {
  assert.ok(node.title && node.title.en && node.title.pt, `${node.id} has a bilingual title`);
  if (node.kind === 'bench' || node.kind === 'reading') { assert.ok(node.href, `${node.id} has an href`); continue; }
  if (node.kind === 'checkpoint') { assert.equal(J.stepsFor(node.id, 3).length > 0, true, `${node.id} draws questions`); continue; }
  for (const step of node.steps) {
    if (step.type !== 'choice') { assert.ok(step.body.en && step.body.pt); continue; }
    questions += 1;
    const en = step.options.map((o) => o.en);
    assert.equal(new Set(en).size, en.length, `${node.id}: options are distinct (${en.join(' / ')})`);
    assert.ok(step.options.length >= 2 && step.options.length <= 4);
    assert.ok(step.answer >= 0 && step.answer < step.options.length);
    assert.ok(step.q.en && step.q.pt && step.explain.en && step.explain.pt, `${node.id}: bilingual copy`);
  }
}
assert.ok(questions >= 40, 'enough questions in the path');

// Shuffled plays keep the right answer pointing at the same option.
const raw = J.findNode('u2-practice').node.steps;
for (const s of J.stepsFor('u2-practice', 11)) {
  const src = raw[Number(s.ref.split('#')[1])];
  assert.equal(s.options[s.answer].en, src.options[src.answer].en);
}

// Path order: only the first lesson is open; optional reading never blocks.
const state = J.emptyState();
let st = J.statuses(state);
assert.equal(st['u1-what'], 'current');
assert.equal(st['u1-energy'], 'locked');
J.finish(state, 'u1-what', { perfect: true, missed: [] }, '2026-11-05T10:00:00');
st = J.statuses(state);
assert.equal(st['u1-what'], 'done');
assert.equal(st['u1-energy'], 'current');
// Practice needs all its rounds.
J.finish(state, 'u1-energy', { perfect: true }, '2026-11-05T10:05:00');
assert.equal(J.statuses(state)['u1-energy'], 'current');
J.finish(state, 'u1-energy', { perfect: false, missed: ['u1-energy#2'] }, '2026-11-05T10:10:00');
assert.equal(J.statuses(state)['u1-energy'], 'done');
J.finish(state, 'u1-bench', {}, '2026-11-05T10:20:00');
for (const id of ['u2-atom', 'u2-particles']) J.finish(state, id, {}, '2026-11-05T10:30:00');
J.finish(state, 'u2-practice', {}, '2026-11-05T10:35:00');
st = J.statuses(state);
assert.equal(st['u2-read'], 'open', 'optional reading is open but not required');
assert.equal(st['u2-practice'], 'current');

// XP, streak, missions and review.
const stats = J.stats(state, '2026-11-05T12:00:00');
assert.equal(stats.today, 10 + 15 + 15 + 10 + 10 + 10 + 15);
assert.equal(stats.streak, 1);
const missions = J.missions(state, '2026-11-05T12:00:00');
assert.deepEqual(missions.map((m) => m.value), [50, 1, 1]);
assert.equal(J.reviewSteps(state).length, 1);
J.finish(state, 'u2-practice', {}, '2026-11-06T09:00:00');
assert.equal(J.stats(state, '2026-11-06T12:00:00').streak, 2);

// Storage round trip.
const store = memStore();
J.save(state, store);
assert.equal(J.load(store).xp, state.xp);
console.log(`study journey ok (${questions} questions)`);
