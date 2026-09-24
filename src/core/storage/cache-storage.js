/*
 * CacheStorage — re-downloadable data with a version and a TTL.
 *
 * For: periodic table / element data, static content, settings snapshots,
 * recently used content. Purpose: open fast, spend less network, degrade to
 * partially offline. Not for: Study Sets, progress, reviews, entitlement —
 * those are CLOUD and the server wins (see src/core/sync).
 *
 *   const cache = createCacheStorage({ backend, version: 'elements@2026-09' })
 *   const data  = await cache.getOrFetch('elements:en', () => api.get(...), { ttlMs: DAY })
 *
 * getOrFetch is stale-while-revalidate: a fresh entry returns immediately; a
 * stale one returns immediately *and* refreshes in the background; offline
 * with a stale entry still returns it (marked stale); offline with nothing
 * rethrows the fetch error so the UI can show an offline state.
 */

import { memoryBackend } from './preferences-storage.js';

export const CACHE_PREFIX = 'atomurus-cache:';

export function createCacheStorage({ backend = memoryBackend(), version = '1', now = () => Date.now(), maxEntryBytes = 512 * 1024 } = {}) {
  const inflight = new Map();

  function storageKey(key) {
    return `${CACHE_PREFIX}${key}`;
  }

  async function read(key) {
    const raw = await backend.get(storageKey(key));
    if (!raw) return null;
    try {
      const entry = JSON.parse(raw);
      if (!entry || entry.v !== version) return null;
      return entry;
    } catch (_err) {
      return null;
    }
  }

  async function write(key, value, ttlMs) {
    const text = JSON.stringify({ v: version, at: now(), ttl: ttlMs, value });
    if (text.length > maxEntryBytes) return false; /* big payloads belong in IndexedDB (A1.3) */
    return backend.set(storageKey(key), text);
  }

  function refresh(key, fetcher, ttlMs) {
    if (inflight.has(key)) return inflight.get(key);
    const p = Promise.resolve()
      .then(fetcher)
      .then(async (value) => {
        await write(key, value, ttlMs);
        return value;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  }

  return {
    async get(key) {
      const entry = await read(key);
      if (!entry) return null;
      return { value: entry.value, fresh: now() - entry.at <= entry.ttl, storedAt: entry.at };
    },
    set: (key, value, { ttlMs = 24 * 3600 * 1000 } = {}) => write(key, value, ttlMs),
    remove: (key) => backend.remove(storageKey(key)),

    async getOrFetch(key, fetcher, { ttlMs = 24 * 3600 * 1000 } = {}) {
      const entry = await read(key);
      if (entry && now() - entry.at <= entry.ttl) return { value: entry.value, source: 'cache', stale: false };
      if (entry) {
        refresh(key, fetcher, ttlMs).catch(() => {});
        return { value: entry.value, source: 'cache', stale: true };
      }
      const value = await refresh(key, fetcher, ttlMs);
      return { value, source: 'network', stale: false };
    }
  };
}
