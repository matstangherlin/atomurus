/*
 * Capacitor platform adapter — PREPARATION ONLY (A1.0).
 *
 * This file is the only place that knows Capacitor exists. It does not import
 * @capacitor/*: the Android bootstrap (A1.4) passes the plugin objects in:
 *
 *   createCapacitorAdapter({ Capacitor, App, Network, Browser })
 *
 * so src/core stays platform-free and this adapter stays testable with fakes.
 * Target line when the Android wave starts: Capacitor 8, Android API 36.
 */

import { readSafeAreaFromCss } from '../../core/platform/safe-area.js';

export function createCapacitorAdapter(bridge = {}, win = globalThis.window) {
  const { Capacitor, App, Network, Browser } = bridge;
  if (!Capacitor || typeof Capacitor.getPlatform !== 'function') {
    throw new Error('createCapacitorAdapter needs the Capacitor core object');
  }
  let online = win?.navigator?.onLine !== false;

  if (Network && typeof Network.getStatus === 'function') {
    Promise.resolve(Network.getStatus()).then((status) => {
      if (status && typeof status.connected === 'boolean') online = status.connected;
    }).catch(() => {});
  }

  function pluginListener(plugin, event, handler) {
    if (!plugin || typeof plugin.addListener !== 'function') return () => {};
    const pending = Promise.resolve(plugin.addListener(event, handler));
    return () => { pending.then((h) => h && typeof h.remove === 'function' && h.remove()).catch(() => {}); };
  }

  return {
    getPlatform: () => Capacitor.getPlatform(),
    isOnline: () => online,
    onNetworkChange(fn) {
      return pluginListener(Network, 'networkStatusChange', (status) => {
        online = Boolean(status && status.connected);
        fn({ online, connectionType: status?.connectionType || null });
      });
    },
    onPause: (fn) => pluginListener(App, 'pause', () => fn()),
    onResume: (fn) => pluginListener(App, 'resume', () => fn()),
    openExternalUrl(url) {
      if (Browser && typeof Browser.open === 'function') return Browser.open({ url });
      return win?.open?.(url, '_blank', 'noopener,noreferrer');
    },
    getSafeArea: () => readSafeAreaFromCss(win?.document)
  };
}
