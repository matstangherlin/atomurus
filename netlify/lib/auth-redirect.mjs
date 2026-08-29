export const PUBLIC_AUTH_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/login/reset'
];

// The /app shell is public; protected data lives behind authenticated APIs.
export const PROTECTED_PATHS = [];

const DEFAULT_ORIGIN = 'https://atomurus.invalid';

export function normalizePathname(pathname) {
  const raw = String(pathname || '').split('?')[0].split('#')[0];
  if (!raw || raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}

export function isPublicAuthPath(pathname) {
  return PUBLIC_AUTH_PATHS.includes(normalizePathname(pathname));
}

export function isProtectedPath(pathname) {
  let path = normalizePathname(pathname);
  if (path === '/app.html') path = '/app';
  return PROTECTED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function fullyDecode(value) {
  let current = String(value || '');
  for (let i = 0; i < 5; i += 1) {
    try {
      const next = decodeURIComponent(current.replace(/\+/g, '%20'));
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

function hasBackslash(value) {
  return String(value || '').includes('\\') || /%5c/i.test(String(value || ''));
}

export function safeNextPath(raw, fallback = '/app', origin = DEFAULT_ORIGIN) {
  const value = String(raw || '').trim();
  if (!value) return fallback;
  if (hasBackslash(value)) return fallback;

  const decoded = fullyDecode(value);
  if (hasBackslash(decoded)) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || decoded.startsWith('//')) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return fallback;

  let url;
  try {
    url = new URL(value, origin);
  } catch {
    return fallback;
  }

  let expectedOrigin;
  try {
    expectedOrigin = new URL(origin).origin;
  } catch {
    return fallback;
  }
  if (url.origin !== expectedOrigin) return fallback;
  if (url.username || url.password) return fallback;
  if (url.pathname.startsWith('//')) return fallback;

  const decodedPath = fullyDecode(url.pathname);
  if (decodedPath.startsWith('//') || decodedPath.includes('\\')) return fallback;
  if (isPublicAuthPath(url.pathname) || isPublicAuthPath(decodedPath)) return fallback;

  return `${url.pathname}${url.search}`;
}

export function loginUrl(nextPath, origin = DEFAULT_ORIGIN, lang = '') {
  const next = safeNextPath(nextPath, '/app', origin);
  let url = `/login?next=${encodeURIComponent(next)}`;
  const language = String(lang || '').trim();
  if (language) url += `&lang=${encodeURIComponent(language)}`;
  return url;
}
