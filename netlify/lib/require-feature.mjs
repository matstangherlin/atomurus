import { accessForUser } from './plan-access.mjs';
import { requireUser } from './require-user.mjs';
import { jsonWithCookies } from './netlify-identity-utils.mjs';

export async function requireFeature(request, featureKey = 'studyCloud') {
  const auth = await requireUser(request);
  if (auth.response) return auth;

  const access = accessForUser(auth.user);
  const allowed = Boolean(access?.features?.[featureKey]);
  if (!allowed) {
    return {
      ...auth,
      access,
      response: jsonWithCookies(
        403,
        {
          ok: false,
          code: 'feature_locked',
          feature: featureKey,
          upgradeUrl: '/pricing',
          error: 'This is an Atomurus Pro feature.'
        },
        auth.session?.cookieHeaders || []
      )
    };
  }

  return { ...auth, access, response: null };
}
