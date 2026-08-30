import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { molarMassOf, runProCalculation, solveDilution, solveIdealGas, solvePH } from '../netlify/lib/chemistry-calc.mjs';
import { compareElements, MAX_COMPARE_ELEMENTS } from '../netlify/lib/canonical-elements.mjs';
import { compareMolecules } from '../netlify/lib/canonical-molecules.mjs';
import { PRO_LAB_LIMITS, validateSessionState } from '../netlify/lib/pro-lab.mjs';
import sessionsHandler from '../netlify/functions/pro-lab-sessions.mjs';
import sessionHandler from '../netlify/functions/pro-lab-session.mjs';
import calculateHandler from '../netlify/functions/pro-lab-calculate.mjs';
import elementsHandler from '../netlify/functions/pro-lab-elements-compare.mjs';
import moleculesHandler from '../netlify/functions/pro-lab-molecules-compare.mjs';
import atomicHandler from '../netlify/functions/pro-lab-atomic-compare.mjs';
import balanceHandler from '../netlify/functions/pro-lab-reaction-balance.mjs';
import solveHandler from '../netlify/functions/pro-lab-reaction-solve.mjs';
import formulaHandler from '../netlify/functions/pro-lab-formula-solve.mjs';
import solutionsHandler from '../netlify/functions/pro-lab-solutions-solve.mjs';
import equilibriumHandler from '../netlify/functions/pro-lab-equilibrium-solve.mjs';
import acidBaseHandler from '../netlify/functions/pro-lab-acid-base-solve.mjs';
import thermoHandler from '../netlify/functions/pro-lab-thermodynamics-solve.mjs';
import viewerMoleculeHandler from '../netlify/functions/pro-lab-viewer-molecule.mjs';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function jsonRes(status, body, extraHeaders = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        const key = String(name).toLowerCase();
        if (extraHeaders[key] != null) return extraHeaders[key];
        if (extraHeaders[name] != null) return extraHeaders[name];
        return null;
      }
    },
    text: async () => (body === undefined ? '' : JSON.stringify(body))
  };
}

function cookieRequest(url, { method = 'GET', cookies = '', body, headers = {} } = {}) {
  const init = {
    method,
    headers: {
      origin: 'https://atomurus.com',
      accept: 'application/json',
      cookie: cookies,
      ...headers
    }
  };
  if (body != null) {
    init.headers['content-type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return new Request(url, init);
}

function sessionCookie(token) {
  return `atm_access=${token}; atm_refresh=refresh-${token}`;
}

async function readJson(res) {
  return JSON.parse(await res.text());
}

function cookieHeadersOf(res) {
  return typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
}

function assertPrivate(res, json) {
  assert.match(res.headers.get('Cache-Control') || '', /no-store/);
  const text = JSON.stringify(json);
  assert.doesNotMatch(text, /accessToken|access_token|"eyJ/);
  assert.equal(cookieHeadersOf(res).some((header) => header.includes('Max-Age=0')), false);
}

function nowIso() {
  return new Date().toISOString();
}

function demoUsers() {
  const old = '2026-01-01T00:00:00.000Z';
  const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  return {
    'access-pro-a': {
      id: 'user-a',
      email: 'alice@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: { atomurus_plan: 'paid', subscription_status: 'active' },
      user_metadata: { username: 'alice' },
      role: 'authenticated'
    },
    'access-pro-b': {
      id: 'user-b',
      email: 'bob@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: { atomurus_plan: 'paid', subscription_status: 'active' },
      user_metadata: { username: 'bob' },
      role: 'authenticated'
    },
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
    'access-admin': {
      id: 'user-admin',
      email: 'admin@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: { roles: ['admin'] },
      user_metadata: {},
      role: 'admin'
    }
  };
}

function parseQuery(href) {
  const raw = String(href).split('?')[1] || '';
  return raw.split('&').filter(Boolean).map((part) => {
    const split = part.indexOf('=');
    if (split < 0) return [decodeURIComponent(part), ''];
    return [decodeURIComponent(part.slice(0, split)), decodeURIComponent(part.slice(split + 1))];
  });
}

function param(params, key) {
  const found = params.find((entry) => entry[0] === key);
  return found ? found[1] : null;
}

function matchesFilters(row, params) {
  for (const [key, raw] of params) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'on_conflict') continue;
    const eq = /^eq\.(.*)$/.exec(raw);
    if (eq && String(row[key]) !== eq[1]) return false;
  }
  return true;
}

function sortRows(rows, params) {
  const order = param(params, 'order') || '';
  if (order.includes('updated_at.desc')) {
    return [...rows].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)) || String(b.id).localeCompare(String(a.id)));
  }
  return rows;
}

