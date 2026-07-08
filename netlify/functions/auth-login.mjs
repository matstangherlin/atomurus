import { authLogin, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import {
  clientIp,
  createRateLimit,
  json,
  jsonWithCookies,
  normalizeEmail,
  normalizeUsername,
  options,
  publicUser,
  readJsonBody,
  statusFromError,
  validEmail,
  validUsername,
  verifySameOrigin
} from '../lib/netlify-identity-utils.mjs';

const hitIp = createRateLimit({ windowMs: 15 * 60 * 1000, limit: 40 });
const hitEmail = createRateLimit({ windowMs: 15 * 60 * 1000, limit: 6 });

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthConfigured()) {
    return json(500, { ok: false, error: 'Authentication unavailable' });
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

  const identifierRaw = String(body.identifier || body.email || '').trim();
  const email = normalizeEmail(identifierRaw);
  const username = normalizeUsername(identifierRaw);
  const password = String(body.password || '');
  const isEmail = validEmail(email);
  const isUsername = validUsername(username);
  if ((!isEmail && !isUsername) || password.length < 8 || password.length > 1024) {
    return json(401, { ok: false, error: 'Invalid email or password' });
  }

  const ip = clientIp(request);
  const rateKey = isEmail ? `email:${email}` : `username:${username}`;
  if (!hitIp(`ip:${ip}`) || !hitEmail(rateKey)) {
    return json(429, { ok: false, error: 'Too many attempts. Try again later.' });
  }

  try {
    const result = await authLogin(identifierRaw, password);
    return jsonWithCookies(200, { ok: true, user: publicUser(result.user) }, result.cookieHeaders);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (isAuthConfigError(err) || status >= 500) {
      console.error('[auth-login] Auth request failed:', err.message);
      return json(500, { ok: false, error: 'Authentication unavailable' });
    }
    console.warn(`[auth-login] Rejected login for ${identifierRaw} from ${ip}: ${status}`);
    return json(401, { ok: false, error: 'Invalid email or password' });
  }
}
