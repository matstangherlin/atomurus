/*
 * Study API — migrated from study-client.js (A1.0).
 *
 * Same methods, same caching and invalidation, same error fields the
 * workspace reads (status, code, feature, upgradeUrl, body) — but every call
 * now goes through the canonical API client, so Study gains timeouts,
 * bounded GET retries, canonical error kinds and Bearer auth on Android
 * without a line of Android-specific code.
 *
 * Writes (save item, create set, grade a review, generate cards) are never
 * replayed automatically; see src/core/api/retry-policy.js.
 */

const SLOW_WRITE_MS = 30000; /* card generation and insights do real work server-side */

function cacheKey(parts) {
  return parts.map((part) => (part == null ? '' : String(part))).join('|');
}

export function createStudyApi(api) {
  if (!api || typeof api.request !== 'function') throw new Error('createStudyApi needs the core API client');

  let overviewCache = null;
  let itemsCache = Object.create(null);
  let progressCache = Object.create(null);
  let setsCache = null;
  let setCache = Object.create(null);
  let reviewOverviewCache = null;
  let insightsCache = null;

  function invalidate() {
    overviewCache = null;
    itemsCache = Object.create(null);
    progressCache = Object.create(null);
    setsCache = null;
    setCache = Object.create(null);
    reviewOverviewCache = null;
    insightsCache = null;
  }

  const get = (path, query, opts) => api.get(path, { ...(opts || {}), query });
  const write = (method, path, body, opts) => api.request(method, path, { ...(opts || {}), body: body || {} });
  const remove = (path, query) => api.request('DELETE', path, { query });
  const thenInvalidate = (p) => p.then((data) => { invalidate(); return data; });

  return {
    overview(force) {
      if (!force && overviewCache) return Promise.resolve(overviewCache);
      return get('/api/study/overview').then((data) => { overviewCache = data; return data; });
    },
    items(params, force) {
      const query = { ...(params || {}) };
      const signal = query.signal;
      delete query.signal;
      const key = cacheKey(['items', query.type, query.exclude, query.itemKey, query.tag, query.hasNote, query.q, query.cursor, query.limit]);
      if (!force && !signal && itemsCache[key]) return Promise.resolve(itemsCache[key]);
      return get('/api/study/items', query, signal ? { signal } : undefined).then((data) => { itemsCache[key] = data; return data; });
    },
    saveItem: (body) => thenInvalidate(write('PUT', '/api/study/item', body)),
    deleteItem: (id) => thenInvalidate(remove('/api/study/item', { id })),
    saveCalculatorRun: (body) => thenInvalidate(write('POST', '/api/study/calculator-history', body)),
    progressList(params, force) {
      const key = cacheKey(['progress', params && params.type, params && params.cursor, params && params.limit]);
      if (!force && progressCache[key]) return Promise.resolve(progressCache[key]);
      return get('/api/study/progress', params || {}).then((data) => { progressCache[key] = data; return data; });
    },
    putProgress(body) {
      return write('PUT', '/api/study/progress', body).then((data) => {
        progressCache = Object.create(null);
        overviewCache = null;
        return data;
      });
    },
    listSets(force) {
      if (!force && setsCache) return Promise.resolve(setsCache);
      return get('/api/study/sets').then((data) => { setsCache = data; return data; });
    },
    createSet: (body) => thenInvalidate(write('POST', '/api/study/sets', body)),
    getSet(id, params, force) {
      const key = cacheKey(['set', id, params && params.cursor, params && params.limit]);
      if (!force && setCache[key]) return Promise.resolve(setCache[key]);
      return get('/api/study/set', { id, ...(params || {}) }).then((data) => { setCache[key] = data; return data; });
    },
    updateSet: (body) => thenInvalidate(write('PUT', '/api/study/set', body)),
    deleteSet: (id) => thenInvalidate(remove('/api/study/set', { id })),
    addSetItem: (body) => thenInvalidate(write('PUT', '/api/study/set-item', body)),
    removeSetItem: (setId, itemId) => thenInvalidate(remove('/api/study/set-item', { setId, itemId })),
    createCard: (body) => thenInvalidate(write('POST', '/api/study/card', body)),
    updateCard: (body) => thenInvalidate(write('PUT', '/api/study/card', body)),
    deleteCard: (id) => thenInvalidate(remove('/api/study/card', { id })),
    generateCards: (body) => thenInvalidate(write('POST', '/api/study/cards/generate', body, { timeoutMs: SLOW_WRITE_MS })),
    reviewOverview(force) {
      if (!force && reviewOverviewCache) return Promise.resolve(reviewOverviewCache);
      return get('/api/study/review/overview').then((data) => { reviewOverviewCache = data; return data; });
    },
    insights(params, force) {
      const query = { ...(params || {}) };
      const key = cacheKey(['insights', query.range, query.setId, query.tz]);
      if (!force && insightsCache && insightsCache.key === key) return Promise.resolve(insightsCache.data);
      return get('/api/study/insights', query, { timeoutMs: SLOW_WRITE_MS }).then((data) => {
        insightsCache = { key, data };
        return data;
      });
    },
    reviewQueue: (params) => get('/api/study/review/queue', params || {}),
    submitReview(body) {
      return write('POST', '/api/study/review', body).then((data) => {
        reviewOverviewCache = null;
        insightsCache = null;
        setsCache = null;
        setCache = Object.create(null);
        return data;
      });
    },
    invalidate
  };
}
