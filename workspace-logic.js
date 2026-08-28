(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusWorkspace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SECTIONS = ['overview', 'library', 'sets', 'review', 'history', 'notes', 'progress', 'account'];
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

  function isTrialUser(user) {
    if (!user) return false;
    return user.planSource === 'trial' || user.planSource === 'billing_trial';
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

  function safeHref(value, fallback) {
    var href = String(value == null ? '' : value).trim();
    var next = fallback || '/app';
    if (!href) return next;
    if (/^(javascript|data|vbscript):/i.test(href)) return next;
    if (href.charAt(0) === '/' && href.charAt(1) !== '/') return href;
    if (/^[a-z0-9][a-z0-9._/-]*\.html(?:[?#].*)?$/i.test(href)) return href;
    return next;
  }

  function uxError(err) {
    var status = err && err.status;
    var code = err && err.code;
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
    UUID_RE: UUID_RE,
    REVIEW_SECONDS_PER_CARD: REVIEW_SECONDS_PER_CARD,
    interpolate: interpolate,
    normalizeSection: normalizeSection,
    isValidSetId: isValidSetId,
    setIdFromQuery: setIdFromQuery,
    isProUser: isProUser,
    isTrialUser: isTrialUser,
    planBadge: planBadge,
    trialDaysLeft: trialDaysLeft,
    greetingKey: greetingKey,
    annualSavePercent: annualSavePercent,
    estimateReviewMinutes: estimateReviewMinutes,
    progressPercent: progressPercent,
    safeHref: safeHref,
    uxError: uxError,
    isTechnicalErrorText: isTechnicalErrorText,
    generateCardsFeedback: generateCardsFeedback,
    masteredPercent: masteredPercent,
    relativeTime: relativeTime,
    formatDate: formatDate,
    hasFeature: hasFeature,
    libraryTypeLabel: libraryTypeLabel
  };
});
