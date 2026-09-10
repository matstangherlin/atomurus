import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dev/viz-prototype.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../dev/viz-prototype.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../dev/viz-prototype.css', import.meta.url), 'utf8');
const robots = readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');

assert.match(html, /noindex/);
assert.match(html, /Paper models/);
assert.match(html, /three\.js\/r128/);
assert.doesNotMatch(html, /viewer\/runtime/);
assert.doesNotMatch(html, /atomurusInitMoleculeViewer/);
assert.match(js, /F2EFE7/);
assert.match(js, /space-fill|spacefill|repStyle|data-rep/);
assert.match(js, /2p_z/);
assert.match(css, /#F2EFE7|#F8F5EC/);
assert.match(robots, /Disallow: \/dev\//);

console.log('viz prototype tests passed');
