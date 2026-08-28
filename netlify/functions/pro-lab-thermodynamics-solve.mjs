import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { solveThermodynamics } from '../lib/chemistry-thermodynamics.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'publicThermodynamics');
  if (auth.response) return auth.response;

  try {
    const body = await readJsonBody(request, 8192);
    assertNoClientUserId(body);
    if (body && (body.isPro != null || body.feature != null || body.features != null)) {
      return jsonWithCookies(400, { ok: false, error: 'Client entitlements are ignored.', code: 'invalid_request' }, auth.session?.cookieHeaders || []);
    }
    const result = solveThermodynamics(body);
    return jsonWithCookies(200, { ok: true, ...result }, auth.session?.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Thermodynamics is unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
