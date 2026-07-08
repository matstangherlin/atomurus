import { recoverPassword } from '@netlify/identity';
import {
  isIdentityConfigError,
  json,
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
  const password = String(body.password || '');
  if (!token || token.length > 2048 || password.length < 8 || password.length > 1024) {
    return json(400, { ok: false, error: 'Use a password with at least 8 characters.' });
  }

  try {
    const user = await recoverPassword(token, password);
    return json(200, { ok: true, user: publicUser(user) });
  } catch (err) {
    const status = statusFromError(err, 500);
    if (isIdentityConfigError(err) || status >= 500) {
      console.error('[auth-reset] Netlify Identity request failed:', err.message);
      return json(500, { ok: false, error: 'Password reset is unavailable.' });
    }
    return json(400, { ok: false, error: 'Password reset link is invalid or expired.' });
  }
}
