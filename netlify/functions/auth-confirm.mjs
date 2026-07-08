import { authConfirm, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
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
    return json(500, { ok: false, error: 'Email confirmation is unavailable.' });
  }

  try {
    verifySameOrigin(request);
  } catch (_err) {
    return json(403, { ok: false, error: 'Forbidden' });
  }

  let body;
  try {
    body = await readJsonBody(request, 2048);
  } catch (err) {
    return json(statusFromError(err, 400), { ok: false, error: 'Invalid request' });
  }

  const token = String(body.token || '').trim();
  const type = String(body.type || 'signup').trim();
  if (!token || token.length > 2048) {
    return json(400, { ok: false, error: 'Invalid confirmation token' });
  }

  try {
    const result = await authConfirm(token, type);
    return jsonWithCookies(200, { ok: true, user: publicUser(result.user) }, result.cookieHeaders);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (isAuthConfigError(err) || isIdentityConfigError(err) || status >= 500) {
      console.error('[auth-confirm] Auth request failed:', err.message);
      return json(500, { ok: false, error: 'Email confirmation is unavailable.' });
    }
    return json(400, { ok: false, error: 'Email confirmation link is invalid or expired.' });
  }
}
