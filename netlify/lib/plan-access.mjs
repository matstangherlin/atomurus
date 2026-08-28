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

function truthyFlag(value) {
  return value === true || value === 'true' || value === '1' || value === 1;
}

function hasStripeCustomerId(app) {
  return Boolean(String(app.stripe_customer_id || '').trim());
}

/** Stripe statuses that keep Pro access. Central source of truth — do not reimplement elsewhere. */
export const PAID_SUBSCRIPTION_STATUSES = Object.freeze(['active', 'trialing', 'past_due']);

export function isPaidSubscriptionStatus(status) {
  return PAID_SUBSCRIPTION_STATUSES.includes(String(status || '').trim().toLowerCase());
}

export function stripeCustomerIdFromMeta(user) {
  const app = appMeta(user);
  const id = String(app.stripe_customer_id || '').trim();
  return id || null;
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
    (subscriptionStatus
      ? isPaidSubscriptionStatus(subscriptionStatus)
      : (app.atomurus_plan === 'paid' || app.plan === 'paid'));

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
  const signedIn = Boolean(user?.id || user?.email);
  const cancelAtPeriodEnd = isPaidSubscriptionStatus(subscriptionStatus) && truthyFlag(app.cancel_at_period_end);
  const currentPeriodEnd = parseIso(app.current_period_end)
    ? new Date(parseIso(app.current_period_end)).toISOString()
    : null;
  const hasStripeCustomer = hasStripeCustomerId(app);
  const canManageBilling = hasStripeCustomer && isPaidSubscriptionStatus(subscriptionStatus);

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
    cancelAtPeriodEnd,
    currentPeriodEnd,
    hasStripeCustomer,
    canManageBilling,
    features: {
      labWorkspace: true,
      premiumLessons: isPro,
      studyCloud: isPro,
      studyProgress: isPro,
      favorites: isPro,
      calculatorHistory: isPro,
      studyNotes: isPro,
      studyTags: isPro,
      studySets: isPro,
      flashcards: isPro,
      smartReview: isPro,
      spacedRepetition: isPro,
      studyInsights: isPro,
      focusReview: isPro,
      advancedStudyStats: isPro,
      exportPdf: isPro,
      adsFree: isPro,
      adminConsole: isAdmin,
      proLab: isPro,
      advancedCalculations: isPro,
      advancedElementCompare: isPro,
      advancedMoleculeCompare: isPro,
      advancedAtomicCompare: isPro,
      savedLabSessions: isPro,
      chemistrySolver: isPro,
      reactionWorkbench: isPro,
      reactionBalancer: isPro,
      stoichiometrySolver: isPro,
      limitingReagentSolver: isPro,
      yieldSolver: isPro,
      formulaSolver: isPro,
      solutionBuilder: isPro,
      scientificCalculator: signedIn,
      unitConverter: signedIn,
      idealGasCalculator: signedIn,
      phCalculator: signedIn,
      interactiveViewers: isPro,
      publicStoichiometry: isPro,
      publicThermodynamics: isPro,
      publicElementCompare: isPro
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
    cancelAtPeriodEnd: access.cancelAtPeriodEnd,
    currentPeriodEnd: access.currentPeriodEnd,
    hasStripeCustomer: access.hasStripeCustomer,
    canManageBilling: access.canManageBilling,
    stripeCustomerId: user?.role === 'admin' ? (user?.appMetadata?.stripe_customer_id || user?.app_metadata?.stripe_customer_id || null) : null,
    stripeSubscriptionId: user?.role === 'admin' ? (user?.appMetadata?.stripe_subscription_id || user?.app_metadata?.stripe_subscription_id || null) : null,
    features: access.features
  };
}
