import { constructWebhookEvent, getStripeClient } from '../lib/billing-stripe.mjs';
import { json, options, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { supabaseAdminPatchAppMetadata } from '../lib/supabase-auth.mjs';

function normalizeSubscriptionInterval(value) {
  const interval = String(value || '').trim().toLowerCase();
  return interval === 'year' || interval === 'annual' ? 'annual' : 'monthly';
}

function planFromMetadata(metadata = {}, subscription) {
  const planKey = String(metadata.atomurus_plan_key || '').trim();
  const currency = String(
    metadata.atomurus_currency ||
    subscription?.currency ||
    ''
  ).trim().toLowerCase();
  const interval = normalizeSubscriptionInterval(
    metadata.atomurus_interval ||
    subscription?.items?.data?.[0]?.price?.recurring?.interval
  );
  return {
    planKey: planKey || (currency ? `pro_${interval}_${currency}` : null),
    currency: currency || null,
    interval
  };
}

async function syncSubscriptionMetadata(subscription, overrides = {}) {
  const metadata = {
    ...(subscription?.metadata || {}),
    ...(overrides.metadata || {})
  };
  const userId = String(metadata.atomurus_user_id || '').trim();
  if (!userId) return false;

  const plan = planFromMetadata(metadata, subscription);
  const status = String(overrides.status || subscription?.status || '').trim().toLowerCase();
  const trialEnd = subscription?.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  await supabaseAdminPatchAppMetadata(userId, {
    atomurus_plan: status === 'active' || status === 'trialing' ? 'paid' : 'free',
    subscription_status: status || null,
    subscription_interval: plan.interval,
    subscription_currency: plan.currency,
    atomurus_plan_key: plan.planKey,
    stripe_customer_id: subscription?.customer ? String(subscription.customer) : null,
    stripe_subscription_id: subscription?.id ? String(subscription.id) : null,
    atomurus_trial_ends_at: status === 'trialing' ? trialEnd : null,
    billing_updated_at: new Date().toISOString()
  });
  return true;
}

async function subscriptionFromInvoice(invoice) {
  const subscriptionId = typeof invoice?.subscription === 'string'
    ? invoice.subscription
    : invoice?.subscription?.id;
  if (!subscriptionId) return null;
  return getStripeClient().subscriptions.retrieve(subscriptionId);
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (!session.subscription) return;
      const subscription = await getStripeClient().subscriptions.retrieve(String(session.subscription));
      await syncSubscriptionMetadata(subscription, { metadata: session.metadata || {} });
      return;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await syncSubscriptionMetadata(event.data.object);
      return;
    }
    case 'invoice.payment_failed': {
      const subscription = await subscriptionFromInvoice(event.data.object);
      if (subscription) await syncSubscriptionMetadata(subscription, { status: 'past_due' });
      return;
    }
    case 'invoice.payment_succeeded': {
      const subscription = await subscriptionFromInvoice(event.data.object);
      if (subscription) await syncSubscriptionMetadata(subscription);
      return;
    }
    default:
      return;
  }
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) return json(400, { ok: false, error: 'Missing Stripe signature' });
    const payload = await request.text();
    const event = constructWebhookEvent(payload, signature);
    await handleStripeEvent(event);
    return json(200, { ok: true });
  } catch (err) {
    const status = statusFromError(err, 400);
    console.error('[billing-webhook] failed:', err);
    return json(status, {
      ok: false,
      error: err.message || 'Webhook handling failed'
    });
  }
}
