import { authResendConfirmation, isAuthConfigError, isAuthConfigured } from '../lib/auth-provider.mjs';
import { EMAIL_SEND_FAILED_MESSAGE, isEmailSendFailure } from '../lib/auth-email-errors.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import {
  consumeAuthLimits,
  hashIdentifier,
  recoverEmailLimiter,
  recoverIpLimiter
} from '../lib/auth-rate-limit.mjs';
import {
  clientIp,
  json,
  normalizeEmail,
  options,
  readJsonBody,
  tooManyRequests,
  validEmail,
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
  const limited = consumeAuthLimits([
    { limiter: recoverIpLimiter, key: `ip:${ip}` },
    { limiter: recoverEmailLimiter, key: hashIdentifier(email) }
  ]);
  if (!limited.allowed) {
    logAuthEvent('auth-resend-confirmation', {
      ok: false,
      event: 'auth_resend_rate_limited',
      errorType: 'rate_limited',
      ip,
      status: 429
    });
    return tooManyRequests(limited.retryAfter);
  }

  try {
    await authResendConfirmation(email);
    logAuthEvent('auth-resend-confirmation', {
      ok: true,
      event: 'auth_resend_requested',
      ip
    });
  } catch (err) {
    if (isEmailSendFailure(err) && !isAuthConfigError(err)) {
      logAuthEvent('auth-resend-confirmation', {
        ok: false,
        errorType: 'email_send_failed',
        ip,
        level: 'warn'
      });
      return json(503, {
        ok: false,
        code: 'email_send_failed',
        error: EMAIL_SEND_FAILED_MESSAGE
      });
    }
    logAuthEvent('auth-resend-confirmation', {
      ok: false,
      errorType: 'provider_error',
      ip,
      level: 'warn'
    });
  }

  return json(200, { ok: true });
}