function createLabStore() {
  const sessions = [];
  let seq = 0;
  function nextId() {
    seq += 1;
    return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
  }
  return {
    sessions,
    handle(href, method, options, user) {
      const url = String(href);
      const table = url.includes('/pro_lab_sessions')
        ? 'pro_lab_sessions'
        : url.includes('/profiles')
          ? 'profiles'
          : null;
      if (!table) return jsonRes(404, { message: 'not found' });
      const params = parseQuery(url);
      const prefer = String(options.headers?.Prefer || options.headers?.prefer || '');
      const body = options.body ? JSON.parse(options.body) : null;
      const rows = table === 'pro_lab_sessions' ? sessions : [];

      if (table === 'profiles') {
        if (method === 'POST') return jsonRes(200, [{ id: user.id, email: user.email || null }]);
        return jsonRes(200, [{ id: user.id, email: user.email || null }]);
      }

      if (method === 'GET') {
        const matched = sortRows(rows.filter((row) => row.user_id === user.id && matchesFilters(row, params)), params);
        const limit = Number(param(params, 'limit') || matched.length);
        if (prefer.includes('count=exact')) {
          return jsonRes(200, matched.slice(0, 1), { 'content-range': `0-0/${matched.length}` });
        }
        return jsonRes(200, matched.slice(0, limit), { 'content-range': `0-${Math.max(0, matched.length - 1)}/${matched.length}` });
      }

      if (method === 'POST') {
        if (body.user_id !== user.id) return jsonRes(401, { message: 'RLS' });
        const stamp = nowIso();
        const created = {
          id: nextId(),
          created_at: stamp,
          updated_at: stamp,
          title: '',
          session_type: 'calculation',
          state: {},
          ...body
        };
        rows.push(created);
        return jsonRes(201, [created]);
      }

      if (method === 'PATCH') {
        const matched = rows.filter((row) => row.user_id === user.id && matchesFilters(row, params));
        const stamp = nowIso();
        matched.forEach((row) => Object.assign(row, body, { updated_at: stamp }));
        return jsonRes(200, matched);
      }

      if (method === 'DELETE') {
        const matched = rows.filter((row) => row.user_id === user.id && matchesFilters(row, params));
        matched.forEach((row) => {
          const index = rows.indexOf(row);
          if (index >= 0) rows.splice(index, 1);
        });
        return jsonRes(200, matched);
      }

      return jsonRes(405, { message: 'method' });
    }
  };
}

function bearerToken(options) {
  const header = options.headers?.Authorization || options.headers?.authorization || '';
  return String(header).replace(/^Bearer\s+/i, '').trim();
}

function installLabMock(store, users) {
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const method = String(options.method || 'GET').toUpperCase();
    const token = bearerToken(options);
    if (method === 'GET' && href.endsWith('/user')) {
      const user = users[token];
      if (!user) return jsonRes(401, { message: 'expired' });
      return jsonRes(200, user);
    }
    if (href.includes('/rest/v1/')) {
      const user = users[token];
      if (!user) return jsonRes(401, { message: 'expired' });
      return store.handle(href, method, options, user);
    }
    throw new Error(`Unexpected fetch ${method} ${href}`);
  };
}

