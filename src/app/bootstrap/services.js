/*
 * Service composition — the only place that decides web vs native.
 *
 *   createWebServices(window)                     browser (atomurus.com)
 *   createNativeServices({ bridge, securePlugin }) Android shell (A1.4)
 *
 * Both return the same shape, so the AppShell and every feature are identical
 * on both platforms: { config, platform, lifecycle, network, api, auth, perf }.
 */

import { createApiClient } from '../../core/api/api-client.js';
import { createWebAuthAdapter } from '../../core/auth/web-auth-adapter.js';
import { createNativeAuthAdapter, createAtomurusTokenTransport } from '../../core/auth/native-auth-adapter.js';
import { PRODUCTION_ORIGIN, resolveRuntimeConfig } from '../../core/config/runtime-config.js';
import { createAppLifecycle } from '../../core/lifecycle/app-lifecycle.js';
import { createNetworkState } from '../../core/network/network-state.js';
import { createPerf, perfEnabled } from '../../core/perf/perf.js';
import { createPlatform } from '../../core/platform/platform.js';
import { createCacheStorage } from '../../core/storage/cache-storage.js';
import { memoryBackend, webStorageBackend } from '../../core/storage/preferences-storage.js';
import { createWebAdapter } from '../../core/platform/web-adapter.js';

function compose({ platform, config, makeAuth, fetchImpl, win }) {
  const lifecycle = createAppLifecycle(platform);
  const network = createNetworkState({ platform });
  const perf = createPerf({ enabled: config.dev || perfEnabled(win) });
  let auth = null;
  /* A 401 only means "session ended" if there was a session. A guest asking
     /api/auth/me, or a guest opening Study, is simply signed out. */
  const onEvent = (event) => {
    if (event.type === 'unauthorized' && !(auth && auth.isAuthenticated())) return;
    network.onApiEvent(event);
  };

  /* Auth endpoints use a transport without an auth adapter (no recursion). */
  const transport = createApiClient({ config, platform, fetchImpl, onEvent });
  auth = makeAuth(transport);
  const api = createApiClient({ config, platform, fetchImpl, auth, onEvent });
  auth.onChange((snapshot) => {
    if (snapshot.signedIn && network.status === 'auth_expired') network.markHealthy();
  });

  /* Links to pages the shell has not migrated: same-origin on the web,
     the production site from a packaged app (never https://localhost/...). */
  const webHref = (path) => (config.native ? `${PRODUCTION_ORIGIN}${path}` : path);

  /* Re-downloadable content only (element index, static data). */
  let storage = null;
  try { storage = win && win.localStorage; } catch (_err) { storage = null; }
  const cache = createCacheStorage({ backend: storage ? webStorageBackend(storage) : memoryBackend(), version: 'a1' });

  return { config, platform, lifecycle, network, api, auth, perf, webHref, cache };
}

export function createWebServices(win = globalThis.window, { fetchImpl } = {}) {
  const platform = createPlatform(createWebAdapter(win));
  const config = resolveRuntimeConfig({ platform: 'web', overrides: (win && win.__ATOMURUS_CONFIG__) || {} });
  return compose({
    platform,
    config,
    fetchImpl,
    win,
    makeAuth: (transport) => createWebAuthAdapter({ transport })
  });
}

/**
 * @param {object} deps
 * @param {object} deps.platformAdapter  createCapacitorAdapter(bridge) result
 * @param {object} deps.secureStorage    createCapacitorSecureStorage(plugin) result
 * @param {object} [deps.overrides]      staging apiBase etc.
 */
export function createNativeServices({ platformAdapter, secureStorage, overrides = {}, fetchImpl, win = globalThis.window }) {
  const platform = createPlatform(platformAdapter);
  const config = resolveRuntimeConfig({ platform: platform.getPlatform(), overrides });
  return compose({
    platform,
    config,
    fetchImpl,
    win,
    makeAuth: (transport) => createNativeAuthAdapter({
      transport: createAtomurusTokenTransport(transport),
      secureStorage
    })
  });
}
