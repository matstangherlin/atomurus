# Netlify Identity setup for Atomurus

Atomurus now uses Netlify Identity for email/password accounts. Do not create a custom database table for passwords and do not store raw passwords anywhere in the project.

## What Netlify stores

- Netlify Identity stores the user account, email, password hash, confirmation state, roles, and auth session data.
- The site talks to Identity through Netlify Functions in `netlify/functions/*.mjs`.
- The browser receives Netlify-managed `nf_jwt` and `nf_refresh` cookies. Login tokens are not saved by Atomurus code.
- If a Netlify email callback lands on `/` with `#confirmation_token` or `#recovery_token`, the home page forwards it to `/login` with the hash preserved.

## Manual setup in Netlify

1. Open the Netlify project dashboard.
2. Go to `Project configuration > Identity`.
3. Select `Enable Identity`.
4. Go to `Identity > Registration > Registration preferences`.
5. Choose `Open` if visitors can create accounts from `/login`.
6. Choose `Invite only` if you want to disable public signup later.
7. Go to `Identity > Emails`.
8. Keep confirmation email enabled for safer accounts, or enable autoconfirm only if you intentionally want accounts active immediately.

## Routes implemented

- `POST /api/auth/signup` creates an account with email and password.
- `POST /api/auth/login` signs in with email and password.
- `GET /api/auth/me` returns the current user.
- `POST /api/auth/refresh` refreshes the Netlify Identity session.
- `POST /api/auth/logout` signs out.
- `POST /api/auth/recover` requests a password recovery email.
- `POST /api/auth/reset` finishes password recovery with a new password.
- `POST /api/auth/confirm` confirms a signup email token.
- `GET /api/private/dashboard` returns gated account data after the server verifies the session.

## When a separate database is needed

You do not need a database for login credentials. Use one only for application data, such as study progress, saved notes, payments, or custom profiles. Good options are:

- Netlify Database/Postgres for relational app data.
- Netlify Blobs for simple key/value or file-like data.
- Another managed database if the paid area needs advanced querying or billing records.

## Smoke test

1. Deploy or run with `netlify dev`.
2. Open `/login`.
3. Create an account using only email and password.
4. If confirmation email is enabled, confirm the email. The `/login#confirmation_token=...` callback should send you to `/app`.
5. Sign in and confirm the page redirects to `/app`.
6. Reload `/app` and confirm the account remains signed in.
7. Test forgot password. The `/login#recovery_token=...` callback should show the new-password form.
8. Click logout and confirm `/app` redirects back to `/login`.
