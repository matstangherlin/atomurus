import { authSession } from '../lib/auth-provider.mjs';
import { resolvePricingContext } from '../lib/geo-pricing.mjs';
import { json, jsonWithCookies, options, publicUser, PLAN_PRICING } from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  // Opportunistic restore only. A miss must not Set-Cookie Max-Age=0:
  // this runs on every public page and would race /app's /me refresh.
  const session = await authSession(request);
  const user = session?.user ? publicUser(session.user) : null;
  const pricingContext = resolvePricingContext(request);

  return jsonWithCookies(
    200,
    {
      ok: true,
      signedIn: Boolean(user),
      adsEnabled: user ? !user.adsFree : true,
      user,
      pricing: PLAN_PRICING,
      pricingContext
    },
    session?.cookieHeaders || []
  );
}
