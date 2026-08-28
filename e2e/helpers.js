const { expect } = require('@playwright/test');

const IRON_ID = '00000000-0000-4000-8000-000000000001';
const SET_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const CARD_A = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
const CARD_B = 'cccccccc-dddd-4eee-8fff-000000000000';

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

function features(on) {
  return {
    labWorkspace: true,
    premiumLessons: on,
    studyCloud: on,
    studyProgress: on,
    favorites: on,
    calculatorHistory: on,
    studyNotes: on,
    studyTags: on,
    studySets: on,
    flashcards: on,
    smartReview: on,
    spacedRepetition: on,
    exportPdf: on,
    adsFree: on,
    adminConsole: false
  };
}

function userFixture(kind) {
  const base = {
    id: `user-${kind}`,
    email: `${kind}@atomurus.test`,
    username: kind,
    displayName: kind === 'pro' ? 'Pro User' : kind === 'trial' ? 'Trial User' : 'Free User',
    emailConfirmed: true,
    role: 'member',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  };
  if (kind === 'free') {
    return {
      ...base,
      plan: 'free',
      planSource: 'free',
      isPro: false,
      adsFree: false,
      trialEndsAt: null,
      hasStripeCustomer: false,
      canManageBilling: false,
      features: features(false)
    };
  }
  if (kind === 'trial') {
    return {
      ...base,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      plan: 'paid',
      planSource: 'trial',
      isPro: true,
      adsFree: true,
      trialEndsAt: daysFromNow(23),
      hasStripeCustomer: false,
      canManageBilling: false,
      features: features(true)
    };
  }
  if (kind === 'cancel') {
    return {
      ...base,
      plan: 'paid',
      planSource: 'paid',
      isPro: true,
      adsFree: true,
      trialEndsAt: null,
      subscriptionStatus: 'active',
      billingPeriod: 'annual',
      billingCurrency: 'brl',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: daysFromNow(31),
      hasStripeCustomer: true,
      canManageBilling: true,
      features: features(true)
    };
  }
  if (kind === 'pastdue') {
    return {
      ...base,
      plan: 'paid',
      planSource: 'paid',
      isPro: true,
      adsFree: true,
      subscriptionStatus: 'past_due',
      hasStripeCustomer: true,
      canManageBilling: true,
      features: features(true)
    };
  }
  return {
    ...base,
    plan: 'paid',
    planSource: 'paid',
    isPro: true,
    adsFree: true,
    trialEndsAt: null,
    subscriptionStatus: 'active',
    billingPeriod: 'annual',
    billingCurrency: 'brl',
    hasStripeCustomer: true,
    canManageBilling: true,
    features: features(true)
  };
}

function dashboard(user) {
  return { ok: true, user, dashboard: { modules: [] } };
}

function adsConfig(user) {
  return {
    ok: true,
    signedIn: Boolean(user),
    adsEnabled: user ? !user.adsFree : true,
    isPro: Boolean(user && user.isPro),
    user: user || null
  };
}

function json(route, status, body) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  });
}

function createStore() {
  return {
    items: [{
      id: IRON_ID,
      itemType: 'element',
      itemKey: 'ferrum',
      title: 'Iron',
      href: '/periodic-table/ferrum',
      note: '',
      tags: ['metal'],
      payload: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }],
    sets: [],
    cards: [],
    reviews: []
  };
}

function dueCard(overrides = {}) {
  return {
    id: CARD_A,
    front: 'What is the symbol for iron?',
    back: 'Fe',
    dueAt: new Date().toISOString(),
    version: 1,
    suspended: false,
    ...overrides
  };
}

async function preparePage(page, extras = {}) {
  await page.addInitScript(({ lang, theme }) => {
    try {
      localStorage.setItem('atomurus-cookie-consent', 'rejected');
      localStorage.setItem('atomurus-lang', lang);
      if (theme) localStorage.setItem('atomurus-theme', theme);
    } catch (_err) {}
  }, { lang: extras.lang || 'en', theme: extras.theme || '' });
}

