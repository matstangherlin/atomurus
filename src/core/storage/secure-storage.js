/*
 * SecureStorage — credentials only (native access/refresh tokens).
 *
 * Contract: { get(key), set(key, value), remove(key) } → Promises.
 *
 * Backends:
 *   - memorySecureStorage(): tests, and the web (the web never holds tokens in
 *     JS at all — its session is an HttpOnly cookie — so there is nothing to
 *     persist there).
 *   - native: src/adapters/capacitor/secure-storage-adapter.js wraps a
 *     Keystore-backed plugin chosen in A1.1.
 *
 * `assertSecureBackend` refuses window storage outright, so a token can never
 * be routed into localStorage/sessionStorage "just for now".
 */

export function isWebStorage(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const g = globalThis;
  if ((g.localStorage && candidate === g.localStorage) || (g.sessionStorage && candidate === g.sessionStorage)) return true;
  if (typeof g.Storage === 'function' && candidate instanceof g.Storage) return true;
  /* Duck type: the Web Storage API surface. */
  return typeof candidate.getItem === 'function' &&
    typeof candidate.setItem === 'function' &&
    typeof candidate.key === 'function' &&
    'length' in candidate;
}

export function assertSecureBackend(backend) {
  if (!backend) throw new Error('SecureStorage needs a backend');
  if (isWebStorage(backend) || isWebStorage(backend.storage) || backend.persistsToWebStorage) {
    throw new Error('SecureStorage must not be backed by localStorage/sessionStorage.');
  }
  for (const name of ['get', 'set', 'remove']) {
    if (typeof backend[name] !== 'function') throw new Error(`SecureStorage backend lacks ${name}()`);
  }
  return backend;
}

export function memorySecureStorage() {
  const map = new Map();
  return {
    kind: 'memory',
    async get(key) { return map.has(key) ? map.get(key) : null; },
    async set(key, value) { map.set(key, value); },
    async remove(key) { map.delete(key); },
    size: () => map.size
  };
}

export function createSecureStorage(backend) {
  const b = assertSecureBackend(backend);
  return {
    kind: b.kind || 'custom',
    async getJson(key) {
      const raw = await b.get(key);
      if (raw == null) return null;
      try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (_err) { return null; }
    },
    async setJson(key, value) { await b.set(key, JSON.stringify(value)); },
    async remove(key) { await b.remove(key); }
  };
}
