#!/usr/bin/env node
// A1.0 — mutation tests. Each mutation plants one of the regressions A1.0
// must never allow, runs the test that is supposed to catch it, and expects
// that test to FAIL ("killed"). A surviving mutation means the gate is blind.
// Files are restored after every mutation (and on exit), generated assets
// rebuilt.
//
//   node tools/test-a1-mutations.mjs            all (Node + Playwright)
//   node tools/test-a1-mutations.mjs --node     Node-only mutations (fast)
//   node tools/test-a1-mutations.mjs --only 12  one mutation
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = (script) => ({ cmd: process.execPath, args: [script], label: script });
const e2e = (spec, grep) => ({ cmd: path.join(ROOT, 'node_modules/.bin/playwright'), args: ['test', spec, '--grep', grep, '--reporter=dot', '--retries=0'], label: `playwright ${spec} --grep "${grep}"`, e2e: true });
const appBundle = { cmd: 'bash', args: ['-c', 'node tools/build-app-bundle.mjs >/dev/null && node tools/test-app-bundle.mjs'], label: 'build:app + test-app-bundle' };

const SHELL_CSS = 'src/ui/layouts/app-shell.css';
const M = [
  // ---- mobile ---------------------------------------------------------------
  { id: 1, name: 'safe top removed', file: SHELL_CSS, find: 'padding: var(--app-safe-top) calc(var(--gutter) + var(--app-safe-right)) 0', replace: 'padding: 0 calc(var(--gutter) + var(--app-safe-right)) 0', build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'safe area top 48 / bottom 48') },
  { id: 2, name: 'safe bottom removed', file: SHELL_CSS, find: 'padding: 0 var(--app-safe-right) var(--app-safe-bottom) var(--app-safe-left);', replace: 'padding: 0 var(--app-safe-right) 0 var(--app-safe-left);', build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'safe area top 48 / bottom 48') },
  { id: 3, name: 'CTA/content covered by the bottom bar', file: SHELL_CSS, find: '  grid-area: nav;\n', replace: '  grid-area: nav;\n  position: fixed;\n  left: 0;\n  right: 0;\n  bottom: 0;\n', build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'app shell 390x844') },
  { id: 4, name: '360px viewport overflows', file: SHELL_CSS, find: '.app-feature { max-width: var(--content-max); margin: 0 auto; }', replace: '.app-feature { max-width: var(--content-max); margin: 0 auto; min-width: 400px; }', build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'app shell 360x740') },
  { id: 5, name: 'bottom nav gets 6 destinations', file: 'src/core/routing/routes.js', find: "export const PRIMARY_NAV = Object.freeze(['home', 'explore', 'lab', 'study', 'account']);", replace: "export const PRIMARY_NAV = Object.freeze(['home', 'explore', 'lab', 'study', 'calculators', 'account']);", kill: node('tools/test-architecture-boundaries.mjs') },
  { id: 6, name: 'critical touch target < 44px', file: 'src/ui/tokens/spacing.css', find: '--touch-min: 44px;', replace: '--touch-min: 32px;', build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'touch targets') },
  { id: 7, name: 'keyboard covers the login CTA', file: 'src/features/account/index.js', find: "const reveal = () => scope.timeout(() => submit.scrollIntoView({ block: 'nearest' }), 250);", replace: 'const reveal = () => {};', kill: e2e('e2e/a1-mobile.spec.js', 'keyboard: login') },
  { id: 8, name: 'modal leaves the viewport', file: 'src/ui/components/overlays.css', find: 'max-height: calc(var(--app-vh, 100vh) - var(--app-safe-top, 0px) - var(--space-5));', replace: 'max-height: none;', build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'sheet and dialog') },
  { id: 9, name: 'nested scroll traps the page', file: SHELL_CSS, find: '.app-feature { max-width: var(--content-max); margin: 0 auto; }', replace: '.app-feature { max-width: var(--content-max); margin: 0 auto; max-height: 300px; overflow-y: auto; }', build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'app shell 390x844') },

  // ---- API ----------------------------------------------------------------------
  { id: 10, name: 'feature calls fetch directly', file: 'src/features/study/index.js', find: '    const study = createStudyApi(services.api);', replace: "    const study = createStudyApi(services.api);\n    fetch('/api/study/overview');", kill: node('tools/test-architecture-boundaries.mjs') },
  { id: 11, name: 'Android sends /api/... to localhost', file: 'src/core/config/runtime-config.js', find: "let apiBase = native ? PRODUCTION_ORIGIN : '';", replace: "let apiBase = '';", kill: node('tools/test-api-client.mjs') },
  { id: 12, name: 'request timeout removed', file: 'src/core/api/api-client.js', find: '    }, timeoutFor(method, opts));', replace: '    }, 2147483647);', kill: { ...node('tools/test-api-client.mjs'), timeoutMs: 30000 } },
  { id: 13, name: 'unbounded retries', file: 'src/core/api/retry-policy.js', find: 'export const HARD_MAX_RETRIES = 4;', replace: 'export const HARD_MAX_RETRIES = 1000;', kill: node('tools/test-api-client.mjs') },
  { id: 14, name: 'POST replayed automatically', file: 'src/core/api/retry-policy.js', find: [['return idempotencyKey ? Math.min(bounded, 1) : 0;', 'return bounded;'], ['return Boolean(idempotencyKey) && RETRYABLE_WRITE_KINDS.has(error.kind);', 'return RETRYABLE_WRITE_KINDS.has(error.kind);']], kill: node('tools/test-api-client.mjs') },
  { id: 15, name: '401 treated as a generic error', file: 'src/core/api/api-errors.js', find: '  if (status === 401) return ApiErrorKind.UNAUTHORIZED;\n', replace: '', kill: node('tools/test-api-client.mjs') },

  // ---- auth -----------------------------------------------------------------------
  { id: 16, name: 'Android relies only on the web cookie', file: 'src/core/auth/native-auth-adapter.js', find: "      return session ? `Bearer ${session.accessToken}` : null;", replace: '      return null;', kill: node('tools/test-auth-adapters.mjs') },
  { id: 17, name: 'token written to localStorage', file: 'src/core/auth/native-auth-adapter.js', find: '    if (next) await store.set(SECURE_KEYS.session, JSON.stringify(next));', replace: '    if (next) { try { globalThis.localStorage && globalThis.localStorage.setItem(SECURE_KEYS.session, JSON.stringify(next)); } catch (_e) {} await store.set(SECURE_KEYS.session, JSON.stringify(next)); }', kill: node('tools/test-auth-adapters.mjs') },
  { id: 18, name: 'refresh token not renewed', file: 'src/core/auth/native-auth-adapter.js', find: '        await persist(fromGrant(grant, base.user));', replace: '        await persist({ ...fromGrant(grant, base.user), refreshToken: base.refreshToken });', kill: node('tools/test-auth-adapters.mjs') },
  { id: 19, name: 'logout keeps the stored session', file: 'src/core/auth/native-auth-adapter.js', find: '      /* Clear locally first: logout must work offline. */\n      await persist(null);', replace: '      session = null;', kill: node('tools/test-auth-adapters.mjs') },
  { id: 20, name: 'web auth weakened (HttpOnly dropped)', file: 'netlify/lib/auth-cookies.mjs', find: "    'HttpOnly',\n", replace: '', kill: node('tools/test-auth-bearer.mjs') },
  { id: 21, name: 'web and Android get different user ids', file: 'netlify/lib/supabase-auth.mjs', find: '    const user = bearer.token ? await supabaseGetUser(bearer.token) : null;', replace: "    const found = bearer.token ? await supabaseGetUser(bearer.token) : null;\n    const user = found ? { ...found, id: `android-${found.id}` } : null;", kill: node('tools/test-auth-bearer.mjs') },

  // ---- performance ------------------------------------------------------------------
  { id: 22, name: 'Three.js loaded at bootstrap', file: 'src/app/bootstrap/app-main.js', find: "import { createAppShell } from '../shell/app-shell.js';", replace: "import { createAppShell } from '../shell/app-shell.js';\nimport * as THREE_EAGER from '../../../node_modules/three/build/three.module.js';\nwindow.__THREE_EAGER = THREE_EAGER;", kill: appBundle },
  { id: 23, name: 'viewer keeps rendering after leaving', file: 'src/features/viewer/viewer-host.js', find: '    if (scope) {\n      scope.dispose();\n      scope = null;\n    }', replace: '    scope = null;', kill: node('tools/test-viewer-lifecycle.mjs') },
  { id: 24, name: 'animation frame loop duplicates', file: 'src/core/lifecycle/scope.js', find: '          if (disposed || running) return;', replace: '          if (disposed) return;', kill: node('tools/test-feature-lifecycle.mjs') },
  { id: 25, name: 'listeners are never removed', file: 'src/core/lifecycle/scope.js', find: "      return track('listeners', () => target.removeEventListener(type, handler, options));", replace: "      return track('listeners', () => {});", kill: node('tools/test-feature-lifecycle.mjs') },
  { id: 26, name: 'geometry not disposed', file: 'src/features/viewer/viewer-host.js', find: '      obj.geometry.dispose();\n', replace: '', kill: node('tools/test-viewer-lifecycle.mjs') },
  { id: 27, name: 'texture not disposed', file: 'src/features/viewer/viewer-host.js', find: '          tex.dispose();\n', replace: '', kill: node('tools/test-viewer-lifecycle.mjs') },
  { id: 28, name: 'feature stays mounted invisibly', file: 'src/app/shell/feature-host.js', find: '    const my = ++token;\n    teardown();', replace: '    const my = ++token;', kill: node('tools/test-feature-lifecycle.mjs') },

  // ---- design -----------------------------------------------------------------------
  { id: 29, name: 'new component depends on legacy CSS', file: 'src/ui/components/toast.css', append: '\n.ui-toast { border-color: var(--lc-border); }\n', build: 'ui', kill: node('tools/test-architecture-boundaries.mjs') },
  { id: 30, name: 'new component uses !important', file: 'src/ui/components/toast.css', append: '\n.ui-toast { color: #000 !important; }\n', build: 'ui', kill: node('tools/test-architecture-boundaries.mjs') },
  { id: 31, name: 'login creates its own tokens', file: 'src/features/account/index.js', find: "el('form', { class: 'app-form', 'data-login-form': true, novalidate: true },", replace: "el('form', { class: 'app-form', 'data-login-form': true, novalidate: true, style: '--login-accent: #c00' },", kill: node('tools/test-architecture-boundaries.mjs') },
  { id: 32, name: 'mobile is the desktop scaled down', file: 'dev/app-shell.html', find: 'content="width=device-width, initial-scale=1, viewport-fit=cover"', replace: 'content="width=1280, viewport-fit=cover"', kill: e2e('e2e/a1-mobile.spec.js', 'app shell 390x844') },
  { id: 33, name: 'periodic table zoomed out until illegible', file: SHELL_CSS, find: [['grid-template-columns: repeat(18, minmax(var(--touch-min), 1fr));', 'grid-template-columns: repeat(18, minmax(0, 1fr));'], ['  min-width: calc(18 * var(--touch-min) + 17 * 2px);\n', '']], build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'periodic table: list') },
  { id: 34, name: 'Lab keeps two impossible columns at 360px', file: SHELL_CSS, find: '.app-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--color-border); }', replace: '.app-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--color-border); display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); }', build: 'ui', kill: e2e('e2e/a1-mobile.spec.js', 'app shell 360x740') }
];

