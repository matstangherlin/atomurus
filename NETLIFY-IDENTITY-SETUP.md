# Atomurus authentication (legacy Identity notes)

Atomurus authentication is **Supabase Auth** via Netlify Functions. Netlify is the host; it is not the identity provider.

The previous dual-provider path (`AUTH_PROVIDER=netlify-identity` and `@netlify/identity`) has been removed. Use `SUPABASE-SETUP.md` for current setup.

Sessions are HttpOnly cookies (`atm_access` / `atm_refresh`, with the `__Host-` prefix in production). The browser API is `window.AtomurusAuth` in `auth-client.js`.

If an old Netlify Identity email still lands on `/` with `#confirmation_token` or `#recovery_token`, the home page forwards it to `/login`. New mail should use Supabase `token_hash` links documented in `SUPABASE-SETUP.md`.
