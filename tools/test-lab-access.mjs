import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accessForUser } from '../netlify/lib/plan-access.mjs';
import {
  allowTool,
  calcTabPolicy,
  calcTabFeature,
  pageToolPolicy
} from '../netlify/lib/lab-tool-access.mjs';
import { solveThermodynamics } from '../netlify/lib/chemistry-thermodynamics.mjs';
import {
  isSafeMoleculeKey,
  viewerMoleculePayload,
  VIEWER_MOLECULE_KEYS
} from '../netlify/lib/viewer-molecule-coords.mjs';
import thermoHandler from '../netlify/functions/pro-lab-thermodynamics-solve.mjs';
import moleculeHandler from '../netlify/functions/pro-lab-viewer-molecule.mjs';

function read(rel) {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

const PRO_FEATURES = [
  'interactiveViewers',
  'atomicModelViewer',
  'moleculeViewer',
  'allotropeViewer',
  'isomerismViewer',
  'publicStoichiometry',
  'publicThermodynamics',
  'publicElementCompare'
];
const LOGIN_FEATURES = [
  'scientificCalculator',
  'unitConverter',
  'idealGasCalculator',
  'phCalculator'
];

function assertFlags(access, keys, expected) {
  for (const key of keys) {
    assert.equal(access.features[key], expected, key);
  }
}

const guestAccess = accessForUser({});
assertFlags(guestAccess, LOGIN_FEATURES, false);
assertFlags(guestAccess, PRO_FEATURES, false);

const freeAccess = accessForUser({ createdAt: daysAgo(40), email: 'free@atomurus.com' });
assertFlags(freeAccess, LOGIN_FEATURES, true);
assertFlags(freeAccess, PRO_FEATURES, false);

const trialAccess = accessForUser({ createdAt: daysAgo(2), email: 'trial@atomurus.com' });
assertFlags(trialAccess, LOGIN_FEATURES, true);
assertFlags(trialAccess, PRO_FEATURES, true);

const paidAccess = accessForUser({
  createdAt: daysAgo(40),
  email: 'paid@atomurus.com',
  appMetadata: { atomurus_plan: 'paid', subscription_status: 'active' }
});
assertFlags(paidAccess, PRO_FEATURES, true);

const adminAccess = accessForUser({ role: 'admin', createdAt: daysAgo(100) });
assertFlags(adminAccess, PRO_FEATURES, true);

assert.equal(calcTabPolicy('molar'), 'public');
assert.equal(calcTabPolicy('dilute'), 'public');
assert.equal(calcTabPolicy('scientific'), 'login');
assert.equal(calcTabPolicy('ideal'), 'login');
assert.equal(calcTabPolicy('stoich'), 'pro');
assert.equal(calcTabPolicy('thermo'), 'pro');
assert.equal(calcTabFeature('stoich'), 'publicStoichiometry');
assert.equal(pageToolPolicy('/periodic-table').need, 'public');
assert.equal(pageToolPolicy('/explore/what-is-isomerism').need, 'public');
assert.equal(pageToolPolicy('/viewer/molecules').need, 'pro');
assert.equal(pageToolPolicy('/periodic-table/compare').need, 'pro');

const pending = { signedIn: true, isPro: true, ready: false, features: { moleculeViewer: true } };
assert.equal(allowTool('pro', pending, 'moleculeViewer'), false);
const failedAuth = { signedIn: false, isPro: false, ready: true, features: {} };
assert.equal(allowTool('pro', failedAuth, 'moleculeViewer'), false);

const water = solveThermodynamics({
  gibbs: { deltaH: 100, deltaS: 200, T: 25, TUnit: 'C' },
  heat: { substance: 'water', mass: 10, deltaT: 10 }
});
assert.equal(water.ok, true);
assert.ok(Math.abs(water.gibbs.Tkelvin - 298.15) < 1e-9);
assert.ok(Math.abs(water.gibbs.deltaG - (100 - 0.2 * 298.15)) < 1e-9);
assert.ok(Math.abs(water.heat.q - 418.4) < 1e-9);
assert.equal(water.heat.direction, 'endothermic');
assert.equal(water.gibbs.crossover.direction, 'above');

const cold = solveThermodynamics({
  gibbs: { deltaH: -80, deltaS: -100, T: -20, TUnit: 'C' },
  heat: { substance: 'ice', mass: 5, deltaT: -4 }
});
assert.ok(cold.gibbs.Tkelvin > 0);
assert.equal(cold.heat.direction, 'exothermic');

assert.throws(() => solveThermodynamics({
  gibbs: { deltaH: 10, deltaS: 10, T: 0, TUnit: 'K' },
  heat: { substance: 'water', mass: 1, deltaT: 1 }
}), /absolute zero/i);
assert.throws(() => solveThermodynamics({
  gibbs: { deltaH: 10, deltaS: 10, T: -300, TUnit: 'C' },
  heat: { substance: 'water', mass: 1, deltaT: 1 }
}), /absolute zero/i);
assert.throws(() => solveThermodynamics({
  gibbs: { deltaH: 10, deltaS: 10, T: 25, TUnit: 'C' },
  heat: { substance: 'uranium', mass: 1, deltaT: 1 }
}), /substance/i);

const noCrossover = solveThermodynamics({
  gibbs: { deltaH: -10, deltaS: 20, T: 25, TUnit: 'C' },
  heat: { substance: 'copper', mass: 2, deltaT: 3 }
});
assert.equal(noCrossover.gibbs.crossover, null);

assert.equal(isSafeMoleculeKey('water'), true);
assert.equal(isSafeMoleculeKey('../water'), false);
assert.equal(isSafeMoleculeKey('water/../../etc'), false);
assert.equal(isSafeMoleculeKey('WATER'), true);
assert.ok(VIEWER_MOLECULE_KEYS.includes('water'));
const payload = viewerMoleculePayload('water');
assert.ok(Array.isArray(payload.atoms) && payload.atoms.length >= 3);
assert.ok(Array.isArray(payload.bonds));

const gate = read('assets/lab-tool-gate.js');
assert.match(gate, /Public-lab access presentation/);
assert.match(gate, /conversion UI only/);
assert.match(gate, /authorized server-side/);
assert.match(gate, /Create a free account/);
assert.match(gate, /Start 30-day Pro trial/);
assert.match(gate, /features\.moleculeViewer|moleculeViewer/);
assert.doesNotMatch(gate, /security boundary/i);

const loadThree = read('viewer/load-three.js');
assert.match(loadThree, /atomurusBootProViewer/);
assert.match(loadThree, /VIEWER_CONTROL_STUBS/);
assert.match(loadThree, /el\.closest\('\.viewer'\)/);
assert.match(loadThree, /Loading 3D viewer/);
assert.match(loadThree, /couldn't load/);
assert.match(loadThree, /hasPremiumFeature\(featureKey\)/);

const molecules = read('viewer/molecules.html');
assert.match(molecules, /atomurusBootProViewer/);
assert.doesNotMatch(molecules, /const molData = \{/);
assert.doesNotMatch(molecules, /atoms:\[\{pos:/);
assert.match(molecules, /\/api\/pro-lab\/viewer\/molecule/);
assert.match(molecules, /canvas-wrap\.is-2d/);
assert.doesNotMatch(molecules, /\.canvas-wrap\.is-2d canvas#viewer3d\{visibility:hidden/);
assert.match(molecules, /canvas\.style\.visibility = 'visible'/);
assert.match(molecules, /return fetchMolecule\(initialMol\)/);
assert.match(molecules, /learningResourceType": "Overview"/);

const moleculesPt = read('viewer/molecules.pt.html');
assert.match(moleculesPt, /atomurusBootProViewer/);
assert.doesNotMatch(moleculesPt, /const molData = \{/);

const atomic = read('viewer/atomic-models.html');
assert.match(atomic, /atomurusBootProViewer/);
assert.match(atomic, /atomicModelViewer/);
assert.match(atomic, /canvas-wrap\.is-2d/);
assert.doesNotMatch(atomic, /\.canvas-wrap\.is-2d canvas#viewer3d\{visibility:hidden/);
assert.doesNotMatch(atomic, /cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js/);

const allotropes = read('viewer/allotropes.html');
assert.match(allotropes, /atomurusBootProViewer/);
assert.match(allotropes, /allotropeViewer/);

const iso3d = read('viewer/isomerism/isomerism-3d.js');
assert.match(iso3d, /atomurusBootProViewer/);
assert.match(iso3d, /isomerismViewer/);
assert.match(iso3d, /isExplorePage/);
assert.match(iso3d, /classList.toggle\('is-2d'/);
assert.doesNotMatch(iso3d, /stageEl\.style\.display = 'none'/);
assert.match(iso3d, /stage\.appendChild\(stage2d\)/);

const calculators = read('calculators.html');
assert.match(calculators, /Open Reaction Workbench/);
assert.match(calculators, /\/api\/pro-lab\/thermodynamics\/solve/);
assert.doesNotMatch(calculators, /function parseEquation/);
assert.doesNotMatch(calculators, /const THERMO_C/);
assert.match(calculators, /data-pro-canonical="stoichiometry"/);
assert.match(calculators, /\/api\/pro-lab\/thermodynamics\/solve/);

const compare = read('periodic-table/compare.html');
assert.match(compare, /data-compare-canonical="pro-lab"/);
assert.match(compare, /Open Advanced Compare/);
assert.match(compare, /isAccessibleForFree": false/);
assert.match(compare, /learningResourceType": "Overview"/);

const netlify = read('netlify.toml');
assert.match(netlify, /\/api\/pro-lab\/thermodynamics\/solve/);
assert.match(netlify, /\/api\/pro-lab\/viewer\/molecule/);

const thermoFn = read('netlify/functions/pro-lab-thermodynamics-solve.mjs');
assert.match(thermoFn, /requireFeature\(request, 'publicThermodynamics'\)/);
assert.match(thermoFn, /body\.isPro/);

const molFn = read('netlify/functions/pro-lab-viewer-molecule.mjs');
assert.match(molFn, /requireFeature\(request, 'moleculeViewer'\)/);
assert.match(molFn, /isSafeMoleculeKey/);

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.scripts['test:lab-access'], 'node tools/test-lab-access.mjs');
assert.match(pkg.scripts.ci, /test:lab-access/);

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function jsonRes(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body))
  };
}

function cookieRequest(url, { method = 'GET', cookies = '', body } = {}) {
  const init = {
    method,
    headers: {
      origin: 'https://atomurus.com',
      accept: 'application/json',
      cookie: cookies
    }
  };
  if (body != null) {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

function sessionCookie(token) {
  return `atm_access=${token}; atm_refresh=refresh-${token}`;
}

function demoUsers() {
  const old = '2026-01-01T00:00:00.000Z';
  const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  return {
    'access-free': {
      id: 'user-free',
      email: 'free@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: {},
      user_metadata: {},
      role: 'authenticated'
    },
    'access-trial': {
      id: 'user-trial',
      email: 'trial@atomurus.com',
      created_at: recent,
      email_confirmed_at: recent,
      app_metadata: {},
      user_metadata: {},
      role: 'authenticated'
    },
    'access-pro-a': {
      id: 'user-a',
      email: 'alice@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: { atomurus_plan: 'paid', subscription_status: 'active' },
      user_metadata: { username: 'alice' },
      role: 'authenticated'
    },
    'access-admin': {
      id: 'user-admin',
      email: 'admin@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: {},
      user_metadata: {},
      role: 'admin'
    }
  };
}

async function withAuthEnv(fn) {
  restoreEnv();
  Object.assign(process.env, {
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    NETLIFY_DEV: 'true',
    AUTH_SITE_URL: 'https://atomurus.com'
  });
  const users = demoUsers();
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const header = options.headers?.Authorization || options.headers?.authorization || '';
    const token = String(header).replace(/^Bearer\s+/i, '').trim();
    if (String(options.method || 'GET').toUpperCase() === 'GET' && href.endsWith('/user')) {
      const user = users[token];
      if (!user) return jsonRes(401, { message: 'expired' });
      return jsonRes(200, user);
    }
    throw new Error(`Unexpected fetch ${href}`);
  };
  try {
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
}

async function readJson(res) {
  return JSON.parse(await res.text());
}

const thermoBody = {
  gibbs: { deltaH: 100, deltaS: 200, T: 25, TUnit: 'C' },
  heat: { substance: 'water', mass: 10, deltaT: 10 }
};

await withAuthEnv(async () => {
  const unsignedThermo = await thermoHandler(cookieRequest('https://atomurus.com/api/pro-lab/thermodynamics/solve', {
    method: 'POST',
    body: thermoBody
  }));
  assert.equal(unsignedThermo.status, 401);
  assert.match(unsignedThermo.headers.get('Cache-Control') || '', /no-store/);

  const unsignedMol = await moleculeHandler(cookieRequest('https://atomurus.com/api/pro-lab/viewer/molecule?key=water'));
  assert.equal(unsignedMol.status, 401);
});

await withAuthEnv(async () => {
  const freeThermo = await thermoHandler(cookieRequest('https://atomurus.com/api/pro-lab/thermodynamics/solve', {
    method: 'POST',
    cookies: sessionCookie('access-free'),
    body: thermoBody
  }));
  const freeThermoJson = await readJson(freeThermo);
  assert.equal(freeThermo.status, 403);
  assert.equal(freeThermoJson.feature, 'publicThermodynamics');

  const freeMol = await moleculeHandler(cookieRequest('https://atomurus.com/api/pro-lab/viewer/molecule?key=water', {
    cookies: sessionCookie('access-free')
  }));
  const freeMolJson = await readJson(freeMol);
  assert.equal(freeMol.status, 403);
  assert.equal(freeMolJson.feature, 'moleculeViewer');
});

await withAuthEnv(async () => {
  for (const token of ['access-trial', 'access-pro-a', 'access-admin']) {
    const thermo = await thermoHandler(cookieRequest('https://atomurus.com/api/pro-lab/thermodynamics/solve', {
      method: 'POST',
      cookies: sessionCookie(token),
      body: thermoBody
    }));
    const thermoJson = await readJson(thermo);
    assert.equal(thermo.status, 200, token);
    assert.equal(thermoJson.ok, true);
    assert.ok(Number.isFinite(thermoJson.gibbs.deltaG));
    assert.match(thermo.headers.get('Cache-Control') || '', /no-store/);

    const mol = await moleculeHandler(cookieRequest('https://atomurus.com/api/pro-lab/viewer/molecule?key=water', {
      cookies: sessionCookie(token)
    }));
    const molJson = await readJson(mol);
    assert.equal(mol.status, 200, token);
    assert.equal(molJson.ok, true);
    assert.ok(molJson.molecule.atoms.length >= 3);
    assert.match(mol.headers.get('Cache-Control') || '', /no-store/);
  }
});

await withAuthEnv(async () => {
  const spoof = await thermoHandler(cookieRequest('https://atomurus.com/api/pro-lab/thermodynamics/solve', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { ...thermoBody, isPro: true, feature: 'publicThermodynamics' }
  }));
  assert.equal(spoof.status, 400);

  const traversal = await moleculeHandler(cookieRequest(
    'https://atomurus.com/api/pro-lab/viewer/molecule?key=../../water',
    { cookies: sessionCookie('access-pro-a') }
  ));
  assert.equal(traversal.status, 400);
});

console.log('lab-access tests passed');
