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
    // getUser returns null if refresh is not possible.
  }

  const identityUser = await getUser();
  if (!identityUser) {
    return json(401, { ok: false, error: 'Session expired', code: 'session_expired' });
  }

  const user = publicUser(identityUser);
  const features = {
    labWorkspace: true,
    premiumLessons: user.plan === 'paid' || user.plan === 'admin',
    adminConsole: user.role === 'admin'
  };

  return json(200, {
    ok: true,
    user,
    access: {
      role: user.role,
      plan: user.plan,
      features
    },
    dashboard: {
      title: 'Atomurus private workspace',
      status: user.plan,
      modules: [
        {
          id: 'study-workspace',
          label: 'Study workspace',
          state: 'available'
        },
        {
          id: 'premium-lessons',
          label: 'Premium lessons',
          state: features.premiumLessons ? 'available' : 'locked'
        },
        {
          id: 'admin-console',
          label: 'Admin console',
          state: features.adminConsole ? 'available' : 'hidden'
        }
      ]
    }
  });
}
