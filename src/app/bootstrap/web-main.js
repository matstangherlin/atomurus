/*
 * Web entry for the AppShell (dev/app-shell.html today; dist/app/index.html
 * for the packaged build). Loads nothing heavy: core services, the shell
 * frame and the router. Features — and Three.js — load on demand.
 */

import { createAppShell } from '../shell/app-shell.js';
import { createWebServices } from './services.js';

function readPref(key) {
  try { return globalThis.localStorage.getItem(key); } catch (_err) { return null; }
}

function detectLang() {
  const stored = readPref('atomurus-lang');
  if (stored === 'pt' || stored === 'en') return stored;
  return String(globalThis.navigator?.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

const services = createWebServices(window);
const shell = createAppShell({
  root: document.getElementById('app'),
  services,
  prefs: { lang: detectLang(), theme: readPref('atomurus-theme') || undefined }
});
shell.start();

/* Dev/test hook: stats for the lifecycle and navigation stress gates. */
window.__atomurusShell = shell;
window.__atomurusServices = services;
if (services.perf.enabled) services.perf.observeLongTasks();
