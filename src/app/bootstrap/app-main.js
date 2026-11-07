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
/* Plugin proxies (@capacitor/core) load lazily, only inside the native shell. */
import { createCapacitorSecureStorage } from '../../adapters/capacitor/secure-storage-adapter.js';
import { createAppShell } from '../shell/app-shell.js';
import { createNativeServices, createWebServices } from './services.js';

function readPref(key) {
  try { return globalThis.localStorage.getItem(key); } catch (_err) { return null; }
}

function isNativeShell(win) {
  const cap = win.Capacitor;
  return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

async function nativeBridge() {
  const { loadNativePlugins } = await import('../../adapters/capacitor/native-plugins.js');
  return loadNativePlugins();
}

function fatal(root, message) {
  root.textContent = '';
  const p = document.createElement('p');
  p.className = 'ui-body';
  p.setAttribute('role', 'alert');
  p.textContent = message;
  root.appendChild(p);
}

async function createServices() {
  if (!isNativeShell(window)) return createWebServices(window);
  const native = await nativeBridge();
  if (!native.securePlugin) {
    fatal(root, 'Atomurus cannot start: secure storage is unavailable on this device.');
    return null;
  }
  return createNativeServices({
    platformAdapter: createCapacitorAdapter(native.bridge, window),
    secureStorage: createCapacitorSecureStorage(native.securePlugin),
    overrides: window.__ATOMURUS_CONFIG__ || {}
  });
}

const root = document.getElementById('app');
const lang = readPref('atomurus-lang') === 'pt' ? 'pt' : (String(navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en');

createServices().then((services) => {
  if (!services) return;
  const shell = createAppShell({ root, services, prefs: { lang, theme: readPref('atomurus-theme') || undefined } });
  shell.start();
  window.__atomurusShell = shell;
}).catch((err) => {
  fatal(root, 'Atomurus could not start. Please reopen the app.');
  console.error(err);
});
