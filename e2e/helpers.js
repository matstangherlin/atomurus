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
    studyInsights: on,
    focusReview: on,
    advancedStudyStats: on,
    exportPdf: on,
    adsFree: on,
    adminConsole: false,
    proLab: on,
    advancedCalculations: on,
    advancedElementCompare: on,
    advancedMoleculeCompare: on,
    advancedAtomicCompare: on,
    savedLabSessions: on,
    chemistrySolver: on,
    reactionWorkbench: on,
    reactionBalancer: on,
    stoichiometrySolver: on,
    limitingReagentSolver: on,
    yieldSolver: on,
    formulaSolver: on,
    solutionBuilder: on
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
    reviews: [],
    labSessions: []
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
    if (path === '/api/study/insights' && method === 'GET') {
      const range = url.searchParams.get('range') === '7d' ? '7d' : '30d';
      const days = range === '7d' ? 7 : 30;
      const setFilter = String(url.searchParams.get('setId') || url.searchParams.get('set') || '').trim();
      const sets = (data.sets || []).filter((set) => !setFilter || set.id === setFilter);
      const hasHistory = (data.reviews && data.reviews.length) || data.cards.length;
      const activity = Array.from({ length: days }, (_, i) => ({
        date: `2026-08-${String(Math.max(1, 28 - days + 1 + i)).padStart(2, '0')}`,
        weekday: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][(i + 5) % 7],
        reviews: hasHistory && i % 3 === 0 ? 4 : hasHistory && i % 2 === 0 ? 2 : 0
      }));
      const weak = data.cards
        .filter((card) => !card.suspended && ((card.lapses || 0) > 0 || (card.easeFactor || 2.5) < 2.5 || card.reviewState === 'learning'))
        .sort((a, b) => (b.lapses || 0) - (a.lapses || 0))
        .slice(0, 5)
        .map((card) => ({
          id: card.id,
          studySetId: card.studySetId || (data.sets[0] && data.sets[0].id) || SET_ID,
          studySetTitle: (data.sets[0] && data.sets[0].title) || 'Metals',
          front: card.front,
          lapses: card.lapses || 0,
          reviewState: card.reviewState || 'learning',
          dueAt: card.dueAt,
          dueNow: true
        }));
      return json(route, 200, {
        ok: true,
        range,
        setId: setFilter || null,
        summary: {
          reviews: hasHistory ? 12 : 0,
          activeDays: hasHistory ? 3 : 0,
          masteredCards: hasHistory ? 1 : 0,
          dueNow: data.cards.filter((card) => !card.suspended).length,
          confidentReviews: hasHistory ? 0.75 : 0
        },
        ratings: hasHistory ? { again: 1, hard: 2, good: 6, easy: 3 } : { again: 0, hard: 0, good: 0, easy: 0 },
        activity,
        consistency: { windowDays: Math.min(14, days), activeDays: hasHistory ? 3 : 0 },
        dueForecast: ['2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'].map((date, i) => ({
          date,
          weekday: ['fri', 'sat', 'sun', 'mon', 'tue', 'wed', 'thu'][i],
          kind: i === 0 ? 'today' : i === 1 ? 'tomorrow' : 'weekday',
          due: hasHistory ? [2, 1, 0, 3, 1, 0, 2][i] : 0
        })),
        weakCards: weak,
        sets: sets.map((set) => ({
          id: set.id,
          title: set.title,
          totalCards: data.cards.length,
          mastered: set.masteredCount || 0,
          learning: set.learningCount || 0,
          newCards: set.newCount || 0,
          due: set.dueCount || data.cards.length,
          reviews: hasHistory ? 12 : 0,
          needsAttention: weak.length,
          masteredPercent: 0
        }))
      });
    }
    if (path === '/api/study/review/queue') {
      const mode = String(url.searchParams.get('mode') || 'due').toLowerCase();
      let cards = data.cards.filter((card) => !card.suspended);
      if (mode === 'weak') {
        cards = cards
          .filter((card) => (card.lapses || 0) > 0 || (card.easeFactor || 2.5) < 2.5 || card.reviewState === 'learning')
          .sort((a, b) => (b.lapses || 0) - (a.lapses || 0));
        const n = Number(url.searchParams.get('limit'));
        cards = cards.slice(0, n === 10 || n === 30 ? n : 20);
      }
      return json(route, 200, {
        ok: true,
        mode: mode === 'weak' ? 'weak' : 'due',
        cards
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
      const existing = data.items.findIndex((row) => row.itemKey === (body.itemKey || 'ferrum') && row.itemType === (body.itemType || 'element'));
      const item = {
        id: existing >= 0 ? data.items[existing].id : `00000000-0000-4000-8000-${String(data.items.length + 20).padStart(12, '0')}`,
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

    if (path.startsWith('/api/pro-lab/')) {
      if (!signedIn) return json(route, 401, { ok: false, code: 'session_expired', error: 'Sign in required' });
      if (locked) return json(route, 403, { ok: false, code: 'feature_locked', feature: 'proLab', upgradeUrl: '/pricing' });
    }

    if (path === '/api/pro-lab/sessions' && method === 'GET') {
      return json(route, 200, {
        ok: true,
        sessions: data.labSessions,
        quota: { used: data.labSessions.length, max: 200 }
      });
    }
    if (path === '/api/pro-lab/sessions' && method === 'POST') {
      const body = req.postDataJSON() || {};
      const session = {
        id: `aaaaaaaa-bbbb-4ccc-8ddd-${String(data.labSessions.length + 1).padStart(12, '0')}`,
        sessionType: body.sessionType || 'calculation',
        title: body.title || 'Untitled',
        state: body.state || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.labSessions.unshift(session);
      return json(route, 200, { ok: true, session });
    }
    if (path === '/api/pro-lab/session' && method === 'GET') {
      const id = url.searchParams.get('id');
      const session = data.labSessions.find((row) => row.id === id);
      if (!session) return json(route, 404, { ok: false, code: 'not_found' });
      return json(route, 200, { ok: true, session });
    }
    if (path === '/api/pro-lab/session' && method === 'PUT') {
      const body = req.postDataJSON() || {};
      const session = data.labSessions.find((row) => row.id === body.id);
      if (!session) return json(route, 404, { ok: false, code: 'not_found' });
      Object.assign(session, {
        title: body.title || session.title,
        sessionType: body.sessionType || session.sessionType,
        state: body.state || session.state,
        updatedAt: new Date().toISOString()
      });
      return json(route, 200, { ok: true, session });
    }
    if (path === '/api/pro-lab/session' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      data.labSessions = data.labSessions.filter((row) => row.id !== id);
      return json(route, 200, { ok: true, deleted: true, id });
    }
    if (path === '/api/pro-lab/calculate' && method === 'POST') {
      const body = req.postDataJSON() || {};
      const scenarios = body.scenarios || body.formulas || [];
      const results = scenarios.map((row, index) => {
        if (body.calculator === 'molar_mass') {
          return { label: row.label || row.formula, formula: row.formula || row, molarMass: 18.015, molarMassDisplay: '18.015', unit: 'g/mol', atomCount: 3, composition: [] };
        }
        const C1 = Number(row.C1);
        const V1 = Number(row.V1);
        const C2 = Number(row.C2);
        const V2 = C2 ? (C1 * V1) / C2 : Number(row.V2);
        return { label: row.label || `Scenario ${index + 1}`, C1, V1, C2, V2, solved: V2, unit: 'mL' };
      });
      return json(route, 200, { ok: true, calculator: body.calculator, results });
    }
    if (path === '/api/pro-lab/elements/compare' && method === 'GET') {
      return json(route, 200, {
        ok: true,
        maxElements: 4,
        properties: ['atomicNumber', 'atomicMass', 'period', 'group', 'category', 'electronegativity'],
        chartProperties: ['atomicMass', 'electronegativity', 'period', 'group']
      });
    }
    if (path === '/api/pro-lab/elements/compare' && method === 'POST') {
      const body = req.postDataJSON() || {};
      const catalog = {
        26: { atomicNumber: 26, symbol: 'Fe', name: 'Iron', latin: 'ferrum', itemKey: 'ferrum', href: '/periodic-table/ferrum', atomicMass: 55.845, atomicMassDisplay: '55.845', period: 4, group: 8, category: 'transition', electronegativity: 1.83 },
        27: { atomicNumber: 27, symbol: 'Co', name: 'Cobalt', latin: 'cobaltum', itemKey: 'cobaltum', href: '/periodic-table/cobaltum', atomicMass: 58.933, atomicMassDisplay: '58.933', period: 4, group: 9, category: 'transition', electronegativity: 1.88 },
        28: { atomicNumber: 28, symbol: 'Ni', name: 'Nickel', latin: 'niccolum', itemKey: 'niccolum', href: '/periodic-table/niccolum', atomicMass: 58.693, atomicMassDisplay: '58.693', period: 4, group: 10, category: 'transition', electronegativity: 1.91 },
        29: { atomicNumber: 29, symbol: 'Cu', name: 'Copper', latin: 'cuprum', itemKey: 'cuprum', href: '/periodic-table/cuprum', atomicMass: 63.546, atomicMassDisplay: '63.546', period: 4, group: 11, category: 'transition', electronegativity: 1.9 }
      };
      const numbers = (body.atomicNumbers || []).map((entry) => Number(typeof entry === 'object' ? entry.atomicNumber || entry.z : entry));
      const elements = numbers.map((z) => catalog[z]).filter(Boolean);
      const max = Math.max(...elements.map((el) => el.atomicMass), 1);
      return json(route, 200, {
        ok: true,
        elements,
        properties: body.properties || ['atomicNumber', 'atomicMass', 'period', 'group'],
        chart: {
          property: 'atomicMass',
          max,
          bars: elements.map((el) => ({ atomicNumber: el.atomicNumber, symbol: el.symbol, value: el.atomicMass, ratio: el.atomicMass / max }))
        }
      });
    }
    if (path === '/api/pro-lab/molecules/compare' && method === 'GET') {
      return json(route, 200, {
        ok: true,
        maxMolecules: 2,
        measuresBonds: false,
        catalog: [
          { id: 'water', formula: 'H2O', name: 'Water' },
          { id: 'co2', formula: 'CO2', name: 'Carbon dioxide' }
        ]
      });
    }
    if (path === '/api/pro-lab/molecules/compare' && method === 'POST') {
      const body = req.postDataJSON() || {};
      const catalog = {
        water: { id: 'water', formula: 'H2O', name: 'Water', itemKey: 'water', href: '/viewer/molecules?mol=water', molarMass: 18.015, molarMassDisplay: '18.015', atomCount: 3, composition: [{ symbol: 'H', count: 2, massPercent: 11.19 }, { symbol: 'O', count: 1, massPercent: 88.81 }] },
        co2: { id: 'co2', formula: 'CO2', name: 'Carbon dioxide', itemKey: 'co2', href: '/viewer/molecules?mol=co2', molarMass: 44.009, molarMassDisplay: '44.009', atomCount: 3, composition: [{ symbol: 'C', count: 1, massPercent: 27.29 }, { symbol: 'O', count: 2, massPercent: 72.71 }] }
      };
      return json(route, 200, {
        ok: true,
        measuresBonds: false,
        molecules: (body.moleculeIds || ['water', 'co2']).map((id) => catalog[id]).filter(Boolean)
      });
    }
    if (path === '/api/pro-lab/atomic/compare' && method === 'POST') {
      const body = req.postDataJSON() || {};
      const catalog = {
        11: { atomicNumber: 11, symbol: 'Na', name: 'Sodium', latin: 'natrium', itemKey: 'natrium', href: '/periodic-table/natrium', electronConfig: '[Ne] 3s1', shells: [2, 8, 1], period: 3, group: 1 },
        17: { atomicNumber: 17, symbol: 'Cl', name: 'Chlorine', latin: 'chlorum', itemKey: 'chlorum', href: '/periodic-table/chlorum', electronConfig: '[Ne] 3s2 3p5', shells: [2, 8, 7], period: 3, group: 17 }
      };
      const numbers = (body.atomicNumbers || [11, 17]).map(Number);
      return json(route, 200, { ok: true, elements: numbers.map((z) => catalog[z] || catalog[11]) });
    }
    if (path === '/api/pro-lab/reaction/balance' && method === 'POST') {
      const body = req.postDataJSON() || {};
      try {
        const { balanceEquation } = await import('../netlify/lib/chemistry-reactions.mjs');
        return json(route, 200, balanceEquation(body.equation));
      } catch (err) {
        return json(route, err.status || 400, { ok: false, error: err.message, code: err.code || 'invalid_request' });
      }
    }
    if (path === '/api/pro-lab/reaction/solve' && method === 'POST') {
      const body = req.postDataJSON() || {};
      if (body.clientMolarMass != null || body.clientCoefficient != null || body.clientLimitingReagent != null) {
        return json(route, 400, { ok: false, code: 'invalid_request', error: 'Client-supplied solver results are not accepted.' });
      }
      try {
        const { solveStoichiometry } = await import('../netlify/lib/chemistry-stoichiometry.mjs');
        return json(route, 200, solveStoichiometry(body));
      } catch (err) {
        return json(route, err.status || 400, { ok: false, error: err.message, code: err.code || 'invalid_request' });
      }
    }
    if (path === '/api/pro-lab/formula/solve' && method === 'POST') {
      const body = req.postDataJSON() || {};
      try {
        const { solveFormula } = await import('../netlify/lib/chemistry-formula-solver.mjs');
        return json(route, 200, solveFormula(body));
      } catch (err) {
        return json(route, err.status || 400, { ok: false, error: err.message, code: err.code || 'invalid_request' });
      }
    }
    if (path === '/api/pro-lab/solutions/solve' && method === 'POST') {
      const body = req.postDataJSON() || {};
      try {
        const { solveSolution } = await import('../netlify/lib/chemistry-solutions.mjs');
        return json(route, 200, solveSolution(body));
      } catch (err) {
        return json(route, err.status || 400, { ok: false, error: err.message, code: err.code || 'invalid_request' });
      }
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
