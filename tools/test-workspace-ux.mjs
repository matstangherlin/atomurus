import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logic = require('../workspace-logic.js');

assert.equal(logic.normalizeSection('library'), 'library');
assert.equal(logic.normalizeSection('account'), 'account');
assert.equal(logic.normalizeSection('nope'), 'overview');
assert.equal(logic.normalizeSection(''), 'overview');
assert.ok(logic.SECTIONS.includes('insights'));
assert.equal(logic.normalizeSection('insights'), 'insights');
assert.equal(logic.focusReviewHref(), '/app?section=review&start=1&mode=weak');
assert.equal(
  logic.focusReviewHref('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 10),
  '/app?section=review&start=1&mode=weak&set=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee&limit=10'
);
assert.equal(logic.reviewModeFromQuery('?mode=weak'), 'weak');
assert.equal(logic.insightsRangeFromQuery('?range=7d'), '7d');
assert.equal(logic.insightsHref('7d'), '/app?section=insights&range=7d');
assert.equal(logic.pickCountKey(1, 'one', 'many'), 'one');
assert.equal(logic.pickCountKey(2, 'one', 'many'), 'many');
assert.equal(
  logic.insightsHref('30d', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
  '/app?section=insights&range=30d&set=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
);
assert.equal(logic.focusLimitFromQuery('?limit=30'), 30);
assert.equal(logic.hasFeature({ isPro: true, features: { studyInsights: true } }, 'studyInsights'), true);
assert.equal(logic.normalizeSection('pro-lab'), 'pro-lab');
assert.equal(logic.labToolFromQuery('?tool=calculations'), 'calculations');
assert.equal(logic.labHref('elements'), '/app?section=pro-lab&tool=elements');
assert.ok(!logic.SECTIONS.includes('billing'));

assert.equal(logic.isValidSetId('not-a-uuid'), false);
assert.equal(logic.setIdFromQuery('?set=not-a-uuid'), '');
assert.equal(
  logic.setIdFromQuery('?set=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
  'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
);

const free = { isPro: false, plan: 'free', planSource: 'free' };
const trial = { isPro: true, plan: 'paid', planSource: 'trial' };
const pro = { isPro: true, plan: 'paid', planSource: 'paid' };
assert.equal(logic.planBadge(free).kind, 'free');
assert.equal(logic.planBadge(trial).kind, 'trial');
assert.equal(logic.planBadge(trial).label, 'PRO TRIAL');
assert.equal(logic.planBadge(pro).kind, 'pro');
assert.equal(logic.isProUser(trial), true);
assert.equal(logic.isProUser(free), false);
assert.equal(logic.hasFeature(free, 'smartReview'), false);
assert.equal(logic.hasFeature(pro, 'smartReview'), true);
assert.equal(logic.hasFeature(free, 'proLab'), false);
assert.equal(logic.hasFeature(pro, 'proLab'), true);
assert.equal(logic.hasFeature({ isPro: false, features: { proLab: false } }, 'proLab'), false);
assert.equal(logic.hasFeature({ isPro: true, features: { proLab: true } }, 'proLab'), true);

assert.equal(logic.annualSavePercent(24.9, 180), 40);
assert.equal(logic.annualSavePercent(10, 60), 50);
assert.equal(logic.estimateReviewMinutes(12), 4);
assert.equal(logic.estimateReviewMinutes(1), 1);
assert.equal(logic.estimateReviewMinutes(2), 1);
assert.equal(logic.progressPercent(168), 100);
assert.equal(logic.progressPercent(-4), 0);

assert.equal(logic.safeHref('javascript:alert(1)', '/app'), '/app');
assert.equal(logic.humanizeKey('what-is-an-atom'), 'What Is An Atom');
assert.equal(logic.reviewStartHref('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'), '/app?section=review&start=1&set=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
assert.equal(logic.reviewStartHref('nope'), '/app?section=review&start=1');
assert.equal(logic.overviewSetCount({ sets: [{}, {}] }), 2);
assert.equal(logic.uxError({ status: 401, code: 'session_expired' }).kind, 'session');
assert.equal(logic.uxError({ status: 403, code: 'feature_locked' }).kind, 'locked');
assert.equal(logic.uxError({ status: 0, code: 'network' }).kind, 'network');
assert.equal(logic.uxError({ status: 500 }).kind, 'server');
assert.ok(logic.isTechnicalErrorText('feature_locked'));
assert.ok(logic.isTechnicalErrorText('PostgREST error'));
assert.equal(logic.generateCardsFeedback({ created: 3, skipped: 0 }).kind, 'created');
assert.equal(logic.generateCardsFeedback({ created: 0, skipped: 4 }).kind, 'noneNeeded');
assert.equal(logic.generateCardsFeedback({ created: 0, skipped: 0 }).kind, 'none');

const ends = new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString();
const days = logic.trialDaysLeft(ends);
assert.ok(days === 23 || days === 24);

const authApp = readFileSync(new URL('../auth-app.js', import.meta.url), 'utf8');
assert.match(authApp, /section=sets/);
assert.match(authApp, /section=account/);
assert.match(authApp, /data-review-front/);
assert.match(authApp, /textContent = card\.front/);
assert.match(authApp, /textContent = reviewSession\.revealed \? \(card\.back/);
assert.doesNotMatch(authApp, /window\.alert\s*\(/);
assert.doesNotMatch(authApp, /\/api\/auth\/me/);
assert.match(authApp, /section=insights/);
assert.match(authApp, /renderLockedInsights/);
assert.match(authApp, /startFocusReview/);
assert.match(authApp, /ws-insights-retry/);
assert.match(authApp, /ws-nav-group/);
assert.match(authApp, /focusLandingBody/);
assert.match(authApp, /data-insight-range/);
assert.match(authApp, /tCount/);
assert.match(authApp, /tCount\('reviewEstimate', 'reviewEstimateOne'/);
assert.match(authApp, /openInsights/);
assert.match(authApp, /reviewShort/);
assert.match(authApp, /confirmDialog/);
assert.doesNotMatch(authApp, /Accuracy 87/);
assert.doesNotMatch(authApp, /Knowledge score|Chemistry level/);
assert.doesNotMatch(authApp, /🔥/);
assert.doesNotMatch(authApp, /apply_focus_review/);
assert.match(authApp, /isProUser/);
assert.match(authApp, /t\('reviewHint'\)/);
assert.match(authApp, /t\('loadMore'\)/);
assert.match(authApp, /resetStudyRoot/);
assert.match(authApp, /reviewStartHref/);
assert.match(authApp, /humanizeKey/);
assert.match(authApp, /I18N\.onChange/);
assert.match(authApp, /icon\('logout'\)/);
assert.match(authApp, /removeSetItem/);
assert.match(authApp, /exitReview/);
assert.match(authApp, /reviewAgain/);
assert.match(authApp, /genPickSet/);
assert.match(authApp, /ws-lib-more/);
assert.equal(logic.accountPlanState({ isPro: false, planSource: 'free' }).kind, 'free');
assert.equal(logic.accountPlanState({ isPro: true, planSource: 'trial' }).kind, 'auto_trial');
assert.equal(logic.accountPlanState({ isPro: true, planSource: 'paid', canManageBilling: true }).kind, 'paid');
assert.equal(logic.accountPlanState({ isPro: true, planSource: 'paid', cancelAtPeriodEnd: true, canManageBilling: true }).kind, 'cancel_scheduled');
assert.equal(logic.accountPlanState({ isPro: true, planSource: 'paid', subscriptionStatus: 'past_due', canManageBilling: true }).kind, 'payment_issue');
assert.equal(logic.isAutoTrialUser({ planSource: 'trial' }), true);
assert.equal(logic.isBillingTrialUser({ planSource: 'billing_trial' }), true);
assert.equal(logic.isAutoTrialUser({ planSource: 'billing_trial' }), false);

assert.match(authApp, /genPartial/);
assert.match(authApp, /ws-billing-portal|openBillingPortal/);
assert.match(authApp, /drawerChrome|ws-topbar-actions/);
assert.match(authApp, /params\.q/);
assert.doesNotMatch(authApp, /location\.reload\s*\(/);
assert.doesNotMatch(authApp, /billingManageBody/);
assert.doesNotMatch(authApp, /map\(continueCard\)\.join\(''\) : emptyState/);
assert.doesNotMatch(authApp, />Load more</);

const css = readFileSync(new URL('../assets/app-workspace.css', import.meta.url), 'utf8');
assert.match(css, /\.ws-body \[hidden\]/);
assert.match(css, /\.ws-skip/);
assert.match(css, /safe-area-inset-bottom/);
assert.match(css, /repeat\(5, minmax\(0, 1fr\)\)/);
assert.match(css, /\.ws-dest-card \{[\s\S]*display: flex/);
const foundation = readFileSync(new URL('../assets/workspace-foundation.css', import.meta.url), 'utf8');
assert.match(foundation, /\.ws-chart/);
assert.match(foundation, /\.ws-sparkline/);
assert.match(foundation, /prefers-reduced-motion/);
assert.doesNotMatch(foundation, /chart\.js|d3|recharts/i);

const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
assert.match(appHtml, /workspace-foundation\.css/);
assert.match(appHtml, /assets\/app-workspace\.css/);
assert.match(appHtml, /workspace-logic\.js/);
assert.match(appHtml, /noindex,nofollow/);
assert.doesNotMatch(appHtml, /html\.lc-loading body/);
assert.match(appHtml, /requireSession\(\{\s*next:/);
assert.match(appHtml, /ws-skip/);
assert.match(appHtml, /pro-lab\.js/);
assert.match(appHtml, /id="app-study"/);

const pricing = readFileSync(new URL('../pricing-page.js', import.meta.url), 'utf8');
assert.doesNotMatch(pricing, /AI tutor|AI powered|AI study/i);
assert.doesNotMatch(pricing, /alert\s*\(/);
assert.match(pricing, /annualSavePercent/);
assert.match(pricing, /Study Insights/);
assert.match(pricing, /Focus Review/);
assert.match(pricing, /Saved Lab Sessions/);
assert.match(pricing, /comingTitle/);
assert.doesNotMatch(pricing, /Study Library, notes and calculator history/);
assert.doesNotMatch(pricing, /Pro Lab advanced tools/);

const pricingHtml = readFileSync(new URL('../pricing.html', import.meta.url), 'utf8');
assert.match(pricingHtml, /flashcards/i);
assert.match(pricingHtml, /id="pricing-free-amount"/);
assert.doesNotMatch(pricingHtml, /upcoming tutors/i);

const dashboard = readFileSync(new URL('../netlify/functions/private-dashboard.mjs', import.meta.url), 'utf8');
assert.match(dashboard, /Chemistry Lab/);
assert.match(dashboard, /Study Insights/);
assert.match(dashboard, /id: 'pro-lab'/);
assert.doesNotMatch(dashboard, /Study workspace/);
assert.match(dashboard, /state: 'coming'/);
assert.doesNotMatch(dashboard, /AI tutor/);

const portalFn = readFileSync(new URL('../netlify/functions/billing-portal.mjs', import.meta.url), 'utf8');
assert.match(portalFn, /requireUser/);
assert.match(portalFn, /createPortalSession/);
assert.match(portalFn, /Body is ignored for authority/);

const studySave = readFileSync(new URL('../study-save.js', import.meta.url), 'utf8');
assert.doesNotMatch(studySave, /innerHTML/);
assert.match(studySave, /openSaveGate/);
assert.match(studySave, /sessionHint/);
assert.match(studySave, /section=review&start=1&set=/);
assert.match(studySave, /bindSetMenuDismiss/);
assert.match(studySave, /labels\.genPartial/);
assert.match(studySave, /aria-expanded/);
assert.match(studySave, /study-add-set/);
assert.doesNotMatch(studySave, /setMsg\(msg, 'Could not save\.'\)/);

const dictSrc = readFileSync(new URL('../tools/i18n-dict-source.js', import.meta.url), 'utf8');
assert.doesNotMatch(dictSrc, /export flags/);

console.log('workspace ux tests passed');
