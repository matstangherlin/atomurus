import { clearSessionCookieHeaders, readSessionTokens } from './auth-cookies.mjs';
import {
  isSupabaseConfigured,
  normalizeSupabaseUser,
  supabaseEstablishSession,
  supabaseGetUser,
  supabaseLogin,
  supabaseLogout,
  supabaseRecover,
  supabaseRefresh,
  supabaseResetPassword,
  supabaseSessionFromRequest,
  supabaseSignup,
  supabaseUpdatePassword,
  supabaseVerifyToken
} from './supabase-auth.mjs';

export function authProviderName() {
  return 'supabase';
}

export function isAuthConfigured() {
  return isSupabaseConfigured();
}

export function isAuthConfigError(error) {
  return error?.name === 'MissingIdentityError' || error?.code === 'auth_not_configured';
}

function isRejectedSession(error) {
  const status = Number(error?.status || 0);
  return status >= 400 && status < 500;
}

export async function authSignup(email, password, profile = {}) {
  return supabaseSignup(email, password, profile);
}

export async function authLogin(identifier, password) {
  return supabaseLogin(identifier, password);
}

export async function authSession(request) {
  try {
    const session = await supabaseSessionFromRequest(request);
    if (session?.user) return session;
    // Opportunistic restore only. A miss (expired access, rotated
    // refresh in another isolate, ads-config racing /me) must not
    // Set-Cookie Max-Age=0: that would wipe a sibling isolate's newly
    // rotated cookies from the shared jar.
    return { user: null, cookieHeaders: session?.cookieHeaders || [], accessToken: null };
  } catch (err) {
    if (isRejectedSession(err)) {
      return { user: null, cookieHeaders: [], accessToken: null };
    }
    throw err;
  }
}

export async function authRefresh(request) {
  const { accessToken, refreshToken } = readSessionTokens(request);
  let refreshed = null;

  if (refreshToken) {
    try {
      refreshed = await supabaseRefresh(refreshToken);
    } catch (err) {
      if (!isRejectedSession(err)) throw err;
    }
  }
  if (refreshed?.user) return refreshed;

  let user = null;
  if (accessToken) {
    try {
      user = await supabaseGetUser(accessToken);
    } catch (err) {
      if (!isRejectedSession(err)) throw err;
    }
  }
  if (user) return { user, cookieHeaders: [] };

  return { user: null, cookieHeaders: clearSessionCookieHeaders() };
}

export async function authLogout(request) {
  const { accessToken } = readSessionTokens(request);
  return supabaseLogout(accessToken);
}

export async function authRecover(email) {
  await supabaseRecover(email);
}

export async function authConfirm(token, type = 'signup') {
  return supabaseVerifyToken(token, type);
}

export async function authEstablish(accessToken, refreshToken) {
  return supabaseEstablishSession(accessToken, refreshToken);
}

export async function authReset(token, password, type = 'recovery', request = null) {
  if (token) {
    return supabaseResetPassword(token, password, type);
  }
  const { accessToken } = readSessionTokens(request || { headers: { get() { return ''; } } });
  const user = await supabaseUpdatePassword(accessToken, password);
  return { user, cookieHeaders: [] };
}

export { normalizeSupabaseUser };
