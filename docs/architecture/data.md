# Data: storage, cache, sync, entitlement (A1.0)

## Storage classes (`src/core/storage/`)

| Class | What | Web | Native |
| --- | --- | --- | --- |
| PREFERENCE | theme, language, sizes, reduced motion | `localStorage` | Preferences plugin |
| CACHE | element index, static content, recent items (re-downloadable) | `localStorage` (small) → IndexedDB (A1.3) | same |
| SECURE | access/refresh tokens | **none** — session is an HttpOnly cookie | Keystore-backed plugin only |
| CLOUD | Study items, progress, sets, cards, reviews, calculator history, Pro Lab sessions, profile, entitlement | Supabase via `/api` | Supabase via `/api` |
| UI_SESSION | per-tab UI memory (isomer tab, guest nudge counter) | `sessionStorage` | memory |
| LOCAL_STATE | device-only work without a cloud model yet (Virtual Lab board, compare queue) | `localStorage` | Preferences |
| SIGNAL | cross-tab auth ping (`atomurus-auth-sync`, no token) | `localStorage`/BroadcastChannel | n/a |

`STORAGE_REGISTRY` lists every key found in the codebase at A1.0 (24 exact
keys/prefixes). `tools/test-core-contracts.mjs` scans all product JS/HTML and
fails on an unregistered key or on any credential-looking key in web storage.
`createPreferencesStorage` refuses credential-like and unregistered keys;
`assertSecureBackend` refuses `localStorage`/`sessionStorage` outright.

**Known local-only data** (not synced, by design until a cloud model exists):
the Virtual Lab board (`atomurus-lab-v1`) and the element compare queue. On
Android these stay on the device; moving them to the cloud is a product
decision for a later wave.

## Cache (`cache-storage.js`)

Versioned entries with TTL. `getOrFetch` is stale-while-revalidate: fresh →
cache; stale → cached value now + background refresh; offline with a cached
value → cached (marked stale); offline with nothing → the fetch error, so the
UI shows the offline state. A data version bump invalidates old entries.
The AppShell periodic table uses it (`elements:v1`, 7 days).

## Sync contract (`src/core/sync/sync-contract.js`)

```text
local optimistic state → API → Supabase → reconcile (or roll back)
```

Every synced domain declares its rule — an unknown domain throws:

| Rule | Domains | Meaning |
| --- | --- | --- |
| cloud-wins | study.items, study.progress, study.reviews, study.calculatorHistory, account.profile, account.entitlement | server answer replaces local |
| versioned | study.sets, study.cards, proLab.sessions | write carries the base version; a stale base is a conflict surfaced to the user, never merged silently |
| local-wins | preferences.theme, preferences.lang | this device's choice stands |

A1.0 does **not** implement offline queues; writes fail fast with `OFFLINE`
and roll back. The mutation queue (persisted, idempotency-keyed, replayed on
reconnect) is A1.1, and requires the backend to honour `Idempotency-Key`
before any write may be replayed.

## Entitlement (`src/core/entitlement/entitlement.js`)

The app asks `hasFeature('smartReview')` / `isPro()`. It never asks whether
the user paid with Stripe. `paymentSource` (`stripe | google_play | trial |
admin | none`) only chooses where "Manage subscription" goes, and
`upgradeChannel()` returns `google-play` on Android so the app never routes a
digital purchase to web checkout (Play policy). Server-side enforcement is
unchanged: `requireFeature` → `plan-access.mjs` on every Pro Function.

A1.5 adds Google Play Billing: the backend records
`app_metadata.billing_provider = 'google_play'` plus the Play purchase state,
and `accessForUser` treats an active Play subscription like an active Stripe
one. `publicUser` then exposes `billingProvider`, which the client already reads.
