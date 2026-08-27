import { authSignup, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import {
  consumeAuthLimits,
  hashIdentifier,
  signupEmailLimiter,
  signupIpLimiter
} from '../lib/auth-rate-limit.mjs';
import {
  clientIp,
  json,
  jsonWithCookies,
  normalizeEmail,
  normalizeUsername,
  options,
  passwordPolicyError,
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
    logAuthEvent('auth-signup', { ok: false, errorType: 'auth_not_configured', level: 'error' });
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
  const limited = consumeAuthLimits([
    { limiter: signupIpLimiter, key: `ip:${ip}` },
    { limiter: signupEmailLimiter, key: hashIdentifier(email) }
  ]);
  if (!limited.allowed) {
    logAuthEvent('auth-signup', {
      ok: false,
      event: 'auth_signup_rate_limited',
      errorType: 'rate_limited',
      ip,
      status: 429,
      summary: `Rejected account creation attempt from ${ip}: 429`
    });
    return tooManyRequests(limited.retryAfter);
  }

  try {
    const result = await authSignup(email, password, { fullName, username });
    logAuthEvent('auth-signup', {
      ok: true,
      needsConfirmation: Boolean(result.needsConfirmation),
      signedIn: Boolean(result.signedIn)
    });
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
      logAuthEvent('auth-signup', { ok: false, errorType: 'unavailable', level: 'error' });
      return json(500, { ok: false, error: 'Account creation is unavailable.' });
    }
    logAuthEvent('auth-signup', {
      ok: false,
      errorType: err?.code || 'rejected',
      ip,
      status,
      summary: `Rejected account creation attempt from ${ip}: ${status}`
    });
    return json(status >= 400 && status < 500 ? status : 400, {
      ok: false,
      error: err?.publicMessage || err?.message || 'Could not create this account. Try signing in or use another email.',
      code: err?.code || null
    });
  }
}
