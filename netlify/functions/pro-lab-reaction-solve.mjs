import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { PRO_LAB_LIMITS } from '../lib/pro-lab.mjs';
import { solveStoichiometry } from '../lib/chemistry-stoichiometry.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'stoichiometrySolver');
  if (auth.response) return auth.response;

  try {
    const body = await readJsonBody(request, PRO_LAB_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    if (body.clientMolarMass != null || body.clientCoefficient != null || body.clientLimitingReagent != null) {
      return jsonWithCookies(400, {
        ok: false,
        error: 'Client-supplied solver results are not accepted.',
        code: 'invalid_request'
      }, auth.session?.cookieHeaders || []);
    }
    const result = solveStoichiometry(body);
    return jsonWithCookies(200, result, auth.session?.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Chemistry Solver is unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
