import { createHash } from 'node:crypto';
import { validUsername, usernameFromEmail, usernameCandidates } from './netlify-identity-utils.mjs';
import {
  clearSessionCookieHeaders,
  readSessionTokens,
  sessionCookieHeaders
} from './auth-cookies.mjs';

const DEFAULT_ACCESS_TTL = 3600;

function supabaseConfig() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function serviceRoleKey() {
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig());
}

function authUrl(path) {
  const cfg = supabaseConfig();
  if (!cfg) {
    const err = new Error('Supabase auth is not configured');
    err.status = 500;
    err.code = 'auth_not_configured';
    throw err;
  }
  return `${cfg.url}/auth/v1${path}`;
}

function anonHeaders(extra = {}) {
  const cfg = supabaseConfig();
  return {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

function serviceHeaders(extra = {}) {
  const cfg = supabaseConfig();
  const serviceKey = serviceRoleKey();
  if (!cfg || !serviceKey) {
    const err = new Error('Supabase service role is not configured');
    err.status = 500;
    err.code = 'supabase_service_role_missing';
    throw err;
  }
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function parseSupabaseResponse(res) {
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = { message: text };
    }
  }
  if (!res.ok) {
    const err = new Error(data.msg || data.message || data.error_description || 'Supabase auth request failed');
    err.status = res.status;
    err.code = data.error_code || data.error || null;
    throw err;
  }
  return data;
}

export function normalizeSupabaseUser(user) {
  if (!user) return null;
  const app = user.app_metadata || {};
  const roles = Array.isArray(app.roles) ? app.roles : [];
  return {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username || null,
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
    createdAt: user.created_at || null,
    confirmedAt: user.email_confirmed_at || null,
    lastSignInAt: user.last_sign_in_at || null,
    appMetadata: app,
    userMetadata: user.user_metadata || {},
    role: user.role || (roles.includes('admin') ? 'admin' : 'member'),
    roles
  };
}

function sessionFromPayload(payload) {
  if (!payload?.access_token || !payload?.refresh_token) return null;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: Number(payload.expires_in) || DEFAULT_ACCESS_TTL,
    user: normalizeSupabaseUser(payload.user)
  };
}

function redirectBase() {
  const configured = String(process.env.AUTH_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '');
  if (configured) return configured;
  if (process.env.NETLIFY_DEV === 'true') return 'http://localhost:8888';
  return 'https://atomurus.com';
}

export function classifySupabaseAuthError(err) {
  const code = String(err?.code || '').toLowerCase();
  const message = String(err?.message || '').toLowerCase();
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    err.status = 401;
    err.code = 'email_not_confirmed';
    err.publicMessage = 'Confirm your email before signing in.';
    return err;
  }
  if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) {
    err.status = 429;
    err.code = 'rate_limited';
    err.publicMessage = 'Too many attempts. Try again later.';
    return err;
  }
  if (code === 'user_already_exists' || message.includes('already registered') || message.includes('already exists')) {
    err.status = 409;
    err.code = 'user_exists';
    err.publicMessage = 'This email already has an account. Sign in or reset your password.';
    return err;
  }
  return err;
}

export async function supabaseSignup(email, password, profile = {}) {
  try {
    const fullName = String(profile.fullName || profile.name || '').trim();
    const username = String(profile.username || '').trim().toLowerCase();
    if (serviceRoleKey()) {
      await assertUsernameAvailable(username);
    }
    const redirectTo = encodeURIComponent(`${redirectBase()}/login`);
    const res = await fetch(authUrl(`/signup?redirect_to=${redirectTo}`), {
      method: 'POST',
      headers: anonHeaders(),
      body: JSON.stringify({
        email,
        password,
        data: {
          atomurus_signup_source: 'login_page',
          name: fullName || undefined,
          full_name: fullName || undefined,
          username: username || undefined
        }
      })
    });
    const data = await parseSupabaseResponse(res);
    const session = sessionFromPayload(data);
    const user = session?.user || normalizeSupabaseUser(data.user || data);
    if (serviceRoleKey()) {
      await saveProfileIdentity({
        userId: user?.id,
        email,
        username,
        fullName
      });
    }
    const needsConfirmation = !user?.confirmedAt && !session;
    return {
      user,
      needsConfirmation,
      signedIn: Boolean(session),
      cookieHeaders: session ? sessionCookieHeaders(session.accessToken, session.refreshToken, session.expiresIn) : []
    };
  } catch (err) {
    throw classifySupabaseAuthError(err);
  }
}