async function withLabEnv(fn) {
  restoreEnv();
  Object.assign(process.env, {
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    NETLIFY_DEV: 'true',
    AUTH_SITE_URL: 'https://atomurus.com'
  });
  const users = demoUsers();
  const store = createLabStore();
  installLabMock(store, users);
  try {
    await fn({ store, users });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
}

const calcSrc = readFileSync(new URL('../netlify/lib/chemistry-calc.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(calcSrc, /(?:^|[^/\w* ])eval\s*\(/);
assert.doesNotMatch(calcSrc, /new Function\s*\(/);

const ethanol = molarMassOf('C2H5OH');
assert.ok(ethanol.atomCount >= 9);
assert.ok(ethanol.molarMass > 40 && ethanol.molarMass < 50);

const water = molarMassOf('H2O');
assert.equal(Number(water.molarMass.toFixed(3)), 18.015);

const sulfuric = molarMassOf('H2SO4');
assert.ok(Math.abs(sulfuric.molarMass - 98.072) < 0.02);
const oxygen = sulfuric.composition.find((row) => row.symbol === 'O');
assert.ok(oxygen);
assert.ok(Math.abs(oxygen.massPercent - 65.26) < 0.2);

const dil = solveDilution({ C1: 1, V1: 10, C2: 0.1, solve: 'V2' });
assert.equal(dil.V2, 100);

const gas = solveIdealGas({ P: 1, n: 1, T: 298.15, PUnit: 'atm', VUnit: 'L', TUnit: 'K', solve: 'V' });
assert.ok(Math.abs(gas.V - 24.464) < 0.02);

const ph = solvePH({ mode: 'pH', pH: 3 });
assert.equal(Number(ph.pOH.toFixed(2)), 11);
assert.equal(ph.nature, 'acidic');

const batch = runProCalculation({
  calculator: 'molar_mass',
  formulas: ['H2O', 'CO2', 'NaCl', 'H2SO4']
});
assert.equal(batch.results.length, 4);
assert.equal(Number(batch.results[0].molarMass.toFixed(3)), 18.015);

assert.throws(() => runProCalculation({ calculator: 'scientific', formulas: ['1+1'] }));
assert.equal(MAX_COMPARE_ELEMENTS, 4);
assert.equal(PRO_LAB_LIMITS.maxSessions, 200);
assert.equal(PRO_LAB_LIMITS.title, 120);

const spoofed = compareElements({
  atomicNumbers: [{ atomicNumber: 26, atomicMass: 99999999 }],
  properties: ['atomicMass']
});
assert.equal(spoofed.elements[0].symbol, 'Fe');
assert.equal(spoofed.elements[0].atomicMass, 55.845);
assert.notEqual(spoofed.elements[0].atomicMass, 99999999);

const mols = compareMolecules({ moleculeIds: ['water', 'co2'] });
assert.equal(mols.molecules[0].formula, 'H2O');
assert.equal(Number(mols.molecules[0].molarMass.toFixed(3)), 18.015);
assert.equal(mols.molecules[1].formula, 'CO2');

assert.throws(() => validateSessionState('calculation', { calculator: 'dilution', eval: '1+1', scenarios: [] }));
assert.throws(() => validateSessionState('calculation', {
  calculator: 'dilution',
  scenarios: [{ label: 'x', code: 'function () {}' }]
}));

const publicPages = [
  'calculators.html',
  'calculators.pt.html',
  'periodic-table.html',
  'periodic-table/heatmap.html',
  'periodic-table/heatmap.pt.html',
  'periodic-table/trends.html',
  'periodic-table/isotopes.html',
  'viewer/atomic-models.html',
  'viewer/molecules.html',
  'explore/what-are-isotopes.html'
];
for (const rel of publicPages) {
  const html = readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
  assert.doesNotMatch(html, /requireFeature/, rel);
  assert.doesNotMatch(html, /feature_locked/, rel);
}

const heatmap = readFileSync(new URL('../periodic-table/heatmap.html', import.meta.url), 'utf8');
assert.equal((heatmap.match(/id="cmp-slot-/g) || []).length, 2);
assert.match(heatmap, /data-pro-lab-tool="elements"/);

const calculators = readFileSync(new URL('../calculators.html', import.meta.url), 'utf8');
assert.match(calculators, /molar mass|Molar Mass/i);
assert.match(calculators, /dilution|Dilution/i);
assert.match(calculators, /ideal gas|Ideal Gas/i);
assert.match(calculators, /pH/);
assert.match(calculators, /scientific/i);
assert.match(calculators, /data-pro-lab-tool="calculations"/);

const moleculesHtml = readFileSync(new URL('../viewer/molecules.html', import.meta.url), 'utf8');
assert.match(moleculesHtml, /data-pro-lab-tool="molecules"/);
assert.doesNotMatch(moleculesHtml, /bond length|bond angle/i);

const atomicHtml = readFileSync(new URL('../viewer/atomic-models.html', import.meta.url), 'utf8');
assert.match(atomicHtml, /data-pro-lab-tool="atomic"/);

const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
assert.match(appHtml, /pro-lab\.js/);
assert.doesNotMatch(appHtml, /three(\.min)?\.js/i);

const proLabSrc = readFileSync(new URL('../pro-lab.js', import.meta.url), 'utf8');
assert.match(proLabSrc, /confirmDialog/);
assert.match(proLabSrc, /deleteSessionTitle/);
assert.match(proLabSrc, /tone: 'danger'/);
assert.doesNotMatch(proLabSrc, /toast\([^)]+,\s*'danger'\s*\)/);

const planAccess = readFileSync(new URL('../netlify/lib/plan-access.mjs', import.meta.url), 'utf8');
assert.match(planAccess, /proLab: isPro/);
assert.match(planAccess, /advancedCalculations: isPro/);
assert.match(planAccess, /advancedElementCompare: isPro/);
assert.match(planAccess, /advancedMoleculeCompare: isPro/);
assert.match(planAccess, /advancedAtomicCompare: isPro/);
assert.match(planAccess, /savedLabSessions: isPro/);
assert.match(planAccess, /chemistrySolver: isPro/);
assert.match(planAccess, /reactionWorkbench: isPro/);
assert.match(planAccess, /reactionBalancer: isPro/);
assert.match(planAccess, /stoichiometrySolver: isPro/);
assert.match(planAccess, /formulaSolver: isPro/);
assert.match(planAccess, /solutionBuilder: isPro/);
assert.match(planAccess, /equilibriumWorkbench: isPro/);
assert.match(planAccess, /equilibriumSolver: isPro/);
assert.match(planAccess, /reactionQuotient: isPro/);
assert.match(planAccess, /iceTableSolver: isPro/);
assert.match(planAccess, /acidBaseWorkbench: isPro/);
assert.match(planAccess, /weakAcidSolver: isPro/);
assert.match(planAccess, /weakBaseSolver: isPro/);
assert.match(planAccess, /bufferSolver: isPro/);
assert.match(planAccess, /acidBaseConstants: isPro/);
assert.match(planAccess, /scientificCalculator: signedIn/);
assert.match(planAccess, /const interactiveViewers = isPro/);
assert.match(planAccess, /publicStoichiometry: isPro/);
assert.match(planAccess, /publicThermodynamics: isPro/);
assert.match(planAccess, /moleculeViewer: interactiveViewers/);

const calcFn = readFileSync(new URL('../netlify/functions/pro-lab-calculate.mjs', import.meta.url), 'utf8');
assert.match(calcFn, /requireFeature\(request, 'advancedCalculations'\)/);
assert.doesNotMatch(calcFn, /\beval\s*\(/);

await withLabEnv(async () => {
  const unsigned = await sessionsHandler(cookieRequest('https://atomurus.com/api/pro-lab/sessions'));
  const unsignedJson = await readJson(unsigned);
  assert.equal(unsigned.status, 401);
  assert.equal(unsignedJson.code, 'session_expired');
  assertPrivate(unsigned, unsignedJson);
});

await withLabEnv(async () => {
  for (const [handler, url, method, feature] of [
    [sessionsHandler, 'https://atomurus.com/api/pro-lab/sessions', 'GET', 'savedLabSessions'],
    [calculateHandler, 'https://atomurus.com/api/pro-lab/calculate', 'POST', 'advancedCalculations'],
    [elementsHandler, 'https://atomurus.com/api/pro-lab/elements/compare', 'POST', 'advancedElementCompare'],
    [moleculesHandler, 'https://atomurus.com/api/pro-lab/molecules/compare', 'GET', 'advancedMoleculeCompare'],
    [atomicHandler, 'https://atomurus.com/api/pro-lab/atomic/compare', 'POST', 'advancedAtomicCompare'],
    [balanceHandler, 'https://atomurus.com/api/pro-lab/reaction/balance', 'POST', 'reactionBalancer'],
    [solveHandler, 'https://atomurus.com/api/pro-lab/reaction/solve', 'POST', 'stoichiometrySolver'],
    [formulaHandler, 'https://atomurus.com/api/pro-lab/formula/solve', 'POST', 'formulaSolver'],
    [solutionsHandler, 'https://atomurus.com/api/pro-lab/solutions/solve', 'POST', 'solutionBuilder'],
    [equilibriumHandler, 'https://atomurus.com/api/pro-lab/equilibrium/solve', 'POST', 'equilibriumSolver'],
    [acidBaseHandler, 'https://atomurus.com/api/pro-lab/acid-base/solve', 'POST', 'weakAcidSolver'],
    [thermoHandler, 'https://atomurus.com/api/pro-lab/thermodynamics/solve', 'POST', 'publicThermodynamics']
  ]) {
    const free = await handler(cookieRequest(url, {
      method,
      cookies: sessionCookie('access-free'),
      body: method === 'GET' ? undefined : { calculator: 'dilution', scenarios: [{ C1: 1, V1: 10, C2: 0.1, solve: 'V2' }] }
    }));
    const json = await readJson(free);
    assert.equal(free.status, 403, feature);
    assert.equal(json.code, 'feature_locked', feature);
    assert.equal(json.feature, feature);
    assertPrivate(free, json);
  }
});

await withLabEnv(async () => {
  for (const token of ['access-trial', 'access-pro-a', 'access-admin']) {
    const listed = await sessionsHandler(cookieRequest('https://atomurus.com/api/pro-lab/sessions', {
      cookies: sessionCookie(token)
    }));
    const json = await readJson(listed);
    assert.equal(listed.status, 200, token);
    assert.equal(json.ok, true);
    assert.equal(json.quota.max, 200);
    assertPrivate(listed, json);
  }
});

await withLabEnv(async ({ store }) => {
  const created = await sessionsHandler(cookieRequest('https://atomurus.com/api/pro-lab/sessions', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      sessionType: 'calculation',
      title: 'Acid-base experiment',
      state: {
        calculator: 'dilution',
        scenarios: [
          { label: 'Experiment A', C1: 1, V1: 10, C2: 0.1, solve: 'V2' }
        ]
      }
    }
  }));
  const createdJson = await readJson(created);
  assert.equal(created.status, 200);
  assert.equal(createdJson.session.title, 'Acid-base experiment');
  const id = createdJson.session.id;

  const stolenGet = await sessionHandler(cookieRequest(`https://atomurus.com/api/pro-lab/session?id=${id}`, {
    cookies: sessionCookie('access-pro-b')
  }));
  assert.equal(stolenGet.status, 404);

  const stolenPut = await sessionHandler(cookieRequest('https://atomurus.com/api/pro-lab/session', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-b'),
    body: { id, title: 'Hijacked', sessionType: 'calculation', state: { calculator: 'dilution', scenarios: [] } }
  }));
  assert.equal(stolenPut.status, 404);

  const stolenDelete = await sessionHandler(cookieRequest(`https://atomurus.com/api/pro-lab/session?id=${id}`, {
    method: 'DELETE',
    cookies: sessionCookie('access-pro-b')
  }));
  assert.equal(stolenDelete.status, 404);

  const updated = await sessionHandler(cookieRequest('https://atomurus.com/api/pro-lab/session', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { id, title: 'Dilution lab' }
  }));
  const updatedJson = await readJson(updated);
  assert.equal(updated.status, 200);
  assert.equal(updatedJson.session.title, 'Dilution lab');
  assert.equal(store.sessions.length, 1);
});

await withLabEnv(async ({ store }) => {
  const stamp = nowIso();
  for (let i = 0; i < 200; i += 1) {
    store.sessions.push({
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      user_id: 'user-a',
      session_type: 'calculation',
      title: `Session ${i + 1}`,
      state: { calculator: 'dilution', scenarios: [] },
      created_at: stamp,
      updated_at: stamp
    });
  }
  const blocked = await sessionsHandler(cookieRequest('https://atomurus.com/api/pro-lab/sessions', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { sessionType: 'calculation', title: 'Overflow', state: { calculator: 'dilution', scenarios: [] } }
  }));
  const blockedJson = await readJson(blocked);
  assert.equal(blocked.status, 409);
  assert.equal(blockedJson.code, 'quota_exceeded');
  assert.equal(store.sessions.length, 200);

  const patch = await sessionHandler(cookieRequest('https://atomurus.com/api/pro-lab/session', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: {
      id: store.sessions[0].id,
      title: 'Updated without quota'
    }
  }));
  const patchJson = await readJson(patch);
  assert.equal(patch.status, 200);
  assert.equal(patchJson.session.title, 'Updated without quota');
  assert.equal(store.sessions.length, 200);
});

await withLabEnv(async () => {
  const calc = await calculateHandler(cookieRequest('https://atomurus.com/api/pro-lab/calculate', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      calculator: 'dilution',
      scenarios: [
        { label: 'Experiment A', C1: 1, V1: 10, C2: 0.1, solve: 'V2' },
        { label: 'Experiment B', C1: 2, V1: 10, C2: 0.1, solve: 'V2' },
        { label: 'Experiment C', C1: 1, V1: 25, C2: 0.5, solve: 'V2' }
      ]
    }
  }));
  const json = await readJson(calc);
  assert.equal(calc.status, 200);
  assert.equal(json.results[0].V2, 100);
  assert.equal(json.results[1].V2, 200);
  assert.equal(json.results[2].V2, 50);
  assertPrivate(calc, json);
});

