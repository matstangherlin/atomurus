export const ACCESS_COOKIE_BASE = 'atm_access';
export const REFRESH_COOKIE_BASE = 'atm_refresh';

export const SESSION_COOKIE_NAMES = [
  ACCESS_COOKIE_BASE,
  REFRESH_COOKIE_BASE,
  `__Host-${ACCESS_COOKIE_BASE}`,
  `__Host-${REFRESH_COOKIE_BASE}`
];

export function hasSessionCookieHeader(cookieHeader) {
  const header = String(cookieHeader || '');
  if (!header.trim()) return false;

  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!SESSION_COOKIE_NAMES.includes(key)) continue;
    let value = trimmed.slice(eq + 1);
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep the raw cookie value
    }
    if (String(value).trim()) return true;
  }
  return false;
}
