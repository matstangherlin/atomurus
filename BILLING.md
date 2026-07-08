# Atomurus billing & Pro entitlements

## Pricing (product)

- Free: `R$0` / `US$0`
- Pro monthly: `R$24,90/mês` or `US$10/mês`
- Pro annual: `R$180/ano` (~`R$15/mês`) or `US$60/ano` (~`US$5/mês`)
- Trial: 30 days of Pro for new accounts, preserved through checkout when applicable

Public SEO surfaces stay free: periodic table, element pages, Explore articles, core calculators and simple simulations.

## Free month (trial)

Every new account gets **30 days of Pro automatically** through `plan-access.mjs` — no card required.

When the user later opens Stripe Checkout:

- remaining trial days are passed to Stripe as `trial_period_days`
- users who already had a Stripe subscription do not get another free month
- checkout returns `trialDays` in the API response when a deferred billing period applies

Pro sells convenience and continuity:

- ad-free workspace
- favorites / history / saved study flow
- PDF and richer exports
- guided tracks, exercises, flashcards and AI tutor rollout

## How entitlements work today

Server source of truth: `netlify/lib/plan-access.mjs` → `accessForUser()` / `publicUser()`.

A user is Pro (`plan = paid` or `admin`) when any of these is true:

1. Netlify Identity role `admin`, or
2. Role `paid`, or `app_metadata.atomurus_plan = "paid"`, or `app_metadata.plan = "paid"`, or
3. Active billing metadata `subscription_status` in `active` / `trialing`, or
4. **Automatic trial:** account age &lt; 30 days from `createdAt` / `confirmedAt`

Features exposed to the client:

- `adsFree`
- `premiumLessons`
- `favorites` / `studyProgress` / `exportPdf`
- `adminConsole` (admin only)

## Endpoints

- `GET /api/ads-config` — anonymous-safe; returns `{ adsEnabled, signedIn, user }`
- `GET /api/private/dashboard` — authenticated Pro-aware modules
- `GET /api/auth/me` — includes `isPro`, `trialEndsAt`, `features`
- `POST /api/billing/checkout` — authenticated only; creates Stripe Checkout Session for `pro_monthly_brl`, `pro_annual_brl`, `pro_monthly_usd`, `pro_annual_usd`
- `POST /api/billing/webhook` — Stripe webhook; syncs subscription metadata back into Supabase Auth app metadata

`/api/ads-config`, `/api/auth/me` and `/api/private/dashboard` now also expose `pricingContext` with server-resolved currency (`brl`/`usd`) and detection source (`geo` / `language` / `default`).

## Metadata shape

Supabase Auth `app_metadata` is the billing source of truth:

```json
{
  "atomurus_plan": "paid",
  "subscription_status": "active",
  "subscription_interval": "annual",
  "subscription_currency": "usd",
  "atomurus_plan_key": "pro_annual_usd",
  "stripe_customer_id": "cus_123",
  "stripe_subscription_id": "sub_123"
}
```

If a subscription is canceled or becomes inactive, webhook sync writes the billing status back and `plan-access.mjs` falls through to `free` unless a local trial is still valid.

## Ads gate

`ads-gate.js` calls `/api/ads-config`. If Pro/trial/admin:

- AdSense / AdCash are not run
- HTML gets class `ads-free`

Failures default to **ads on** so a broken function does not erase revenue.

## Geo pricing

Server-side currency resolution lives in `netlify/lib/geo-pricing.mjs`:

1. `BR` country header from Netlify => `brl`
2. otherwise Portuguese language fallback => `brl`
3. everything else => `usd`

The UI may still let the user toggle currency before checkout, but defaults come from the server so the first rendered price is predictable.

Pages:

- `/pricing` — Free vs Pro
- `/login` — start trial path (signup)
- `/app` — private workspace shell

## Required env vars

Do not commit secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY_BRL`
- `STRIPE_PRICE_ANNUAL_BRL`
- `STRIPE_PRICE_MONTHLY_USD`
- `STRIPE_PRICE_ANNUAL_USD`

## Stripe setup notes

Create four recurring Stripe prices and map them exactly:

- `pro_monthly_brl`
- `pro_annual_brl`
- `pro_monthly_usd`
- `pro_annual_usd`

Current mapped Stripe Price IDs in code fallback:

- `pro_monthly_brl` => `price_1Tr1FbBtqIZtQQj8L0muniX3`
- `pro_annual_brl` => `price_1Tr1FbBtqIZtQQj8o3rBN4ji`
- `pro_monthly_usd` => `price_1Tr1FbBtqIZtQQj8rRZAb3cM`
- `pro_annual_usd` => `price_1Tr1FbBtqIZtQQj8XccYbVEj`

You can still override any of them in Netlify with:

- `STRIPE_PRICE_MONTHLY_BRL`
- `STRIPE_PRICE_ANNUAL_BRL`
- `STRIPE_PRICE_MONTHLY_USD`
- `STRIPE_PRICE_ANNUAL_USD`