await withLabEnv(async () => {
  const mass = await calculateHandler(cookieRequest('https://atomurus.com/api/pro-lab/calculate', {
    method: 'POST',
    cookies: sessionCookie('access-trial'),
    body: { calculator: 'molar_mass', formulas: ['H2O', { formula: 'CO2', label: 'Carbon dioxide' }] }
  }));
  const json = await readJson(mass);
  assert.equal(mass.status, 200);
  assert.equal(Number(json.results[0].molarMass.toFixed(3)), 18.015);
});

await withLabEnv(async () => {
  const compared = await elementsHandler(cookieRequest('https://atomurus.com/api/pro-lab/elements/compare', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      atomicNumbers: [
        { atomicNumber: 26, atomicMass: 99999999 },
        27,
        28,
        29
      ],
      properties: ['atomicNumber', 'atomicMass', 'period', 'group'],
      chartProperty: 'atomicMass'
    }
  }));
  const json = await readJson(compared);
  assert.equal(compared.status, 200);
  assert.equal(json.elements.length, 4);
  assert.equal(json.elements[0].symbol, 'Fe');
  assert.equal(json.elements[0].atomicMass, 55.845);
  assert.equal(json.chart.property, 'atomicMass');
  assertPrivate(compared, json);
});

await withLabEnv(async () => {
  const compared = await atomicHandler(cookieRequest('https://atomurus.com/api/pro-lab/atomic/compare', {
    method: 'POST',
    cookies: sessionCookie('access-admin'),
    body: { atomicNumbers: [11, 17] }
  }));
  const json = await readJson(compared);
  assert.equal(compared.status, 200);
  assert.equal(json.elements[0].symbol, 'Na');
  assert.equal(json.elements[1].symbol, 'Cl');
  assert.ok(Array.isArray(json.elements[0].shells));
});

