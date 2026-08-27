import { authConfirm, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import { confirmIpLimiter } from '../lib/auth-rate-limit.mjs';
import {
  clientIp,
  json,
  jsonWithCookies,
  options,
  publicUser,
  readJsonBody,
  statusFromError,
  tooManyRequests,
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

  const limited = confirmIpLimiter.hit(`ip:${clientIp(request)}`);
  if (!limited.allowed) {
    return tooManyRequests(limited.retryAfter);
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
    logAuthEvent('auth-confirm', { ok: true, type });
    return jsonWithCookies(200, { ok: true, user: publicUser(result.user) }, result.cookieHeaders);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (isAuthConfigError(err) || status >= 500) {
      logAuthEvent('auth-confirm', { ok: false, errorType: 'unavailable', level: 'error' });
      return json(500, { ok: false, error: 'Email confirmation is unavailable.' });
    }
    logAuthEvent('auth-confirm', { ok: false, errorType: 'invalid_token', type });
    return json(400, { ok: false, error: 'Email confirmation link is invalid or expired.' });
  }
}
