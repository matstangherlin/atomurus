/*
 * Native SecureStorage backend — PREPARATION ONLY (A1.0).
 *
 * Wraps a Keystore-backed Capacitor plugin chosen in A1.1. The plugin is
 * injected, not imported, and must expose promise-based
 *   get({ key }) → { value }   set({ key, value })   remove({ key })
 * The result passes assertSecureBackend: it is never localStorage.
 */

export function createCapacitorSecureStorage(plugin) {
  if (!plugin || typeof plugin.get !== 'function' || typeof plugin.set !== 'function' || typeof plugin.remove !== 'function') {
    throw new Error('createCapacitorSecureStorage needs a secure storage plugin with get/set/remove');
  }
  return {
    kind: 'native-secure',
    async get(key) {
      try {
        const res = await plugin.get({ key });
        return res && res.value != null ? res.value : null;
      } catch (_err) {
        return null; /* missing key throws on some plugins */
      }
    },
    set: (key, value) => plugin.set({ key, value: String(value) }),
    remove: (key) => plugin.remove({ key })
  };
}
