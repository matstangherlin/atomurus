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
import {
  equilibriumFeatureForMode,
  solveEquilibrium
} from '../lib/chemistry-equilibrium.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = await readJsonBody(request, PRO_LAB_LIMITS.bodyBytes);
  } catch (err) {
    return json(statusFromError(err, 400), { ok: false, error: 'Invalid request', code: 'invalid_request' });
  }

  try {
    assertNoClientUserId(body);
  } catch (err) {
    return json(statusFromError(err, 400), { ok: false, error: err.message, code: err.code || 'invalid_request' });
  }

  const feature = equilibriumFeatureForMode(body?.mode);
  const auth = await requireFeature(request, feature);
  if (auth.response) return auth.response;

  try {
    const result = solveEquilibrium(body);
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
