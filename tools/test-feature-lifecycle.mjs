// A1.0 — cleanup contract: scopes, feature host (lazy load, one mounted
// feature, error boundary, load timeout, stale navigation), and the app
// lifecycle. mount → listeners; unmount → none left.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createScope, liveScopeCount } from '../src/core/lifecycle/scope.js';
import { createFeatureHost, FeatureState } from '../src/app/shell/feature-host.js';

function fakeEnv() {
  let nextId = 1;
  const timers = new Map();
  const frames = new Map();
  return {
    timers, frames,
    setTimeout(fn, ms) { const id = nextId++; timers.set(id, { fn, ms, kind: 't' }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn, ms) { const id = nextId++; timers.set(id, { fn, ms, kind: 'i' }); return id; },
    clearInterval(id) { timers.delete(id); },
    requestAnimationFrame(fn) { const id = nextId++; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    flushFrame(ts = 16) { const due = Array.from(frames.entries()); frames.clear(); for (const [, fn] of due) fn(ts); },
    console: { error() {} }
  };
}

function target() {
  const map = new Map();
  return {
    addEventListener(t, fn) { if (!map.has(t)) map.set(t, new Set()); map.get(t).add(fn); },
    removeEventListener(t, fn) { map.get(t)?.delete(fn); },
    count() { let n = 0; for (const s of map.values()) n += s.size; return n; }
  };
}

function observer() {
  return { disconnected: false, disconnect() { this.disconnected = true; } };
}

function fakeRoot() {
  const attrs = {};
  return { attrs, textContent: '', children: [], setAttribute(k, v) { attrs[k] = v; }, appendChild(c) { this.children.push(c); } };
}

test('scope removes every listener, timer, interval, observer and frame it created', () => {
  const env = fakeEnv();
  const win = target();
  const before = liveScopeCount();
  const scope = createScope('feature', env);
  scope.listen(win, 'resize', () => {});
  scope.listen(win, 'visibilitychange', () => {});
  scope.timeout(() => {}, 1000);
  scope.interval(() => {}, 1000);
  const ro = observer();
  scope.observe(ro);
  scope.frame(() => {});
  let custom = 0;
  scope.add(() => { custom += 1; });
  assert.equal(win.count(), 2);
  assert.equal(env.timers.size, 2);
  assert.equal(env.frames.size, 1);
  assert.equal(liveScopeCount(), before + 1);

  scope.dispose();
  assert.equal(win.count(), 0, 'listeners removed');
  assert.equal(env.timers.size, 0, 'timers and intervals cleared');
  assert.equal(env.frames.size, 0, 'animation frame cancelled');
  assert.equal(ro.disconnected, true, 'observer disconnected');
  assert.equal(custom, 1);
  assert.equal(liveScopeCount(), before);
  scope.dispose(); /* idempotent */
  assert.equal(custom, 1);

  /* registering on a disposed scope cleans up immediately */
  scope.listen(win, 'resize', () => {});
  assert.equal(win.count(), 0);
});

test('fired timeouts leave the scope; a frame loop is single and stoppable', () => {
  const env = fakeEnv();
  const scope = createScope('x', env);
  scope.timeout(() => {}, 5);
  const [[id, t]] = Array.from(env.timers.entries());
  env.timers.delete(id); t.fn();
  assert.equal(scope.stats().timers, 0);

  let ticks = 0;
  const loop = scope.frameLoop(() => { ticks += 1; });
  loop.start();
  loop.start(); /* no duplicate chain */
  assert.equal(env.frames.size, 1);
  env.flushFrame(); env.flushFrame();
  assert.equal(ticks, 2);
  assert.equal(env.frames.size, 1);
  loop.stop();
  assert.equal(env.frames.size, 0);
  loop.start();
  scope.dispose();
  assert.equal(env.frames.size, 0, 'dispose stops the loop');
  loop.start();
  assert.equal(env.frames.size, 0, 'a disposed loop cannot restart');
});

test('child scopes die with the parent, and alone', () => {
  const env = fakeEnv();
  const win = target();
  const parent = createScope('p', env);
  const a = parent.child('a');
  a.listen(win, 'x', () => {});
  const b = parent.child('b');
  b.listen(win, 'y', () => {});
  a.dispose();
  assert.equal(win.count(), 1);
  assert.equal(parent.stats().children, 1);
  parent.dispose();
  assert.equal(win.count(), 0);
  assert.equal(b.disposed, true);
});

function registry(overrides = {}) {
  const loads = {};
  const mounts = {};
  const win = target();
  function feature(id) {
    return {
      load: async () => {
        loads[id] = (loads[id] || 0) + 1;
        return {
          default: {
            mount({ scope }) {
              mounts[id] = (mounts[id] || 0) + 1;
              scope.listen(win, 'resize', () => {});
              scope.interval(() => {}, 1000);
              return { unmount() { mounts[id] -= 1; } };
            }
          }
        };
      }
    };
  }
  return { loads, mounts, win, reg: { home: feature('home'), study: feature('study'), review: feature('review'), ...overrides } };
}

test('feature host: lazy load on first show, one mounted feature, cleanup on leave (×20)', async () => {
  const env = fakeEnv();
  const { loads, mounts, win, reg } = registry();
  const root = fakeRoot();
  const states = [];
  const host = createFeatureHost({ root, registry: reg, env, onState: (s) => states.push(s) });

  assert.equal(Object.keys(loads).length, 0, 'nothing imported before a route asks');
  await host.show('home');
  assert.deepEqual(Object.keys(loads), ['home'], 'opening home does not load study or review');
  await host.show('review');
  assert.equal(loads.review, 1);
  assert.equal(mounts.home, 0, 'home unmounted when review mounted');

  for (let i = 0; i < 20; i += 1) {
    await host.show('study');
    await host.show('home');
  }
  assert.equal(loads.study, 1, 'modules are imported once, then cached');
  assert.equal(host.mountedCount(), 1);
  assert.equal(win.count(), 1, 'only the current feature has listeners');
  assert.equal(env.timers.size, 1, 'only the current feature has timers');
  host.leave();
  assert.equal(win.count(), 0);
  assert.equal(env.timers.size, 0);
  assert.equal(host.mountedCount(), 0, 'no feature stays mounted invisibly');
  assert.ok(states.includes(FeatureState.LOADING) && states.includes(FeatureState.READY));
});

test('feature host is an error boundary: failed import / mount → failed state + retry', async () => {
  const env = fakeEnv();
  let attempts = 0;
  const { reg } = registry({
    broken: { load: async () => { attempts += 1; if (attempts === 1) throw new Error('chunk failed'); return { default: { mount() { return {}; } } }; } },
    throws: { load: async () => ({ default: { mount() { throw new Error('boom'); } } }) }
  });
  const root = fakeRoot();
  let retryFn = null;
  const host = createFeatureHost({ root, registry: reg, env, renderFailed: (_el, _id, _err, retry) => { retryFn = retry; } });

  await host.show('broken');
  assert.equal(host.state, FeatureState.FAILED);
  assert.equal(root.attrs['data-feature-state'], 'failed');
  await retryFn();
  assert.equal(host.state, FeatureState.READY, 'retry imports again');

  await host.show('throws');
  assert.equal(host.state, FeatureState.FAILED);
  await host.show('home');
  assert.equal(host.state, FeatureState.READY, 'the shell keeps working after a feature fails');
  await host.show('nope');
  assert.equal(host.state, FeatureState.FAILED);
});

test('feature host: slow import times out; navigation during load discards it', async () => {
  const env = { ...fakeEnv(), setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (id) => clearTimeout(id) };
  let release;
  const { reg, mounts } = registry({
    slow: { load: () => new Promise((resolve) => { release = () => resolve({ default: { mount() { mounts.slow = 1; return {}; } } }); }) },
    hang: { load: () => new Promise(() => {}) }
  });
  const root = fakeRoot();
  const host = createFeatureHost({ root, registry: reg, env, loadTimeoutMs: 30 });

  const pending = host.show('slow');
  await host.show('home');
  release();
  await pending;
  assert.equal(host.currentId, 'home', 'late import does not steal the screen');
  assert.equal(mounts.slow, undefined, 'discarded feature never mounted');

  await host.show('hang');
  assert.equal(host.state, FeatureState.FAILED, 'no eternal spinner');
});