await withLabEnv(async () => {
  const compared = await moleculesHandler(cookieRequest('https://atomurus.com/api/pro-lab/molecules/compare', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { moleculeIds: ['water', 'co2'], molarMass: 999999 }
  }));
  const json = await readJson(compared);
  assert.equal(compared.status, 200);
  assert.equal(json.measuresBonds, false);
  assert.equal(Number(json.molecules[0].molarMass.toFixed(3)), 18.015);
});

await withLabEnv(async () => {
  const rejected = await sessionsHandler(cookieRequest('https://atomurus.com/api/pro-lab/sessions', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      sessionType: 'calculation',
      title: 'Nope',
      state: { calculator: 'dilution', javascript: 'alert(1)', scenarios: [] }
    }
  }));
  assert.equal(rejected.status, 400);
});

await withLabEnv(async () => {
  const unsigned = await balanceHandler(cookieRequest('https://atomurus.com/api/pro-lab/reaction/balance', {
    method: 'POST',
    body: { equation: 'H2 + O2 -> H2O' }
  }));
  assert.equal(unsigned.status, 401);
});

await withLabEnv(async () => {
  const balanced = await balanceHandler(cookieRequest('https://atomurus.com/api/pro-lab/reaction/balance', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { equation: 'C2H6 + O2 -> CO2 + H2O' }
  }));
  const json = await readJson(balanced);
  assert.equal(balanced.status, 200);
  assert.equal(json.balanced, '2 C2H6 + 7 O2 -> 4 CO2 + 6 H2O');
  assertPrivate(balanced, json);
});

