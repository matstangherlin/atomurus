import { authRefresh } from '../lib/auth-provider.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import { refreshIpLimiter } from '../lib/auth-rate-limit.mjs';
import {
  clientIp,
  json,
  jsonWithCookies,
  options,
  publicUser,
  tooManyRequests,
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

  const ip = clientIp(request);
  const limited = refreshIpLimiter.hit(`ip:${ip}`);
  if (!limited.allowed) {
    logAuthEvent('auth-refresh', {
      ok: false,
      event: 'auth_refresh_rate_limited',
      errorType: 'rate_limited',
      ip,
      status: 429
    });
    return tooManyRequests(limited.retryAfter);
  }

  const refreshed = await authRefresh(request);
  if (!refreshed?.user) {
    return jsonWithCookies(
      401,
      { ok: false, error: 'Session expired', code: 'session_expired' },
      refreshed?.cookieHeaders || []
    );
  }

  return jsonWithCookies(200, { ok: true, user: publicUser(refreshed.user) }, refreshed.cookieHeaders);
}
