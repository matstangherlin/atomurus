/*
 * Browser platform adapter. Pause/resume map to page visibility, network to
 * online/offline events, external URLs to a new tab with no opener.
 */

import { readSafeAreaFromCss } from './safe-area.js';

export function createWebAdapter(win = globalThis.window) {
  const doc = win?.document;
  const nav = win?.navigator;

  function on(target, type, handler) {
    if (!target || typeof target.addEventListener !== 'function') return () => {};
    target.addEventListener(type, handler);
    return () => target.removeEventListener(type, handler);
  }

  return {
    getPlatform: () => 'web',
    isOnline: () => (nav && typeof nav.onLine === 'boolean' ? nav.onLine : true),
    onNetworkChange(fn) {
      const offA = on(win, 'online', () => fn({ online: true }));
      const offB = on(win, 'offline', () => fn({ online: false }));
      return () => { offA(); offB(); };
    },
    onPause(fn) {
      return on(doc, 'visibilitychange', () => { if (doc.visibilityState === 'hidden') fn(); });
    },
    onResume(fn) {
      return on(doc, 'visibilitychange', () => { if (doc.visibilityState === 'visible') fn(); });
    },
    openExternalUrl(url) {
      const opened = win.open(url, '_blank', 'noopener,noreferrer');
      if (opened) opened.opener = null;
      return Boolean(opened);
    },
    getSafeArea: () => readSafeAreaFromCss(doc)
  };
}
