/*
 * Entry for the packaged app bundle (dist/app/index.html).
 *
 * Composition root: the only module allowed to look for the native bridge.
 *   - inside the Android shell (A1.4): Capacitor plugins → native services
 *     (absolute API base, Bearer tokens in secure storage)
 *   - opened in a browser (QA of dist/app): web services
 *
 * If the native bridge is present but no secure storage plugin is, the app
 * refuses to start rather than keep tokens anywhere weaker.
 */

import { createCapacitorAdapter } from '../../adapters/capacitor/capacitor-adapter.js';
import { createCapacitorSecureStorage } from '../../adapters/capacitor/secure-storage-adapter.js';
import { createAppShell } from '../shell/app-shell.js';
import { createNativeServices, createWebServices } from './services.js';

function readPref(key) {
  try { return globalThis.localStorage.getItem(key); } catch (_err) { return null; }
}

function nativeBridge(win) {
  const cap = win.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) return null;
  const plugins = cap.Plugins || {};
  return {
    bridge: { Capacitor: cap, App: plugins.App, Network: plugins.Network, Browser: plugins.Browser },
    securePlugin: plugins.AtomurusSecureStorage || null
  };
}

function fatal(root, message) {
  root.textContent = '';
  const p = document.createElement('p');
  p.className = 'ui-body';
  p.setAttribute('role', 'alert');
  p.textContent = message;
  root.appendChild(p);
}

const root = document.getElementById('app');
const lang = readPref('atomurus-lang') === 'pt' ? 'pt' : (String(navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en');
let services = null;
const native = nativeBridge(window);

if (native) {
  if (!native.securePlugin) {
    fatal(root, 'Atomurus cannot start: secure storage is unavailable on this device.');
  } else {
    services = createNativeServices({
      platformAdapter: createCapacitorAdapter(native.bridge, window),
      secureStorage: createCapacitorSecureStorage(native.securePlugin),
      overrides: window.__ATOMURUS_CONFIG__ || {}
    });
  }
} else {
  services = createWebServices(window);
}

if (services) {
  const shell = createAppShell({ root, services, prefs: { lang, theme: readPref('atomurus-theme') || undefined } });
  shell.start();
  window.__atomurusShell = shell;
}
