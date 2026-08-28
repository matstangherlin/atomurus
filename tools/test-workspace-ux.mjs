import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logic = require('../workspace-logic.js');

assert.equal(logic.normalizeSection('library'), 'library');
assert.equal(logic.normalizeSection('account'), 'account');
assert.equal(logic.normalizeSection('nope'), 'overview');
assert.equal(logic.normalizeSection(''), 'overview');
assert.ok(logic.SECTIONS.includes('account'));
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

assert.equal(logic.annualSavePercent(24.9, 180), 40);
assert.equal(logic.annualSavePercent(10, 60), 50);
assert.equal(logic.estimateReviewMinutes(12), 4);
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
assert.match(authApp, /showStudyLocked/);
assert.match(authApp, /isProUser/);
assert.match(authApp, /t\('reviewHint'\)/);
assert.match(authApp, /t\('loadMore'\)/);
assert.match(authApp, /resetStudyRoot/);
assert.match(authApp, /reviewStartHref/);
assert.match(authApp, /humanizeKey/);
assert.match(authApp, /I18N\.onChange/);
assert.match(authApp, /icon\('logout'\)/);
assert.doesNotMatch(authApp, /map\(continueCard\)\.join\(''\) : emptyState/);
assert.doesNotMatch(authApp, />Load more</);

const css = readFileSync(new URL('../assets/app-workspace.css', import.meta.url), 'utf8');
assert.match(css, /\.ws-body \[hidden\]/);

const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
assert.match(appHtml, /assets\/app-workspace\.css/);
assert.match(appHtml, /workspace-logic\.js/);
assert.match(appHtml, /noindex,nofollow/);
assert.doesNotMatch(appHtml, /html\.lc-loading body/);
assert.match(appHtml, /requireSession\(\{\s*next:/);

const pricing = readFileSync(new URL('../pricing-page.js', import.meta.url), 'utf8');
assert.doesNotMatch(pricing, /AI tutor|AI powered|AI study/i);
assert.doesNotMatch(pricing, /alert\s*\(/);
assert.match(pricing, /annualSavePercent/);
assert.match(pricing, /Study Library/);
assert.match(pricing, /Smart Review/);

const pricingHtml = readFileSync(new URL('../pricing.html', import.meta.url), 'utf8');
assert.match(pricingHtml, /flashcards/i);
assert.match(pricingHtml, /id="pricing-free-amount"/);
assert.doesNotMatch(pricingHtml, /upcoming tutors/i);

const dashboard = readFileSync(new URL('../netlify/functions/private-dashboard.mjs', import.meta.url), 'utf8');
assert.match(dashboard, /state: 'coming'/);
assert.doesNotMatch(dashboard, /AI tutor/);

const studySave = readFileSync(new URL('../study-save.js', import.meta.url), 'utf8');
assert.doesNotMatch(studySave, /innerHTML/);
assert.match(studySave, /openSaveGate/);
assert.match(studySave, /sessionHint/);
assert.match(studySave, /section=review&start=1&set=/);

console.log('workspace ux tests passed');
