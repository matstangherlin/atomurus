# Atomurus UI V2 — auth (login)

**Scope:** Prompt 04. `login.html` (pretty URLs `/login`, `/signup`, `/forgot-password`, `/reset-password`) uses UI V2 tokens, forms, buttons, and cards. Auth APIs, cookies, and routing are unchanged.

## Layout source

```text
assets/ui/index.css          tokens + primitives (login only among production pages)
assets/layouts/auth.css     grid, panel show/hide, password wrap, pw reqs
```

The ~261-line inline `<style>` is gone. The FOUC theme/lang `<style>` in `<head>` stays for theme icons. Prompt 14 removed `lang-pt-pending` hiding.

Home and `/app` still do **not** load `assets/ui/index.css`.

## DOM contract (do not break)

Keep these IDs, names, and hooks:

- `html.auth-checking`, `#auth-session-boot` / `.auth-session-boot`
- Panels `#auth-panel-login` `#auth-panel-signup` `#auth-panel-recover` `#auth-password-panel`
- `data-auth-panel="login|signup|recover|reset"` and `data-auth-route="login|signup|recover"`
- Forms `#auth-login-form` `#auth-signup-form` `#auth-reset-form` `#auth-password-form`
- Submit `#auth-login-submit` `#auth-signup-submit` `#auth-reset-submit` `#auth-password-submit`
- Inputs `#auth-email` (`name="identifier"`), `#auth-password`, signup name/username/email/password/confirm, `#auth-reset-email`, `#auth-new-password`
- Feedback `#auth-login-ok` `#auth-login-err` `#auth-signup-ok` `#auth-signup-err` `#auth-reset-ok` `#auth-reset-err` `#auth-password-err`
- `[data-password-toggle]` `[data-pw-for]` `[data-req="length|special"]`
- Scripts `auth-sync.js`, `auth-client.js`, `auth-login.js`

Login topnav CTA stays **Open lab** → `periodic-table.html`. `#auth-email` stays visible after boot; computed border-radius ≥ 10px.

Dual classes keep the old hooks and the official primitives: `.lc-form` + `.ui-field` / `.ui-input` / `.ui-btn.ui-btn-primary`.

## Product language

Primary copy is a chemistry workspace, not a developer console. Removed from the login experience: `auth.access`, `secure HttpOnly cookie`, `managed authentication`, `provider`, `secure account flow`.

Sign in / Create account / Save password use **ink** (`.ui-btn-primary`). Science green stays for Calculate / Run on other pages.

Signup still mentions the **30-day Pro trial** as secondary (`common.auth.signupCopy` / rail trial card).

## Cascade

`public-shell.css` still paints leftover `.lc-form button[type=submit]` green with `!important`. Migrated auth buttons add `.ui-btn-primary`; the shell skips those (`:not(.ui-btn-primary)`). Prompt 13 removes the war.

`auth.css` uses `!important` only to:
- hide panels while `html.auth-checking` is on
- reset `.ui-label` letter-spacing against public-shell (until Prompt 13)

## Tests

- `npm run test:ui-v2` / `validate` — `assets/layouts/auth.css` exists; login loads UI V2 + auth layout; no `.auth-shell` in a page `<style>`; Open lab stays
- `e2e/auth.spec.js` — login / signup / recover / guest `/app`
- `e2e/public-chrome.spec.js` — Open lab, `#auth-email` radius, ink Sign in, no console copy
