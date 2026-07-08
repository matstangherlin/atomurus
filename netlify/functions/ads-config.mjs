import { authSession } from '../lib/auth-provider.mjs';
import { json, jsonWithCookies, options, publicUser, PLAN_PRICING } from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const session = await authSession(request);
  const user = session?.user ? publicUser(session.user) : null;

  return jsonWithCookies(
    200,
    {
      ok: true,
      signedIn: Boolean(user),
      adsEnabled: user ? !user.adsFree : true,
      user,
      pricing: PLAN_PRICING
    },
    session?.cookieHeaders || []
  );
}