async function waitForWorkspace(page) {
  await expect(page.locator('#ws-nav-main a').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#app-loading')).toBeHidden();
}

async function gotoWorkspace(page, path = '/app') {
  await page.goto(path);
  await waitForWorkspace(page);
}

async function installApi(page, options = {}) {
  const {
    kind = 'pro',
    store,
    signedIn: signedInOption,
    lang,
    theme,
    reviewFails = 0
  } = options;
  await preparePage(page, { lang, theme });
  const user = userFixture(kind === 'guest' ? 'free' : kind);
  const data = store || createStore();
  let signedIn = signedInOption != null ? Boolean(signedInOption) : kind !== 'guest';
  let remainingReviewFails = Number(reviewFails) || 0;

  await page.route('https://billing.stripe.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Stripe portal</title><body>Stripe Customer Portal</body>'
    });
  });
  await page.route('https://checkout.stripe.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Stripe checkout</title><body>Stripe Checkout</body>'
    });
  });

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();

    if (path === '/api/auth/me' && method === 'GET') {
      if (!signedIn) return json(route, 401, { ok: false, code: 'session_expired', error: 'Sign in required' });
      return json(route, 200, { ok: true, user });
    }
    if (path === '/api/auth/login' && method === 'POST') {
      signedIn = true;
      return json(route, 200, { ok: true, user });
    }
    if (path === '/api/auth/logout' && method === 'POST') {
      signedIn = false;
      return json(route, 200, { ok: true });
    }
    if (path === '/api/auth/refresh' && method === 'POST') {
      if (!signedIn) return json(route, 401, { ok: false, code: 'session_expired' });
      return json(route, 200, { ok: true, user });
    }
    if (path === '/api/ads-config' && method === 'GET') {
      return json(route, 200, adsConfig(signedIn ? user : null));
    }
    if (path === '/api/private/dashboard' && method === 'GET') {
      if (!signedIn) return json(route, 401, { ok: false, code: 'session_expired' });
      return json(route, 200, dashboard(user));
    }
    if (path === '/api/billing/portal' && method === 'POST') {
      if (!signedIn) return json(route, 401, { ok: false, code: 'session_expired' });
      if (!user.canManageBilling) return json(route, 409, { ok: false, code: 'billing_customer_missing' });
      return json(route, 200, { ok: true, url: 'https://billing.stripe.com/session/e2e' });
    }
    if (path === '/api/billing/checkout' && method === 'POST') {
      return json(route, 200, { ok: true, url: 'https://checkout.stripe.com/e2e' });
    }

    const locked = !user.isPro;
    if (path.startsWith('/api/study/')) {
      if (!signedIn) return json(route, 401, { ok: false, code: 'session_expired' });
      if (locked) return json(route, 403, { ok: false, code: 'feature_locked', feature: 'studyCloud', upgradeUrl: '/pricing' });
    }

    if (path === '/api/study/overview') {
      return json(route, 200, {
        ok: true,
        counts: { element: data.items.length },
        recentItems: data.items.slice(0, 5),
        continueStudying: []
      });
    }
    if (path === '/api/study/review/overview') {
      const dueNow = data.cards.filter((card) => !card.suspended).length;
      return json(route, 200, {
        ok: true,
        dueNow,
        totalCards: data.cards.length,
        masteredCards: 0,
        setCount: data.sets.length,
        sets: data.sets
      });
    }
    if (path === '/api/study/review/queue') {
      return json(route, 200, {
        ok: true,
        cards: data.cards.filter((card) => !card.suspended)
      });
    }
    if (path === '/api/study/review' && method === 'POST') {
      if (remainingReviewFails > 0) {
        remainingReviewFails -= 1;
        return json(route, 500, { ok: false, error: 'review_unavailable' });
      }
      const body = req.postDataJSON() || {};
      data.reviews.push(body);
      return json(route, 200, { ok: true, card: { id: body.cardId, version: (body.expectedVersion || 1) + 1 } });
    }
    if (path === '/api/study/items' && method === 'GET') {
      const q = String(url.searchParams.get('q') || '').toLowerCase();
      const type = url.searchParams.get('type');
      const exclude = url.searchParams.get('exclude');
      const hasNote = url.searchParams.get('hasNote') === '1';
      let items = data.items.slice();
      if (exclude === 'calculator') items = items.filter((item) => item.itemType !== 'calculator');
      if (type) items = items.filter((item) => item.itemType === type);
      if (hasNote) items = items.filter((item) => String(item.note || '').trim());
      if (q) {
        items = items.filter((item) => (`${item.title} ${item.itemKey} ${(item.tags || []).join(' ')}`).toLowerCase().includes(q));
      }
      const cursor = url.searchParams.get('cursor');
      const limit = Number(url.searchParams.get('limit') || 40);
      let start = 0;
      if (cursor) {
        const idx = items.findIndex((item) => item.id === cursor);
        start = idx >= 0 ? idx + 1 : 0;
      }
      const page = items.slice(start, start + limit);
      const last = page[page.length - 1];
      return json(route, 200, {
        ok: true,
        items: page,
        nextCursor: items.length > start + limit && last ? last.id : null
      });
    }
    if (path === '/api/study/item' && method === 'PUT') {
      const body = req.postDataJSON() || {};
      const item = {
        id: IRON_ID,
        itemType: body.itemType || 'element',
        itemKey: body.itemKey || 'ferrum',
        title: body.title || 'Iron',
        href: body.href || '/periodic-table/ferrum',
        note: body.note || '',
        tags: body.tags || [],
        payload: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const existing = data.items.findIndex((row) => row.itemKey === item.itemKey && row.itemType === item.itemType);
      if (existing >= 0) data.items[existing] = { ...data.items[existing], ...item, id: data.items[existing].id };
      else data.items.unshift(item);
      const saved = data.items[existing >= 0 ? existing : 0];
      return json(route, 200, { ok: true, item: saved });
    }
    if (path === '/api/study/item' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      data.items = data.items.filter((item) => item.id !== id);
      return json(route, 200, { ok: true });
    }
    if (path === '/api/study/sets' && method === 'GET') {
      return json(route, 200, { ok: true, sets: data.sets });
    }
    if (path === '/api/study/sets' && method === 'POST') {
      const body = req.postDataJSON() || {};
      const set = {
        id: SET_ID,
        title: body.title || 'Untitled',
        description: body.description || '',
        cardCount: data.cards.length,
        dueCount: data.cards.filter((card) => !card.suspended).length,
        masteredCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.sets.unshift(set);
      return json(route, 200, { ok: true, set });
    }
    if (path === '/api/study/set' && method === 'GET') {
      const id = url.searchParams.get('id');
      const set = data.sets.find((row) => row.id === id) || data.sets[0] || {
        id: SET_ID,
        title: 'Metals',
        cardCount: data.cards.length,
        dueCount: data.cards.length,
        masteredCount: 0
      };
      return json(route, 200, {
        ok: true,
        set,
        items: data.items.map((item) => ({ itemId: item.id, item })),
        cards: data.cards,
        nextCursor: null
      });
    }
    if (path === '/api/study/set' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      data.sets = data.sets.filter((set) => set.id !== id);
      return json(route, 200, { ok: true });
    }
    if (path === '/api/study/set-item' && method === 'PUT') {
      return json(route, 200, { ok: true });
    }
    if (path === '/api/study/set-item' && method === 'DELETE') {
      return json(route, 200, { ok: true });
    }
    if (path === '/api/study/cards/generate' && method === 'POST') {
      if (!data.cards.length) {
        data.cards.push(dueCard(), dueCard({ id: CARD_B, front: 'Atomic number of iron?', back: '26' }));
      }
      if (data.sets[0]) {
        data.sets[0].cardCount = data.cards.length;
        data.sets[0].dueCount = data.cards.filter((card) => !card.suspended).length;
      }
      return json(route, 200, { ok: true, created: data.cards.length, skipped: 0, cards: data.cards });
    }
    if (path === '/api/study/card' && method === 'POST') {
      const body = req.postDataJSON() || {};
      const card = dueCard({
        id: CARD_A,
        front: body.front,
        back: body.back
      });
      data.cards.unshift(card);
      return json(route, 200, { ok: true, card });
    }
    if (path === '/api/study/card' && method === 'PUT') {
      const body = req.postDataJSON() || {};
      const card = data.cards.find((row) => row.id === body.id) || { id: body.id };
      Object.assign(card, body);
      return json(route, 200, { ok: true, card });
    }
    if (path === '/api/study/card' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      data.cards = data.cards.filter((card) => card.id !== id);
      return json(route, 200, { ok: true });
    }
    if (path === '/api/study/progress') {
      return json(route, 200, { ok: true, items: [], nextCursor: null });
    }

    return json(route, 404, { ok: false, error: 'not mocked', path });
  });

  return { user, store: data, setSignedIn(v) { signedIn = v; } };
}

module.exports = {
  IRON_ID,
  SET_ID,
  CARD_A,
  CARD_B,
  userFixture,
  createStore,
  dueCard,
  installApi,
  preparePage,
  waitForWorkspace,
  gotoWorkspace
};
