import { authSignup, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import {
  clientIp,
  createRateLimit,
  json,
  jsonWithCookies,
  normalizeEmail,
  options,
  publicUser,
  readJsonBody,
  statusFromError,
  validEmail,
  verifySameOrigin
} from '../lib/netlify-identity-utils.mjs';

const hitIp = createRateLimit({ windowMs: 60 * 60 * 1000, limit: 20 });
const hitEmail = createRateLimit({ windowMs: 60 * 60 * 1000, limit: 4 });

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthConfigured()) {
    return json(500, { ok: false, error: 'Account creation is unavailable.' });
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

  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  if (!validEmail(email) || password.length < 8 || password.length > 1024) {
    return json(400, { ok: false, error: 'Use a valid email and a password with at least 8 characters.' });
  }

  const ip = clientIp(request);
  if (!hitIp(`ip:${ip}`) || !hitEmail(`email:${email}`)) {
    return json(429, { ok: false, error: 'Too many attempts. Try again later.' });
  }

  try {
    const result = await authSignup(email, password);
    return jsonWithCookies(
      200,
      {
        ok: true,
        needsConfirmation: result.needsConfirmation,
        signedIn: result.signedIn,
        user: publicUser(result.user)
      },
      result.cookieHeaders
    );
  } catch (err) {
    const status = statusFromError(err, 500);
    if (isAuthConfigError(err) || status >= 500) {
      console.error('[auth-signup] Auth request failed:', err.message);
      return json(500, { ok: false, error: 'Account creation is unavailable.' });
    }
    console.warn(`[auth-signup] Rejected signup for ${email} from ${ip}: ${status}`);
    return json(400, { ok: false, error: 'Could not create this account. Try signing in or use another email.' });
  }
}
