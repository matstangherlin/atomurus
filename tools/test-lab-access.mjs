import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const PUBLIC_FEATURES = [
  'interactiveViewers',
  'atomicModelViewer',
  'moleculeViewer',
  'allotropeViewer',
  'isomerismViewer',
  'publicElementCompare',
  'scientificCalculator',
  'unitConverter',
  'idealGasCalculator',
  'phCalculator'
];
const ACCOUNT_FEATURES = [
  'studyCloud',
  'studySets',
  'flashcards'
];
const PRO_FEATURES = [
  'publicStoichiometry',
  'publicThermodynamics',
  'smartReview',
  'automatedPractice',
  'reactionWorkbench'
];

function assertFlags(access, keys, expected) {
  for (const key of keys) {
    assert.equal(access.features[key], expected, key);
  }
}

const guestAccess = accessForUser({});
assertFlags(guestAccess, PUBLIC_FEATURES, true);
assertFlags(guestAccess, ACCOUNT_FEATURES, false);
assertFlags(guestAccess, PRO_FEATURES, false);

const freeAccess = accessForUser({ createdAt: daysAgo(40), email: 'free@atomurus.com' });
assertFlags(freeAccess, PUBLIC_FEATURES, true);
assertFlags(freeAccess, ACCOUNT_FEATURES, true);
assertFlags(freeAccess, PRO_FEATURES, false);

const trialAccess = accessForUser({ createdAt: daysAgo(2), email: 'trial@atomurus.com' });
assertFlags(trialAccess, PUBLIC_FEATURES, true);
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
assert.equal(calcTabPolicy('scientific'), 'public');
assert.equal(calcTabPolicy('ideal'), 'public');
assert.equal(calcTabPolicy('stoich'), 'pro');
assert.equal(calcTabPolicy('thermo'), 'pro');
assert.equal(calcTabFeature('stoich'), 'publicStoichiometry');
assert.equal(pageToolPolicy('/periodic-table').need, 'public');
assert.equal(pageToolPolicy('/explore/what-is-isomerism').need, 'public');
assert.equal(pageToolPolicy('/viewer/molecules').need, 'public');
assert.equal(pageToolPolicy('/viewer/atomic-models').need, 'public');
assert.equal(pageToolPolicy('/viewer/allotropes').need, 'public');
assert.equal(pageToolPolicy('/viewer/isomerism').need, 'public');
assert.equal(pageToolPolicy('/viewer/isomerism/constitutional/function').need, 'public');
assert.equal(pageToolPolicy('/periodic-table/compare').need, 'public');