const args = process.argv.slice(2);
const onlyNode = args.includes('--node');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? Number(args[onlyIdx + 1]) : null;

const originals = new Map();
function restoreAll() {
  for (const [file, text] of originals) writeFileSync(path.join(ROOT, file), text);
  originals.clear();
}
process.on('exit', restoreAll);
process.on('SIGINT', () => { restoreAll(); process.exit(130); });

function run({ cmd, args: a, timeoutMs = 240000 }) {
  const res = spawnSync(cmd, a, { cwd: ROOT, encoding: 'utf8', timeout: timeoutMs, env: { ...process.env, CI: '' } });
  return { status: res.status, timedOut: Boolean(res.error && res.error.code === 'ETIMEDOUT'), out: `${res.stdout || ''}${res.stderr || ''}` };
}

function rebuild(kind) {
  if (kind === 'ui') run({ cmd: process.execPath, args: ['tools/build-ui.mjs'] });
}

const results = [];
for (const m of M) {
  if (only != null && m.id !== only) continue;
  if (onlyNode && m.kill.e2e) continue;
  const abs = path.join(ROOT, m.file);
  const before = readFileSync(abs, 'utf8');
  let after = before;
  if (m.append) {
    after = before + m.append;
  } else {
    const pairs = Array.isArray(m.find) ? m.find : [[m.find, m.replace]];
    for (const [find, replace] of pairs) {
      if (!after.includes(find)) {
        results.push({ ...m, outcome: 'STALE', detail: `pattern not found in ${m.file}` });
        after = null;
        break;
      }
      after = after.replace(find, replace);
    }
  }
  if (after == null) continue;
  originals.set(m.file, before);
  writeFileSync(abs, after);
  rebuild(m.build);
  const res = run(m.kill);
  writeFileSync(abs, before);
  originals.delete(m.file);
  rebuild(m.build);
  const killed = res.status !== 0 || res.timedOut;
  results.push({ ...m, outcome: killed ? (res.timedOut ? 'KILLED (timeout)' : 'KILLED') : 'SURVIVED' });
  process.stdout.write(`#${String(m.id).padStart(2)} ${killed ? 'killed  ' : 'SURVIVED'} ${m.name} — ${m.kill.label}\n`);
}

/* Leave generated assets exactly as the sources say. */
run({ cmd: process.execPath, args: ['tools/build-ui.mjs'] });
run({ cmd: process.execPath, args: ['tools/build-app-bundle.mjs'] });

const survived = results.filter((r) => r.outcome === 'SURVIVED' || r.outcome === 'STALE');
console.log(`\n${results.length - survived.length}/${results.length} mutations killed`);
for (const r of survived) console.log(`  ✗ #${r.id} ${r.name}: ${r.outcome}${r.detail ? ` (${r.detail})` : ''}`);
if (args.includes('--markdown')) {
  console.log('\n| # | mutation | caught by | result |\n| ---: | --- | --- | --- |');
  for (const r of results) console.log(`| ${r.id} | ${r.name} | \`${r.kill.label}\` | ${r.outcome} |`);
}
process.exit(survived.length ? 1 : 0);
