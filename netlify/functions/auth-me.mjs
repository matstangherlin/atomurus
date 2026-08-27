import { authSession } from '../lib/auth-provider.mjs';
import { resolvePricingContext } from '../lib/geo-pricing.mjs';
import { json, jsonWithCookies, options, publicUser } from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const session = await authSession(request);
  if (!session?.user) {
    return jsonWithCookies(
      401,
      { ok: false, error: 'Session expired', code: 'session_expired' },
      session?.cookieHeaders || []
    );
  }

  return jsonWithCookies(200, {
    ok: true,
    user: publicUser(session.user),
    pricingContext: resolvePricingContext(request)
  }, session.cookieHeaders);
}
