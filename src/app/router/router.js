/*
 * App router — hash based (#/study/review) so the same shell works from
 * /dev/app-shell.html on the web and from https://localhost/index.html in a
 * packaged app without server rewrites. Navigation between areas never
 * reloads the page; public web pages keep their own multipage URLs.
 */

import { ROUTES, getRoute, resolveDeepLink } from '../../core/routing/routes.js';

const BY_PATH = new Map(ROUTES.map((r) => [r.path, r]));

export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#/, '') || '/home';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.replace(/\/+$/, '') || '/home';
  const route = BY_PATH.get(path) || null;
  const params = Object.fromEntries(new URLSearchParams(queryPart || '').entries());
  return route ? { id: route.id, params } : { id: 'home', params, unknown: path };
}

export function hashFor(id, params = {}) {
  const route = getRoute(id);
  if (!route) return '#/home';
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
  return `#${route.path}${qs ? `?${qs}` : ''}`;
}

export function createRouter({ win = globalThis.window, scope, onRoute }) {
  let current = null;

  function apply() {
    const next = parseHash(win.location.hash);
    current = next;
    onRoute(next);
  }

  scope.listen(win, 'hashchange', apply);

  return {
    start: apply,
    navigate(id, params) {
      const target = hashFor(id, params);
      if (win.location.hash === target) apply();
      else win.location.hash = target;
    },
    /* atomurus://study/review or https://atomurus.com/study/review */
    openDeepLink(url) {
      const resolved = resolveDeepLink(url);
      if (!resolved || !getRoute(resolved.id)) return false;
      this.navigate(resolved.id, resolved.params);
      return true;
    },
    get current() { return current; }
  };
}
