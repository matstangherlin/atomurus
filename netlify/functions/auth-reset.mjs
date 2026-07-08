import { authReset, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import {
  isIdentityConfigError,
  json,
  jsonWithCookies,
  options,
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
  if (!token || token.length > 2048 || password.length < 8 || password.length > 1024) {
    return json(400, { ok: false, error: 'Use a password with at least 8 characters.' });
  }

  try {
    const result = await authReset(token, password, type);
    return jsonWithCookies(200, { ok: true, user: publicUser(result.user) }, result.cookieHeaders);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (isAuthConfigError(err) || isIdentityConfigError(err) || status >= 500) {
      console.error('[auth-reset] Auth request failed:', err.message);
      return json(500, { ok: false, error: 'Password reset is unavailable.' });
    }
    return json(400, { ok: false, error: 'Password reset link is invalid or expired.' });
  }
}
