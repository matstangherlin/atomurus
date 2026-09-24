/*
 * Auth adapter contract shared by web and native:
 *
 *   login(credentials) logout() getSession() refresh() getUser() isAuthenticated()
 *   onChange(fn)
 *
 * Plus three hooks the API client calls:
 *
 *   getAuthorization()          → 'Bearer …' | null   (web: always null)
 *   refreshAfterUnauthorized()  → Promise<boolean>     (one refresh on a 401)
 *   onUnauthorized(err)         → session really ended
 *
 * The identity behind both adapters is the same Supabase user: `user.id` is the
 * Supabase auth UUID in every case. There is no Android account, no local user
 * table, no shadow id.
 */

export const AUTH_ADAPTER_METHODS = Object.freeze([
  'login', 'logout', 'getSession', 'refresh', 'getUser', 'isAuthenticated', 'onChange',
  'getAuthorization', 'refreshAfterUnauthorized', 'onUnauthorized'
]);

export function assertAuthAdapter(adapter) {
  const missing = AUTH_ADAPTER_METHODS.filter((m) => typeof adapter?.[m] !== 'function');
  if (missing.length) throw new Error(`Auth adapter is missing: ${missing.join(', ')}`);
  return adapter;
}

export function createAuthEmitter() {
  const listeners = new Set();
  return {
    on(fn) {
      if (typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit(snapshot) {
      for (const fn of Array.from(listeners)) {
        try { fn(snapshot); } catch (_err) { /* listener errors stay local */ }
      }
    },
    size: () => listeners.size
  };
}
