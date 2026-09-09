(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusWorkspace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SECTIONS = ['overview', 'library', 'sets', 'review', 'insights', 'pro-lab', 'history', 'notes', 'progress', 'account'];
  var ACCOUNT_TABS = ['overview', 'profile', 'security', 'plan', 'preferences'];
  var AREA_BY_SECTION = {
    overview: 'overview',
    library: 'study',
    sets: 'study',
    review: 'study',
    insights: 'study',
    'pro-lab': 'lab',
    history: 'activity',
    notes: 'activity',
    progress: 'activity',
    account: 'account'
  };
  var LAB_TOOLS = ['home', 'reactions', 'formula', 'solutions', 'calculations', 'elements', 'molecules', 'atomic', 'sessions'];
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  var MS_DAY = 24 * 60 * 60 * 1000;
  var REVIEW_SECONDS_PER_CARD = 20;

  function interpolate(template, vars) {
    var text = String(template == null ? '' : template);
    if (!vars) return text;
    Object.keys(vars).forEach(function (key) {
      text = text.split('{' + key + '}').join(String(vars[key]));
    });
    return text;
  }

  function normalizeSection(raw) {
    var section = String(raw || '').trim().toLowerCase();
    return SECTIONS.indexOf(section) === -1 ? 'overview' : section;
  }

  function labToolFromQuery(search) {
    try {
      var tool = String(new URLSearchParams(search || '').get('tool') || 'home').trim().toLowerCase();
      return LAB_TOOLS.indexOf(tool) === -1 ? 'home' : tool;
    } catch (_err) {
      return 'home';
    }
  }

  function workspaceArea(section) {
    return AREA_BY_SECTION[normalizeSection(section)] || 'overview';
  }

  function defaultSectionForArea(area) {
    if (area === 'study') return 'library';
    if (area === 'lab') return 'pro-lab';
    if (area === 'activity') return 'progress';
    if (area === 'account') return 'account';
    return 'overview';
  }

  function accountTabFromQuery(search) {
    try {
      var tab = String(new URLSearchParams(search || '').get('tab') || 'overview').trim().toLowerCase();
      return ACCOUNT_TABS.indexOf(tab) === -1 ? 'overview' : tab;
    } catch (_err) {
      return 'overview';
    }
  }

  function labHref(tool) {
    var next = String(tool || 'home').trim().toLowerCase();
    if (LAB_TOOLS.indexOf(next) === -1 || next === 'home') return '/app?section=pro-lab';
    return '/app?section=pro-lab&tool=' + encodeURIComponent(next);
  }

  function isValidSetId(raw) {
    return UUID_RE.test(String(raw || '').trim());
  }

  function setIdFromQuery(search) {
    try {
      var raw = String(new URLSearchParams(search || '').get('set') || '').trim();
      return isValidSetId(raw) ? raw : '';
    } catch (_err) {
      return '';
    }
  }

  function isProUser(user) {
    return Boolean(user && user.isPro);
  }

  function isAutoTrialUser(user) {
    return Boolean(user && user.planSource === 'trial');
  }

  function isBillingTrialUser(user) {
    return Boolean(user && user.planSource === 'billing_trial');
  }

  function isTrialUser(user) {
    return isAutoTrialUser(user) || isBillingTrialUser(user);
  }

  function accountPlanState(user) {
    if (!user) return { kind: 'guest', canManage: false };
    var status = String(user.subscriptionStatus || '').toLowerCase();
    var canManage = Boolean(user.canManageBilling);
    if (isAutoTrialUser(user)) return { kind: 'auto_trial', canManage: false };
    if (user.isPro && status === 'past_due') return { kind: 'payment_issue', canManage: canManage };
    if (user.isPro && user.cancelAtPeriodEnd) return { kind: 'cancel_scheduled', canManage: canManage };
    if (isBillingTrialUser(user)) return { kind: 'billing_trial', canManage: canManage };
    if (user.isPro) return { kind: 'paid', canManage: canManage };
    return { kind: 'free', canManage: false };
  }

  function emitWorkspaceEvent(name, detail) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    try {
      window.dispatchEvent(new CustomEvent('atomurus:analytics', {
        detail: Object.assign({ source: 'workspace', name: name }, detail || {})
      }));
    } catch (_err) {}
  }

  function planBadge(user) {
    if (!user) return { kind: 'guest', label: '' };
    if (user.plan === 'admin' || user.role === 'admin') return { kind: 'admin', label: 'ADMIN' };
    if (isTrialUser(user)) return { kind: 'trial', label: 'PRO TRIAL' };
    if (user.isPro) return { kind: 'pro', label: 'PRO' };
    return { kind: 'free', label: 'FREE' };
  }

  function trialDaysLeft(trialEndsAt, now) {
    var end = Date.parse(trialEndsAt);
    if (!Number.isFinite(end)) return null;
    var ms = end - (now || Date.now());
    return Math.max(0, Math.ceil(ms / MS_DAY));
  }

  function greetingKey(date) {
    var hours = (date || new Date()).getHours();
    if (hours < 12) return 'morning';
    if (hours < 18) return 'afternoon';
    return 'evening';
  }

  function annualSavePercent(monthly, annual) {
    var month = Number(monthly);
    var year = Number(annual);
    if (!(month > 0) || !(year > 0)) return 0;
    return Math.round((1 - year / (month * 12)) * 100);
  }

  function estimateReviewMinutes(count) {
    var n = Math.max(0, Number(count) || 0);
    if (!n) return 0;
    return Math.max(1, Math.round((n * REVIEW_SECONDS_PER_CARD) / 60));
  }

  function progressPercent(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function humanizeKey(value) {
    var text = String(value == null ? '' : value).trim();
    if (!text) return '';
    return text
      .replace(/[._]+/g, '-')
      .split(/[-/]+/)
      .filter(Boolean)
      .map(function (part) {
        if (/^[A-Z]{1,3}$/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function reviewStartHref(id) {
    var href = '/app?section=review&start=1';
    if (isValidSetId(id)) href += '&set=' + encodeURIComponent(String(id).trim());
    return href;
  }

  function focusReviewHref(id, limit) {
    var href = '/app?section=review&start=1&mode=weak';
    if (isValidSetId(id)) href += '&set=' + encodeURIComponent(String(id).trim());
    var n = Number(limit);
    if (n === 10 || n === 20 || n === 30) href += '&limit=' + n;
    return href;
  }

  function reviewModeFromQuery(search) {
    try {
      var mode = String(new URLSearchParams(search || '').get('mode') || 'due').trim().toLowerCase();
      return mode === 'weak' ? 'weak' : 'due';
    } catch (_err) {
      return 'due';
    }
  }

  function focusLimitFromQuery(search) {
    try {
      var n = Number(new URLSearchParams(search || '').get('limit'));
      if (n === 10 || n === 20 || n === 30) return n;
    } catch (_err) {}
    return 20;
  }

  function insightsRangeFromQuery(search) {
    try {
      var range = String(new URLSearchParams(search || '').get('range') || '30d').trim().toLowerCase();
      return range === '7d' ? '7d' : '30d';
    } catch (_err) {
      return '30d';
    }
  }

  function insightsHref(range, setId) {
    var href = '/app?section=insights&range=' + (range === '7d' ? '7d' : '30d');
    if (isValidSetId(setId)) href += '&set=' + encodeURIComponent(String(setId).trim());
    return href;
  }

  function pickCountKey(n, oneKey, manyKey) {
    return Number(n) === 1 ? oneKey : manyKey;
  }

  function overviewSetCount(review) {
    if (!review) return 0;
    if (Array.isArray(review.sets)) return review.sets.length;
    return Number(review.setCount) || 0;
  }

  function safeHref(value, fallback) {
    var href = String(value == null ? '' : value).trim();
    var next = fallback || '/app';
    if (!href) return next;
    if (/^(javascript|data|vbscript):/i.test(href)) return next;
    if (href.charAt(0) === '/' && href.charAt(1) !== '/') return href;
    if (/^[a-z0-9][a-z0-9._/-]*\.html(?:[?#].*)?$/i.test(href)) return href;
    return next;
  }

  var SOLVER_ERROR_KEYS = {
    ionic_unsupported: 'errIonicUnsupported',
    ambiguous_equation: 'errAmbiguousEquation',
    duplicate_element: 'errDuplicateElement',
    duplicate_given_species: 'errDuplicateGivenSpecies',
    duplicate_species: 'errDuplicateSpecies',
    invalid_mode: 'errInvalidMode',
    invalid_given_species: 'errInvalidGivenSpecies',
    invalid_target_species: 'errInvalidTargetSpecies',
    unknown_element: 'errUnknownElement'
  };

  function uxError(err) {
    var status = err && err.status;
    var code = err && err.code;
    if (code && SOLVER_ERROR_KEYS[code]) {
      return { kind: 'solver', titleKey: 'errGenericTitle', bodyKey: SOLVER_ERROR_KEYS[code] };
    }
    if (code === 'session_expired' || status === 401) {
      return { kind: 'session', titleKey: 'errSessionTitle', bodyKey: 'errSessionBody' };
    }
    if (code === 'feature_locked' || status === 403) {
      return { kind: 'locked', titleKey: 'errLockedTitle', bodyKey: 'errLockedBody' };
    }
    if (code === 'quota_exceeded') {
      return { kind: 'quota', titleKey: 'errQuotaTitle', bodyKey: 'errQuotaBody' };
    }
    if (code === 'review_conflict' || status === 409) {
      return { kind: 'conflict', titleKey: 'errConflictTitle', bodyKey: 'errConflictBody' };
    }
    if (code === 'network' || status === 0) {
      return { kind: 'network', titleKey: 'errNetworkTitle', bodyKey: 'errNetworkBody' };
    }
    if (status >= 500) {
      return { kind: 'server', titleKey: 'errServerTitle', bodyKey: 'errServerBody' };
    }
    return { kind: 'generic', titleKey: 'errGenericTitle', bodyKey: 'errGenericBody' };
  }

  function isTechnicalErrorText(text) {
    return /feature_locked|session_expired|PostgREST|Supabase|invalid_credentials|JWT|PGRST/i.test(String(text || ''));
  }

  function generateCardsFeedback(result) {
    var created = Number(result && result.created) || 0;
    var skipped = Number(result && result.skipped) || 0;
    if (created > 0) return { kind: 'created', created: created };
    if (skipped > 0) return { kind: 'noneNeeded' };
    return { kind: 'none' };
  }

  function masteredPercent(mastered, total) {
    var m = Number(mastered) || 0;
    var t = Number(total) || 0;
    if (t <= 0) return null;
    return Math.round((m / t) * 100);
  }

  function relativeTime(iso, now, lang) {
    var then = Date.parse(iso);
    if (!Number.isFinite(then)) return '';
    var diff = Math.max(0, (now || Date.now()) - then);
    var minutes = Math.round(diff / 60000);
    var pt = lang === 'pt';
    if (minutes < 1) return pt ? 'agora' : 'just now';
    if (minutes < 60) return pt ? ('há ' + minutes + ' min') : (minutes + 'm ago');
    var hours = Math.round(minutes / 60);
    if (hours < 24) return pt ? ('há ' + hours + ' h') : (hours + 'h ago');
    var days = Math.round(hours / 24);
    if (days === 1) return pt ? 'ontem' : 'yesterday';
    if (days < 14) return pt ? ('há ' + days + ' dias') : (days + ' days ago');
    try {
      return new Date(then).toLocaleDateString(pt ? 'pt-BR' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (_err) {
      return String(iso);
    }
  }

  function formatDate(iso, lang) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (_err) {
      return String(iso);
    }
  }

  function hasFeature(user, name) {
    if (!user) return false;
    if (user.features && user.features[name] === false) return false;
    if (user.features && user.features[name] === true) return true;
    return Boolean(user.isPro);
  }

  function libraryTypeLabel(type) {
    var key = String(type || '').toLowerCase();
    if (key === 'element' || key === 'molecule' || key === 'article' || key === 'calculator') return key;
    return 'item';
  }

  return {
    SECTIONS: SECTIONS,
    ACCOUNT_TABS: ACCOUNT_TABS,
    workspaceArea: workspaceArea,
    defaultSectionForArea: defaultSectionForArea,
    accountTabFromQuery: accountTabFromQuery,
    UUID_RE: UUID_RE,
    REVIEW_SECONDS_PER_CARD: REVIEW_SECONDS_PER_CARD,
    interpolate: interpolate,
    normalizeSection: normalizeSection,
    isValidSetId: isValidSetId,
    setIdFromQuery: setIdFromQuery,
    isProUser: isProUser,
    isAutoTrialUser: isAutoTrialUser,
    isBillingTrialUser: isBillingTrialUser,
    isTrialUser: isTrialUser,
    accountPlanState: accountPlanState,
    emitWorkspaceEvent: emitWorkspaceEvent,
    planBadge: planBadge,
    trialDaysLeft: trialDaysLeft,
    greetingKey: greetingKey,
    annualSavePercent: annualSavePercent,
    estimateReviewMinutes: estimateReviewMinutes,
    progressPercent: progressPercent,
    safeHref: safeHref,
    humanizeKey: humanizeKey,
    reviewStartHref: reviewStartHref,
    focusReviewHref: focusReviewHref,
    reviewModeFromQuery: reviewModeFromQuery,
    focusLimitFromQuery: focusLimitFromQuery,
    insightsRangeFromQuery: insightsRangeFromQuery,
    insightsHref: insightsHref,
    pickCountKey: pickCountKey,
    overviewSetCount: overviewSetCount,
    uxError: uxError,
    isTechnicalErrorText: isTechnicalErrorText,
    generateCardsFeedback: generateCardsFeedback,
    masteredPercent: masteredPercent,
    relativeTime: relativeTime,
    formatDate: formatDate,
    hasFeature: hasFeature,
    libraryTypeLabel: libraryTypeLabel,
    labToolFromQuery: labToolFromQuery,
    labHref: labHref
  };
});
