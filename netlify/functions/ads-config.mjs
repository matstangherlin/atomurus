import { getUser, refreshSession } from '@netlify/identity';
import { json, options, publicUser, PLAN_PRICING } from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  try {
    await refreshSession();
  } catch (_err) {
    // Anonymous visitors remain free.
  }

  const identityUser = await getUser();
  const user = identityUser ? publicUser(identityUser) : null;

  return json(200, {
    ok: true,
    signedIn: Boolean(user),
    adsEnabled: user ? !user.adsFree : true,
    user,
    pricing: PLAN_PRICING
  });
}
