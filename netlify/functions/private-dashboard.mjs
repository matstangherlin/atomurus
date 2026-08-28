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
      id: 'chemistry-lab',
      label: 'Chemistry Lab',
      description: 'Open the public lab: periodic table, molar mass and dilution.',
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
      id: 'study-library',
      label: 'Study Library',
      description: 'Saved elements, molecules and articles, with notes and tags.',
      href: '/app?section=library',
      state: features.studyCloud || features.favorites ? 'available' : 'locked'
    },
    {
      id: 'study-sets',
      label: 'Study Sets',
      description: 'Group saved material into exam-ready study sets.',
      href: features.studySets ? '/app?section=sets' : '/pricing',
      state: features.studySets ? 'available' : 'locked'
    },
    {
      id: 'smart-review',
      label: 'Smart Review',
      description: 'Flashcards and spaced repetition for due cards.',
      href: features.smartReview ? '/app?section=review' : '/pricing',
      state: features.smartReview ? 'available' : 'locked'
    },
    {
      id: 'study-insights',
      label: 'Study Insights',
      description: 'Review activity, weak cards, consistency and due forecast.',
      href: features.studyInsights ? '/app?section=insights' : '/pricing',
      state: features.studyInsights ? 'available' : 'locked'
    },
    {
      id: 'pro-lab',
      label: 'Pro Lab',
      description: 'Advanced chemistry analysis, comparisons and saved sessions.',
      href: features.proLab ? '/app?section=pro-lab' : '/pricing',
      state: features.proLab ? 'available' : 'locked'
    },
    {
      id: 'chemistry-solver',
      label: 'Chemistry Solver',
      description: 'Balance reactions, solve stoichiometry and build solutions.',
      href: features.reactionWorkbench ? '/app?section=pro-lab&tool=reactions' : '/pricing',
      state: features.reactionWorkbench ? 'available' : 'locked'
    },
    {
      id: 'calculator-history',
      label: 'Calculator History',
      description: 'Keep validated calculator runs and reopen them later.',
      href: '/app?section=history',
      state: features.calculatorHistory || features.studyCloud ? 'available' : 'locked'
    },
    {
      id: 'study-progress',
      label: 'Study Progress',
      description: 'Continue studying from the last incomplete lesson or article.',
      href: '/app?section=progress',
      state: features.studyProgress || features.studyCloud ? 'available' : 'locked'
    },
    {
      id: 'favorites',
      label: 'Favorites & history',
      description: 'Your Study Cloud library and calculator history live in this workspace.',
      href: user.isPro ? '/app?section=library' : '/pricing',
      state: features.favorites ? 'available' : 'locked'
    },
    {
      id: 'export-pdf',
      label: 'Study sheet PDF',
      description: 'Study-sheet PDF export is not available yet. The public periodic table can still be downloaded from the table page.',
      href: '/periodic-table',
      state: 'coming'
    },
    {
      id: 'premium-lessons',
      label: 'Premium study tracks',
      description: 'Guided chemistry paths for high school, ENEM and general chemistry.',
      href: '/pricing',
      state: 'coming'
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
              'Open Study Library to review saved elements and notes.',
              'Add a saved item to a Study Set and generate flashcards.',
              'Open Smart Review when cards are due.',
              'Check Study Insights, then start Focus Review on cards that need attention.',
              'Use Pro Lab for advanced calculations, comparisons and saved sessions.'
            ]
          : [
              'Create an account to unlock 30 days of Pro (ads-free) automatically.',
              'Upgrade to Pro to sync Study Cloud across devices.',
              'Compare Free vs Pro on the pricing page.'
            ]
      }
    },
    session.cookieHeaders
  );
}
