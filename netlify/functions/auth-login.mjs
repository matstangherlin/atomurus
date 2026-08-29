import { authLogin, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import {
  consumeAuthLimits,
  hashIdentifier,
  loginIdentifierLimiter,
  loginIpLimiter
} from '../lib/auth-rate-limit.mjs';
import {
  clientIp,
  json,
  jsonWithCookies,
  normalizeEmail,
  normalizeUsername,
  options,
  publicUser,
  readJsonBody,
  statusFromError,
  tooManyRequests,
  validEmail,
  validUsername,
  verifySameOrigin
} from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthConfigured()) {
    logAuthEvent('auth-login', { ok: false, errorType: 'auth_not_configured', level: 'error' });
    return json(500, { ok: false, error: 'Authentication unavailable' });
  }

  try {
    verifySameOrigin(request);
  } catch (_err) {
    logAuthEvent('auth-login', { ok: false, errorType: 'forbidden_origin', level: 'warn' });
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
  const limited = consumeAuthLimits([
    { limiter: loginIpLimiter, key: `ip:${ip}` },
    { limiter: loginIdentifierLimiter, key: hashIdentifier(isEmail ? email : username) }
  ]);
  if (!limited.allowed) {
    logAuthEvent('auth-login', {
      ok: false,
      event: 'auth_login_rate_limited',
      errorType: 'rate_limited',
      ip,
      status: 429,
      summary: `Rejected credential attempt from ${ip}: 429`
    });
    return tooManyRequests(limited.retryAfter);
  }

  try {
    const result = await authLogin(identifierRaw, password);
    logAuthEvent('auth-login', {
      ok: true,
      event: 'auth_login_success',
      identifierType: isEmail ? 'email' : 'username',
      ip
    });
    return jsonWithCookies(200, { ok: true, user: publicUser(result.user) }, result.cookieHeaders);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (err?.code === 'email_not_confirmed') {
      logAuthEvent('auth-login', {
        ok: false,
        errorType: 'email_not_confirmed',
        ip,
        status: 401,
        summary: `Rejected credential attempt from ${ip}: 401`
      });
      return json(401, {
        ok: false,
        error: err.publicMessage || 'Confirm your email before signing in.',
        code: 'email_not_confirmed'
      });
    }
    if (err?.code === 'upstream_timeout' || status === 503) {
      logAuthEvent('auth-login', {
        ok: false,
        errorType: 'upstream_timeout',
        ip,
        status: 503,
        level: 'error',
        summary: `Rejected credential attempt from ${ip}: 503`
      });
      return json(503, {
        ok: false,
        error: 'Authentication unavailable',
        code: 'upstream_timeout'
      });
    }
    if (isAuthConfigError(err) || status >= 500) {
      logAuthEvent('auth-login', {
        ok: false,
        errorType: 'unavailable',
        ip,
        status: 500,
        level: 'error',
        summary: `Rejected credential attempt from ${ip}: 500`
      });
      return json(500, { ok: false, error: 'Authentication unavailable' });
    }
    logAuthEvent('auth-login', {
      ok: false,
      errorType: 'invalid_credentials',
      ip,
      status: 401,
      summary: `Rejected credential attempt from ${ip}: 401`
    });
    return json(401, { ok: false, error: 'Invalid email or password' });
  }
}
