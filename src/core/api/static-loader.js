/*
 * Static content loader — packaged assets (element index, datasets). Relative
 * on both platforms: on the web they come from atomurus.com, in the app from
 * the local bundle. Same timeout rule as the API: nothing waits forever.
 * Pair with CacheStorage for fast reopen and partial offline.
 */

import { ApiError, ApiErrorKind } from './api-errors.js';

export function createStaticLoader({ fetchImpl = (...a) => globalThis.fetch(...a), timeoutMs = 10000 } = {}) {
  return async function loadJson(path, { signal } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const relay = () => controller.abort();
    if (signal) signal.addEventListener('abort', relay, { once: true });
    try {
      const res = await fetchImpl(path, { signal: controller.signal, credentials: 'same-origin' });
      if (!res.ok) throw new ApiError(res.status === 404 ? ApiErrorKind.NOT_FOUND : ApiErrorKind.SERVER_ERROR, { status: res.status, path });
      try {
        return await res.json();
      } catch (err) {
        throw new ApiError(ApiErrorKind.MALFORMED_RESPONSE, { path, cause: err });
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (signal && signal.aborted) throw new ApiError(ApiErrorKind.ABORTED, { path });
      if (controller.signal.aborted) throw new ApiError(ApiErrorKind.TIMEOUT, { path });
      throw new ApiError(ApiErrorKind.NETWORK_ERROR, { path, cause: err });
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', relay);
    }
  };
}
