const ACCESS_BASE = 'atm_access';
const REFRESH_BASE = 'atm_refresh';

function isSecureContext() {
  return process.env.NETLIFY_DEV !== 'true' && process.env.CONTEXT === 'production';
}

export function accessCookieName() {
  return isSecureContext() ? `__Host-${ACCESS_BASE}` : ACCESS_BASE;
}

export function refreshCookieName() {
  return isSecureContext() ? `__Host-${REFRESH_BASE}` : REFRESH_BASE;
}

export function allSessionCookieNames() {
  return [
    ACCESS_BASE,
    REFRESH_BASE,
    `__Host-${ACCESS_BASE}`,
    `__Host-${REFRESH_BASE}`
  ];
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
