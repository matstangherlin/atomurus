/*
 * Feature host — lazy loading + failure isolation ("error boundary") for
 * vanilla JS features.
 *
 * States:  idle → loading → ready
 *                        ↘ failed (retry)
 *
 * A feature module is `{ mount(ctx) → { update?(params), unmount?() } }`.
 * ctx = { root, scope, services, params, featureId }.
 *
 * Guarantees:
 *   - a feature is imported only when first shown (route lazy load)
 *   - only ONE feature is mounted at a time; leaving a feature disposes its
 *     scope (listeners, timers, observers, render loops) — nothing stays
 *     mounted invisibly
 *   - a feature that throws while loading or mounting renders an error state
 *     with Retry; the shell (nav, auth, toasts) keeps working
 *   - loading is bounded by a timeout; no eternal spinner
 *   - a slow import that finishes after the user moved on is discarded
 */

import { createScope } from '../../core/lifecycle/scope.js';

export const FeatureState = Object.freeze({ IDLE: 'idle', LOADING: 'loading', READY: 'ready', FAILED: 'failed' });

export function createFeatureHost({ root, registry, services, env = globalThis, loadTimeoutMs = 15000, renderLoading, renderFailed, onState }) {
  if (!root) throw new Error('feature host needs a root element');
  const moduleCache = new Map();
  let current = null; /* { id, scope, instance, params } */
  let state = FeatureState.IDLE;
  let token = 0;
  let mounts = 0;

  function setState(next, detail) {
    state = next;
    root.setAttribute('data-feature-state', next);
    if (typeof onState === 'function') {
      try { onState(next, detail); } catch (_err) { /* observer errors stay local */ }
    }
  }

  function withTimeout(promise, ms, id) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_resolve, reject) => {
        timer = env.setTimeout(() => {
          const err = new Error(`Feature "${id}" took longer than ${ms}ms to load`);
          err.code = 'FEATURE_TIMEOUT';
          reject(err);
        }, ms);
      })
    ]).finally(() => env.clearTimeout(timer));
  }

  function load(id) {
    if (moduleCache.has(id)) return moduleCache.get(id);
    const entry = registry[id];
    if (!entry || typeof entry.load !== 'function') {
      return Promise.reject(Object.assign(new Error(`Unknown feature "${id}"`), { code: 'FEATURE_UNKNOWN' }));
    }
    const p = withTimeout(Promise.resolve().then(entry.load), loadTimeoutMs, id)
      .then((mod) => (mod && mod.default) || mod)
      .catch((err) => {
        moduleCache.delete(id); /* allow Retry to import again */
        throw err;
      });
    moduleCache.set(id, p);
    return p;
  }

  function teardown() {
    if (!current) return;
    const leaving = current;
    current = null;
    try {
      if (leaving.instance && typeof leaving.instance.unmount === 'function') leaving.instance.unmount();
    } catch (err) {
      if (env.console) env.console.error(`[feature-host] ${leaving.id} unmount failed`, err);
    }
    leaving.scope.dispose();
    mounts -= 1;
    root.textContent = '';
  }

  async function show(id, params = {}) {
    if (current && current.id === id && state === FeatureState.READY) {
      current.params = params;
      if (current.instance && typeof current.instance.update === 'function') current.instance.update(params);
      return current.instance;
    }
    const my = ++token;
    teardown();
    setState(FeatureState.LOADING, { id });
    root.textContent = '';
    if (typeof renderLoading === 'function') renderLoading(root, id);

    let mod;
    try {
      mod = await load(id);
    } catch (err) {
      if (my !== token) return null;
      fail(id, params, err);
      return null;
    }
    if (my !== token) return null; /* user navigated on while this loaded */

    const scope = createScope(`feature:${id}`, env);
    root.textContent = '';
    try {
      const instance = (await mod.mount({ root, scope, services, params, featureId: id })) || {};
      if (my !== token) {
        /* navigated away during an async mount */
        try { if (typeof instance.unmount === 'function') instance.unmount(); } finally { scope.dispose(); }
        return null;
      }
      current = { id, scope, instance, params };
      mounts += 1;
      setState(FeatureState.READY, { id });
      return instance;
    } catch (err) {
      scope.dispose();
      if (my !== token) return null;
      fail(id, params, err);
      return null;
    }
  }

  function fail(id, params, err) {
    root.textContent = '';
    setState(FeatureState.FAILED, { id, error: err });
    if (typeof renderFailed === 'function') {
      renderFailed(root, id, err, () => show(id, params));
    }
  }

  return {
    show,
    leave() {
      token += 1;
      teardown();
      setState(FeatureState.IDLE, {});
    },
    get state() { return state; },
    get currentId() { return current ? current.id : null; },
    mountedCount: () => mounts,
    currentScopeStats: () => (current ? current.scope.stats() : null)
  };
}
