# Auth architecture (A1.0)

Supabase Auth is the identity source of truth. There is no local user table,
no Android account id, no shadow account.

## One interface, two adapters

`src/core/auth/auth-adapter.js`:

```text
login() logout() getSession() refresh() getUser() isAuthenticated() onChange()
+ API-client hooks: getAuthorization() refreshAfterUnauthorized() onUnauthorized()
```

| | WebAuthAdapter | NativeAuthAdapter |
| --- | --- | --- |
| Session carrier | `__Host-atm_access` / `__Host-atm_refresh` cookies, HttpOnly + Secure + SameSite=Lax | Supabase access + refresh token |
| Where it lives | browser cookie jar (JS never sees it) | SecureStorage (Keystore-backed plugin, A1.1) |
| Sent as | cookie, `credentials: 'include'` | `Authorization: Bearer …`, `credentials: 'omit'` |
| Refresh | server-side, from the refresh cookie, on any `/api` call | client-side, single-flight, **rotated refresh token persisted** |
| 401 | final (server already tried the refresh cookie) | one refresh + one replay, then signed out |
| Offline refresh failure | n/a | session kept, retried later |
| Logout | `/api/auth/logout` clears cookies | local wipe first (works offline), then best-effort revoke |

The web adapter refuses bearer mode, so the browser can never be downgraded
to tokens-in-JS to "match Android". Legacy pages keep `auth-client.js`
(`window.AtomurusAuth`) — same endpoints, same cookies.

## Backend: dual auth, one guard (done in A1.0)

`netlify/lib/supabase-auth.mjs → supabaseSessionFromRequest`:

```text
Authorization header present?
  yes → bearer path: supabaseGetUser(token); no cookie read, no refresh,
        no Set-Cookie; malformed/invalid → user null → 401
  no  → cookie path (unchanged): access cookie, else refresh cookie → rotate
both → { user (same Supabase user.id), accessToken, authMode }
```

`requireUser()` and `requireFeature()` are unchanged callers of that
resolver — there is no `requireAndroidUser()`. The user-scoped Supabase
client (`createUserDataClient(session.accessToken)`) receives the bearer token,
so RLS applies identically. `authLogout` revokes a bearer token and returns
no cookie headers. Covered by `tools/test-auth-bearer.mjs`.

## A1.1 — exact remaining plan

1. **`POST /api/auth/token`** (new Function, same rate limiter as login):
   - `{ grant_type: 'password', identifier, password }` → reuse `resolveLoginEmail` + GoTrue password grant
   - `{ grant_type: 'refresh_token', refresh_token }` → reuse `supabaseRefresh` single-flight
   - response `{ ok, accessToken, refreshToken, expiresIn, user: publicUser(user) }`, **no Set-Cookie**
   - client contract already implemented: `createAtomurusTokenTransport` (`src/core/auth/native-auth-adapter.js`)
2. **Transport from the WebView**: enable CapacitorHttp (native HTTP, no CORS
   preflight). If WebView fetch is kept instead, add CORS for the app origin
   (`https://localhost`) on `/api/*` with `Authorization` allowed and
   credentials **disabled**.
3. **Origin checks**: functions that call `verifySameOrigin` (login, logout,
   signup, billing…) must skip it for bearer requests — CSRF does not apply
   to a header the browser never attaches automatically, and bearer requests
   ignore cookies. Add this together with (2), with tests.
4. **Secure storage plugin**: choose a Keystore-backed plugin, expose it as
   `Capacitor.Plugins.AtomurusSecureStorage` (`get/set/remove`); `app-main.js`
   already refuses to start without it.
5. **Signup / password reset / email confirmation** on native: deep link
   `atomurus://auth/callback` → `/api/auth/establish` equivalent returning
   tokens (not cookies).

## Error mapping

`src/core/auth/auth-errors.js` maps API errors to
`INVALID_CREDENTIALS · EMAIL_NOT_CONFIRMED · SESSION_EXPIRED · REFRESH_EXPIRED ·
TOKEN_INVALID · RATE_LIMITED · OFFLINE · TIMEOUT · SERVER_UNAVAILABLE · UNKNOWN`.
The login screen and the shell banner branch on these, never on messages.

## Test matrix

| Case | Where |
| --- | --- |
| Web login / refresh / logout, cookies only, nothing in storage | `test-auth-adapters.mjs`, `e2e/auth.spec.js`, `e2e/a1-lifecycle.spec.js` (auth stress ×5) |
| Native mock login, Bearer sent, session in SecureStorage only | `test-auth-adapters.mjs` |
| Refresh rotation, single-flight, pre-expiry refresh | `test-auth-adapters.mjs` |
| Expired/invalid refresh → signed out + storage cleared | `test-auth-adapters.mjs` |
| Invalid bearer → 401, never falls back to cookies | `test-auth-bearer.mjs` |
| Offline / API 500 during refresh → session kept | `test-auth-adapters.mjs` |
| Same Supabase `user.id` for cookie and bearer | `test-auth-bearer.mjs` |
| Web cookie flags unchanged | `test-auth-bearer.mjs`, `test-auth-provider.mjs` |
