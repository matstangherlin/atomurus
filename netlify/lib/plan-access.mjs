const TRIAL_DAYS = 30;
const MS_DAY = 24 * 60 * 60 * 1000;

export const PLAN_PRICING = {
  brl: {
    currency: 'BRL',
    monthly: {
      key: 'pro_monthly_brl',
      amount: 24.9,
      label: 'R$24,90/mês',
      period: 'monthly'
    },
    annual: {
      key: 'pro_annual_brl',
      amount: 180,
      perMonth: 15,
      label: 'R$15/mês no anual',
      billed: 'R$180/ano',
      period: 'annual'
    }
  },
  usd: {
    currency: 'USD',
    monthly: {
      key: 'pro_monthly_usd',
      amount: 10,
      label: 'US$10/month',
      period: 'monthly'
    },
    annual: {
      key: 'pro_annual_usd',
      amount: 60,
      perMonth: 5,
      label: 'US$5/month on annual',
      billed: 'US$60/year',
      period: 'annual'
    }
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

function billingStatus(app) {
  return String(app.subscription_status || '').trim().toLowerCase();
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
  const subscriptionStatus = billingStatus(app);

  const paidMeta =
    roles.includes('paid') ||
    app.atomurus_plan === 'paid' ||
    app.plan === 'paid' ||
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing';

  const trialEndsAt = trialEndsAtForUser(user);
  const trialActive = Boolean(trialEndsAt && Date.now() < Date.parse(trialEndsAt) && !paidMeta && !isAdmin);

  let plan = 'free';
  let planSource = 'free';
  if (isAdmin) {
    plan = 'admin';
    planSource = 'admin';
  } else if (paidMeta) {
    plan = 'paid';
    planSource = subscriptionStatus === 'trialing' ? 'billing_trial' : 'paid';
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
    subscriptionStatus: subscriptionStatus || null,
    billingPeriod: app.subscription_interval || null,
    billingCurrency: app.subscription_currency || null,
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
  const userMeta = user?.userMetadata || user?.user_metadata || {};
  const username = user?.username || userMeta.username || null;
  const fullName = user?.fullName || user?.name || userMeta.full_name || userMeta.name || null;
  const email = user?.email || null;
  const displayName = fullName || username || (email ? String(email).split('@')[0] : null);
  return {
    id: user?.id || null,
    email,
    username,
    fullName,
    displayName,
    emailConfirmed: Boolean(user?.confirmedAt || user?.email_confirmed_at),
    lastSignInAt: user?.lastSignInAt || null,
    createdAt: user?.createdAt || user?.created_at || null,
    role: access.role,
    plan: access.plan,
    planSource: access.planSource,
    isPro: access.isPro,
    adsFree: access.adsFree,
    trialEndsAt: access.trialEndsAt,
    subscriptionStatus: access.subscriptionStatus,
    billingPeriod: access.billingPeriod,
    billingCurrency: access.billingCurrency,
    stripeCustomerId: user?.role === 'admin' ? (user?.appMetadata?.stripe_customer_id || user?.app_metadata?.stripe_customer_id || null) : null,
    stripeSubscriptionId: user?.role === 'admin' ? (user?.appMetadata?.stripe_subscription_id || user?.app_metadata?.stripe_subscription_id || null) : null,
    features: access.features
  };
}
