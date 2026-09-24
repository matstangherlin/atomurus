/*
 * Shared route contract. Logic in the app refers to *logical* routes
 * ('study/review'), never to HTML files. Each route knows the web URL that
 * serves it today, so the public site keeps its multipage, SEO-friendly
 * URLs while the app shell (and deep links) resolve the same destinations.
 *
 *   atomurus://study/review
 *   https://atomurus.com/study/review          → { id: 'study/review' }
 *   https://atomurus.com/app?section=review
 */

import { PRODUCTION_ORIGIN } from '../config/runtime-config.js';

export const ROUTES = Object.freeze([
  { id: 'home', path: '/home', web: '/', feature: null, access: 'public' },
  { id: 'explore', path: '/explore', web: '/explore', feature: 'explore', access: 'public' },
  { id: 'lab', path: '/lab', web: '/app?section=lab', feature: 'lab', access: 'public' },
  { id: 'lab/analysis', path: '/lab/analysis', web: '/app?section=lab&panel=analysis', feature: 'pro-lab', access: 'public', parent: 'lab' },
  { id: 'study', path: '/study', web: '/app?section=study', feature: 'study', access: 'public' },
  { id: 'study/review', path: '/study/review', web: '/app?section=review', feature: 'review', access: 'account', parent: 'study' },
  { id: 'study/sets', path: '/study/sets', web: '/app?section=sets', feature: 'sets', access: 'account', parent: 'study' },
  { id: 'study/practice', path: '/study/practice', web: '/app?section=practice', feature: 'study', access: 'public', parent: 'study' },
  { id: 'study/insights', path: '/study/insights', web: '/app?section=insights', feature: 'insights', access: 'pro', parent: 'study' },
  { id: 'study/work', path: '/study/work', web: '/app?section=work', feature: 'study', access: 'account', parent: 'study' },
  { id: 'account', path: '/account', web: '/account', feature: 'account', access: 'account' },
  { id: 'periodic-table', path: '/periodic-table', web: '/periodic-table', feature: 'periodic-table', access: 'public', parent: 'explore' },
  { id: 'molecules', path: '/molecules', web: '/viewer/molecules', feature: 'molecules', access: 'public', parent: 'explore' },
  { id: 'atomic-models', path: '/atomic-models', web: '/viewer/atomic-models', feature: 'atomic-models', access: 'public', parent: 'explore' },
  { id: 'calculators', path: '/calculators', web: '/calculators', feature: 'calculators', access: 'public', parent: 'explore' },
  { id: 'pricing', path: '/pricing', web: '/pricing', feature: null, access: 'public', parent: 'account' },
  { id: 'login', path: '/login', web: '/login', feature: null, access: 'public' }
]);

const BY_ID = new Map(ROUTES.map((r) => [r.id, r]));
const BY_PATH = new Map(ROUTES.map((r) => [r.path, r]));

/* Mobile bottom navigation: at most five destinations (Material guidance and
   A1.0 rule). Everything else is reached from inside one of these. */
export const MAX_PRIMARY_DESTINATIONS = 5;
export const PRIMARY_NAV = Object.freeze(['home', 'explore', 'lab', 'study', 'account']);

/* Secondary navigation lives in a sheet / in-page tabs, not the bottom bar. */
export const SECONDARY_NAV = Object.freeze({
  study: ['study', 'study/sets', 'study/review', 'study/practice', 'study/insights', 'study/work'],
  explore: ['explore', 'periodic-table', 'molecules', 'atomic-models', 'calculators'],
  lab: ['lab', 'lab/analysis'],
  account: ['account', 'pricing']
});

export function getRoute(id) {
  return BY_ID.get(id) || null;
}

export function primaryDestinations() {
  if (PRIMARY_NAV.length > MAX_PRIMARY_DESTINATIONS) {
    throw new Error(`Bottom navigation allows ${MAX_PRIMARY_DESTINATIONS} destinations, got ${PRIMARY_NAV.length}.`);
  }
  return PRIMARY_NAV.map((id) => BY_ID.get(id));
}

/* The primary tab a route belongs to (for highlighting the bottom bar). */
export function primaryFor(id) {
  let route = BY_ID.get(id);
  const seen = new Set();
  while (route && !PRIMARY_NAV.includes(route.id) && route.parent && !seen.has(route.id)) {
    seen.add(route.id);
    route = BY_ID.get(route.parent);
  }
  return route && PRIMARY_NAV.includes(route.id) ? route.id : null;
}

export function webUrlFor(id, params = {}) {
  const route = BY_ID.get(id);
  if (!route) return null;
  const url = new URL(route.web, PRODUCTION_ORIGIN);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.pathname + url.search;
}

/* Legacy /app?section=… → logical route. Mirrors workspace-logic.js areas. */
const SECTION_TO_ROUTE = Object.freeze({
  lab: 'lab', overview: 'lab', creations: 'lab', 'pro-lab': 'lab/analysis',
  study: 'study', library: 'study', sets: 'study/sets', practice: 'study/practice',
  review: 'study/review', insights: 'study/insights',
  work: 'study/work', notebook: 'study/work', notes: 'study/work', history: 'study/work', progress: 'study/work',
  account: 'account'
});

const WEB_PATH_TO_ROUTE = Object.freeze({
  '/': 'home', '/index.html': 'home',
  '/explore': 'explore', '/explore.html': 'explore',
  '/periodic-table': 'periodic-table', '/periodic-table.html': 'periodic-table',
  '/viewer/molecules': 'molecules', '/viewer/molecules.html': 'molecules',
  '/viewer/atomic-models': 'atomic-models', '/viewer/atomic-models.html': 'atomic-models',
  '/calculators': 'calculators', '/calculators.html': 'calculators',
  '/account': 'account', '/account.html': 'account',
  '/pricing': 'pricing', '/pricing.html': 'pricing',
  '/login': 'login', '/login.html': 'login'
});

const TRUSTED_HOSTS = new Set(['atomurus.com', 'www.atomurus.com']);
export const APP_SCHEME = 'atomurus:';

/**
 * Resolve any Atomurus link to { id, params } — or null when it is not ours.
 * Only atomurus:// and https://(www.)atomurus.com are accepted.
 */
export function resolveDeepLink(raw) {
  let url;
  try {
    url = new URL(String(raw || ''));
  } catch (_err) {
    return null;
  }
  let path;
  if (url.protocol === APP_SCHEME) {
    /* atomurus://study/review → host "study", path "/review" */
    path = `/${url.host}${url.pathname}`.replace(/\/+$/, '') || '/';
  } else if (url.protocol === 'https:' && TRUSTED_HOSTS.has(url.hostname)) {
    path = url.pathname.replace(/\/+$/, '') || '/';
  } else {
    return null;
  }

  const params = Object.fromEntries(url.searchParams.entries());

  if (path === '/app' || path === '/app.html') {
    const section = String(params.section || 'lab').toLowerCase();
    delete params.section;
    const id = SECTION_TO_ROUTE[section] || 'lab';
    return { id, params };
  }
  if (BY_PATH.has(path)) return { id: BY_PATH.get(path).id, params };
  if (WEB_PATH_TO_ROUTE[path]) return { id: WEB_PATH_TO_ROUTE[path], params };
  if (path.startsWith('/periodic-table/')) {
    return { id: 'periodic-table', params: { ...params, element: path.slice('/periodic-table/'.length).replace(/\.html$/, '') } };
  }
  return null;
}
