const TRIAL_DAYS = 30;
const MS_DAY = 24 * 60 * 60 * 1000;

export const PLAN_PRICING = {
  brl: {
    monthly: { amount: 24.9, label: 'R$24,90/mês' },
    annual: { amount: 180, perMonth: 15, label: 'R$15/mês no anual', billed: 'R$180/ano' }
  },
  usd: {
    monthly: { amount: 10, label: 'US$10/mês' },
    annual: { amount: 60, perMonth: 5, label: 'US$5/mês no anual', billed: 'US$60/ano' }
  },
  trialDays: TRIAL_DAYS
};

function parseIso(value) {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

function rolesOf(user) {
  return Array.isArray(user?.roles) ? user.roles : [];
}

function appMeta(user) {
  return user?.appMetadata || user?.app_metadata || {};
}

export function trialEndsAtForUser(user) {
  const app = appMeta(user);
  const explicit = parseIso(app.atomurus_trial_ends_at || app.trial_ends_at);
  if (explicit) return new Date(explicit).toISOString();

  // Auto-trial: first 30 days from account creation (or email confirmation).
  const created = parseIso(user?.createdAt || user?.created_at || user?.confirmedAt);
  if (!created) return null;
  return new Date(created + TRIAL_DAYS * MS_DAY).toISOString();
}

export function accessForUser(user) {
  const roles = rolesOf(user);
  const app = appMeta(user);
  const isAdmin = user?.role === 'admin' || roles.includes('admin');

  const paidMeta =
    roles.includes('paid') ||
    app.atomurus_plan === 'paid' ||
    app.plan === 'paid' ||
    app.subscription_status === 'active' ||
    app.subscription_status === 'trialing';

  const trialEndsAt = trialEndsAtForUser(user);
  const trialActive = Boolean(trialEndsAt && Date.now() < Date.parse(trialEndsAt) && !paidMeta && !isAdmin);

  let plan = 'free';
  let planSource = 'free';
  if (isAdmin) {
    plan = 'admin';
    planSource = 'admin';
  } else if (paidMeta) {
    plan = 'paid';
    planSource = app.subscription_status === 'trialing' ? 'billing_trial' : 'paid';
  } else if (trialActive) {
    plan = 'paid';
    planSource = 'trial';
  }

  const isPro = plan === 'paid' || plan === 'admin';

  return {
    role: isAdmin ? 'admin' : 'member',
    plan,
    planSource,
    isPro,
    adsFree: isPro,
    trialEndsAt: isPro && planSource === 'trial' ? trialEndsAt : (trialActive ? trialEndsAt : null),
    subscriptionStatus: app.subscription_status || null,
    features: {
      labWorkspace: true,
      premiumLessons: isPro,
      studyProgress: isPro,
      favorites: isPro,
      exportPdf: isPro,
      adsFree: isPro,
      adminConsole: isAdmin
    }
  };
}

export function publicUser(user) {
  const access = accessForUser(user || {});
  return {
    id: user?.id || null,
    email: user?.email || null,
    emailConfirmed: Boolean(user?.confirmedAt || user?.email_confirmed_at),
    lastSignInAt: user?.lastSignInAt || null,
    createdAt: user?.createdAt || user?.created_at || null,
    role: access.role,
    plan: access.plan,
    planSource: access.planSource,
    isPro: access.isPro,
    adsFree: access.adsFree,
    trialEndsAt: access.trialEndsAt,
    features: access.features
  };
}
