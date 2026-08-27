import { hasSessionCookieHeader } from './session-cookie-flag.mjs';
import { isProtectedPath, loginUrl, normalizePathname } from './auth-redirect.mjs';

export function workspacePathname(pathname) {
  const path = normalizePathname(pathname);
  if (path === '/app.html') return '/app';
  return path;
}

export function appGateDecision(requestUrl, cookieHeader) {
  let url;
  try {
    url = new URL(requestUrl);
  } catch {
    return { action: 'next' };
  }

  const path = workspacePathname(url.pathname);
  if (!isProtectedPath(path)) return { action: 'next' };
  if (hasSessionCookieHeader(cookieHeader)) return { action: 'next' };

  const next = `${path}${url.search}`;
  const lang = url.searchParams.get('lang') || '';
  return {
    action: 'redirect',
    location: loginUrl(next, url.origin, lang)
  };
}
