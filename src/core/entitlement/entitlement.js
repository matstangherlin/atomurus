/*
 * Atomurus Entitlement.
 *
 * The app asks:     entitlement.isPro()   entitlement.hasFeature('smartReview')
 * The app never asks: "did they pay with Stripe?"
 *
 * Where Pro came from is a *payment source* detail (Stripe on the web, Google
 * Play on Android from A1.5, trial, admin). It matters only for "manage
 * subscription" routing, which is why it is kept apart from access.
 *
 * This is presentation only. Every Pro feature is still enforced on the
 * server (requireFeature → plan-access.mjs). Hiding a button is not security.
 */

export const PaymentSource = Object.freeze({
  NONE: 'none',
  STRIPE: 'stripe',
  GOOGLE_PLAY: 'google_play',
  TRIAL: 'trial',
  ADMIN: 'admin'
});

export function paymentSourceFor(user) {
  if (!user) return PaymentSource.NONE;
  const declared = String(user.billingProvider || '').toLowerCase();
  if (declared === PaymentSource.GOOGLE_PLAY) return PaymentSource.GOOGLE_PLAY;
  if (declared === PaymentSource.STRIPE) return PaymentSource.STRIPE;
  if (user.plan === 'admin' || user.planSource === 'admin') return PaymentSource.ADMIN;
  if (user.planSource === 'trial') return PaymentSource.TRIAL;
  if (user.isPro && user.hasStripeCustomer) return PaymentSource.STRIPE;
  return user.isPro ? PaymentSource.STRIPE : PaymentSource.NONE;
}

/**
 * @param {object|null} user  the publicUser payload from /api/auth/me
 * @param {object} [opts]
 * @param {string} [opts.platform]  'web' | 'android'
 */
export function createEntitlement(user, opts = {}) {
  const features = (user && user.features) || {};
  const source = paymentSourceFor(user);
  const platform = opts.platform || 'web';

  function manageChannel() {
    if (source === PaymentSource.STRIPE) return 'stripe-portal';
    if (source === PaymentSource.GOOGLE_PLAY) return 'google-play';
    return null;
  }

  /* Where "Upgrade" goes. Android must use Play Billing for digital goods
     (A1.5); until then the app shows plans without a web checkout link. */
  function upgradeChannel() {
    return platform === 'web' ? 'stripe-checkout' : 'google-play';
  }

  return Object.freeze({
    signedIn: Boolean(user && user.id),
    isPro: () => Boolean(user && user.isPro),
    hasFeature: (key) => features[key] === true,
    plan: (user && user.plan) || 'free',
    paymentSource: source,
    manageChannel,
    upgradeChannel,
    trialEndsAt: (user && user.trialEndsAt) || null
  });
}
