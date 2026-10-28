// tools/audit-csp.mjs on minimal fixtures, plus the policies in netlify.toml
// against the ones the script builds.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  inventory, scanHtml, scanJs, scanCss, sha256, redact, buildPolicy, reportOnlyPolicy, REPORT_ONLY_BUDGET
} from './audit-csp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The hash is the one a CSP hash source carries: sha256 of the exact body, base64.
const body = "document.documentElement.classList.add('x');";
assert.equal(sha256(body), crypto.createHash('sha256').update(body).digest('base64'));
assert.equal(sha256('alert(1)'), 'bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI=');

const page = [
  '<!doctype html><html><head>',
  '<script>' + body + '</script>',
  '<script type="application/ld+json">{"@context":"https://schema.org"}</script>',
  '<script type="importmap">{"imports":{}}</script>',
  '<script src="https://cdn.example.org/lib.js"></script>',
  '<script src="/local.js"></script>',
  '<link rel="stylesheet" href="https://fonts.example.net/css" onload="this.media=\'all\'">',
  '<link rel="canonical" href="https://atomurus.example/page">',
  '<style>.a{color:red}</style>',
  '<!-- <script>commented()</script> -->',
  '</head><body>',
  '<button onclick="go()" style="color:red">Go</button>',
  '<input onchange="x()" oninput="y()">',
  '<img src="https://img.example.com/a.png" srcset="https://img2.example.com/a.png 2x">',
  '<a href="https://elsewhere.example/">a link is not a resource</a>',
  '<script>(window.atomurusRunAutoTag||function(){})({ zoneId: \'abc123secret\' });</script>',
  '</body></html>'
].join('\n');

const scan = scanHtml(page);
assert.equal(scan.scripts.length, 2, 'JSON-LD, importmap, external and commented scripts are not inline scripts');
assert.equal(scan.externalScripts.length, 2);
assert.deepEqual(scan.handlers, { onload: 1, onclick: 1, onchange: 1, oninput: 1 });
assert.equal(scan.styles.length, 1);
assert.equal(scan.styleAttrs, 1);
const origins = new Set(scan.origins.map((row) => row.origin));
assert.ok(origins.has('https://fonts.example.net'));
assert.ok(origins.has('https://img.example.com') && origins.has('https://img2.example.com'), 'src and srcset');
assert.ok(!origins.has('https://atomurus.example'), 'canonical links are not fetched');
assert.ok(!origins.has('https://elsewhere.example'), 'anchors are navigation');

assert.equal(redact("zoneId: 'abc123secret'"), "zoneId: '…'");
assert.equal(redact('ca-pub-1234567890'), 'ca-pub-…');
assert.equal(redact("id: 'G-ABCDEFG12'"), "id: 'G-…'");
assert.deepEqual(scanJs("var a = 'https://api.example.com/x'; // https://comment.example.com\nvar ns = 'http://www.w3.org/2000/svg';"), ['https://api.example.com']);
assert.deepEqual(scanCss("@import 'https://f.example.com/a.css'; .b{background:url(https://i.example.com/b.png)} .c{background:url(/local.png)}"),
  ['https://f.example.com', 'https://i.example.com']);

// A tiny site: two pages share a script, one is in a skipped folder.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'csp-audit-'));
fs.writeFileSync(path.join(tmp, 'index.html'), page);
fs.writeFileSync(path.join(tmp, 'about.html'), '<script>' + body + '</script><p onclick="a()">x</p>');
fs.mkdirSync(path.join(tmp, 'docs'));
fs.writeFileSync(path.join(tmp, 'docs', 'skip.html'), '<script>skipped()</script>');
fs.writeFileSync(path.join(tmp, 'site.js'), "fetch('https://data.example.io/v1');");
const inv = inventory(tmp);
assert.equal(inv.htmlFiles, 2);
assert.equal(inv.inlineScripts.total, 3);
assert.equal(inv.inlineScripts.distinct, 2);
assert.equal(inv.inlineScripts.groups[0].hash, sha256(body), 'the shared script comes first');
assert.equal(inv.inlineScripts.groups[0].pages, 2);
assert.equal(inv.handlers.byAttribute.onclick.count, 2);
assert.equal(inv.handlers.pages, 2);
assert.ok(inv.origins.some((row) => row.origin === 'https://data.example.io' && row.uses.includes('js literal')));
assert.ok(!JSON.stringify(inv).includes('abc123secret'), 'IDs never reach the inventory');
fs.rmSync(tmp, { recursive: true, force: true });

