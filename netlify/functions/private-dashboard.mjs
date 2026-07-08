import { authSession } from '../lib/auth-provider.mjs';
import { json, jsonWithCookies, options, publicUser, PLAN_PRICING } from '../lib/netlify-identity-utils.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const session = await authSession(request);
  if (!session?.user) {
    return json(401, { ok: false, error: 'Session expired', code: 'session_expired' });
  }

  const user = publicUser(session.user);
  const features = user.features || {};

  const modules = [
    {
      id: 'study-workspace',
      label: 'Study workspace',
      description: 'Open the free lab: periodic table, models and calculators.',
      href: '/periodic-table',
      state: 'available'
    },
    {
      id: 'favorites',
      label: 'Favorites & history',
      description: 'Save elements, molecules and calculator runs (Pro).',
      href: user.isPro ? '/app#progress' : '/pricing',
      state: features.favorites ? 'available' : 'locked'
    },
    {
      id: 'premium-lessons',
      label: 'Premium study tracks',
      description: 'Guided chemistry paths for high school, ENEM and general chemistry.',
      href: user.isPro ? '/app#tracks' : '/pricing',
      state: features.premiumLessons ? 'coming' : 'locked'
    },
    {
      id: 'ads-free',
      label: 'Ad-free lab',
      description: 'Remove AdSense and AdCash while your Pro plan or trial is active.',
      href: '/pricing',
      state: features.adsFree ? 'available' : 'locked'
    },
    {
      id: 'export-pdf',
      label: 'PDF export',
      description: 'Export study sheets and table views without watermarks (Pro).',
      href: user.isPro ? '/periodic-table' : '/pricing',
      state: features.exportPdf ? 'available' : 'locked'
    },
    {
      id: 'admin-console',
      label: 'Admin console',
      description: 'Internal operators only.',
      href: '/app',
      state: features.adminConsole ? 'available' : 'hidden'
    }
  ];

  return jsonWithCookies(
    200,
    {
      ok: true,
      user,
      access: {
        role: user.role,
        plan: user.plan,
        planSource: user.planSource,
        isPro: user.isPro,
        adsFree: user.adsFree,
        trialEndsAt: user.trialEndsAt,
        features
      },
      pricing: PLAN_PRICING,
      dashboard: {
        title: 'Atomurus Pro workspace',
        status: user.planSource === 'trial' ? 'trial' : user.plan,
        upgradeUrl: '/pricing',
        modules,
        nextSteps: user.isPro
          ? [
              'Explore the periodic table without ads.',
              'Bookmark this workspace and return after each study session.',
              'Premium tracks and AI tutor ship next in the roadmap.'
            ]
          : [
              'Start a free account to unlock 30 days of Pro.',
              'Compare Free vs Pro on the pricing page.',
              'Checkout (Stripe / Mercado Pago) connects next.'
            ]
      }
    },
    session.cookieHeaders
  );
}