export async function supabaseLogin(identifier, password) {
  try {
    const email = await resolveLoginEmail(identifier);
    const res = await fetch(authUrl('/token?grant_type=password'), {
      method: 'POST',
      headers: anonHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await parseSupabaseResponse(res);
    const session = sessionFromPayload(data);
    if (!session) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }
    return {
      user: session.user,
      cookieHeaders: sessionCookieHeaders(session.accessToken, session.refreshToken, session.expiresIn)
    };
  } catch (err) {
    throw classifySupabaseAuthError(err);
  }
}

// Same-isolate single-flight for refresh_token grants.
// This Map is NOT a distributed lock: two Function instances can still
// race. Supabase rotates refresh tokens, so a sibling isolate may see
// an invalid/reused token. authSession must not clear cookies on that
// miss; only explicit authRefresh / authLogout expire the jar. Shared
// storage would still be required to make refresh itself consistent.
// Keys are SHA-256 prefixes, never the token.
const refreshFlights = new Map();

function refreshFlightKey(refreshToken) {
  return createHash('sha256').update(String(refreshToken || '')).digest('hex').slice(0, 16);
}

export function resetRefreshFlights() {
  refreshFlights.clear();
}

export async function supabaseGetUser(accessToken) {
  if (!accessToken) return null;
  const res = await fetch(authUrl('/user'), {
    method: 'GET',
    headers: anonHeaders({ Authorization: `Bearer ${accessToken}` })
  });
  if (res.status === 401) return null;
  const data = await parseSupabaseResponse(res);
  return normalizeSupabaseUser(data.user || data);
}

async function supabaseRefreshOnce(refreshToken) {
  const res = await fetch(authUrl('/token?grant_type=refresh_token'), {
    method: 'POST',
    headers: anonHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  if (res.status === 401) return null;
  const data = await parseSupabaseResponse(res);
  const session = sessionFromPayload(data);
  if (!session) return null;
  return {
    user: session.user,
    accessToken: session.accessToken,
    cookieHeaders: sessionCookieHeaders(session.accessToken, session.refreshToken, session.expiresIn)
  };
}

export async function supabaseRefresh(refreshToken) {
  if (!refreshToken) return null;
  const flightKey = refreshFlightKey(refreshToken);
  const existing = refreshFlights.get(flightKey);
  if (existing) return existing;

  const flight = supabaseRefreshOnce(refreshToken);
  refreshFlights.set(flightKey, flight);
  try {
    return await flight;
  } finally {
    if (refreshFlights.get(flightKey) === flight) refreshFlights.delete(flightKey);
  }
}

export async function supabaseLogout(accessToken) {
  if (accessToken) {
    try {
      await fetch(authUrl('/logout'), {
        method: 'POST',
        headers: anonHeaders({ Authorization: `Bearer ${accessToken}` })
      });
    } catch (_err) {
      // Always clear local cookies even if remote logout fails.
    }
  }
  return clearSessionCookieHeaders();
}

export async function supabaseRecover(email) {
  const redirectTo = String(process.env.AUTH_PASSWORD_REDIRECT || `${redirectBase()}/reset-password`).replace(/\/$/, '');
  const res = await fetch(authUrl('/recover'), {
    method: 'POST',
    headers: anonHeaders(),
    body: JSON.stringify({ email, redirect_to: redirectTo })
  });
  await parseSupabaseResponse(res);
}

export async function supabaseEstablishSession(accessToken, refreshToken) {
  const user = await supabaseGetUser(accessToken);
  if (!user || !refreshToken) {
    const err = new Error('Invalid session');
    err.status = 401;
    throw err;
  }
  return {
    user,
    cookieHeaders: sessionCookieHeaders(accessToken, refreshToken, DEFAULT_ACCESS_TTL)
  };
}

export async function supabaseUpdatePassword(accessToken, password) {
  if (!accessToken) {
    const err = new Error('Session expired');
    err.status = 401;
    err.code = 'session_expired';
    throw err;
  }
  const res = await fetch(authUrl('/user'), {
    method: 'PUT',
    headers: anonHeaders({ Authorization: `Bearer ${accessToken}` }),
    body: JSON.stringify({ password })
  });
  const data = await parseSupabaseResponse(res);
  return normalizeSupabaseUser(data.user || data);
}

export async function supabaseVerifyToken(token, type = 'signup') {
  const res = await fetch(authUrl('/verify'), {
    method: 'POST',
    headers: anonHeaders(),
    body: JSON.stringify({ token_hash: token, type })
  });
  const data = await parseSupabaseResponse(res);
  const session = sessionFromPayload(data);
  if (!session) {
    const err = new Error('Verification failed');
    err.status = 400;
    throw err;
  }
  return {
    user: session.user,
    cookieHeaders: sessionCookieHeaders(session.accessToken, session.refreshToken, session.expiresIn)
  };
}

export async function supabaseResetPassword(token, password, type = 'recovery') {
  const verified = await supabaseVerifyToken(token, type);
  const accessToken = verified.cookieHeaders.length
    ? readSessionTokensFromHeaders(verified.cookieHeaders).accessToken
    : null;
  if (!accessToken) {
    const err = new Error('Password reset link is invalid or expired.');
    err.status = 400;
    throw err;
  }

  const res = await fetch(authUrl('/user'), {
    method: 'PUT',
    headers: anonHeaders({ Authorization: `Bearer ${accessToken}` }),
    body: JSON.stringify({ password })
  });
  const data = await parseSupabaseResponse(res);
  const user = normalizeSupabaseUser(data.user || data) || verified.user;
  return {
    user,
    cookieHeaders: verified.cookieHeaders
  };
}

function readSessionTokensFromHeaders(cookieHeaders) {
  const jar = {};
  for (const header of cookieHeaders) {
    const [pair] = header.split(';');
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1);
    try {
      jar[key] = decodeURIComponent(value);
    } catch (_err) {
      jar[key] = value;
    }
  }
  return {
    accessToken: jar.atm_access || jar['__Host-atm_access'] || null,
    refreshToken: jar.atm_refresh || jar['__Host-atm_refresh'] || null
  };
}

export async function supabaseSessionFromRequest(request) {
  const { accessToken, refreshToken } = readSessionTokens(request);
  let user = await supabaseGetUser(accessToken);
  let cookieHeaders = [];
  let token = accessToken || null;
  if (!user && refreshToken) {
    const refreshed = await supabaseRefresh(refreshToken);
    if (refreshed) {
      user = refreshed.user;
      cookieHeaders = refreshed.cookieHeaders;
      token = refreshed.accessToken || null;
    }
  }
  return {
    user,
    cookieHeaders,
    accessToken: user ? token : null
  };
}

export async function supabaseAdminUpdateUser(userId, payload = {}) {
  if (!userId) {
    const err = new Error('Missing user id');
    err.status = 400;
    throw err;
  }
  const res = await fetch(authUrl(`/admin/users/${encodeURIComponent(userId)}`), {
    method: 'PUT',
    headers: serviceHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await parseSupabaseResponse(res);
  return normalizeSupabaseUser(data.user || data);
}

export async function supabaseAdminPatchAppMetadata(userId, patch = {}) {
  const current = await supabaseAdminGetUser(userId);
  if (!current) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const nextMetadata = {
    ...(current.appMetadata || {}),
    ...patch
  };
  return supabaseAdminUpdateUser(userId, { app_metadata: nextMetadata });
}

export async function supabaseAdminGetUser(userId) {
  if (!userId) return null;
  const res = await fetch(authUrl(`/admin/users/${encodeURIComponent(userId)}`), {
    method: 'GET',
    headers: serviceHeaders()
  });
  if (res.status === 404) return null;
  const data = await parseSupabaseResponse(res);
  return normalizeSupabaseUser(data.user || data);
}

async function resolveLoginEmail(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  if (raw.includes('@')) return raw.toLowerCase();
  const profile = await getProfileByUsername(raw.toLowerCase());
  if (!profile?.email) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  return String(profile.email).toLowerCase();
}

async function getProfileByUsername(username) {
  if (!username || !serviceRoleKey()) return null;
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const url = `${cfg.url}/rest/v1/profiles?select=id,email,username&username=eq.${encodeURIComponent(username)}&limit=1`;
  const res = await fetch(url, {
    method: 'GET',
    headers: serviceHeaders()
  });
  if (res.status === 404) return null;
  const data = await parseSupabaseResponse(res);
  return Array.isArray(data) ? (data[0] || null) : null;
}

export async function allocateUniqueUsername(base) {
  const candidates = usernameCandidates(base || usernameFromEmail(base));
  for (const candidate of candidates) {
    if (!validUsername(candidate)) continue;
    try {
      await assertUsernameAvailable(candidate);
      return candidate;
    } catch (err) {
      if (err?.code === 'username_taken') continue;
      throw err;
    }
  }
  const err = new Error('This username is already in use.');
  err.status = 409;
  err.code = 'username_taken';
  throw err;
}

async function assertUsernameAvailable(username) {
  try {
    const existing = await getProfileByUsername(username);
    if (existing?.id) {
      const err = new Error('This username is already in use.');
      err.status = 409;
      err.code = 'username_taken';
      throw err;
    }
  } catch (err) {
    if (err?.code === 'username_taken') throw err;
    // Signup should still work if the profiles table is not ready yet.
    if (err?.status && err.status < 500) throw err;
  }
}

async function saveProfileIdentity({ userId, email, username, fullName }) {
  if (!userId || !serviceRoleKey()) return;
  try {
    const cfg = supabaseConfig();
    const url = `${cfg.url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: serviceHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({
        email,
        username,
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
    });
    await parseSupabaseResponse(res);
  } catch (_err) {
    // Profile metadata is optional for the first signup path.
  }
}
