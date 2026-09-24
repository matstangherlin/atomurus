/*
 * Platform service. Features ask *this*, never Capacitor or `window.Capacitor`:
 *
 *   Platform.isNative()  Platform.isWeb()  Platform.getPlatform()
 *   Platform.isOnline()  Platform.onNetworkChange(fn)
 *   Platform.onPause(fn) Platform.onResume(fn)
 *   Platform.openExternalUrl(url)
 *   Platform.getSafeArea()
 *
 * An adapter implements the same shape: WebAdapter (./web-adapter.js) in the
 * browser, CapacitorAdapter (src/adapters/capacitor) in the Android shell.
 * src/core never imports the latter; the app bootstrap picks one.
 */

import { ZERO_INSETS } from './safe-area.js';

export const PLATFORM_METHODS = Object.freeze([
  'getPlatform',
  'isOnline',
  'onNetworkChange',
  'onPause',
  'onResume',
  'openExternalUrl',
  'getSafeArea'
]);

export function assertPlatformAdapter(adapter) {
  const missing = PLATFORM_METHODS.filter((name) => typeof adapter?.[name] !== 'function');
  if (missing.length) {
    throw new Error(`Platform adapter is missing: ${missing.join(', ')}`);
  }
  return adapter;
}

const EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:']);

export function isSafeExternalUrl(raw) {
  try {
    const url = new URL(String(raw));
    return EXTERNAL_PROTOCOLS.has(url.protocol);
  } catch (_err) {
    return false;
  }
}

export function createPlatform(adapter) {
  assertPlatformAdapter(adapter);
  const noop = () => {};
  const subscribe = (method, fn) => (typeof fn === 'function' ? adapter[method](fn) || noop : noop);

  return Object.freeze({
    adapter,
    getPlatform: () => adapter.getPlatform(),
    isNative: () => adapter.getPlatform() !== 'web',
    isWeb: () => adapter.getPlatform() === 'web',
    isOnline: () => adapter.isOnline() !== false,
    onNetworkChange: (fn) => subscribe('onNetworkChange', fn),
    onPause: (fn) => subscribe('onPause', fn),
    onResume: (fn) => subscribe('onResume', fn),
    openExternalUrl(url) {
      if (!isSafeExternalUrl(url)) return Promise.resolve(false);
      return Promise.resolve(adapter.openExternalUrl(String(url))).then(() => true, () => false);
    },
    getSafeArea() {
      const value = adapter.getSafeArea() || ZERO_INSETS;
      return {
        top: Number(value.top) || 0,
        right: Number(value.right) || 0,
        bottom: Number(value.bottom) || 0,
        left: Number(value.left) || 0
      };
    }
  });
}
