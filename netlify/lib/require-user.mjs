import { logAuthEvent } from './auth-log.mjs';
import { authSession } from './auth-provider.mjs';
import { jsonWithCookies } from './netlify-identity-utils.mjs';

export async function requireUser(request, message = 'Session expired') {
  const session = await authSession(request);
  if (!session?.user) {
    logAuthEvent('auth-session', {
      ok: false,
      event: 'auth_session_expired',
      status: 401
    });
    return {
      session,
      user: null,
      response: jsonWithCookies(
        401,
        { ok: false, error: message, code: 'session_expired' },
        session?.cookieHeaders || []
      )
    };
  }
  return { session, user: session.user, response: null };
}
