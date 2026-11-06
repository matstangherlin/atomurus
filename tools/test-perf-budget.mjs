import assert from 'node:assert/strict';
import { checkBudget } from './check-perf-budget.mjs';

const budget = {
  pages: {
    '/': { totalKiB: 100, requests: 10, unusedJsKiB: 5 }
  }
};

const ok = checkBudget({
  pages: [{ path: '/', totalKiB: 90, requests: 10, unusedJsKiB: 4 }]
}, budget);
assert.deepEqual(ok, []);

const over = checkBudget({
  pages: [{ path: '/', totalKiB: 140, requests: 12, unusedJsKiB: 5 }]
}, budget);
assert.deepEqual(over, ['/ totalKiB 140 > 100', '/ requests 12 > 10']);

const ignored = checkBudget({
  pages: [{ path: '/outro', totalKiB: 9999, requests: 99, unusedJsKiB: 99 }]
}, budget);
assert.deepEqual(ignored, []);

console.log('test-perf-budget: ok');