// ── The policies ────────────────────────────────────────────────────────────
const applied = buildPolicy();
assert.match(applied, /script-src 'self' 'unsafe-inline' /, "stage 1 keeps 'unsafe-inline'");
for (const directive of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'", "form-action 'self'"]) {
  assert.ok(applied.includes(directive), directive);
}
assert.match(applied, /connect-src [^;]*https:\/\/\*\.google-analytics\.com/, 'GA4 collection hosts');
assert.match(applied, /connect-src [^;]*https:\/\/\*\.analytics\.google\.com/);
assert.match(applied, /connect-src [^;]*https:\/\/www\.google\.com\/recaptcha\//, 'reCAPTCHA calls back to www.google.com/recaptcha/');
assert.match(applied, /frame-src [^;]*https:\/\/recaptcha\.google\.com\/recaptcha\//);
assert.doesNotMatch(applied, /fonts\.googleapis|fonts\.gstatic|youtube/, 'origins nothing loads are gone');

const strict = buildPolicy({ scriptHashes: ['AAAA'] });
assert.doesNotMatch(strict, /'unsafe-inline'[^;]*;\s*script-src-attr/);
assert.match(strict, /script-src 'self' 'report-sample' 'sha256-AAAA' /, 'reports carry the first characters of the script');
assert.match(strict, /script-src-attr 'none' 'report-sample'/);

const real = inventory(ROOT);
const ro = reportOnlyPolicy(real);
assert.ok(ro.bytes <= REPORT_ONLY_BUDGET, `Report-Only header ${ro.bytes} bytes`);
assert.ok(ro.hashes > 0);
assert.doesNotMatch(ro.policy.split(';').find((d) => d.trim().startsWith('script-src ')), /'unsafe-inline'/);

// netlify.toml carries exactly what the script builds, so the two never drift.
const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
const header = (name) => {
  const m = new RegExp('^\\s*' + name.replace(/-/g, '\\-') + '\\s*=\\s*"([^"]*)"', 'm').exec(toml);
  return m ? m[1] : null;
};
assert.equal(header('Content-Security-Policy'), applied, 'applied CSP in netlify.toml = node tools/audit-csp.mjs --emit-policy');
// The Report-Only hashes are checked against the pages as they are now: the
// deploy build rewrites some HTML (other than ?v= stamps, which are never
// hashed), so the choice of hashes may differ by a tie after a build, but a
// hash in netlify.toml must always name a script that still exists.
const shipped = header('Content-Security-Policy-Report-Only');
const withoutHashes = (policy) => policy.replace(/ 'sha256-[^']+'/g, '');
assert.equal(withoutHashes(shipped), withoutHashes(ro.policy), 'Report-Only directives = node tools/audit-csp.mjs --emit-report-only');
const live = new Set(real.inlineScripts.groups.map((g) => g.hash));
const stale = [...shipped.matchAll(/'sha256-([^']+)'/g)].map((m) => m[1]).filter((h) => !live.has(h));
assert.deepEqual(stale, [], 'every Report-Only hash names an inline script that still exists; regenerate with --emit-report-only');
assert.ok(Buffer.byteLength(shipped, 'utf8') <= REPORT_ONLY_BUDGET);

console.log(`test-audit-csp: ok (${real.inlineScripts.distinct} distinct inline scripts, report-only ${ro.bytes} bytes)`);