await withLabEnv(async () => {
  const rejected = await solveHandler(cookieRequest('https://atomurus.com/api/pro-lab/reaction/solve', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      equation: 'H2 + O2 -> H2O',
      quantities: [{ formula: 'H2', amount: 2, unit: 'mol' }],
      clientLimitingReagent: 'H2'
    }
  }));
  assert.equal(rejected.status, 400);
});

await withLabEnv(async () => {
  const created = await sessionsHandler(cookieRequest('https://atomurus.com/api/pro-lab/sessions', {
    method: 'POST',
    cookies: sessionCookie('access-trial'),
    body: {
      sessionType: 'reaction',
      title: 'Combustion of ethane',
      state: {
        equation: 'C2H6 + O2 -> CO2 + H2O',
        quantities: [{ formula: 'C2H6', amount: 10, unit: 'g' }],
        balanced: 'should-not-trust'
      }
    }
  }));
  const json = await readJson(created);
  assert.equal(created.status, 200);
  assert.equal(json.session.state.solverVersion, 1);
  assert.equal(json.session.state.equation, 'C2H6 + O2 -> CO2 + H2O');
  assert.equal(json.session.state.balanced, undefined);
});

const reactionState = validateSessionState('reaction', { equation: 'H2 + O2 -> H2O', quantities: [] });
assert.equal(reactionState.solverVersion, 1);

