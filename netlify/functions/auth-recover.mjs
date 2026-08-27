import { authRecover } from '../lib/auth-provider.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import {
  clientIp,
  createRateLimit,
  json,
  normalizeEmail,
  options,
  readJsonBody,
  validEmail,
  verifySameOrigin
} from '../lib/netlify-identity-utils.mjs';

const hitRecovery = createRateLimit({ windowMs: 60 * 60 * 1000, limit: 5 });

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
    body = await readJsonBody(request, 2048);
  } catch (_err) {
    return json(200, { ok: true });
  }

  const email = normalizeEmail(body.email);
  if (!validEmail(email)) {
    return json(200, { ok: true });
  }

  const ip = clientIp(request);
  if (!hitRecovery(`${ip}:${email}`)) {
    logAuthEvent('auth-recover', { ok: false, errorType: 'rate_limited' });
    return json(429, { ok: false, error: 'Too many attempts. Try again later.' });
  }

  try {
    await authRecover(email);
    logAuthEvent('auth-recover', { ok: true });
  } catch (err) {
    logAuthEvent('auth-recover', { ok: false, errorType: 'provider_error', level: 'warn' });
  }

  return json(200, { ok: true });
}
