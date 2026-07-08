import { authLogout } from '../lib/auth-provider.mjs';
import { json, jsonWithCookies, options, verifySameOrigin } from '../lib/netlify-identity-utils.mjs';

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

  const cookieHeaders = await authLogout(request);
  return jsonWithCookies(200, { ok: true }, cookieHeaders);
}
