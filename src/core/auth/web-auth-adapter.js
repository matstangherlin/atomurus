/*
 * WebAuthAdapter — the browser keeps doing exactly what it does today:
 *
 *   HttpOnly + Secure + SameSite=Lax cookies (__Host-atm_access / __Host-atm_refresh)
 *   set and rotated by /api/auth/* Functions.
 *
 * JavaScript never sees a token. getAuthorization() is always null, so the web
 * never sends Authorization headers, and nothing is written to web storage.
 * The server refreshes the access cookie from the refresh cookie on its own
 * (supabaseSessionFromRequest), so a 401 here means the session is really over.
 *
 * `transport` is an API client created WITHOUT an auth adapter (auth endpoints
 * must not recurse into the adapter).
 */

import { createAuthEmitter } from './auth-adapter.js';
import { ApiErrorKind } from '../api/api-errors.js';

export function createWebAuthAdapter({ transport }) {
  if (!transport) throw new Error('WebAuthAdapter needs a transport (api client in cookie mode)');
  if (transport.config && transport.config.authMode !== 'cookie') {
    throw new Error('WebAuthAdapter requires cookie auth mode');
  }
  const emitter = createAuthEmitter();
  let user = null;
  let known = false;
  let inflight = null;

  function set(next) {
    const changed = !known || (user && user.id) !== (next && next.id);
    user = next || null;
    known = true;
    if (changed) emitter.emit({ signedIn: Boolean(user), user });
  }

  async function getSession({ force = false } = {}) {
    if (!force && known) return { signedIn: Boolean(user), user };
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const data = await transport.get('/api/auth/me', { kind: 'auth', auth: false });
        set(data && data.user);
      } catch (err) {
        if (err.kind === ApiErrorKind.UNAUTHORIZED) set(null);
        else throw err;
      } finally {
        inflight = null;
      }
      return { signedIn: Boolean(user), user };
    })();
    return inflight;
  }

  return {
    mode: 'cookie',
    async login({ identifier, password }) {
      const data = await transport.post('/api/auth/login', { identifier, password }, { kind: 'auth', auth: false });
      set(data && data.user);
      return { signedIn: Boolean(user), user };
    },
    async logout() {
      try {
        await transport.post('/api/auth/logout', {}, { kind: 'auth', auth: false });
      } catch (_err) {
        /* The server clears cookies; locally we are signed out either way. */
      }
      set(null);
      return { signedIn: false, user: null };
    },
    getSession,
    async refresh() {
      const data = await transport.post('/api/auth/refresh', {}, { kind: 'auth', auth: false });
      set(data && data.user);
      return { signedIn: Boolean(user), user };
    },
    async getUser() {
      const s = await getSession();
      return s.user;
    },
    isAuthenticated: () => Boolean(user),
    onChange: (fn) => emitter.on(fn),

    getAuthorization: async () => null,
    refreshAfterUnauthorized: async () => false,
    onUnauthorized() {
      if (user) set(null);
    }
  };
}