const eqState = validateSessionState('equilibrium', {
  equation: 'H2(g) + I2(g) ⇌ 2HI(g)',
  mode: 'ice',
  K: 50,
  initials: [{ formula: 'H2', value: 1, unit: 'mol/L' }]
});
assert.equal(eqState.solverVersion, 1);
assert.equal(eqState.mode, 'ice');

const abState = validateSessionState('acid_base', { mode: 'weak-acid', C: 0.1, Ka: 1e-5 });
assert.equal(abState.solverVersion, 1);
assert.equal(abState.Ka, 1e-5);

await withLabEnv(async () => {
  const unsigned = await viewerMoleculeHandler(cookieRequest('https://atomurus.com/api/pro-lab/viewer/molecule?key=water'));
  assert.equal(unsigned.status, 401);
  const free = await viewerMoleculeHandler(cookieRequest('https://atomurus.com/api/pro-lab/viewer/molecule?key=water', {
    cookies: sessionCookie('access-free')
  }));
  assert.equal(free.status, 403);
  const paid = await viewerMoleculeHandler(cookieRequest('https://atomurus.com/api/pro-lab/viewer/molecule?key=water', {
    cookies: sessionCookie('access-pro-a')
  }));
  const paidJson = await readJson(paid);
  assert.equal(paid.status, 200);
  assert.equal(paidJson.ok, true);
  assert.ok(paidJson.molecule.atoms.length >= 3);
  assertPrivate(paid, paidJson);
});

