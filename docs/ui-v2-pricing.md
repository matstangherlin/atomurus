# Atomurus UI V2 — pricing, docs, 404

**Scope:** Prompt 05. Public billing and document pages use UI V2 tokens. Auth APIs, Stripe, and plan gates are unchanged.

## Pricing

`pricing.html` no longer loads `assets/app-workspace.css`. Layout lives in [`assets/layouts/pricing.css`](../assets/layouts/pricing.css) plus `assets/ui/index.css`.

Keep:

- `#pricing-*` IDs, currency/period toggles, `#pricing-pro-cta`, `#pricing-matrix`, `#pricing-steps`
- Access ladder **Open Lab → Free account → Pro** and 30-day trial copy
- Benefit lists from `pricing-page.js` / plan-access — do not invent new plans

Create account / Upgrade use **ink** (`.ui-btn-primary`). Science green stays for Calculate / Run on other pages.

## Docs and 404

`about.html`, `contact.html`, `privacy.html`, `terms.html`, and `404.html` load `assets/ui/index.css` and [`assets/layouts/docs.css`](../assets/layouts/docs.css). Contact submit is ink. 404 CTA stays **Back to home**.

HTML fallbacks now match the i18n dictionary for optional accounts. Remaining legal wording (first-party session cookies vs “we do not set first-party cookies”, processors, children’s privacy) is flagged for human legal review — this step only removes copy that contradicted the live product (no accounts / no login).

## What this step does not do

- Home, Explore, tools, `/app`
- Rewriting Pro benefits or prices
- Removing `public-shell.css` / hoist
- Full legal rewrite

## Tests

- `npm run test:ui-v2` / `validate` — pricing must not load workspace CSS; legal HTML must not claim there is no login
- `e2e/public-chrome.spec.js`, `e2e/lab-access.spec.js` pricing ladder, `e2e/solver.spec.js` Pro list
