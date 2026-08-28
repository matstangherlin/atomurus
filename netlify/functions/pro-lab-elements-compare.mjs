import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { compareElements, ELEMENT_CHART_KEYS, ELEMENT_PROPERTY_KEYS, MAX_COMPARE_ELEMENTS } from '../lib/canonical-elements.mjs';
import { PRO_LAB_LIMITS } from '../lib/pro-lab.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'advancedElementCompare');
  if (auth.response) return auth.response;

  try {
    if (request.method === 'GET') {
      return jsonWithCookies(200, {
        ok: true,
        maxElements: MAX_COMPARE_ELEMENTS,
        properties: ELEMENT_PROPERTY_KEYS,
        chartProperties: ELEMENT_CHART_KEYS
      }, auth.session?.cookieHeaders || []);
    }

    const body = await readJsonBody(request, PRO_LAB_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    const lang = String(body.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
    const compared = compareElements({
      atomicNumbers: body.atomicNumbers || body.elements,
      properties: body.properties,
      chartProperty: body.chartProperty,
      lang
    });
    return jsonWithCookies(200, { ok: true, ...compared }, auth.session?.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Pro Lab is unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
