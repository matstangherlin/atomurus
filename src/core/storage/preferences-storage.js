/*
 * PreferencesStorage — small, device-local UI choices.
 *
 * Async so the same calls work over the web Storage API today and over the
 * native Preferences plugin later. Only registered PREFERENCE keys; a
 * credential-looking key is refused outright.
 */

import { StorageClass, classify, looksLikeCredentialKey } from './storage-policy.js';

/* Storage-like (localStorage) → async backend. Every access guarded: Safari
   private mode, blocked site data and quota errors must not break the page. */
export function webStorageBackend(storage) {
  return {
    async get(key) {
      try { return storage ? storage.getItem(key) : null; } catch (_err) { return null; }
    },
    async set(key, value) {
      try { storage && storage.setItem(key, value); return true; } catch (_err) { return false; }
    },
    async remove(key) {
      try { storage && storage.removeItem(key); } catch (_err) { /* ignore */ }
    }
  };
}

export function memoryBackend() {
  const map = new Map();
  return {
    async get(key) { return map.has(key) ? map.get(key) : null; },
    async set(key, value) { map.set(key, String(value)); return true; },
    async remove(key) { map.delete(key); },
    _map: map
  };
}

function assertPreferenceKey(key) {
  if (looksLikeCredentialKey(key)) {
    throw new Error(`Refusing to store credential-like key "${key}" as a preference; use SecureStorage.`);
  }
  const entry = classify(key);
  if (!entry || (entry.cls !== StorageClass.PREFERENCE && entry.cls !== StorageClass.LOCAL_STATE)) {
    throw new Error(`"${key}" is not a registered preference (see storage-policy.js).`);
  }
}

export function createPreferencesStorage(backend) {
  return {
    async get(key, fallback = null) {
      assertPreferenceKey(key);
      const value = await backend.get(key);
      return value == null ? fallback : value;
    },
    async set(key, value) {
      assertPreferenceKey(key);
      return backend.set(key, String(value));
    },
    async remove(key) {
      assertPreferenceKey(key);
      return backend.remove(key);
    }
  };
}
