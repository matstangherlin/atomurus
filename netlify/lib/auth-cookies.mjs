import {
  ACCESS_COOKIE_BASE as ACCESS_BASE,
  REFRESH_COOKIE_BASE as REFRESH_BASE,
  SESSION_COOKIE_NAMES
} from './session-cookie-flag.mjs';

function isSecureContext() {
  // Local `netlify dev` is HTTP; deployed Netlify (prod + previews) is HTTPS.
  return process.env.NETLIFY_DEV !== 'true';
}

export function accessCookieName() {
  return isSecureContext() ? `__Host-${ACCESS_BASE}` : ACCESS_BASE;
}

export function refreshCookieName() {
  return isSecureContext() ? `__Host-${REFRESH_BASE}` : REFRESH_BASE;
}

export function allSessionCookieNames() {
  return SESSION_COOKIE_NAMES.slice();
}

function serializeCookie(name, value, maxAge) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax'
  ];
  if (isSecureContext()) parts.push('Secure');
  if (typeof maxAge === 'number') parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

export function sessionCookieHeaders(accessToken, refreshToken, expiresIn = 3600) {
  const refreshTtl = 60 * 60 * 24 * 30;
  return [
    serializeCookie(accessCookieName(), accessToken, expiresIn),
    serializeCookie(refreshCookieName(), refreshToken, refreshTtl)
  ];
}

export function clearSessionCookieHeaders() {
  return allSessionCookieNames().map((name) => serializeCookie(name, '', 0));
}

// Native clients (Android, A1.x) authenticate with `Authorization: Bearer
// <supabase access token>` instead of the cookie jar. `present` is true as soon
// as the header exists, so a malformed or dead bearer is rejected outright and
// never falls back to whatever cookies the request also carries.
const BEARER_RE = /^Bearer\s+([A-Za-z0-9\-_.~+/]+=*)$/;
const MAX_BEARER_LENGTH = 4096;

export function readBearerCredential(request) {
  const header = String(request?.headers?.get?.('authorization') || '').trim();
  if (!header) return { present: false, token: null };
  if (header.length > MAX_BEARER_LENGTH + 7) return { present: true, token: null };
  const match = BEARER_RE.exec(header);
  return { present: true, token: match ? match[1] : null };
}

export function readSessionTokens(request) {
  const header = request.headers.get('cookie') || '';
  const jar = {};
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1);
    try {
      jar[key] = decodeURIComponent(value);
    } catch (_err) {
      jar[key] = value;
    }
  }

  return {
    accessToken: jar[accessCookieName()] || jar[ACCESS_BASE] || null,
    refreshToken: jar[refreshCookieName()] || jar[REFRESH_BASE] || null
  };
}
