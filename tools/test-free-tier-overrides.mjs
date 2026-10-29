// Prompt 34, scenario B of docs/product/escopo-gratuito-e-plano-escolar.md:
// the balancer and the basic limiting reagent open to free accounts. The
// configuration is injected here; the defaults in feature-catalog.mjs never
// change (tools/test-feature-access-snapshot.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ACCESS_CONFIG, FEATURES, accessCatalog, featureAccess, featuresForAccess, resolveAccessConfig } from '../netlify/lib/feature-catalog.mjs';
import { accessForUser } from '../netlify/lib/plan-access.mjs';
import { requireFeature } from '../netlify/lib/require-feature.mjs';
import { renderAccessPolicy } from './build-access-policy.mjs';
import { PRO_LAB_LIMITS } from '../netlify/lib/pro-lab.mjs';
import { STUDY_LIMITS } from '../netlify/lib/study-cloud.mjs';
import { STUDY_SET_LIMITS } from '../netlify/lib/study-sets.mjs';
import { REACTION_LIMITS } from '../netlify/lib/chemistry-reactions.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B = Object.freeze({
  FREE_TIER_OVERRIDES: { reactionBalancer: 'account', limitingReagentSolver: 'account' },
  SCHOOL_PLAN_ENABLED: false,
  SCHOOL_PLAN_FEATURES: []
});

// ── The defaults stay as they are ───────────────────────────────────────────
assert.deepEqual(ACCESS_CONFIG.FREE_TIER_OVERRIDES, {}, 'nothing is opened by default');
assert.equal(ACCESS_CONFIG.SCHOOL_PLAN_ENABLED, false);
assert.deepEqual([...ACCESS_CONFIG.SCHOOL_PLAN_FEATURES], []);

// ── Scenario B on the server ────────────────────────────────────────────────
const guest = featuresForAccess({}, B);
const free = featuresForAccess({ signedIn: true }, B);
const pro = featuresForAccess({ signedIn: true, isPro: true }, B);
for (const key of ['reactionBalancer', 'limitingReagentSolver']) {
  assert.equal(featureAccess(key, B), 'account', `${key}: account in B`);
  assert.equal(guest[key], false, `${key}: blocked without an account`);
  assert.equal(free[key], true, `${key}: open with a free account`);
  assert.equal(pro[key], true, `${key}: still in Pro`);
}
assert.equal(free.reactionWorkbench, false, 'the Reaction Workbench stays Pro');
assert.equal(free.adsFree, false, 'ads-free stays Pro');
// Today the limiting reagent is computed by pro-lab-reaction-solve, which asks
// for stoichiometrySolver: B alone does not open it (owner decision, see the doc).
assert.match(fs.readFileSync(path.join(ROOT, 'netlify/functions/pro-lab-reaction-solve.mjs'), 'utf8'), /requireFeature\(request, 'stoichiometrySolver'\)/);
assert.equal(free.stoichiometrySolver, false, 'B does not open the stoichiometry solver');
// Nothing else moves: every other feature has the same access for every profile.
const def = { guest: featuresForAccess({}), free: featuresForAccess({ signedIn: true }), pro: featuresForAccess({ signedIn: true, isPro: true }) };
for (const key of Object.keys(def.free).filter((k) => !['reactionBalancer', 'limitingReagentSolver'].includes(k))) {
  assert.equal(guest[key], def.guest[key], `guest ${key}`);
  assert.equal(free[key], def.free[key], `free ${key}`);
  assert.equal(pro[key], def.pro[key], `pro ${key}`);
}
// The default catalog is untouched by building B.
assert.equal(FEATURES.reactionBalancer.access, 'pro');
assert.equal(accessCatalog().FEATURES.limitingReagentSolver.access, 'pro');

const freeUser = { id: 'u-free', email: 'free@example.test', createdAt: '2020-01-01T00:00:00Z' };
assert.equal(accessForUser(freeUser, B).features.reactionBalancer, true);
assert.equal(accessForUser(freeUser, B).plan, 'free', 'the plan does not change');
assert.equal(accessForUser(freeUser).features.reactionBalancer, false, 'default: Pro');

