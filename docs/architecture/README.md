# Atomurus architecture (A1.0 — shared Web + Android foundation)

One Atomurus account, one cloud, one core, two clients:

```text
                    ATOMURUS CLOUD
             Supabase (identity + data) · Netlify Functions (/api)
                            │
                  src/core  (shared application core)
                            │
             ┌──────────────┴──────────────┐
      Atomurus Web                   Atomurus Android (A1.4)
  atomurus.com (multipage, SEO)      Capacitor 8 shell over dist/app
  + AppShell (/dev/app-shell today)  same AppShell, native adapters
```

There is no Android database, no Android account and no Android-only Study
or Pro Lab. Both clients call the same Functions, which resolve the same
Supabase `user.id` whether the request carries the web cookie or a bearer
token (`netlify/lib/supabase-auth.mjs → supabaseSessionFromRequest`).

## Before A1.0

```text
app.html: 17 classic <script> files exposing window globals (AtomurusAuth, AtomurusStudy, …)
  └─ each client with its own fetch() wrapper (Study: no timeout)
CSS: critical-lab → lab-console (199 KB) → workspace-foundation →
     app-workspace (78 KB) → ui/index → layouts/workspace, 1 264 !important
3D:  page-level runtimes, Three.js r128 from cdnjs, no teardown (page nav reclaims)
Build: repo root published as-is by Netlify; no module bundler
```

## After A1.0

```text
src/
  core/        platform-free: no Capacitor, no DOM framework
    api/         api-client, errors, retry policy, static loader
    auth/        auth-adapter contract, web (cookie) + native (bearer) adapters, error map
    config/      runtime config: the one place that knows the API origin
    entitlement/ hasFeature()/isPro(), payment source (Stripe | Google Play)
    lifecycle/   disposable scopes, app lifecycle (pause/resume/network/route)
    network/     online | offline | slow | server_error | auth_expired
    perf/        dev marks/measures, long-task observer
    platform/    Platform service + WebAdapter, safe-area reader
    routing/     logical routes, ≤5 primary destinations, deep-link resolver
    storage/     preference / cache / secure / cloud classes + key registry
    sync/        conflict policy per domain, optimistic mutation
  adapters/
    capacitor/   the ONLY Capacitor-aware code (plugins injected, not installed)
  features/    study, pro-lab, periodic-table, molecules, viewer, home, explore,
               lab, account, legacy-link — each a lazy module
  ui/          Design System V2 source: tokens/, components/, layouts/, utilities/
  app/
    bootstrap/ composition roots: web-main (web), app-main (packaged), legacy-bridge
    router/    feature registry, hash router
    shell/     AppShell, feature host (error boundary), strings
```

Generated from `src/` (committed, drift-checked in CI):

| Output | Built by | Consumed by |
| --- | --- | --- |
| `assets/ui/*.css` | `tools/build-ui.mjs` | every page that loads UI V2 |
| `assets/core/atomurus-core.js` | `tools/build-core-bundle.mjs` | legacy pages (app.html, study-boot, Pro Lab) |
| `assets/app/elements.json` | `tools/build-app-data.mjs` | AppShell periodic table |
| `dist/app/` (gitignored) | `tools/build-app-bundle.mjs` | future Capacitor `webDir` |

## Rules (enforced by `npm run test:architecture-boundaries`)

1. `src/core` never mentions Capacitor/Android and never imports an adapter.
2. Only the composition roots (`src/app/bootstrap/services.js`, `app-main.js`) pick an adapter.
3. No `fetch(` outside `src/core/api/`; migrated legacy clients do not fetch either.
4. The production origin appears only in `src/core/config/runtime-config.js`.
5. The API client always has a timeout; retries are hard-capped (≤4) and writes are never replayed without an idempotency key.
6. No credential ever goes to web storage; the native auth adapter uses SecureStorage only.
7. Bottom navigation ≤ 5 destinations.
8. `src/ui` has no `!important` (except the four pre-existing guards in `base.css`) and no `--lc-/--ws-/--ps-` dependency (except `compat.css`).
9. Generated assets match their sources.

## Legacy coexistence

Public pages stay multipage and SEO-first. Legacy scripts keep working; the
two API clients with the most traffic (`study-client.js`, `pro-lab-client.js`)
are now thin shims over the core, loaded through the classic bridge. Everything
else is listed under *Remaining legacy* in
[`docs/reports/a1-0-architecture-mobile-readiness.md`](../reports/a1-0-architecture-mobile-readiness.md).

## Documents

- [auth.md](auth.md) — web cookie vs native bearer, backend dual auth, A1.1 token endpoint contract
- [data.md](data.md) — storage classes, cache, sync and conflict policy, entitlement
- [ui-and-mobile.md](ui-and-mobile.md) — Design System V2, override removal strategy, mobile layouts, safe areas, keyboard
- [performance.md](performance.md) — budgets, lazy loading, viewer lifecycle, memory/navigation/auth QA procedures
- [capacitor-preparation.md](capacitor-preparation.md) — A1.4 starting point (nothing installed)
