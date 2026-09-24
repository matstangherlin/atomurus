/*
 * Development performance instruments.
 *
 *   perf.mark('study:start') … perf.measure('study', 'study:start')
 *   perf.observeLongTasks()   // logs main-thread tasks > 50ms
 *
 * Off by default in production: enabled when the runtime config has dev:true,
 * on localhost, or with ?perf=1. Canonical span names below so reports compare
 * like with like.
 */

export const PERF_SPANS = Object.freeze([
  'bootstrap', 'auth', 'study', 'review', 'lab', 'periodic-table', 'viewer'
]);

export const LONG_TASK_MS = 50;

export function perfEnabled(win = globalThis.window) {
  try {
    if (!win) return false;
    if (win.__ATOMURUS_CONFIG__ && win.__ATOMURUS_CONFIG__.dev) return true;
    const host = win.location && win.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    return new URLSearchParams(win.location.search).get('perf') === '1';
  } catch (_err) {
    return false;
  }
}

export function createPerf({ enabled = false, performanceImpl = globalThis.performance, PerformanceObserverImpl = globalThis.PerformanceObserver, log = (...a) => console.info(...a) } = {}) {
  const longTasks = [];
  let observer = null;
  const on = Boolean(enabled && performanceImpl && typeof performanceImpl.mark === 'function');

  return {
    enabled: on,
    mark(name) {
      if (!on) return;
      try { performanceImpl.mark(`atomurus:${name}`); } catch (_err) { /* ignore */ }
    },
    measure(span, startMark, endMark) {
      if (!on) return null;
      try {
        const start = `atomurus:${startMark || `${span}:start`}`;
        const end = endMark ? `atomurus:${endMark}` : undefined;
        const entry = performanceImpl.measure(`atomurus:${span}`, start, end);
        return entry ? entry.duration : null;
      } catch (_err) {
        return null;
      }
    },
    observeLongTasks() {
      if (!on || observer || typeof PerformanceObserverImpl !== 'function') return () => {};
      try {
        observer = new PerformanceObserverImpl((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > LONG_TASK_MS) {
              longTasks.push({ start: entry.startTime, duration: entry.duration, name: entry.name });
              log(`[perf] long task ${Math.round(entry.duration)}ms`);
            }
          }
        });
        observer.observe({ type: 'longtask', buffered: true });
      } catch (_err) {
        observer = null;
      }
      return () => {
        if (observer) observer.disconnect();
        observer = null;
      };
    },
    longTasks: () => longTasks.slice()
  };
}
