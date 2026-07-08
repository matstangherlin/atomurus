import { authSession } from '../lib/auth-provider.mjs';
import { createCheckoutSession } from '../lib/billing-stripe.mjs';
import { resolvePricingContext, normalizeBillingPeriod } from '../lib/geo-pricing.mjs';
import { billingPlanKey } from '../lib/billing-stripe.mjs';
import { json, jsonWithCookies, options, publicUser, readJsonBody, statusFromError, verifySameOrigin } from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  try {
    verifySameOrigin(request);
  } catch (_err) {
    return json(403, { ok: false, error: 'Forbidden' });
  }

  const session = await authSession(request);
  if (!session?.user) {
    return json(401, { ok: false, error: 'Sign in required', code: 'session_required' });
  }

  try {
    const body = await readJsonBody(request, 4096);
    const user = publicUser(session.user);
    const context = resolvePricingContext(request, { currency: body.currency, language: body.language });
    const period = normalizeBillingPeriod(body.period);
    const currency = String(body.currency || context.currency || 'usd').trim().toLowerCase() === 'brl' ? 'brl' : 'usd';
    const planKey = billingPlanKey(currency, period);
    const checkout = await createCheckoutSession({
      request,
      planKey,
      user,
      rawUser: session.user
    });

    return jsonWithCookies(200, {
      ok: true,
      url: checkout.session.url,
      id: checkout.session.id,
      planKey,
      currency,
      period,
      trialDays: checkout.trialDays
    }, session.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (status >= 500) console.error('[billing-checkout] failed:', err);
    return json(status, {
      ok: false,
      error: status >= 500 ? 'Checkout is unavailable right now.' : (err.message || 'Invalid checkout request')
    });
  }
}