await withLabEnv(async () => {
  const body = {
    gibbs: { deltaH: 100, deltaS: 200, T: 25, TUnit: 'C' },
    heat: { substance: 'water', mass: 10, deltaT: 10 }
  };
  const trial = await thermoHandler(cookieRequest('https://atomurus.com/api/pro-lab/thermodynamics/solve', {
    method: 'POST',
    cookies: sessionCookie('access-trial'),
    body
  }));
  const json = await readJson(trial);
  assert.equal(trial.status, 200);
  assert.equal(json.ok, true);
  assertPrivate(trial, json);
});

await withLabEnv(async () => {
  const unsigned = await equilibriumHandler(cookieRequest('https://atomurus.com/api/pro-lab/equilibrium/solve', {
    method: 'POST',
    body: { mode: 'constant', equation: 'A <-> B', values: [{ formula: 'A', value: 0.2 }, { formula: 'B', value: 0.8 }] }
  }));
  assert.equal(unsigned.status, 401);

  const iceLocked = await equilibriumHandler(cookieRequest('https://atomurus.com/api/pro-lab/equilibrium/solve', {
    method: 'POST',
    cookies: sessionCookie('access-free'),
    body: { mode: 'ice', equation: 'A <-> B', K: 4, initials: [{ formula: 'A', value: 1 }, { formula: 'B', value: 0 }] }
  }));
  const iceJson = await readJson(iceLocked);
  assert.equal(iceLocked.status, 403);
  assert.equal(iceJson.feature, 'iceTableSolver');

  const paid = await equilibriumHandler(cookieRequest('https://atomurus.com/api/pro-lab/equilibrium/solve', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      mode: 'constant',
      equation: 'A <-> B',
      values: [{ formula: 'A', value: 0.2, unit: 'mol/L' }, { formula: 'B', value: 0.8, unit: 'mol/L' }]
    }
  }));
  const paidJson = await readJson(paid);
  assert.equal(paid.status, 200);
  assert.equal(paidJson.K, 4);
  assertPrivate(paid, paidJson);

  const trialAb = await acidBaseHandler(cookieRequest('https://atomurus.com/api/pro-lab/acid-base/solve', {
    method: 'POST',
    cookies: sessionCookie('access-trial'),
    body: { mode: 'weak-acid', C: 0.1, Ka: 1e-5 }
  }));
  const abJson = await readJson(trialAb);
  assert.equal(trialAb.status, 200);
  assert.equal(abJson.pKa, 5);
  assertPrivate(trialAb, abJson);

  const created = await sessionsHandler(cookieRequest('https://atomurus.com/api/pro-lab/sessions', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      sessionType: 'equilibrium',
      title: 'HI equilibrium',
      state: {
        equation: 'H2(g) + I2(g) ⇌ 2HI(g)',
        mode: 'constant',
        KClient: 99,
        values: [{ formula: 'H2', value: 1 }]
      }
    }
  }));
  const createdJson = await readJson(created);
  assert.equal(created.status, 200);
  assert.equal(createdJson.session.state.solverVersion, 1);
  assert.equal(createdJson.session.state.KClient, undefined);
});

console.log('pro-lab tests passed');
