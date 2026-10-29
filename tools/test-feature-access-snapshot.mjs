// Prompt 34: freezes who gets what today — the catalog, the features each
// profile receives (server), the browser mirror and its presentation gate,
// the prices, the trial and the limits. A change of access has to show up
// here as a deliberate edit of tools/fixtures/feature-access-snapshot.json;
// the free-tier and school-plan switches of the prompt must leave it as is.
//
//   node tools/test-feature-access-snapshot.mjs           → compare
//   node tools/test-feature-access-snapshot.mjs --write   → (re)write the fixture
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { FEATURES, LAB_TABS, PAGE_TOOLS, featureAccess, featuresForAccess } from '../netlify/lib/feature-catalog.mjs';
import { PLAN_PRICING, PAID_SUBSCRIPTION_STATUSES, accessForUser } from '../netlify/lib/plan-access.mjs';
import { allowTool, calcTabPolicy, calcTabFeature, pageToolPolicy } from '../netlify/lib/lab-tool-access.mjs';
import { PRO_LAB_LIMITS } from '../netlify/lib/pro-lab.mjs';
import { STUDY_LIMITS } from '../netlify/lib/study-cloud.mjs';
import { STUDY_SET_LIMITS } from '../netlify/lib/study-sets.mjs';
import { REACTION_LIMITS } from '../netlify/lib/chemistry-reactions.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = path.join(ROOT, 'tools', 'fixtures', 'feature-access-snapshot.json');
const DAY = 24 * 60 * 60 * 1000;

const enabled = (features) => Object.keys(features).filter((k) => features[k]).sort();
const accessMap = (catalog) => Object.fromEntries(Object.entries(catalog).map(([k, v]) => [k, { access: v.access, category: v.category || null, feature: v.feature === undefined ? undefined : v.feature }]));
const plain = (v) => JSON.parse(JSON.stringify(v));

// Accounts as Supabase hands them to plan-access (fixtures, no real data).
const USERS = {
  guest: {},
  freeAfterTrial: { id: 'u-free', email: 'free@example.test', createdAt: '2020-01-01T00:00:00Z' },
  freeInTrial: { id: 'u-trial', email: 'trial@example.test', createdAt: new Date(Date.now() - DAY).toISOString() },
  trialExplicitEnded: { id: 'u-te', email: 'te@example.test', createdAt: new Date(Date.now() - DAY).toISOString(), app_metadata: { atomurus_trial_ends_at: '2021-01-01T00:00:00Z' } },
  paidActive: { id: 'u-paid', email: 'paid@example.test', createdAt: '2020-01-01T00:00:00Z', app_metadata: { subscription_status: 'active', stripe_customer_id: 'cus_fixture' } },
  paidTrialing: { id: 'u-bt', email: 'bt@example.test', createdAt: '2020-01-01T00:00:00Z', app_metadata: { subscription_status: 'trialing' } },
  pastDue: { id: 'u-pd', email: 'pd@example.test', createdAt: '2020-01-01T00:00:00Z', app_metadata: { subscription_status: 'past_due' } },
  canceled: { id: 'u-c', email: 'c@example.test', createdAt: '2020-01-01T00:00:00Z', app_metadata: { subscription_status: 'canceled', atomurus_plan: 'paid' } },
  legacyPaid: { id: 'u-lp', email: 'lp@example.test', createdAt: '2020-01-01T00:00:00Z', app_metadata: { atomurus_plan: 'paid' } },
  paidRole: { id: 'u-r', email: 'r@example.test', createdAt: '2020-01-01T00:00:00Z', roles: ['paid'] },
  admin: { id: 'u-a', email: 'a@example.test', role: 'admin', createdAt: '2020-01-01T00:00:00Z' },
  schoolAfterTrial: { id: 'u-s', email: 's@example.test', createdAt: '2020-01-01T00:00:00Z', app_metadata: { atomurus_plan: 'school' } },
  schoolInTrial: { id: 'u-st', email: 'st@example.test', createdAt: new Date(Date.now() - DAY).toISOString(), app_metadata: { plan: 'school' } }
};

const PATHS = ['/', '/explore/what-is-an-atom', '/periodic-table/compare', '/periodic-table/compare.pt.html', '/viewer/molecules/water',
  '/molecules', '/viewer/atomic-models/bohr', '/atomic-models', '/viewer/allotropes', '/allotropes', '/viewer/isomerism', '/isomerism/x', '/calculators'];
