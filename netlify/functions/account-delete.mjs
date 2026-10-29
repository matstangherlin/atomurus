// POST /api/account/delete — «Delete my account» (prompt 29, M12-b; LGPD art.
// 18, VI). Deliberate friction: the current password, a typed phrase, and no
// subscription that would keep charging. The user is deleted in the auth
// provider; every table references profiles(id) ON DELETE CASCADE, so the rows
// go with it (proved by tools/test-account-delete.mjs) — nothing is deleted
// table by table here.
import { clearSessionCookieHeaders } from '../lib/auth-cookies.mjs';
import { logAuthEvent } from '../lib/auth-log.mjs';
import { authLogin } from '../lib/auth-provider.mjs';
import { createAuthRateLimiter, digestKey } from '../lib/auth-rate-limit.mjs';
import { json, jsonWithCookies, options, readJsonBody, statusFromError, tooManyRequests, verifySameOrigin } from '../lib/netlify-identity-utils.mjs';
import { accessForUser, isPaidSubscriptionStatus } from '../lib/plan-access.mjs';
import { requireUser } from '../lib/require-user.mjs';
import { supabaseAdminDeleteUser } from '../lib/supabase-auth.mjs';

/* Owner decision (prompt 29). Only the conservative default is implemented:
   'require-no-active-subscription' refuses while a subscription would renew
   and points to the billing portal to cancel it first.
   TODO(owner): 'cancel-then-delete' (cancel at period end, then delete) and
   'immediate' (cancel now, then delete) need the Stripe cancel call and a
   decision on refunds; the handler answers 501 for them until then. */
export const ACCOUNT_DELETE_MODES = ['require-no-active-subscription', 'cancel-then-delete', 'immediate'];
export const ACCOUNT_DELETE_MODE = 'require-no-active-subscription';
export const CONFIRM_PHRASES = Object.freeze({ pt: 'EXCLUIR', en: 'DELETE' });

export const deleteLimiter = createAuthRateLimiter({ windowMs: 24 * 60 * 60 * 1000, limit: 3, maxKeys: 4000 });

/* A subscription that will charge again blocks deletion; one already set to
   end at the period's close does not (nothing more is billed). */
export function subscriptionBlocksDeletion(user) {
  const access = accessForUser(user || {});
  return Boolean(access.hasStripeCustomer && isPaidSubscriptionStatus(access.subscriptionStatus) && !access.cancelAtPeriodEnd);
}

export function createAccountDeleteHandler({
  deleteUser = supabaseAdminDeleteUser,
  verifyPassword = (email, password) => authLogin(email, password),
  mode = ACCOUNT_DELETE_MODE
} = {}) {
  return async function handler(request) {
    if (request.method === 'OPTIONS') return options();
    if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    try {
      verifySameOrigin(request);
    } catch (_err) {
      return json(403, { ok: false, error: 'Forbidden' });
    }

    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const user = auth.user;
    const cookies = auth.session?.cookieHeaders || [];
    const userHash = digestKey(user.id, 'user');

    // Three re-authentications a day. A request that never reaches the
    // password check (bad phrase, bad body) does not spend one.
    const limited = deleteLimiter.check(userHash);
    if (!limited.allowed) return tooManyRequests(limited.retryAfter, 'Too many attempts. Try again tomorrow.');

    let body;
    try {
      body = await readJsonBody(request, 4096);
    } catch (err) {
      return jsonWithCookies(statusFromError(err, 400), { ok: false, error: 'Invalid request' }, cookies);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonWithCookies(400, { ok: false, error: 'Invalid request' }, cookies);
    }
    const phrase = String(body.confirm || '').trim();
    if (!Object.values(CONFIRM_PHRASES).includes(phrase)) {
      return jsonWithCookies(400, { ok: false, error: 'Type the confirmation phrase exactly.', code: 'confirm_phrase' }, cookies);
    }
    const password = String(body.password || '');
    if (!password || password.length > 1024) {
      return jsonWithCookies(400, { ok: false, error: 'Enter your current password.', code: 'password_required' }, cookies);
    }

    if (mode !== 'require-no-active-subscription') {
      return jsonWithCookies(501, { ok: false, error: 'This deletion mode is not available yet.', code: 'mode_not_implemented' }, cookies);
    }
    if (subscriptionBlocksDeletion(user)) {
      return jsonWithCookies(409, {
        ok: false,
        error: 'Cancel your subscription in the billing portal first; then you can delete the account.',
        code: 'subscription_active'
      }, cookies);
    }

    // Re-authentication: the current password, checked by the provider. The
    // session it would start is discarded (the user is about to be deleted).
    const attempt = deleteLimiter.hit(userHash);
    if (!attempt.allowed) return tooManyRequests(attempt.retryAfter, 'Too many attempts. Try again tomorrow.');
    try {
      if (!user.email) throw Object.assign(new Error('no email'), { status: 401 });
      await verifyPassword(user.email, password);
    } catch (err) {
      const status = statusFromError(err, 401);
      if (status >= 500) {
        return jsonWithCookies(503, { ok: false, error: 'Authentication unavailable' }, cookies);
      }
      logAuthEvent('account-delete', { ok: false, errorType: 'reauth_failed', userHash, status: 401 });
      return jsonWithCookies(401, { ok: false, error: 'The password is not correct.', code: 'reauth_failed' }, cookies);
    }

    try {
      const result = await deleteUser(user.id);
      logAuthEvent('account-delete', { ok: true, event: 'account_deleted', userHash, alreadyGone: Boolean(result && result.missing) });
    } catch (err) {
      logAuthEvent('account-delete', { ok: false, errorType: 'delete_failed', userHash, status: statusFromError(err, 500), level: 'error' });
      return jsonWithCookies(500, { ok: false, error: 'The account could not be deleted right now. Nothing was removed; try again later.' }, cookies);
    }
    return jsonWithCookies(200, { ok: true, deleted: true }, clearSessionCookieHeaders());
  };
}

export default createAccountDeleteHandler();
