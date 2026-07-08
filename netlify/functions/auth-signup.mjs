import { authSignup, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import {
  clientIp,
  createRateLimit,
  json,
  jsonWithCookies,
  normalizeEmail,
  normalizeUsername,
  options,
  passwordPolicyError,
  publicUser,
  readJsonBody,
  statusFromError,
  validEmail,
  validUsername,
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
  const fullName = String(body.fullName || body.name || '').trim();
  const username = normalizeUsername(body.username);
  const password = String(body.password || '');
  const passwordConfirm = String(body.passwordConfirm || '');
  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return json(400, { ok: false, error: 'Use your name with at least 2 characters.' });
  }
  if (!validUsername(username)) {
    return json(400, { ok: false, error: 'Choose a unique username with 3 to 30 letters, numbers, dot, underscore or hyphen.' });
  }
  const passwordError = passwordPolicyError(password);
  if (!validEmail(email) || passwordError) {
    return json(400, { ok: false, error: passwordError || 'Use a valid email address.' });
  }
  if (password !== passwordConfirm) {
    return json(400, { ok: false, error: 'Password confirmation does not match.' });
  }

  const ip = clientIp(request);
  if (!hitIp(`ip:${ip}`) || !hitEmail(`email:${email}`)) {
    return json(429, { ok: false, error: 'Too many attempts. Try again later.' });
  }

  try {
    const result = await authSignup(email, password, { fullName, username });
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
    return json(status >= 400 && status < 500 ? status : 400, {
      ok: false,
      error: err?.message || 'Could not create this account. Try signing in or use another email.'
    });
  }
}