const SESSIONS = {
  guest: { ready: true, signedIn: false, features: featuresForAccess({}) },
  free: { ready: true, signedIn: true, features: featuresForAccess({ signedIn: true }) },
  pro: { ready: true, signedIn: true, features: featuresForAccess({ signedIn: true, isPro: true }) },
  loading: { ready: false, signedIn: false, features: {} }
};
const NEEDS = [['public', null], ['account', null], ['account', 'studyCloud'], ['pro', null], ['pro', 'publicStoichiometry'], ['pro', 'reactionBalancer'], ['pro', 'limitingReagentSolver']];

function browser() {
  const window = {};
  const listeners = [];
  const document = {
    readyState: 'loading', // keep the gate from booting: only its policy functions are read
    documentElement: { lang: 'en' },
    addEventListener: (type) => listeners.push(type),
    querySelector: () => null,
    getElementById: () => null
  };
  const ctx = vm.createContext({ window, document, location: { pathname: '/', search: '' } });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', 'access-policy.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', 'lab-tool-gate.js'), 'utf8'), ctx);
  const cat = window.ATOMURUS_ACCESS;
  const gate = window.AtomurusLabToolGate;
  return plain({
    FEATURES: accessMap(cat.FEATURES),
    LAB_TABS: accessMap(cat.LAB_TABS),
    PAGE_TOOLS: accessMap(cat.PAGE_TOOLS),
    unknownFeature: cat.featureAccess('noSuchFeature'),
    gatePages: Object.fromEntries(PATHS.map((p) => [p, gate.pagePolicy(p)])),
    gateTabs: Object.fromEntries(Object.keys(LAB_TABS).concat('nope').map((t) => [t, [gate.calcTabPolicy(t), gate.calcTabFeature(t)]])),
    gateAllow: Object.fromEntries(Object.entries(SESSIONS).map(([s, session]) => [s, NEEDS.map(([need, f]) => gate.allow(need, session, f))]))
  });
}

export function snapshot() {
  return plain({
    server: {
      FEATURES: accessMap(FEATURES),
      LAB_TABS: accessMap(LAB_TABS),
      PAGE_TOOLS: accessMap(PAGE_TOOLS),
      featureAccess: Object.fromEntries(Object.keys(FEATURES).concat('noSuchFeature').map((k) => [k, featureAccess(k)])),
      profiles: {
        guest: enabled(featuresForAccess({})),
        account: enabled(featuresForAccess({ signedIn: true })),
        pro: enabled(featuresForAccess({ signedIn: true, isPro: true })),
        admin: enabled(featuresForAccess({ signedIn: true, isPro: true, isAdmin: true }))
      },
      users: Object.fromEntries(Object.entries(USERS).map(([k, u]) => {
        const a = accessForUser(u);
        return [k, { plan: a.plan, planSource: a.planSource, isPro: a.isPro, adsFree: a.adsFree, role: a.role, trial: Boolean(a.trialEndsAt), features: enabled(a.features) }];
      })),
      labToolAccess: {
        pages: Object.fromEntries(PATHS.map((p) => [p, pageToolPolicy(p)])),
        tabs: Object.fromEntries(Object.keys(LAB_TABS).concat('nope').map((t) => [t, [calcTabPolicy(t), calcTabFeature(t)]])),
        allow: Object.fromEntries(Object.entries(SESSIONS).map(([s, session]) => [s, NEEDS.map(([need, f]) => allowTool(need, session, f))]))
      }
    },
    browser: browser(),
    pricing: { PLAN_PRICING, PAID_SUBSCRIPTION_STATUSES },
    limits: { PRO_LAB_LIMITS, STUDY_LIMITS, STUDY_SET_LIMITS, REACTION_LIMITS }
  });
}

const now = snapshot();
if (process.argv.includes('--write')) {
  fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
  fs.writeFileSync(FIXTURE, JSON.stringify(now, null, 2) + '\n');
  console.log('test-feature-access-snapshot: wrote ' + path.relative(ROOT, FIXTURE));
} else {
  const frozen = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  assert.deepEqual(now, frozen, 'access changed: if that is intended, it is an owner decision (docs/product/escopo-gratuito-e-plano-escolar.md)');
  console.log(`test-feature-access-snapshot: ok (${Object.keys(FEATURES).length} features, ${Object.keys(USERS).length} accounts, browser gate in step)`);
}
