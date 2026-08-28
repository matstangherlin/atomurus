import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { compareMolecules, MAX_COMPARE_MOLECULES, moleculeCatalogPublic } from '../lib/canonical-molecules.mjs';
import { PRO_LAB_LIMITS } from '../lib/pro-lab.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'advancedMoleculeCompare');
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const langParam = String(url.searchParams.get('lang') || '').toLowerCase();
    if (request.method === 'GET') {
      const lang = langParam.indexOf('pt') === 0 ? 'pt' : 'en';
      return jsonWithCookies(200, {
        ok: true,
        maxMolecules: MAX_COMPARE_MOLECULES,
        catalog: moleculeCatalogPublic(lang),
        measuresBonds: false,
        note: '3D coordinates are visualization aids. Bond lengths and angles are not reported as measured physical values.'
      }, auth.session?.cookieHeaders || []);
    }

    const body = await readJsonBody(request, PRO_LAB_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    const lang = String(body.lang || langParam).toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
    const compared = compareMolecules({
      moleculeIds: body.moleculeIds || body.molecules,
      lang
    });
    return jsonWithCookies(200, {
      ok: true,
      ...compared,
      measuresBonds: false
    }, auth.session?.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Pro Lab is unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
