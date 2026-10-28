import { constructWebhookEvent, getStripeClient } from '../lib/billing-stripe.mjs';
import {
  billingAppMetadataPatch,
  stripeUserIdFromMetadata
} from '../lib/billing-lifecycle.mjs';
import { json, options } from '../lib/netlify-identity-utils.mjs';
import { processedEventsStore } from '../lib/processed-events.mjs';
import { supabaseAdminPatchAppMetadata } from '../lib/supabase-auth.mjs';

// The caller only ever learns that handling failed; the detail goes to the log.
const FAILED = { ok: false, error: 'Webhook handling failed' };

/* The Stripe and Supabase calls come in as dependencies so the handler can be
   tested without either (tools/test-billing-webhook.mjs). */
export function createWebhookHandler({
  constructEvent = constructWebhookEvent,
  stripe = getStripeClient,
  patchAppMetadata = supabaseAdminPatchAppMetadata,
  processedEvents = processedEventsStore,
  log = (...args) => console.error(...args)
} = {}) {
  async function syncSubscriptionMetadata(subscription, overrides = {}) {
    const userId = stripeUserIdFromMetadata(subscription, overrides);
    if (!userId) return false;
    // billingAppMetadataPatch is last-write-wins on the same keys, so Stripe retries
    // of the same event rewrite the same metadata and do not corrupt entitlement.
    await patchAppMetadata(userId, billingAppMetadataPatch(subscription, overrides));
    return true;
  }

  async function subscriptionFromInvoice(invoice) {
    const subscriptionId = typeof invoice?.subscription === 'string'
      ? invoice.subscription
      : invoice?.subscription?.id;
    if (!subscriptionId) return null;
    return stripe().subscriptions.retrieve(subscriptionId);
  }

  // Events that carry a subscription id read its current state from Stripe, so
  // an old retry delivered late does not write an outdated status. The
  // customer.subscription.* events still carry their own snapshot: see
  // docs/billing/webhook.md (out-of-order delivery).
  async function handleStripeEvent(event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (!session.subscription) return;
        const subscription = await stripe().subscriptions.retrieve(String(session.subscription));
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

  return async function handler(request) {
    if (request.method === 'OPTIONS') return options();
    if (request.method !== 'POST') {
      return json(405, { ok: false, error: 'Method not allowed' });
    }

    let event;
    try {
      const signature = request.headers.get('stripe-signature');
      if (!signature) return json(400, FAILED);
      const payload = await request.text();
      event = constructEvent(payload, signature);
    } catch (err) {
      log('[billing-webhook] rejected event:', err);
      return json(400, FAILED);
    }

    const store = typeof processedEvents === 'function' ? processedEvents() : processedEvents;
    let claimed = true;
    try {
      claimed = await store.claim(event.id);
    } catch (err) {
      // Dedupe is an extra layer; without it the handler is still idempotent.
      log('[billing-webhook] dedupe unavailable:', err);
    }
    if (!claimed) return json(200, { ok: true, duplicate: true });

    try {
      await handleStripeEvent(event);
    } catch (err) {
      log('[billing-webhook] failed:', event.type, event.id, err);
      try { await store.release(event.id); } catch (_err) { /* Stripe retries anyway */ }
      return json(500, FAILED);
    }
    try {
      await store.commit(event.id);
    } catch (err) {
      log('[billing-webhook] could not record the event:', err);
    }
    return json(200, { ok: true });
  };
}

export default createWebhookHandler();
