import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { isAdWarmup, stripAdsPreconnect, run } = require('./patch-remove-ads-preconnect.js');

const sample = '<link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>';
assert.equal(isAdWarmup(sample), true);
assert.equal(isAdWarmup('<link rel="preload" href="/assets/fonts/inter-tight-normal-latin.woff2" as="font">'), false);
assert.equal(isAdWarmup('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'), false);

const html = `<!DOCTYPE html>\n<head>\n${sample}\n<link rel="preload" href="/assets/fonts/inter-tight-normal-latin.woff2" as="font">\n</head>\n`;
const once = stripAdsPreconnect(html);
assert.equal(once.includes('pagead2'), false);
assert.equal(once.includes('inter-tight'), true);
assert.equal(stripAdsPreconnect(once), once);

const bom = `\uFEFF<!DOCTYPE html>\r\n<head>\r\n<link rel="preload" href="/x.css" as="style">\r\n</head>\r\n`;
assert.equal(stripAdsPreconnect(bom), bom);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomurus-preconnect-'));
const file = path.join(dir, 'page.html');
fs.writeFileSync(file, html);
assert.equal(run(dir), 1);
assert.equal(run(dir), 0);
assert.equal(fs.readFileSync(file, 'utf8').includes('pagead2'), false);

console.log('test-patch-ads-preconnect: ok');
