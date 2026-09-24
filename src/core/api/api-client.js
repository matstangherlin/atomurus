/*
 * Atomurus API client — the single way new and migrated features talk to
 * /api/*. Web and native share it; only the runtime config and the auth
 * adapter differ.
 *
 *   api.get('/api/study/sets')
 *   api.post('/api/study/sets', { title })
 *   api.put(...), api.patch(...), api.delete(...)
 *
 * Guarantees:
 *   - every request has a timeout (AbortController); none waits forever
 *   - errors are ApiError with a canonical `kind` (see api-errors.js)
 *   - safe reads retry a bounded number of times; writes never replay
 *     unless the caller sends an idempotency key (see retry-policy.js)
 *   - web sends cookies (HttpOnly session); native sends
 *     Authorization: Bearer and never relies on cookies
 *   - a 401 in bearer mode triggers exactly one refresh + one replay
 *   - offline fails fast with OFFLINE instead of hanging
 */

import { apiUrl } from '../config/runtime-config.js';
import { ApiError, ApiErrorKind, kindForStatus, parseRetryAfter } from './api-errors.js';
import { backoffDelay, maxRetriesFor, shouldRetry } from './retry-policy.js';

const JSON_TYPE = /\bjson\b/i;

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function queryString(query) {
  if (!query) return '';
  const search = new URLSearchParams();
  for (const key of Object.keys(query)) {
    const value = query[key];
    if (value == null || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

/**
 * @param {object} deps
 * @param {object} deps.config          resolveRuntimeConfig() result
 * @param {Function} [deps.fetchImpl]   defaults to globalThis.fetch
 * @param {object} [deps.auth]          { getAuthorization(), refreshAfterUnauthorized(), onUnauthorized(err) }
 * @param {object} [deps.platform]      { isOnline() }
 * @param {Function} [deps.onEvent]     telemetry / network-state hook
 */
export function createApiClient(deps = {}) {
  const config = deps.config;
  if (!config) throw new Error('createApiClient needs a runtime config');
  const fetchImpl = deps.fetchImpl || ((...args) => globalThis.fetch(...args));
  const sleep = deps.sleep || defaultSleep;
  const random = deps.random || Math.random;
  const auth = deps.auth || null;
  const platform = deps.platform || null;
  const onEvent = typeof deps.onEvent === 'function' ? deps.onEvent : () => {};

  function emit(type, detail) {
    try { onEvent({ type, ...detail }); } catch (_err) { /* telemetry never breaks a request */ }
  }

  function timeoutFor(method, opts) {
    const explicit = Number(opts.timeoutMs);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    if (opts.kind === 'auth') return config.timeouts.auth;
    return method === 'GET' || method === 'HEAD' ? config.timeouts.read : config.timeouts.write;
  }

  async function once(method, path, opts, url) {
    if (platform && typeof platform.isOnline === 'function' && platform.isOnline() === false) {
      throw new ApiError(ApiErrorKind.OFFLINE, { method, path });
    }

    const headers = { Accept: 'application/json', ...(opts.headers || {}) };
    let body;
    if (opts.body !== undefined && opts.body !== null) {
      if (typeof opts.body === 'string') {
        body = opts.body;
      } else {
        body = JSON.stringify(opts.body);
      }
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    }
    if (opts.idempotencyKey) headers['Idempotency-Key'] = String(opts.idempotencyKey);

    if (opts.auth !== false && auth && typeof auth.getAuthorization === 'function') {
      const authorization = await auth.getAuthorization();
      if (authorization) headers.Authorization = authorization;
    }

    const controller = new AbortController();
    const external = opts.signal || null;
    let timedOut = false;
    const onExternalAbort = () => controller.abort();
    if (external) {
      if (external.aborted) throw new ApiError(ApiErrorKind.ABORTED, { method, path });
      external.addEventListener('abort', onExternalAbort, { once: true });
    }
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutFor(method, opts));

    let res;
    try {
      res = await fetchImpl(url, {
        method,
        headers,
        body,
        /* Web: HttpOnly session cookies. Native: tokens only, never the jar. */
        credentials: config.authMode === 'cookie' ? 'include' : 'omit',
        signal: controller.signal
      });
    } catch (err) {
      if (timedOut) throw new ApiError(ApiErrorKind.TIMEOUT, { method, path, cause: err });
      if (external && external.aborted) throw new ApiError(ApiErrorKind.ABORTED, { method, path, cause: err });
      throw new ApiError(ApiErrorKind.NETWORK_ERROR, { method, path, cause: err });
    } finally {
      clearTimeout(timer);
      if (external) external.removeEventListener('abort', onExternalAbort);
    }

    return readResponse(res, method, path);
  }

  async function readResponse(res, method, path) {
    const status = res.status;
    let text = '';
    try {
      text = await res.text();
    } catch (err) {
      throw new ApiError(ApiErrorKind.NETWORK_ERROR, { status, method, path, cause: err });
    }

    let data = null;
    let malformed = false;
    if (text) {
      const type = res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-type') || '' : '';
      if (!type || JSON_TYPE.test(type)) {
        try {
          data = JSON.parse(text);
        } catch (_err) {
          malformed = true;
        }
      } else {
        malformed = true;
      }
    }

    if (!res.ok) {
      const body = data && typeof data === 'object' ? data : null;
      throw new ApiError(kindForStatus(status), {
        status,
        method,
        path,
        body,
        code: body?.code || null,
        message: body?.error || undefined,
        retryAfterMs: parseRetryAfter(res.headers?.get?.('retry-after'))
      });
    }

    if (malformed) {
      throw new ApiError(ApiErrorKind.MALFORMED_RESPONSE, { status, method, path });
    }

    /* Atomurus Functions answer { ok: false, error, code } for handled failures. */
    if (data && typeof data === 'object' && data.ok === false) {
      throw new ApiError(ApiErrorKind.CLIENT_ERROR, {
        status,
        method,
        path,
        body: data,
        code: data.code || null,
        message: data.error || undefined
      });
    }

    return data;
  }

  async function request(method, path, opts = {}) {
    const m = String(method || 'GET').toUpperCase();
    const url = apiUrl(config, path) + queryString(opts.query);
    const maxRetries = maxRetriesFor({ method: m, idempotencyKey: opts.idempotencyKey, retry: opts.retry, config: config.retry });
    let attempt = 0;
    let refreshed = false;

    for (;;) {
      try {
        return await once(m, path, opts, url);
      } catch (err) {
        if (err.kind === ApiErrorKind.UNAUTHORIZED) {
          /* Bearer mode: the access token may simply have expired. Refresh once,
             replay once. The server rejected the request before acting on it,
             so the replay cannot duplicate a write. */
          if (!refreshed && opts.auth !== false && auth && typeof auth.refreshAfterUnauthorized === 'function') {
            refreshed = true;
            let ok = false;
            try { ok = await auth.refreshAfterUnauthorized(); } catch (_err) { ok = false; }
            if (ok) continue;
          }
          emit('unauthorized', { method: m, path, status: err.status });
          if (auth && typeof auth.onUnauthorized === 'function') {
            try { auth.onUnauthorized(err); } catch (_e) { /* listener errors are not request errors */ }
          }
          throw err;
        }

        if (err.kind === ApiErrorKind.OFFLINE) emit('offline', { method: m, path });
        else if (err.kind === ApiErrorKind.TIMEOUT) emit('timeout', { method: m, path });
        else if (err.kind === ApiErrorKind.SERVER_ERROR) emit('server_error', { method: m, path, status: err.status });
        else if (err.kind === ApiErrorKind.NETWORK_ERROR) emit('network_error', { method: m, path });

        if (!shouldRetry(err, { method: m, idempotencyKey: opts.idempotencyKey, attempt, maxRetries, maxDelayMs: config.retry.maxDelayMs })) {
          throw err;
        }
        const delay = backoffDelay(attempt, config.retry, random, err.retryAfterMs);
        attempt += 1;
        emit('retry', { method: m, path, attempt, delay, kind: err.kind });
        await sleep(delay);
      }
    }
  }

  return Object.freeze({
    config,
    request,
    get: (path, opts) => request('GET', path, opts),
    post: (path, body, opts) => request('POST', path, { ...(opts || {}), body }),
    put: (path, body, opts) => request('PUT', path, { ...(opts || {}), body }),
    patch: (path, body, opts) => request('PATCH', path, { ...(opts || {}), body }),
    delete: (path, opts) => request('DELETE', path, opts)
  });
}
