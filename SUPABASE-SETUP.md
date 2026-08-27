# Atomurus setup for Supabase Auth

Atomurus uses **Supabase Auth** as the only authentication backend. Netlify hosts the site and runs Functions; it does not decide who is signed in.

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Netlify (and in local `.env` for `netlify dev`). The service role key stays server-only.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon public key** from **Project Settings → API**.
3. Keep the **service role key** in Netlify Functions only. Never put it in HTML, `auth-client.js`, or any browser script.

## 2. Repo + local CLI

The repo includes `supabase/config.toml` and these scripts:

- `npm run supabase:start`
- `npm run supabase:stop`
- `npm run supabase:db:push`

They assume you already have the Supabase CLI installed locally.

## 3. Netlify environment variables

In **Site configuration → Environment variables** (and in local `.env` for `netlify dev`):

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for username login and billing metadata | Server-only |
| `AUTH_SITE_URL` | No | Canonical site URL for email redirects (`https://atomurus.com`) |
| `AUTH_PASSWORD_REDIRECT` | No | Password recovery landing URL (`https://atomurus.com/reset-password`) |
| `AUTH_ALLOWED_ORIGINS` | No | Comma-separated extra origins for CORS checks |
| `ALLOWED_ORIGIN` | No | Legacy single-origin allowlist |

## 4. Auth settings in Supabase

1. **Authentication → Providers → Email**: enable email signups.
2. **Authentication → URL configuration**:
   - Site URL: `https://atomurus.com`
   - Redirect URLs (hosted dashboard; `supabase/config.toml` only applies to local CLI):
     - `https://atomurus.com/login`
     - `https://atomurus.com/reset-password`
     - `https://www.atomurus.com/login`
     - `https://www.atomurus.com/reset-password`
     - `http://localhost:8888/login`
     - `http://localhost:8888/reset-password`
     - `https://**--216y56y.netlify.app/login`
     - `https://**--216y56y.netlify.app/reset-password`
   Dashboard: https://supabase.com/dashboard/project/ylofdottauzcqcifnnpm/auth/url-configuration
3. **Authentication → Email templates**: prefer `token_hash` links:
   - Confirm: `{{ .SiteURL }}/login?token_hash={{ .TokenHash }}&type=signup`
   - Recovery: `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery`

The frontend also accepts implicit hash callbacks (`#access_token` + `#refresh_token`) and exchanges them through `POST /api/auth/establish` so tokens become HttpOnly cookies.

## 5. Database schema

Run the SQL in `supabase/migrations/` (or `npm run supabase:db:push`):

- `001_profiles.sql` — profiles + study items + RLS
- `002_profile_identity.sql` — username / full name
- `003_profiles_insert_own.sql` — self-insert policy
- `004_rls_with_check.sql` — update policies with `WITH CHECK`

RLS keeps `user A` from reading or writing `user B` rows even if someone calls PostgREST directly with a user JWT.

## 6. Routes

Public:

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`

Protected (edge cookie gate redirects unsigned visitors to `/login?next=` before `app.html`; stale cookies still fall through to `/api/auth/me`):

- `/app`

API:

- `POST /api/auth/signup`
- `POST /api/auth/login` — email or username
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/recover`
- `POST /api/auth/reset`
- `POST /api/auth/confirm`
- `POST /api/auth/establish`
- `GET /api/private/dashboard`

The browser talks to these Functions through `auth-client.js` (`window.AtomurusAuth`). Pages should call `auth.getCurrentUser()` / `auth.getSession()`, not Supabase or cookies directly.

Sessions use HttpOnly cookies:

- Production: `__Host-atm_access`, `__Host-atm_refresh`
- Local `netlify dev`: `atm_access`, `atm_refresh`

## 7. Plans & billing metadata

Trial and Pro logic live in `netlify/lib/plan-access.mjs`.

Stripe webhook sync writes **app metadata** in Supabase. Use the service role key only in server-side webhook functions.

## 8. Smoke test

1. Set env vars and deploy (or `netlify dev`).
2. Open `/login` → **Create account**.
3. Confirm email if required; the link should land on `/login` and enter `/app`.
4. Reload `/app` — session should persist.
5. Open `/app` in a new tab — still signed in.
6. Test **Forgot password** → `/reset-password` → new password → workspace.
7. Logout, then click Back — `/app` must not show the private workspace.
8. Open `/pricing` and confirm trial/Pro badges on `/app`.

Automated coverage: `npm run test:auth`.

## 9. Migration from Netlify Identity

Netlify Identity is no longer a supported auth backend in this repo. Existing Identity users do not migrate automatically; they need a Supabase account.

See also: `BILLING.md`.
