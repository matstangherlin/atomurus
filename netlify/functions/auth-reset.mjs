import { authReset, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import {
  json,
  jsonWithCookies,
  options,
  passwordPolicyError,
  publicUser,
  readJsonBody,
  statusFromError,
  verifySameOrigin
} from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthConfigured()) {
    return json(500, { ok: false, error: 'Password reset is unavailable.' });
  }

  try {
    verifySameOrigin(request);
  } catch (_err) {
    return json(403, { ok: false, error: 'Forbidden' });
  }

  let body;
  try {
    body = await readJsonBody(request, 4096);
  } catch (err) {
    return json(statusFromError(err, 400), { ok: false, error: 'Invalid request' });
  }

  const token = String(body.token || '').trim();
  const type = String(body.type || 'recovery').trim();
  const password = String(body.password || '');
  const passwordError = passwordPolicyError(password);
  if (passwordError) {
    return json(400, { ok: false, error: passwordError });
  }
  if (token && token.length > 2048) {
    return json(400, { ok: false, error: 'Use a valid password.' });
  }

  try {
    const result = await authReset(token, password, type, request);
    logAuthEvent('auth-reset', { ok: true, usedToken: Boolean(token) });
    return jsonWithCookies(200, { ok: true, user: publicUser(result.user) }, result.cookieHeaders);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (isAuthConfigError(err) || status >= 500) {
      logAuthEvent('auth-reset', { ok: false, errorType: 'unavailable', level: 'error' });
      return json(500, { ok: false, error: 'Password reset is unavailable.' });
    }
    logAuthEvent('auth-reset', { ok: false, errorType: err?.code || 'invalid_token' });
    return json(status === 401 ? 401 : 400, {
      ok: false,
      error: status === 401 ? 'Session expired' : 'Password reset link is invalid or expired.',
      code: err?.code || null
    });
  }
}
