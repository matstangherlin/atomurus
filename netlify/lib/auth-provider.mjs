import { getSettings, getUser, login, logout, recoverPassword, refreshSession, requestPasswordRecovery, signup, confirmEmail } from '@netlify/identity';
import { clearSessionCookieHeaders, readSessionTokens } from './auth-cookies.mjs';
import {
  isSupabaseConfigured,
  normalizeSupabaseUser,
  supabaseGetUser,
  supabaseLogin,
  supabaseLogout,
  supabaseRecover,
  supabaseRefresh,
  supabaseResetPassword,
  supabaseSessionFromRequest,
  supabaseSignup,
  supabaseVerifyToken
} from './supabase-auth.mjs';

export function authProviderName() {
  const explicit = String(process.env.AUTH_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'supabase' || explicit === 'netlify-identity') return explicit;
  if (isSupabaseConfigured()) return 'supabase';
  return 'netlify-identity';
}

export function isAuthConfigured() {
  if (authProviderName() === 'supabase') return isSupabaseConfigured();
  return true;
}

export function isAuthConfigError(error) {
  return error?.name === 'MissingIdentityError' || error?.code === 'auth_not_configured';
}

function normalizeIdentityUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt || null,
    confirmedAt: user.confirmedAt || null,
    lastSignInAt: user.lastSignInAt || null,
    appMetadata: user.appMetadata || {},
    userMetadata: user.userMetadata || {},
    role: user.role || 'member',
    roles: Array.isArray(user.roles) ? user.roles : []
  };
}

export async function authSignup(email, password, profile = {}) {
  if (authProviderName() === 'supabase') {
    return supabaseSignup(email, password, profile);
  }

  let settings = null;
  try {
    settings = await getSettings();
  } catch (_err) {
    // Signup still reports configuration failures below if Identity is unavailable.
  }

  let identityUser;
  try {
    identityUser = await signup(
      email,
      password,
      profile && (profile.fullName || profile.username)
        ? {
            full_name: profile.fullName || '',
            name: profile.fullName || '',
            username: profile.username || ''
          }
        : undefined
    );
  } catch (err) {
    if (profile && (profile.fullName || profile.username)) {
      identityUser = await signup(email, password);
    } else {
      throw err;
    }
  }
  const user = normalizeIdentityUser(identityUser);
  const needsConfirmation = settings ? !settings.autoconfirm : !user.confirmedAt;
  return {
    user,
    needsConfirmation,
    signedIn: !needsConfirmation,
    cookieHeaders: []
  };
}

export async function authLogin(identifier, password) {
  if (authProviderName() === 'supabase') {
    return supabaseLogin(identifier, password);
  }
  if (!String(identifier || '').includes('@')) {
    const err = new Error('Username login requires Supabase authentication.');
    err.status = 400;
    throw err;
  }

  const user = normalizeIdentityUser(await login(identifier, password));
  return { user, cookieHeaders: [] };
}

export async function authSession(request) {
  if (authProviderName() === 'supabase') {
    return supabaseSessionFromRequest(request);
  }

  try {
    await refreshSession();
  } catch (_err) {
    // getUser returns null if refresh is not possible.
  }

  const user = normalizeIdentityUser(await getUser());
  return { user, cookieHeaders: [] };
}

export async function authRefresh(request) {
  if (authProviderName() === 'supabase') {
    const { accessToken, refreshToken } = readSessionTokens(request);
    const refreshed = await supabaseRefresh(refreshToken);
    if (refreshed) return refreshed;
    const user = await supabaseGetUser(accessToken);
    return user ? { user, cookieHeaders: [] } : null;
  }

  try {
    await refreshSession();
  } catch (_err) {
    // Continue to getUser below.
  }
  const user = normalizeIdentityUser(await getUser());
  return user ? { user, cookieHeaders: [] } : null;
}

export async function authLogout(request) {
  if (authProviderName() === 'supabase') {
    const { accessToken } = readSessionTokens(request);
    return supabaseLogout(accessToken);
  }

  try {
    await logout();
  } catch (_err) {
    // Ignore remote logout failures.
  }
  return clearSessionCookieHeaders();
}

export async function authRecover(email) {
  if (authProviderName() === 'supabase') {
    await supabaseRecover(email);
    return;
  }
  await requestPasswordRecovery(email);
}

export async function authConfirm(token, type = 'signup') {
  if (authProviderName() === 'supabase') {
    return supabaseVerifyToken(token, type);
  }

  const user = normalizeIdentityUser(await confirmEmail(token));
  return { user, cookieHeaders: [] };
}

export async function authReset(token, password, type = 'recovery') {
  if (authProviderName() === 'supabase') {
    return supabaseResetPassword(token, password, type);
  }

  const user = normalizeIdentityUser(await recoverPassword(token, password));
  return { user, cookieHeaders: [] };
}

export { normalizeSupabaseUser };
