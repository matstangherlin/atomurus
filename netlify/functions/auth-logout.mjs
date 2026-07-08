import { logout } from '@netlify/identity';
import { json, options, verifySameOrigin } from '../lib/netlify-identity-utils.mjs';

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
    await logout();
  } catch (err) {
    console.warn('[auth-logout] Netlify Identity logout failed:', err.message);
  }

  return json(200, { ok: true });
}
