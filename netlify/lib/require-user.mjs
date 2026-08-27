import { clearSessionCookieHeaders } from './auth-cookies.mjs';
import { authSession } from './auth-provider.mjs';
import { jsonWithCookies } from './netlify-identity-utils.mjs';

export async function requireUser(request, message = 'Session expired') {
  const session = await authSession(request);
  if (!session?.user) {
    return {
      session,
      user: null,
      response: jsonWithCookies(
        401,
        { ok: false, error: message, code: 'session_expired' },
        session?.cookieHeaders?.length ? session.cookieHeaders : clearSessionCookieHeaders()
      )
    };
  }
  return { session, user: session.user, response: null };
}
