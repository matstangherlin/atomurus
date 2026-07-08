import { authRefresh } from '../lib/auth-provider.mjs';
import { json, jsonWithCookies, options, publicUser, verifySameOrigin } from '../lib/netlify-identity-utils.mjs';

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

  const refreshed = await authRefresh(request);
  if (!refreshed?.user) {
    return json(401, { ok: false, error: 'Session expired' });
  }

  return jsonWithCookies(200, { ok: true, user: publicUser(refreshed.user) }, refreshed.cookieHeaders);
}
