import { getUser, refreshSession } from '@netlify/identity';
import { json, options, publicUser } from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  try {
    await refreshSession();
  } catch (_err) {
    // getUser returns null if the session cannot be refreshed.
  }

  const user = await getUser();
  if (!user) {
    return json(401, { ok: false, error: 'Session expired', code: 'session_expired' });
  }

  return json(200, { ok: true, user: publicUser(user) });
}
