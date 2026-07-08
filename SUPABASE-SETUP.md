# Supabase setup for Atomurus

Atomurus can use **Supabase Auth** for email/password accounts. When `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Netlify, the site automatically switches from Netlify Identity to Supabase.

Set `AUTH_PROVIDER=supabase` to force Supabase, or `AUTH_PROVIDER=netlify-identity` to keep Identity even if Supabase vars exist.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon public key** from **Project Settings → API**.
3. Keep the **service role key** server-only (billing webhooks later). Auth functions use only the anon key.

## 2. Repo + local CLI

The repo now includes `supabase/config.toml` and these scripts:

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
| `AUTH_PROVIDER` | No | `supabase` or `netlify-identity` |
| `AUTH_SITE_URL` | No | Canonical site URL for email redirects (`https://atomurus.com`) |
| `AUTH_ALLOWED_ORIGINS` | No | Comma-separated extra origins for CORS checks |
| `ALLOWED_ORIGIN` | No | Legacy single-origin allowlist |

## 4. Auth settings in Supabase

1. **Authentication → Providers → Email**: enable email signups.
2. **Authentication → URL configuration**:
   - Site URL: `https://atomurus.com`
   - Redirect URLs: `https://atomurus.com/login`, `http://localhost:8888/login`
3. **Authentication → Email templates** (optional): confirmation/recovery links can use `{{ .SiteURL }}/login?token_hash={{ .TokenHash }}&type=signup` (or recovery).

The frontend accepts:

- Netlify Identity: `#confirmation_token`, `#recovery_token`
- Supabase: `?token_hash=...&type=signup|recovery` (query or hash)

## 5. Database schema

Run `supabase/migrations/001_profiles.sql` in the Supabase SQL editor (or via Supabase CLI).

This creates:

- `profiles` — one row per user, auto trial end (+30 days)
- `study_items` — favorites/history (Pro workspace, next step)
- RLS policies so users only read/write their own rows
- Trigger `on_auth_user_created` after signup

## 6. Routes (unchanged API surface)

- `POST /api/auth/signup` — create account (30-day Pro trial from `created_at`)
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/recover`
- `POST /api/auth/reset`
- `POST /api/auth/confirm`
- `GET /api/private/dashboard`

Supabase sessions use HttpOnly cookies:

- Production: `__Host-atm_access`, `__Host-atm_refresh`
- Local dev: `atm_access`, `atm_refresh`

## 7. Plans & billing metadata

Trial and Pro logic live in `netlify/lib/plan-access.mjs`.

To mark a paid subscriber (until Stripe/Mercado Pago webhooks ship), set **app metadata** in Supabase:

```json
{
  "atomurus_plan": "paid",
  "subscription_status": "active"
}
```

Use the service role key only in server-side webhook functions — never in the browser.

## 8. Smoke test

1. Set env vars and deploy (or `netlify dev`).
2. Open `/login` → **Create account**.
3. Confirm email if required; link should land on `/login` and redirect to `/app`.
4. Reload `/app` — session should persist.
5. Test **Forgot password** → set new password → sign in.
6. Open `/pricing` and confirm trial/Pro badges on `/app`.
7. Pro users: ads off via `/api/ads-config`.

## 9. Migration from Netlify Identity

- Existing Identity users do **not** migrate automatically.
- For a clean cutover: enable Supabase vars, deploy, and ask new signups to use Supabase.
- Or keep `AUTH_PROVIDER=netlify-identity` until you export users and import into Supabase.

See also: `NETLIFY-IDENTITY-SETUP.md`, `BILLING.md`.
