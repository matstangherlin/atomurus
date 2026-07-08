import { getUser, refreshSession } from '@netlify/identity';
import { json, options, publicUser, verifySameOrigin } from '../lib/netlify-identity-utils.mjs';

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

  try {
    await refreshSession();
  } catch (err) {
    console.warn('[auth-refresh] Netlify Identity refresh failed:', err.message);
  }

  const user = await getUser();
  if (!user) {
    return json(401, { ok: false, error: 'Session expired' });
  }

  return json(200, { ok: true, user: publicUser(user) });
}
