# Atomurus billing & Pro entitlements

## Pricing (product)

| Plan | Brazil | International |
|------|--------|---------------|
| Free | R$0 | US$0 |
| Pro monthly | **R$24,90/mês** | **US$10/mês** |
| Pro annual | **R$180/ano** (~R$15/mês) | **US$60/ano** (~US$5/mês) |
| Trial | 30 days of Pro on every new account | same |

Public SEO surfaces (periodic table, element pages, Explore articles) stay free.
Pro sells: **ad-free lab, private dashboard, favorites/history/export flags**, plus roadmap tracks / AI tutor.

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

## Manual paid (until Stripe/Mercado Pago webhooks)

Netlify → Identity → user → App metadata:

```json
{
  "atomurus_plan": "paid",
  "subscription_status": "active"
}
```

Or add the Identity role `paid`.

## Ads gate

`ads-gate.js` calls `/api/ads-config`. If Pro/trial/admin:

- AdSense / AdCash are not run
- HTML gets class `ads-free`

Failures default to **ads on** so a broken function does not erase revenue.

## Still TODO (checkout)

1. Stripe Checkout Session for USD annual/monthly
2. Mercado Pago preference for BRL Pix/card
3. Webhook functions that set Identity `app_metadata` via Admin API
4. Cancel / customer portal
5. Legal copy updates (privacy/terms still describe an older no-account model)

Pages:

- `/pricing` — Free vs Pro
- `/login` — start trial path (signup)
- `/app` — private workspace shell

## Env vars (future checkout)

Document placeholders; do not commit secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY_USD` / `STRIPE_PRICE_ANNUAL_USD`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `IDENTITY_ADMIN` credentials as required by Netlify Admin APIs to write metadata
