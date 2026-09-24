/*
 * Legacy bridge — lets the classic-script pages (app.html, element pages,
 * Pro Lab loaders) use the new core without becoming modules.
 *
 * Built by tools/build-core-bundle.mjs into /assets/core/atomurus-core.js
 * (IIFE, no Three, no features beyond the API wrappers). Exposes:
 *
 *   window.AtomurusCore = {
 *     config, platform, network, api, ApiErrorKind,
 *     createStudyApi, createProLabApi
 *   }
 *
 * Kept deliberately small: public pages load it through study-boot.js, so
 * every byte here is paid on Home and element pages.
 *
 * The legacy session UI stays with auth-client.js (window.AtomurusAuth):
 * the bridge's API client sends cookies exactly as before and never a token.
 */

import { createApiClient } from '../../core/api/api-client.js';
import { ApiErrorKind } from '../../core/api/api-errors.js';
import { resolveRuntimeConfig } from '../../core/config/runtime-config.js';
import { createNetworkState } from '../../core/network/network-state.js';
import { createPlatform } from '../../core/platform/platform.js';
import { createWebAdapter } from '../../core/platform/web-adapter.js';
import { createProLabApi } from '../../features/pro-lab/pro-lab-api.js';
import { createStudyApi } from '../../features/study/study-api.js';

(function install(win) {
  if (!win || win.AtomurusCore) return;
  const platform = createPlatform(createWebAdapter(win));
  const config = resolveRuntimeConfig({ platform: 'web', overrides: win.__ATOMURUS_CONFIG__ || {} });
  const network = createNetworkState({ platform });
  const api = createApiClient({ config, platform, onEvent: (e) => network.onApiEvent(e) });

  win.AtomurusCore = Object.freeze({
    version: 'a1.0',
    config,
    platform,
    network,
    api,
    ApiErrorKind,
    createStudyApi,
    createProLabApi
  });
})(typeof window !== 'undefined' ? window : undefined);
