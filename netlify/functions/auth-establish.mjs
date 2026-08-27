import { authEstablish, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import { establishIpLimiter } from '../lib/auth-rate-limit.mjs';
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
    return json(500, { ok: false, error: 'Authentication unavailable' });
  }

  try {
    verifySameOrigin(request);
  } catch (_err) {
    return json(403, { ok: false, error: 'Forbidden' });
  }

  const limited = establishIpLimiter.hit(`ip:${clientIp(request)}`);
  if (!limited.allowed) {
    return tooManyRequests(limited.retryAfter);
  }

  let body;
  try {
    body = await readJsonBody(request, 8192);
  } catch (err) {
    return json(statusFromError(err, 400), { ok: false, error: 'Invalid request' });
  }

  const accessToken = String(body.accessToken || body.access_token || '').trim();
  const refreshToken = String(body.refreshToken || body.refresh_token || '').trim();
  if (!accessToken || !refreshToken || accessToken.length > 4096 || refreshToken.length > 4096) {
    return json(400, { ok: false, error: 'Invalid session' });
  }

  try {
    const result = await authEstablish(accessToken, refreshToken);
    logAuthEvent('auth-establish', { ok: true });
    return jsonWithCookies(200, { ok: true, user: publicUser(result.user) }, result.cookieHeaders);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (isAuthConfigError(err) || status >= 500) {
      logAuthEvent('auth-establish', { ok: false, errorType: 'unavailable', level: 'error' });
      return json(500, { ok: false, error: 'Authentication unavailable' });
    }
    logAuthEvent('auth-establish', { ok: false, errorType: 'invalid_session' });
    return json(401, { ok: false, error: 'Invalid session', code: 'session_expired' });
  }
}
