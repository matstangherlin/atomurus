/*
 * Storage classes. Four different things, four different homes:
 *
 *   PREFERENCE  small UI choices (theme, language, sizes). Device-local.
 *               Web: localStorage. Native: Preferences plugin.
 *   CACHE       re-downloadable data (element data, static content, recent
 *               items). May be evicted at any time. Never the only copy.
 *   SECURE      credentials (Android access/refresh tokens). Native secure
 *               storage only. NEVER localStorage/sessionStorage/plain JSON.
 *               The web has no SECURE keys: its session is an HttpOnly cookie.
 *   CLOUD       account data (Study Sets, progress, reviews, history,
 *               entitlement, profile). Server-first in Supabase via /api.
 *               A local copy is a cache of it, not a replacement.
 *
 * Plus two web-only classes that already exist and stay local:
 *   UI_SESSION  per-tab UI memory (sessionStorage), e.g. last isomer tab.
 *   LOCAL_STATE device-only work that has no cloud model yet (Lab board).
 *
 * The registry below is the audit of every key the codebase touches today.
 * tools/test-storage-policy.mjs fails if code starts using an unregistered key
 * or if any credential-looking key is written to web storage.
 */

export const StorageClass = Object.freeze({
  PREFERENCE: 'preference',
  CACHE: 'cache',
  SECURE: 'secure',
  CLOUD: 'cloud',
  UI_SESSION: 'ui-session',
  LOCAL_STATE: 'local-state',
  SIGNAL: 'signal'
});

/* Exact keys and prefixes (ending in '-') found in the codebase at A1.0. */
export const STORAGE_REGISTRY = Object.freeze({
  'atomurus-theme': { cls: StorageClass.PREFERENCE, area: 'local', note: 'light/dark' },
  'atomurus-lang': { cls: StorageClass.PREFERENCE, area: 'local', note: 'en/pt' },
  'atomurus-reduced-motion': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-3d-quality': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-elsize': { cls: StorageClass.PREFERENCE, area: 'local', note: 'periodic table cell size' },
  'atomurus-fontsize': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-mass': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-heatmap': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-fblock': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-anim': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-sci-mode': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-proto-theme': { cls: StorageClass.PREFERENCE, area: 'local', note: 'dev prototype only' },
  'atomurus-lab-sound': { cls: StorageClass.PREFERENCE, area: 'local' },
  'atomurus-cookie-consent': { cls: StorageClass.PREFERENCE, area: 'local', note: 'web only; app consent is A1.5' },
  'atomurus-nav-': { cls: StorageClass.PREFERENCE, area: 'local', prefix: true, note: 'sidebar group open/closed' },
  'atomurus-compare-queue': { cls: StorageClass.LOCAL_STATE, area: 'local', note: 'elements queued to compare' },
  'atomurus-lab-v1': { cls: StorageClass.LOCAL_STATE, area: 'local', note: 'Virtual Lab board; cloud model is future work' },
  'atomurus-guest-nudge': { cls: StorageClass.PREFERENCE, area: 'local', note: 'dismissal timestamp' },
  'atomurus-guest-lab-views': { cls: StorageClass.UI_SESSION, area: 'session' },
  'atomurus-iso-tab': { cls: StorageClass.UI_SESSION, area: 'session' },
  'atomurus-iso-tab-': { cls: StorageClass.UI_SESSION, area: 'session', prefix: true },
  'atomurus-iso-group': { cls: StorageClass.UI_SESSION, area: 'session' },
  'atomurus-auth-sync': { cls: StorageClass.SIGNAL, area: 'local', note: 'cross-tab signed-in/out ping; carries no token' },
  'atomurus-cache:': { cls: StorageClass.CACHE, area: 'local', prefix: true, note: 'core CacheStorage namespace' }
});

/* Secure keys exist only on native. */
export const SECURE_KEYS = Object.freeze({
  session: 'atomurus.auth.session'
});

/* Data that lives in Supabase and is reached through /api. */
export const CLOUD_DATA = Object.freeze([
  'study.items',
  'study.progress',
  'study.sets',
  'study.cards',
  'study.reviews',
  'study.calculatorHistory',
  'proLab.sessions',
  'account.profile',
  'account.entitlement'
]);

const CREDENTIAL_RE = /(token|refresh|access[-_]?key|secret|password|jwt|bearer|session[-_]?id)/i;

export function looksLikeCredentialKey(key) {
  return CREDENTIAL_RE.test(String(key || ''));
}

export function classify(key) {
  const k = String(key || '');
  if (STORAGE_REGISTRY[k]) return STORAGE_REGISTRY[k];
  for (const [name, entry] of Object.entries(STORAGE_REGISTRY)) {
    if (entry.prefix && k.startsWith(name)) return entry;
  }
  return null;
}