const pending = { signedIn: true, isPro: true, ready: false, features: { publicThermodynamics: true } };
assert.equal(allowTool('pro', pending, 'publicThermodynamics'), false);
const failedAuth = { signedIn: false, isPro: false, ready: true, features: {} };
assert.equal(allowTool('pro', failedAuth, 'publicThermodynamics'), false);

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
assert.match(loadThree, /atomurusBootLabViewer/);
assert.match(loadThree, /atomurusBootProViewer = bootLabViewer/);
assert.match(loadThree, /isPublicViewerFeature/);
assert.match(loadThree, /VIEWER_CONTROL_STUBS/);
assert.match(loadThree, /el\.closest\('\.viewer'\)/);
assert.match(loadThree, /Loading 3D viewer/);
assert.match(loadThree, /couldn't load/);
assert.match(loadThree, /hasPremiumFeature\(featureKey\)/);
assert.match(loadThree, /atomurusLoadViewerRuntime/);
assert.match(loadThree, /VIEWER_RUNTIME_SRC/);
assert.match(loadThree, /atomic-viewer\.js/);
assert.match(loadThree, /function nearViewport/);
assert.match(loadThree, /Public access does not mean eager-loading/);
assert.doesNotMatch(loadThree, /VIEWER_RUNTIME_SRC\[name\] \+|src = name/);
assert.match(loadThree, /paper-lab\.js/);
assert.match(loadThree, /loadPaperLab/);

const molecules = read('viewer/molecules.html');
assert.match(molecules, /atomurusBootLabViewer/);
assert.match(molecules, /href="isomerism.html"/);
assert.doesNotMatch(molecules, /href="isomerism\/constitutional\/function.html"/);
assert.match(molecules, /atomurusLoadViewerRuntime\('molecule-viewer\.js'\)/);
assert.doesNotMatch(molecules, /const molData = \{/);
assert.doesNotMatch(molecules, /atoms:\[\{pos:/);
assert.doesNotMatch(molecules, /WebGLRenderer/);
assert.match(molecules, /canvas-wrap\.is-2d/);
assert.doesNotMatch(molecules, /\.canvas-wrap\.is-2d canvas#viewer3d\{visibility:hidden/);
assert.match(molecules, /learningResourceType": "Overview"/);
assert.match(molecules, /isAccessibleForFree": true/);
assert.doesNotMatch(molecules, /interactive 3D rendering is part of Atomurus Pro/);
assert.match(molecules, /data-mol-rep="space"/);
assert.match(molecules, /--canvas-bg-1:#F2EFE7/);
assert.match(molecules, /#C94A3A/);
assert.doesNotMatch(molecules, /class="vc-btn active" id="vc-labels"/);
assert.doesNotMatch(molecules, /html\.lc-loading body\{visibility:hidden\}/);

const about = read('about.html');
assert.doesNotMatch(about, /Interactive 3D is part of Atomurus Pro/);
assert.doesNotMatch(about, /Included in Atomurus Pro/);
assert.doesNotMatch(about, /Interactive 3D tools are Pro/);

const molRuntime = read('viewer/runtime/molecule-viewer.js');
assert.match(molRuntime, /\/api\/pro-lab\/viewer\/molecule/);
assert.match(molRuntime, /canvas\.style\.visibility = 'visible'/);
assert.match(molRuntime, /return fetchMolecule\(initialMol\)/);
assert.match(molRuntime, /atomurusInitMoleculeViewer/);
assert.match(molRuntime, /setMolRep/);
assert.match(molRuntime, /atomurusPaperLab/);
assert.match(molRuntime, /PerspectiveCamera\(paper\(\) \? 42 : 50/);
assert.match(molRuntime, /labelsVisible = !paper\(\)/);
assert.match(molRuntime, /paper\(\)\.BOND/);
assert.match(molRuntime, /vdwRadius/);
assert.match(molRuntime, /bindLiveLoop/);
assert.match(molRuntime, /bindPageScrollWheel/);

const moleculesPt = read('viewer/molecules.pt.html');
assert.match(moleculesPt, /atomurusBootLabViewer/);
assert.match(moleculesPt, /atomurusLoadViewerRuntime\('molecule-viewer\.js'\)/);
assert.match(moleculesPt, /load-three\.js\?v=\d+/);
assert.match(moleculesPt, /--canvas-bg-1:#F2EFE7/);
assert.match(moleculesPt, /data-mol-rep="stick"/);
assert.doesNotMatch(moleculesPt, /const molData = \{/);
assert.doesNotMatch(moleculesPt, /WebGLRenderer/);

const atomic = read('viewer/atomic-models.html');
assert.match(atomic, /atomurusBootLabViewer/);
assert.match(atomic, /atomicModelViewer/);
assert.match(atomic, /atomurusLoadViewerRuntime\('atomic-viewer\.js'\)/);
assert.match(atomic, /canvas-wrap\.is-2d/);
assert.doesNotMatch(atomic, /\.canvas-wrap\.is-2d canvas#viewer3d\{visibility:hidden/);
assert.doesNotMatch(atomic, /cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js/);
assert.doesNotMatch(atomic, /WebGLRenderer/);

const atomicRuntime = read('viewer/runtime/atomic-viewer.js');
assert.match(atomicRuntime, /atomurusInitAtomicViewer/);
assert.match(atomicRuntime, /WebGLRenderer/);
assert.match(atomicRuntime, /viewer3d\.style\.visibility = 'visible'/);
assert.match(atomicRuntime, /atomurusPaperLab/);
assert.match(atomicRuntime, /bindLiveLoop/);

const paperLab = read('viewer/runtime/paper-lab.js');
assert.match(paperLab, /atomurusPaperLab/);
assert.match(paperLab, /F2EFE7/);
assert.match(paperLab, /C94A3A/);
assert.match(paperLab, /5A554C/);
assert.match(paperLab, /moleculeGroundOpts/);
assert.match(paperLab, /camZForMol/);
assert.match(paperLab, /bindLiveLoop/);
assert.match(paperLab, /bindPageScrollWheel/);
assert.match(paperLab, /createRenderer/);
assert.match(paperLab, /cancelAnimationFrame/);
assert.match(paperLab, /function kick/);

const allotropes = read('viewer/allotropes.html');
assert.match(allotropes, /atomurusBootLabViewer/);
assert.match(allotropes, /allotropeViewer/);
assert.match(allotropes, /atomurusLoadViewerRuntime\('allotrope-viewer\.js'\)/);
assert.doesNotMatch(allotropes, /WebGLRenderer/);

const alloRuntime = read('viewer/runtime/allotrope-viewer.js');
assert.match(alloRuntime, /atomurusInitAllotropeViewer/);
assert.match(alloRuntime, /WebGLRenderer/);
assert.match(alloRuntime, /atomurusPaperLab/);
assert.match(alloRuntime, /bindLiveLoop/);

function listHtml(dir, acc = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) listHtml(p, acc);
    else if (ent.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const isoPages = listHtml(fileURLToPath(new URL('../viewer/isomerism', import.meta.url)));
assert.ok(isoPages.length >= 14, 'expected isomerism viewer pages');
for (const file of isoPages) {
  const html = readFileSync(file, 'utf8');
  assert.match(html, /atomurusLoadViewerRuntime\('isomerism-3d\.js'\)/, file);
  assert.match(html, /<script src="\.\.\/\.\.\/load-three\.js\?v=[^"]+"><\/script>/, file);
  assert.doesNotMatch(html, /<script defer>\s*atomurusBoot(?:Lab|Pro)Viewer/, file);
  assert.doesNotMatch(html, /load-three\.js[^"']*["']\s+defer/, file);
  assert.doesNotMatch(html, /src="\.\.\/isomerism-3d\.js/, file);
  assert.doesNotMatch(html, /WebGLRenderer/, file);
}

const exploreIso = read('explore/what-is-isomerism.html');
assert.match(exploreIso, /isomerism-3d\.js/);

const iso3d = read('viewer/isomerism/isomerism-3d.js');
assert.match(iso3d, /atomurusBootLabViewer/);
assert.match(iso3d, /isomerismViewer/);
assert.match(iso3d, /isExplorePage/);
assert.match(iso3d, /loadedAsProRuntime/);
assert.match(iso3d, /classList.toggle\('is-2d'/);
assert.doesNotMatch(iso3d, /stageEl\.style\.display = 'none'/);
assert.match(iso3d, /stage\.appendChild\(stage2d\)/);
assert.match(iso3d, /ensureModeStyles/);
assert.match(iso3d, /iso-3d-mode-css/);
assert.match(iso3d, /sizeClonedIsoSvg/);
assert.match(iso3d, /pinIsoOverlay/);
assert.match(iso3d, /atomurusPaperLab/);
assert.match(iso3d, /paper-lab\.js/);
assert.match(iso3d, /moleculeGroundOpts/);
assert.match(iso3d, /paperLab\(\)\.BOND/);
assert.match(iso3d, /bindLiveLoop/);

const labCss = read('atomurus-lab-console.css');
assert.match(labCss, /\.iso-3d-stage \{\n  position: relative;/);
assert.doesNotMatch(labCss, /'\.iso-3d-stage/);
assert.match(labCss, /\.iso-3d-stage2d svg \{\n  width: auto;/);

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
assert.match(compare, /isAccessibleForFree": true/);
assert.match(compare, /learningResourceType": "Overview"/);

const netlify = read('netlify.toml');
assert.match(netlify, /\/api\/pro-lab\/thermodynamics\/solve/);
assert.match(netlify, /\/api\/pro-lab\/viewer\/molecule/);

const thermoFn = read('netlify/functions/pro-lab-thermodynamics-solve.mjs');
assert.match(thermoFn, /requireFeature\(request, 'publicThermodynamics'\)/);
assert.match(thermoFn, /body\.isPro/);

const molFn = read('netlify/functions/pro-lab-viewer-molecule.mjs');
assert.doesNotMatch(molFn, /requireFeature/);
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
  assert.equal(unsignedMol.status, 200);
  const unsignedMolJson = await readJson(unsignedMol);
  assert.equal(unsignedMolJson.ok, true);
  assert.ok(unsignedMolJson.molecule.atoms.length >= 3);
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
  assert.equal(freeMol.status, 200);
  assert.equal(freeMolJson.ok, true);
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

const studySave = read('study-save.js');
assert.match(studySave, /canUseAccountSave/);
assert.match(studySave, /canGeneratePractice/);
assert.match(studySave, /data-study-save/);
assert.match(studySave, /Create a free account to keep it in your workspace/);
assert.match(studySave, /Save this molecule/);
assert.doesNotMatch(studySave, /Study Library is a Pro feature/);
assert.doesNotMatch(studySave, /start your 30-day Pro trial to save/);
assert.doesNotMatch(studySave, /if \(!hint\.isPro\) \{\s*openSaveGate/);
assert.doesNotMatch(studySave, /if \(!on && !sessionHint\(\)\.isPro\)/);

const localNav = read('templates/chrome/viewer-local-nav.html');
assert.match(localNav, /data-local-nav="atomic-models"/);
assert.match(localNav, /data-local-nav="molecules"/);
assert.match(localNav, /data-local-nav="allotropes"/);
assert.match(localNav, /data-local-nav="isomerism"/);
assert.doesNotMatch(localNav, /PRO/);

const shareBtn = read('share-button.js');
assert.match(shareBtn, /injectShareButton/);
assert.match(shareBtn, /share-copy/);
assert.doesNotMatch(shareBtn, /isPro/);
assert.doesNotMatch(shareBtn, /signedIn/);

const pageShare = read('page-share-init.js');
assert.match(pageShare, /atomic_models_share/);
assert.match(pageShare, /molecules_share/);
assert.match(pageShare, /allotropes_share/);
assert.match(pageShare, /isomerism_share/);

const robots = read('robots.txt');
assert.match(robots, /^Allow: \//m);
assert.doesNotMatch(robots, /Disallow: \/viewer/);

const isomerismHub = read('viewer/isomerism.html');
assert.match(isomerismHub, /<link rel="canonical" href="https:\/\/atomurus.com\/viewer\/isomerism">/);
assert.doesNotMatch(isomerismHub, /canonical" href="https:\/\/atomurus.com\/viewer\/isomerism\?lang=pt-BR"/);
assert.match(isomerismHub, /isAccessibleForFree": true/);
assert.match(isomerismHub, /share-button\.js/);
assert.match(isomerismHub, /page-share-init\.js/);

const sitemap = read('sitemap.xml');
assert.match(sitemap, /<loc>https:\/\/atomurus.com\/viewer\/isomerism<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/atomurus.com\/viewer\/molecules<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/atomurus.com\/viewer\/atomic-models<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/atomurus.com\/viewer\/allotropes<\/loc>/);

const bohr = read('viewer/atomic-models/bohr.html');
assert.match(bohr, /isAccessibleForFree": true/);
assert.match(bohr, /share-button\.js/);

const exploreMol = read('explore/viewer/mol-viewer.js');
assert.match(exploreMol, /bindLiveLoop/);
assert.match(exploreMol, /bindPageScrollWheel/);
assert.match(exploreMol, /cancelAnimationFrame|kick\(\)/);

console.log('lab-access tests passed');
