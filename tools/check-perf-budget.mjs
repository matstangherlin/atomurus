#!/usr/bin/env node
/**
 * Compare a Lighthouse summary with docs/perf/budget.json.
 * Not wired into CI. The owner decides whether a budget should fail a build.
 *
 *   node tools/check-perf-budget.mjs [summary.json] [budget.json]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function checkBudget(summary, budget) {
  const failures = [];
  const pages = summary.pages || [];
  for (const page of pages) {
    const limit = budget.pages && budget.pages[page.path];
    if (!limit) continue;
    for (const key of ['totalKiB', 'requests', 'unusedJsKiB']) {
      if (typeof limit[key] !== 'number' || typeof page[key] !== 'number') continue;
      if (page[key] > limit[key]) {
        failures.push(`${page.path} ${key} ${page[key]} > ${limit[key]}`);
      }
    }
  }
  return failures;
}

function main() {
  const summaryPath = process.argv[2] || path.join(ROOT, 'docs/perf/lighthouse-after.json');
  const budgetPath = process.argv[3] || path.join(ROOT, 'docs/perf/budget.json');
  const failures = checkBudget(JSON.parse(readFileSync(summaryPath, 'utf8')), JSON.parse(readFileSync(budgetPath, 'utf8')));
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log('perf budget ok');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
