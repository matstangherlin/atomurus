import { resolvePricingContext } from '../lib/geo-pricing.mjs';
import { json, jsonWithCookies, options, publicUser } from '../lib/netlify-identity-utils.mjs';
import { requireUser } from '../lib/require-user.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  return jsonWithCookies(200, {
    ok: true,
    user: publicUser(auth.user),
    pricingContext: resolvePricingContext(request)
  }, auth.session.cookieHeaders);
}
