import Stripe from 'stripe';
import { PLAN_PRICING } from './plan-access.mjs';

const MS_DAY = 24 * 60 * 60 * 1000;

function appMetaFromUser(user) {
  return user?.appMetadata || user?.app_metadata || {};
}

const PRICE_ENV = {
  pro_monthly_brl: 'STRIPE_PRICE_MONTHLY_BRL',
  pro_annual_brl: 'STRIPE_PRICE_ANNUAL_BRL',
  pro_monthly_usd: 'STRIPE_PRICE_MONTHLY_USD',
  pro_annual_usd: 'STRIPE_PRICE_ANNUAL_USD'
};

const PRICE_DEFAULTS = {
  pro_monthly_brl: 'price_1Tr1FbBtqIZtQQj8L0muniX3',
  pro_annual_brl: 'price_1Tr1FbBtqIZtQQj8o3rBN4ji',
  pro_monthly_usd: 'price_1Tr1FbBtqIZtQQj8rRZAb3cM',
  pro_annual_usd: 'price_1Tr1FbBtqIZtQQj8XccYbVEj'
};

let cachedStripe = null;

export function billingCatalog() {
  return {
    pro_monthly_brl: {
      key: 'pro_monthly_brl',
      currency: 'brl',
      interval: 'monthly',
      amount: PLAN_PRICING.brl.monthly.amount,
      envVar: PRICE_ENV.pro_monthly_brl
    },
    pro_annual_brl: {
      key: 'pro_annual_brl',
      currency: 'brl',
      interval: 'annual',
      amount: PLAN_PRICING.brl.annual.amount,
      envVar: PRICE_ENV.pro_annual_brl
    },
    pro_monthly_usd: {
      key: 'pro_monthly_usd',
      currency: 'usd',
      interval: 'monthly',
      amount: PLAN_PRICING.usd.monthly.amount,
      envVar: PRICE_ENV.pro_monthly_usd
    },
    pro_annual_usd: {
      key: 'pro_annual_usd',
      currency: 'usd',
      interval: 'annual',
      amount: PLAN_PRICING.usd.annual.amount,
      envVar: PRICE_ENV.pro_annual_usd
    }
  };
}

export function billingPlanKey(currency, period) {
  return `pro_${period}_${currency}`;
}

export function getStripeClient() {
  if (cachedStripe) return cachedStripe;
  const secretKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secretKey) {
    const err = new Error('Stripe secret key is not configured');
    err.status = 500;
    err.code = 'stripe_not_configured';
    throw err;
  }
  cachedStripe = new Stripe(secretKey);
  return cachedStripe;
}

export function stripeBaseUrl(request) {
  const configured = String(process.env.AUTH_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export function checkoutTrialDays(user, rawUser = user) {
  const app = appMetaFromUser(rawUser || user);
  if (app.stripe_subscription_id) return 0;

  const status = String(user?.subscriptionStatus || app.subscription_status || '').toLowerCase();
  if (status === 'active' || status === 'past_due' || status === 'canceled' || status === 'unpaid') {
    return 0;
  }

  const trialEndMs = Date.parse(user?.trialEndsAt || app.atomurus_trial_ends_at || '');
  if (Number.isFinite(trialEndMs) && trialEndMs > Date.now()) {
    return Math.max(1, Math.min(
      PLAN_PRICING.trialDays,
      Math.ceil((trialEndMs - Date.now()) / MS_DAY)
    ));
  }

  const createdMs = Date.parse(user?.createdAt || rawUser?.createdAt || rawUser?.created_at || '');
  if (Number.isFinite(createdMs)) {
    const remainingMs = (PLAN_PRICING.trialDays * MS_DAY) - (Date.now() - createdMs);
    if (remainingMs > 0) {
      return Math.max(1, Math.min(
        PLAN_PRICING.trialDays,
        Math.ceil(remainingMs / MS_DAY)
      ));
    }
  }

  return 0;
}

export function stripePriceIdFor(planKey) {
  const envVar = PRICE_ENV[planKey];
  const priceId = String(process.env[envVar] || PRICE_DEFAULTS[planKey] || '').trim();
  if (!envVar || !priceId) {
    const err = new Error(`Stripe price id missing for ${planKey}`);
    err.status = 500;
    err.code = 'stripe_price_missing';
    throw err;
  }
  return priceId;
}

export function stripeCustomerIdFromUser(user) {
  const app = appMetaFromUser(user);
  const id = String(app.stripe_customer_id || '').trim();
  return id || null;
}

export function portalReturnUrl(request) {
  return `${stripeBaseUrl(request)}/account?tab=plan`;
}

export async function createPortalSession({
  request,
  rawUser,
  stripe = null
}) {
  const customer = stripeCustomerIdFromUser(rawUser);
  if (!customer) {
    const err = new Error('No Stripe customer is linked to this account');
    err.status = 409;
    err.code = 'billing_customer_missing';
    throw err;
  }
  const client = stripe || getStripeClient();
  const session = await client.billingPortal.sessions.create({
    customer,
    return_url: portalReturnUrl(request)
  });
  return { url: session.url };
}

export async function createCheckoutSession({
  request,
  planKey,
  user,
  rawUser = user
}) {
  const stripe = getStripeClient();
  const priceId = stripePriceIdFor(planKey);
  const baseUrl = stripeBaseUrl(request);
  const price = billingCatalog()[planKey];
  const trialDays = checkoutTrialDays(user, rawUser);
  const existingCustomer = stripeCustomerIdFromUser(rawUser);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...(existingCustomer
      ? { customer: existingCustomer }
      : { customer_email: user.email || undefined }),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/app?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: user.id || undefined,
    metadata: {
      atomurus_user_id: user.id || '',
      atomurus_user_email: user.email || '',
      atomurus_plan_key: planKey,
      atomurus_currency: price.currency,
      atomurus_interval: price.interval
    },
    subscription_data: {
      trial_period_days: trialDays > 0 ? trialDays : undefined,
      metadata: {
        atomurus_user_id: user.id || '',
        atomurus_user_email: user.email || '',
        atomurus_plan_key: planKey,
        atomurus_currency: price.currency,
        atomurus_interval: price.interval
      }
    }
  });
  return { session, trialDays: trialDays > 0 ? trialDays : null };
}

export function constructWebhookEvent(payload, signature) {
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret) {
    const err = new Error('Stripe webhook secret is not configured');
    err.status = 500;
    err.code = 'stripe_webhook_not_configured';
    throw err;
  }
  return getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret);
}
