/*
 * Atomurus runtime configuration — the one place that knows where the API is.
 *
 * Web:     apiBase = ''                     → fetch('/api/...') same origin, cookies.
 * Native:  apiBase = 'https://atomurus.com' → absolute URL, Bearer token.
 *
 * A packaged app serves its own assets from https://localhost, so a
 * relative '/api/...' there would hit the WebView, not Atomurus. Native builds
 * therefore refuse an empty or local API base instead of failing silently.
 *
 * Nothing else in the codebase may hard-code the production origin: import
 * PRODUCTION_ORIGIN or ask resolveRuntimeConfig().
 */

export const PRODUCTION_ORIGIN = 'https://atomurus.com';

export const DEFAULT_TIMEOUTS = Object.freeze({
  /* Reads the UI is waiting on. */
  read: 12000,
  /* Writes (save, review, create set). Longer: a duplicate write costs more
     than a slow one, and writes are never retried automatically. */
  write: 20000,
  /* Auth endpoints: GoTrue behind a Function can be slow on a cold start. */
  auth: 20000
});

export const DEFAULT_RETRY = Object.freeze({
  /* Extra attempts for safe reads only. Never infinite. */
  maxRetries: 2,
  baseDelayMs: 400,
  maxDelayMs: 4000
});

export const DEFAULT_THREE_MODULE_URL = '/vendor/three/three.module.js';

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i;

export function isLocalOrigin(origin) {
  try {
    const url = new URL(origin);
    /* Any non-http(s) scheme is an in-app scheme, i.e. the device itself. */
    return LOCAL_HOST_RE.test(url.hostname) || (url.protocol !== 'https:' && url.protocol !== 'http:');
  } catch (_err) {
    return false;
  }
}

function normalizeBase(raw) {
  const value = String(raw == null ? '' : raw).trim();
  return value.replace(/\/+$/, '');
}

/**
 * @param {object} opts
 * @param {'web'|'android'|'ios'} [opts.platform]
 * @param {object} [opts.overrides]  e.g. window.__ATOMURUS_CONFIG__ for a staging build
 */
export function resolveRuntimeConfig(opts = {}) {
  const platform = opts.platform || 'web';
  const overrides = opts.overrides || {};
  const native = platform !== 'web';

  let apiBase = native ? PRODUCTION_ORIGIN : '';
  if (overrides.apiBase != null) apiBase = normalizeBase(overrides.apiBase);

  if (native) {
    if (!apiBase) {
      throw configError('Native builds need an absolute apiBase; relative /api/... would resolve against the WebView.');
    }
    let url;
    try {
      url = new URL(apiBase);
    } catch (_err) {
      throw configError(`apiBase is not a URL: ${apiBase}`);
    }
    if (url.protocol !== 'https:' && !overrides.allowInsecureDevApi) {
      throw configError('Native apiBase must be https.');
    }
    if (isLocalOrigin(apiBase) && !overrides.allowInsecureDevApi) {
      throw configError('Native apiBase points at the device itself (localhost).');
    }
  }

  return Object.freeze({
    platform,
    native,
    apiBase,
    authMode: native ? 'bearer' : 'cookie',
    timeouts: Object.freeze({ ...DEFAULT_TIMEOUTS, ...(overrides.timeouts || {}) }),
    retry: Object.freeze({ ...DEFAULT_RETRY, ...(overrides.retry || {}) }),
    /* Three.js is fetched on demand by viewers only — packaged locally in the
       app bundle (dist/app/vendor), never part of the bootstrap. */
    threeModuleUrl: String(overrides.threeModuleUrl || DEFAULT_THREE_MODULE_URL),
    dev: Boolean(overrides.dev)
  });
}

export function apiUrl(config, path) {
  const p = String(path || '');
  if (/^[a-z][a-z0-9+.-]*:/i.test(p) || p.startsWith('//')) {
    throw configError('api paths must be relative to the API base, not absolute URLs.');
  }
  const rel = p.startsWith('/') ? p : `/${p}`;
  return `${config.apiBase}${rel}`;
}

function configError(message) {
  const err = new Error(message);
  err.code = 'CONFIG_ERROR';
  return err;
}