// ── requireFeature with B (Supabase mocked, as in test-auth-bearer) ─────────
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const originalInfo = console.info;
Object.assign(process.env, { SUPABASE_URL: 'https://demo.supabase.co', SUPABASE_ANON_KEY: 'anon', NETLIFY_DEV: 'true', SUPABASE_FETCH_RETRIES: '0' });
console.warn = () => {};
console.info = () => {};
globalThis.fetch = async (url, options = {}) => {
  const u = String(url);
  if (u.endsWith('/auth/v1/user')) {
    return (options.headers?.Authorization || '') === 'Bearer fixture-access'
      ? new Response(JSON.stringify({ id: '11111111-2222-4333-8444-555555555555', email: 'free@example.test', created_at: '2020-01-01T00:00:00Z', app_metadata: {} }), { status: 200, headers: { 'content-type': 'application/json' } })
      : new Response(JSON.stringify({ msg: 'invalid JWT' }), { status: 401, headers: { 'content-type': 'application/json' } });
  }
  throw new Error('unexpected fetch ' + u);
};
try {
  const req = (auth) => new Request('https://atomurus.com/api/pro-lab/reactions/balance', { method: 'POST', headers: auth ? { Authorization: 'Bearer ' + auth } : {} });
  const anon = await requireFeature(req(null), 'reactionBalancer', B);
  assert.equal(anon.response.status, 401, 'no account: 401');
  const opened = await requireFeature(req('fixture-access'), 'reactionBalancer', B);
  assert.equal(opened.response, null, 'free account in B: allowed');
  const locked = await requireFeature(req('fixture-access'), 'reactionBalancer');
  assert.equal(locked.response.status, 403, 'default: still Pro');
  assert.equal((await locked.response.json()).code, 'feature_locked');
  const workbench = await requireFeature(req('fixture-access'), 'reactionWorkbench', B);
  assert.equal(workbench.response.status, 403, 'the Workbench stays Pro in B');
} finally {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
  console.info = originalInfo;
}

// ── The browser copy follows the same configuration ─────────────────────────
const sandbox = { window: {} };
vm.runInNewContext(renderAccessPolicy(B), sandbox);
assert.equal(sandbox.window.ATOMURUS_ACCESS.featureAccess('reactionBalancer'), 'account');
assert.equal(sandbox.window.ATOMURUS_ACCESS.featureAccess('reactionWorkbench'), 'pro');
assert.equal(sandbox.window.ATOMURUS_ACCESS.LAB_TABS.stoich.access, 'pro', 'the calculator stoichiometry tab is untouched');
const shipped = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/access-policy.js'), 'utf8'), shipped);
assert.equal(shipped.window.ATOMURUS_ACCESS.featureAccess('reactionBalancer'), 'pro', 'the shipped copy keeps the default');

// ── Limits and quotas do not depend on the configuration ────────────────────
const frozen = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/fixtures/feature-access-snapshot.json'), 'utf8')).limits;
assert.deepEqual(JSON.parse(JSON.stringify({ PRO_LAB_LIMITS, STUDY_LIMITS, STUDY_SET_LIMITS, REACTION_LIMITS })), frozen);

// ── Mistakes are refused, not applied silently ──────────────────────────────
const bad = (overrides, re) => assert.throws(() => resolveAccessConfig({ FREE_TIER_OVERRIDES: overrides }), re);
bad({ reactionBalance: 'account' }, /unknown feature/);
bad({ adsFree: 'public' }, /cannot be overridden/);
bad({ reactionBalancer: 'pro' }, /must be 'public' or 'account'/);
bad({ moleculeViewer: 'account' }, /only be opened/);
assert.throws(() => resolveAccessConfig({ SCHOOL_PLAN_FEATURES: ['adsFree'] }), /seat can grant/);

console.log('test-free-tier-overrides: ok (scenario B injected; defaults, limits and the Workbench unchanged)');
