import { resolvePricingContext } from '../lib/geo-pricing.mjs';
import { json, jsonWithCookies, options, publicUser, PLAN_PRICING } from '../lib/netlify-identity-utils.mjs';
import { requireUser } from '../lib/require-user.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const session = auth.session;
  const user = publicUser(auth.user);
  const features = user.features || {};
  const pricingContext = resolvePricingContext(request);

  const modules = [
    {
      id: 'study-workspace',
      label: 'Study workspace',
      description: 'Open the free lab: periodic table, models and calculators.',
      href: '/periodic-table',
      state: 'available'
    },
    {
      id: 'ads-free',
      label: 'Ad-free lab',
      description: 'Remove AdSense and AdCash while your Pro plan or trial is active.',
      href: features.adsFree ? '/periodic-table' : '/pricing',
      state: features.adsFree ? 'available' : 'locked'
    },
    {
      id: 'export-pdf',
      label: 'PDF export',
      description: 'Export table views and study sheets from the periodic table (Pro).',
      href: user.isPro ? '/periodic-table' : '/pricing',
      state: features.exportPdf ? 'available' : 'locked'
    },
    {
      id: 'favorites',
      label: 'Favorites & history',
      description: 'Save elements, molecules and calculator runs — shipping next.',
      href: '/pricing',
      // Entitlement bit exists for Pro, but UI/storage is not live yet — stay honest.
      state: features.favorites ? 'coming' : 'locked'
    },
    {
      id: 'premium-lessons',
      label: 'Premium study tracks',
      description: 'Guided chemistry paths for high school, ENEM and general chemistry.',
      href: '/pricing',
      state: features.premiumLessons ? 'coming' : 'locked'
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
      pricingContext,
      dashboard: {
        title: 'Atomurus Pro workspace',
        status: user.planSource === 'trial' ? 'trial' : user.plan,
        upgradeUrl: '/pricing',
        modules,
        nextSteps: user.isPro
          ? [
              'Explore the periodic table without ads.',
              'Use PDF export from the periodic table when you need study sheets.',
              'Favorites and premium tracks are next on the roadmap.'
            ]
          : [
              'Create an account to unlock 30 days of Pro (ads-free) automatically.',
              'Compare Free vs Pro on the pricing page.',
              'Subscribe with Stripe when the trial ends — checkout is live.'
            ]
      }
    },
    session.cookieHeaders
  );
}
