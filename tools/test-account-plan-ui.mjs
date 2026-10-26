import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createContext, runInContext } from 'node:vm';

const require = createRequire(import.meta.url);
const logic = require('../workspace-logic.js');
const accountSrc = readFileSync(new URL('../assets/account-center.js', import.meta.url), 'utf8');
const pricingSrc = readFileSync(new URL('../pricing-page.js', import.meta.url), 'utf8');

function daysFromNow(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function loadAccount(lang) {
  const sandbox = {
    document: {
      documentElement: { lang },
      readyState: 'loading',
      addEventListener() {},
      getElementById() { return null; },
      querySelectorAll() { return []; }
    },
    location: { search: '', assign() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    setTimeout() { return 0; },
    fetch() { return Promise.resolve({ ok: false, json() { return Promise.resolve({}); } }); }
  };
  sandbox.window = sandbox;
  sandbox.AtomurusWorkspace = logic;
  runInContext(accountSrc, createContext(sandbox));
  return sandbox.AtomurusAccount;
}

const trialEnds = daysFromNow(12);
const periodEnd = daysFromNow(20);
const users = {
  auto_trial: { planSource: 'trial', isPro: true, trialEndsAt: trialEnds, canManageBilling: false },
  billing_trial: { planSource: 'billing_trial', isPro: true, canManageBilling: true, currentPeriodEnd: periodEnd, subscriptionStatus: 'trialing' },
  paid: { planSource: 'paid', isPro: true, canManageBilling: true, currentPeriodEnd: periodEnd, subscriptionStatus: 'active' },
  payment_issue: { isPro: true, subscriptionStatus: 'past_due', canManageBilling: true, currentPeriodEnd: periodEnd },
  cancel_scheduled: { isPro: true, cancelAtPeriodEnd: true, canManageBilling: true, currentPeriodEnd: periodEnd, subscriptionStatus: 'active' },
  free: { isPro: false, planSource: 'free' }
};

const pt = loadAccount('pt-BR');
const en = loadAccount('en');

const ptAuto = pt.planBlock(users.auto_trial);
assert.match(ptAuto, /nada será cobrado/);
assert.match(ptAuto, /plano gratuito/);
assert.match(ptAuto, /Ver planos/);
assert.doesNotMatch(ptAuto, /ws-billing-portal/);

const enAuto = en.planBlock(users.auto_trial);
assert.match(enAuto, /nothing will be charged/);
assert.match(enAuto, /free plan/);
assert.match(enAuto, /View plans/);

for (const kind of ['billing_trial', 'paid', 'payment_issue']) {
  const html = pt.planBlock(users[kind]);
  assert.match(html, /Gerenciar ou cancelar assinatura/, kind);
  assert.match(html, /Renova em /, kind);
  assert.match(en.planBlock(users[kind]), /Manage or cancel subscription/, kind);
}

const ptCancel = pt.planBlock(users.cancel_scheduled);
assert.match(ptCancel, /não será renovada/);
assert.match(ptCancel, /Acesso Pro até /);
assert.match(ptCancel, /Reativar ou gerenciar/);
assert.match(en.planBlock(users.cancel_scheduled), /will not renew/);
assert.match(en.planBlock(users.cancel_scheduled), /Reactivate or manage/);

assert.match(pt.planBlock(users.free), /Assinar o Pro/);
assert.equal(pt.billingPortalMessage({ code: 'billing_customer_missing' }), 'Esta conta ainda não tem assinatura para gerenciar.');
assert.match(pt.billingPortalMessage({ code: 'network' }), /Não foi possível abrir o portal/);
assert.match(en.billingPortalMessage(new Error('down')), /could not be opened/);
assert.doesNotMatch(accountSrc, /billing_customer_missing' \? t\('noStripe'\) : t\('noStripe'\)/);

function setBusy(button, busy, label) {
  button.disabled = Boolean(busy);
  if (busy) {
    if (!button.dataset.readyLabel) button.dataset.readyLabel = button.textContent;
    if (label) button.textContent = label;
  } else if (button.dataset.readyLabel) {
    button.textContent = button.dataset.readyLabel;
  }
}

async function drive(task, schedule) {
  const button = { disabled: false, textContent: 'Generate Cards', dataset: {} };
  let status = '';
  setBusy(button, true, 'Generating…');
  const outcome = await logic.watchGenerate(task, {
    timeoutMs: 35000,
    schedule: schedule || function (fn) { return setTimeout(fn, 0); },
    cancel: function () {},
    onTimeout() {
      setBusy(button, false);
      status = 'genTimeout';
    }
  });
  if (!outcome.timedOut) {
    setBusy(button, false);
    if (outcome.error) status = logic.uxError(outcome.error).bodyKey;
    else status = logic.generateCardsFeedback(outcome.value).kind;
  }
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, 'Generate Cards');
  assert.ok(status);
  return status;
}

let timeoutFn;
const hung = drive(function () { return new Promise(function () {}); }, function (fn) {
  timeoutFn = fn;
  return 1;
});
timeoutFn();
assert.equal(await hung, 'genTimeout');

assert.equal(await drive(async function () {
  const err = new Error('locked');
  err.code = 'feature_locked';
  err.status = 403;
  throw err;
}), 'errLockedBody');
assert.equal(logic.isTechnicalErrorText('Upgrade to unlock your saved study workspace.'), false);

assert.equal(await drive(async function () {
  const err = new Error('<html>');
  err.status = 500;
  throw err;
}), 'errServerBody');

assert.equal(await drive(async function () {
  return { created: 0, skipped: 0 };
}), 'needItems');

assert.equal(await drive(async function () {
  return { created: 3, skipped: 0 };
}), 'created');

function loadPricing() {
  const clicks = [];
  const button = {
    disabled: false,
    textContent: '',
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, fn) { if (type === 'click') clicks.push(fn); }
  };
  const listeners = { document: {}, window: {} };
  const sandbox = {
    document: {
      documentElement: { lang: 'en', classList: { add() {}, remove() {} } },
      readyState: 'loading',
      visibilityState: 'visible',
      addEventListener(name, fn) { listeners.document[name] = fn; },
      getElementById(id) { return id === 'pricing-pro-cta' ? button : null; },
      querySelectorAll() { return []; },
      createElement() {
        return { className: '', textContent: '', appendChild() {}, classList: { add() {}, remove() {} } };
      }
    },
    location: { assign() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    fetchCalls: 0,
    fetch() {
      sandbox.fetchCalls += 1;
      return new Promise(function () {});
    },
    setTimeout() { return 0; },
    __ATOMURUS_AUTH__: {
      ready: true,
      signedIn: true,
      user: { isPro: false, canManageBilling: false, planSource: 'free' }
    }
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = function (name, fn) { listeners.window[name] = fn; };
  runInContext(pricingSrc, createContext(sandbox));
  listeners.document.DOMContentLoaded();
  return { button, clicks, listeners, sandbox };
}

const pricing = loadPricing();
assert.equal(pricing.button.disabled, false);
pricing.clicks[0]();
assert.equal(pricing.button.disabled, true);
assert.match(pricing.button.textContent, /Opening secure checkout/);
pricing.clicks[0]();
assert.equal(pricing.sandbox.fetchCalls, 1);
pricing.listeners.window.pageshow({ persisted: true });
assert.equal(pricing.button.disabled, false);
assert.doesNotMatch(pricing.button.textContent, /Opening secure checkout/);

console.log('test-account-plan-ui: ok');
