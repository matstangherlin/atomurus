export const PUBLIC_AUTH_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/login/reset'
];

export const PROTECTED_PATHS = ['/app'];

export function normalizePathname(pathname) {
  const raw = String(pathname || '').split('?')[0].split('#')[0];
  if (!raw || raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}

export function isPublicAuthPath(pathname) {
  return PUBLIC_AUTH_PATHS.includes(normalizePathname(pathname));
}

export function isProtectedPath(pathname) {
  const path = normalizePathname(pathname);
  return PROTECTED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function safeNextPath(raw, fallback = '/app') {
  const value = String(raw || '').trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return fallback;
  if (isPublicAuthPath(value)) return fallback;
  return value;
}

export function loginUrl(nextPath) {
  const next = safeNextPath(nextPath);
  if (!next || next === '/app') return '/login';
  return `/login?next=${encodeURIComponent(next)}`;
}
