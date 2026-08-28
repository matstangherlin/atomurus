import { constructWebhookEvent, getStripeClient } from '../lib/billing-stripe.mjs';
import {
  billingAppMetadataPatch,
  stripeUserIdFromMetadata
} from '../lib/billing-lifecycle.mjs';
import { json, options, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { supabaseAdminPatchAppMetadata } from '../lib/supabase-auth.mjs';

async function syncSubscriptionMetadata(subscription, overrides = {}) {
  const userId = stripeUserIdFromMetadata(subscription, overrides);
  if (!userId) return false;
  // billingAppMetadataPatch is last-write-wins on the same keys, so Stripe retries
  // of the same event rewrite the same metadata and do not corrupt entitlement.
  await supabaseAdminPatchAppMetadata(userId, billingAppMetadataPatch(subscription, overrides));
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
    case 'invoice.paid':
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
