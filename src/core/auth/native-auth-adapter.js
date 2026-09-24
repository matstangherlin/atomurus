/*
 * NativeAuthAdapter — Android (and any future native shell).
 *
 * A WebView's cookie jar is not a place to keep an Atomurus session: it is
 * shared with every page the WebView loads, cleared by the OS in ways the app
 * does not control, and cross-origin from https://localhost to atomurus.com.
 * So the native app holds the Supabase session itself:
 *
 *   Supabase session → { accessToken, refreshToken, expiresAt, userId }
 *   stored ONLY in SecureStorage (Keystore-backed plugin, A1.1)
 *   sent as  Authorization: Bearer <accessToken>
 *
 * Refresh is single-flight and rotates the refresh token (Supabase rotates it
 * on every use; keeping the old one would sign the user out on the next
 * refresh). A refresh that fails because the network is down keeps the
 * session; one the server rejects ends it.
 *
 * `transport` implements the token contract (see TOKEN_TRANSPORT_METHODS and
 * createAtomurusTokenTransport). `secureStorage` must pass assertSecureBackend.
 */

import { createAuthEmitter } from './auth-adapter.js';
import { isTerminalRefreshError } from './auth-errors.js';
import { assertSecureBackend } from '../storage/secure-storage.js';
import { SECURE_KEYS } from '../storage/storage-policy.js';

export const TOKEN_TRANSPORT_METHODS = Object.freeze(['passwordGrant', 'refreshGrant', 'revoke', 'me']);

/* Refresh a little before expiry so a request never leaves with a dead token. */
export const EXPIRY_SKEW_MS = 60 * 1000;

export function createNativeAuthAdapter({ transport, secureStorage, now = () => Date.now() }) {
  const missing = TOKEN_TRANSPORT_METHODS.filter((m) => typeof transport?.[m] !== 'function');
  if (missing.length) throw new Error(`Token transport is missing: ${missing.join(', ')}`);
  const store = assertSecureBackend(secureStorage);
  const emitter = createAuthEmitter();

  let session = null; /* { accessToken, refreshToken, expiresAt, user } */
  let loaded = false;
  let refreshFlight = null;

  async function load() {
    if (loaded) return session;
    loaded = true;
    const raw = await store.get(SECURE_KEYS.session);
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && parsed.accessToken && parsed.refreshToken) session = parsed;
      } catch (_err) {
        session = null;
      }
    }
    return session;
  }

  async function persist(next) {
    const prevId = session && session.user && session.user.id;
    session = next;
    if (next) await store.set(SECURE_KEYS.session, JSON.stringify(next));
    else await store.remove(SECURE_KEYS.session);
    const nextId = next && next.user && next.user.id;
    if (prevId !== nextId) emitter.emit({ signedIn: Boolean(next), user: next ? next.user : null });
  }

  function fromGrant(grant, previousUser) {
    if (!grant || !grant.accessToken || !grant.refreshToken) {
      const err = new Error('Token response is missing tokens');
      err.kind = 'MALFORMED_RESPONSE';
      throw err;
    }
    const ttl = Number(grant.expiresIn) > 0 ? Number(grant.expiresIn) : 3600;
    return {
      accessToken: grant.accessToken,
      refreshToken: grant.refreshToken,
      expiresAt: now() + ttl * 1000,
      user: grant.user || previousUser || null
    };
  }

  function refresh() {
    if (refreshFlight) return refreshFlight;
    refreshFlight = (async () => {
      await load();
      if (!session) return { signedIn: false, user: null };
      const base = session;
      try {
        const grant = await transport.refreshGrant(base.refreshToken);
        /* A logout (or another login) while the refresh was in flight wins. */
        if (session !== base) return { signedIn: Boolean(session), user: session ? session.user : null };
        await persist(fromGrant(grant, base.user));
      } catch (err) {
        if (session !== base) return { signedIn: Boolean(session), user: session ? session.user : null };
        if (isTerminalRefreshError(err)) {
          await persist(null);
          return { signedIn: false, user: null, error: err };
        }
        throw err; /* offline / 5xx: keep the session, caller decides */
      }
      return { signedIn: true, user: session.user };
    })().finally(() => { refreshFlight = null; });
    return refreshFlight;
  }

  function expiring() {
    return Boolean(session && session.expiresAt - EXPIRY_SKEW_MS <= now());
  }

  return {
    mode: 'bearer',
    async login({ identifier, password }) {
      const grant = await transport.passwordGrant({ identifier, password });
      await load();
      await persist(fromGrant(grant, null));
      return { signedIn: true, user: session.user };
    },
    async logout() {
      await load();
      const token = session && session.accessToken;
      /* Clear locally first: logout must work offline. */
      await persist(null);
      if (token) {
        try { await transport.revoke(token); } catch (_err) { /* best effort */ }
      }
      return { signedIn: false, user: null };
    },
    async getSession() {
      await load();
      if (session && expiring()) {
        try { await refresh(); } catch (_err) { /* offline: report the cached session */ }
      }
      return { signedIn: Boolean(session), user: session ? session.user : null };
    },
    refresh,
    async getUser() {
      await load();
      if (!session) return null;
      if (!session.user) {
        const user = await transport.me(session.accessToken);
        session = { ...session, user };
        await store.set(SECURE_KEYS.session, JSON.stringify(session));
      }
      return session.user;
    },
    isAuthenticated: () => Boolean(session),
    onChange: (fn) => emitter.on(fn),

    async getAuthorization() {
      await load();
      if (!session) return null;
      if (expiring()) {
        try { await refresh(); } catch (_err) { /* let the server answer 401 */ }
      }
      return session ? `Bearer ${session.accessToken}` : null;
    },
    async refreshAfterUnauthorized() {
      try {
        const result = await refresh();
        return Boolean(result && result.signedIn);
      } catch (_err) {
        return false;
      }
    },
    onUnauthorized() {
      /* After a failed refresh the session is already cleared; nothing else
         to do here. The shell listens to onChange for the signed-out state. */
    }
  };
}

/*
 * HTTP token transport against Atomurus Functions — the exact contract A1.1
 * implements on the backend (see docs/architecture/auth.md):
 *
 *   POST /api/auth/token  { grant_type: 'password', identifier, password }
 *   POST /api/auth/token  { grant_type: 'refresh_token', refresh_token }
 *        → { ok, accessToken, refreshToken, expiresIn, user }
 *   POST /api/auth/logout  Authorization: Bearer …
 *   GET  /api/auth/me      Authorization: Bearer …   (works today: dual auth)
 *
 * `api` is an API client in bearer mode created without an auth adapter.
 */
export function createAtomurusTokenTransport(api) {
  const opts = { kind: 'auth', auth: false };
  return {
    passwordGrant: ({ identifier, password }) =>
      api.post('/api/auth/token', { grant_type: 'password', identifier, password }, opts),
    refreshGrant: (refreshToken) =>
      api.post('/api/auth/token', { grant_type: 'refresh_token', refresh_token: refreshToken }, opts),
    revoke: (accessToken) =>
      api.post('/api/auth/logout', {}, { ...opts, headers: { Authorization: `Bearer ${accessToken}` } }),
    me: async (accessToken) => {
      const data = await api.get('/api/auth/me', { ...opts, headers: { Authorization: `Bearer ${accessToken}` } });
      return data && data.user;
    }
  };
}
