/*
 * App lifecycle contract.
 *
 *   onAppPause(fn)       app went to background / tab hidden
 *   onAppResume(fn)      app is visible again
 *   onNetworkChange(fn)  { online }
 *   onRouteEnter(fn)     { route, params }
 *   onRouteLeave(fn)     { route, params }
 *
 * Every subscription returns an unsubscribe, so a feature can hand it to its
 * scope: scope.add(lifecycle.onAppPause(pauseRenderLoop)).
 * `state()` tells late subscribers whether the app is currently paused.
 */

export function createAppLifecycle(platform) {
  const topics = { pause: new Set(), resume: new Set(), network: new Set(), routeEnter: new Set(), routeLeave: new Set() };
  let paused = false;
  let online = platform ? platform.isOnline() : true;
  let route = null;
  const unbind = [];

  function publish(topic, detail) {
    for (const fn of Array.from(topics[topic])) {
      try { fn(detail); } catch (err) {
        /* A broken subscriber must not stop the others (or the app). */
        if (globalThis.console) console.error(`[lifecycle] ${topic} subscriber failed`, err);
      }
    }
  }

  function subscribe(topic, fn) {
    if (typeof fn !== 'function') return () => {};
    topics[topic].add(fn);
    return () => topics[topic].delete(fn);
  }

  if (platform) {
    unbind.push(platform.onPause(() => {
      if (paused) return;
      paused = true;
      publish('pause');
    }));
    unbind.push(platform.onResume(() => {
      if (!paused) return;
      paused = false;
      publish('resume');
    }));
    unbind.push(platform.onNetworkChange((detail) => {
      online = Boolean(detail && detail.online);
      publish('network', { online });
    }));
  }

  return {
    onAppPause: (fn) => subscribe('pause', fn),
    onAppResume: (fn) => subscribe('resume', fn),
    onNetworkChange: (fn) => subscribe('network', fn),
    onRouteEnter: (fn) => subscribe('routeEnter', fn),
    onRouteLeave: (fn) => subscribe('routeLeave', fn),

    /* Called by the router, never by features. */
    enterRoute(next) {
      if (route) publish('routeLeave', route);
      route = next || null;
      if (route) publish('routeEnter', route);
    },

    state: () => ({ paused, online, route }),
    subscriberCount: () => Object.values(topics).reduce((sum, set) => sum + set.size, 0),

    destroy() {
      for (const off of unbind.splice(0)) {
        try { off(); } catch (_err) { /* ignore */ }
      }
      for (const set of Object.values(topics)) set.clear();
    }
  };
}
