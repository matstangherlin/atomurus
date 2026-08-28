import { createPortalSession } from '../lib/billing-stripe.mjs';
import { json, jsonWithCookies, options, readJsonBody, statusFromError, verifySameOrigin } from '../lib/netlify-identity-utils.mjs';
import { requireUser } from '../lib/require-user.mjs';

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

  const auth = await requireUser(request, 'Sign in required');
  if (auth.response) return auth.response;
  const session = auth.session;

  try {
    // Body is ignored for authority. Customer id comes from the signed-in user.
    await readJsonBody(request, 4096).catch(() => ({}));
    const portal = await createPortalSession({
      request,
      rawUser: session.user
    });
    return jsonWithCookies(200, {
      ok: true,
      url: portal.url
    }, session.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    if (status >= 500) console.error('[billing-portal] failed:', err);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Billing portal is unavailable right now.' : (err.message || 'Could not open billing portal'),
      code: err.code || null
    }, session.cookieHeaders || []);
  }
}
