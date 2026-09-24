/*
 * Disposable scope — the cleanup contract for every feature and viewer.
 *
 *   mount   → scope = createScope('study')
 *             scope.listen(window, 'resize', onResize)
 *             scope.interval(tick, 1000)
 *             scope.observe(new ResizeObserver(...))
 *             scope.frameLoop(render)
 *   unmount → scope.dispose()   // everything above is gone
 *
 * Nothing a feature registers through a scope can outlive it. `stats()`
 * exposes live counts so tests can assert "mount ×20, unmount ×20 → 0".
 */

let liveScopes = 0;

export function liveScopeCount() {
  return liveScopes;
}

export function createScope(name = 'scope', env = globalThis) {
  const disposers = new Set();
  const counts = { listeners: 0, timers: 0, intervals: 0, observers: 0, frames: 0, loops: 0, children: 0, custom: 0 };
  let disposed = false;
  let disposing = false;
  liveScopes += 1;

  function track(kind, dispose) {
    if (disposed || disposing) {
      /* Registering on a dead scope is a bug in the caller; clean up now so it
         cannot leak, and say so in development. */
      try { dispose(); } catch (_err) { /* ignore */ }
      return () => {};
    }
    counts[kind] += 1;
    let done = false;
    const entry = () => {
      if (done) return;
      done = true;
      counts[kind] -= 1;
      disposers.delete(entry);
      dispose();
    };
    disposers.add(entry);
    return entry;
  }

  const scope = {
    name,
    get disposed() { return disposed; },

    listen(target, type, handler, options) {
      if (!target || typeof target.addEventListener !== 'function') return () => {};
      target.addEventListener(type, handler, options);
      return track('listeners', () => target.removeEventListener(type, handler, options));
    },

    timeout(fn, ms) {
      let cancel = () => {};
      const id = env.setTimeout(() => {
        cancel();
        fn();
      }, ms);
      cancel = track('timers', () => env.clearTimeout(id));
      return cancel;
    },

    interval(fn, ms) {
      const id = env.setInterval(fn, ms);
      return track('intervals', () => env.clearInterval(id));
    },

    observe(observer) {
      if (!observer || typeof observer.disconnect !== 'function') return () => {};
      return track('observers', () => observer.disconnect());
    },

    frame(fn) {
      let cancel = () => {};
      const id = env.requestAnimationFrame((ts) => {
        cancel();
        fn(ts);
      });
      cancel = track('frames', () => env.cancelAnimationFrame(id));
      return cancel;
    },

    /*
     * One animation loop owned by the scope. Starting it twice keeps one loop
     * (no duplicated rAF chains). pause()/resume() for background and
     * off-screen; dispose() of the scope stops it for good.
     */
    frameLoop(tick) {
      let rafId = 0;
      let running = false;
      const step = (ts) => {
        rafId = 0;
        if (!running) return;
        const keepGoing = tick(ts);
        if (running && keepGoing !== false) rafId = env.requestAnimationFrame(step);
        else running = false;
      };
      const loop = {
        start() {
          if (disposed || running) return;
          running = true;
          rafId = env.requestAnimationFrame(step);
        },
        stop() {
          running = false;
          if (rafId) env.cancelAnimationFrame(rafId);
          rafId = 0;
        },
        get running() { return running; }
      };
      track('loops', () => loop.stop());
      return loop;
    },

    child(childName) {
      const kid = createScope(`${name}/${childName || 'child'}`, env);
      const remove = track('children', () => kid.dispose());
      kid.add(() => remove());
      return kid;
    },

    add(dispose) {
      if (typeof dispose !== 'function') return () => {};
      return track('custom', dispose);
    },

    stats() {
      return { ...counts, total: disposers.size, disposed };
    },

    dispose() {
      if (disposed || disposing) return;
      /* Mark first so disposers that touch the scope do not re-register. */
      disposing = true;
      const entries = Array.from(disposers).reverse();
      for (const entry of entries) {
        try { entry(); } catch (_err) { /* one bad disposer must not strand the rest */ }
      }
      disposed = true;
      liveScopes -= 1;
    }
  };
  return scope;
}
