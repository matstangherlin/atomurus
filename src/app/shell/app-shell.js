/*
 * AppShell — the canonical application frame for the authenticated app
 * (web /app successor and the Android client). Owns:
 *
 *   lifecycle · navigation · auth bootstrap · online state · theme ·
 *   language · safe area · global toast · overlays · feature router
 *
 * Layouts (src/ui/layouts/app-shell.css):
 *   mobile  (<768)    top bar + bottom navigation (5 destinations) + sheets
 *   tablet  (768–1023) navigation rail
 *   desktop (≥1024)   sidebar — desktop stays desktop
 *
 * The first paint never waits on the network: the frame renders at once,
 * auth resolves in the background, each feature shows its own loading state.
 */

import { createScope, liveScopeCount } from '../../core/lifecycle/scope.js';
import { NetworkStatus } from '../../core/network/network-state.js';
import { getRoute, primaryDestinations, primaryFor } from '../../core/routing/routes.js';
import { createOverlay } from '../../ui/components/overlay.js';
import { createToastHost } from '../../ui/components/toast.js';
import { h } from '../../ui/utilities/dom.js';
import { viewerStats } from '../../features/viewer/viewer-stats.js';
import { FEATURE_REGISTRY } from '../router/feature-registry.js';
import { createRouter, hashFor } from '../router/router.js';
import { createFeatureHost } from './feature-host.js';
import { createTranslator } from './strings.js';

const ICONS = {
  home: 'M3 9.5 10 4l7 5.5M5 8.5V16h10V8.5M8 16v-4h4v4',
  explore: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
  lab: 'M8 3h4M9 3v5l-4.5 7.5A1 1 0 0 0 5.4 17h9.2a1 1 0 0 0 .9-1.5L11 8V3',
  study: 'M3 5.5 10 3l7 2.5-7 2.5zM6 7v4.5c0 1.2 1.8 2.5 4 2.5s4-1.3 4-2.5V7',
  account: 'M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4.5 17c.7-2.7 2.8-4.3 5.5-4.3s4.8 1.6 5.5 4.3'
};

function icon(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', ICONS[id] || ICONS.home);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  return svg;
}

export function createAppShell({ root, services, registry = FEATURE_REGISTRY, win = globalThis.window, prefs = {} }) {
  const doc = root.ownerDocument;
  const scope = createScope('app-shell', win);
  const lang = prefs.lang || 'en';
  const t = createTranslator(lang);
  const { lifecycle, network, auth, perf } = services;
  perf.mark('bootstrap:start');

  doc.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en-US';
  if (prefs.theme) doc.documentElement.setAttribute('data-theme', prefs.theme);

  /* ---- frame ------------------------------------------------------------ */
  const title = h('span', { class: 'app-topbar-title' }, 'Atomurus');
  const topbar = h('header', { class: 'app-topbar', 'data-app-topbar': true },
    h('a', { class: 'app-brand', href: hashFor('home'), 'aria-label': 'Atomurus' }, h('span', { class: 'app-brand-mark', 'aria-hidden': 'true' }), title));

  const navLinks = new Map();
  const nav = h('nav', { class: 'app-nav', 'aria-label': 'Primary', 'data-app-nav': true },
    h('ul', { class: 'app-nav-list' }, primaryDestinations().map((route) => {
      const link = h('a', { class: 'app-nav-item', href: hashFor(route.id), 'data-nav': route.id },
        icon(route.id), h('span', { class: 'app-nav-label' }, t(`nav.${route.id}`)));
      navLinks.set(route.id, link);
      return h('li', null, link);
    })));

  const banner = h('div', { class: 'app-banner', role: 'status', 'aria-live': 'polite', hidden: true, 'data-app-banner': true });
  const featureRoot = h('div', { class: 'app-feature', 'data-feature-root': true });
  const main = h('main', { class: 'app-main', id: 'app-main', tabindex: '-1', 'data-scroll-owner': true }, banner, featureRoot);
  const overlays = h('div', { class: 'app-overlays' });
  const frame = h('div', { class: 'app-shell', 'data-app-shell': true }, topbar, main, nav, overlays);
  root.appendChild(frame);
  scope.add(() => frame.remove());

  const toasts = createToastHost({ parent: frame, scope });

  /* ---- network state → specific banner, never "Something went wrong" ---- */
  function renderNetwork(status) {
    if (status === NetworkStatus.ONLINE) {
      banner.hidden = true;
      banner.removeAttribute('data-status');
      return;
    }
    banner.hidden = false;
    banner.setAttribute('data-status', status);
    banner.textContent = t(`net.${status}`);
  }
  scope.add(network.subscribe(renderNetwork));
  renderNetwork(network.status);

  /* ---- features ------------------------------------------------------------ */
  const shellApi = {};
  const host = createFeatureHost({
    root: featureRoot,
    registry,
    services: { ...services, shell: shellApi, t, lang },
    env: win,
    renderLoading(el) {
      el.appendChild(h('div', { class: 'ui-skeleton-stack', 'aria-busy': 'true', 'aria-label': t('state.loading') },
        h('div', { class: 'ui-skeleton ui-skeleton-title' }), h('div', { class: 'ui-skeleton' }), h('div', { class: 'ui-skeleton' })));
    },
    renderFailed(el, _id, err, retry) {
      el.appendChild(h('section', { class: 'ui-error-state', 'data-feature-failed': true },
        h('h2', { class: 'ui-h3' }, t('state.failed')),
        h('p', { class: 'ui-body ui-text-muted' }, err && err.code === 'FEATURE_TIMEOUT' ? t('net.slow') : ''),
        h('button', { class: 'ui-btn ui-btn-primary', type: 'button', onclick: retry }, t('state.retry'))));
    }
  });

  function onRoute({ id, params }) {
    const route = getRoute(id);
    const feature = (route && route.feature) || 'home';
    const primary = primaryFor(id) || 'home';
    for (const [navId, link] of navLinks) {
      if (navId === primary) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    lifecycle.enterRoute({ id, params });
    perf.mark(`${feature}:start`);
    main.scrollTop = 0;
    host.show(feature, { ...params, routeId: id }).then(() => perf.measure(feature));
  }

  const router = createRouter({ win, scope, onRoute });

  Object.assign(shellApi, {
    t,
    navigate: (id, params) => router.navigate(id, params),
    toast: (message, opts) => toasts.show(message, opts),
    openSheet: (opts) => createOverlay({ parent: overlays, scope, variant: 'sheet', ...opts }),
    openDialog: (opts) => createOverlay({ parent: overlays, scope, variant: 'dialog', ...opts })
  });

  /* ---- auth bootstrap: never blocks first paint ---------------------------- */
  scope.add(auth.onChange((snapshot) => {
    frame.setAttribute('data-signed-in', snapshot.signedIn ? 'true' : 'false');
  }));

  return {
    element: frame,
    async start() {
      router.start();
      perf.mark('bootstrap:shell-ready');
      perf.measure('bootstrap', 'bootstrap:start', 'bootstrap:shell-ready');
      perf.mark('auth:start');
      auth.getSession().then(() => perf.measure('auth')).catch(() => {});
    },
    navigate: shellApi.navigate,
    toast: shellApi.toast,
    openSheet: shellApi.openSheet,
    openDialog: shellApi.openDialog,
    stats() {
      return {
        feature: host.currentId,
        featureState: host.state,
        mountedFeatures: host.mountedCount(),
        shellListeners: scope.stats().listeners,
        featureScope: host.currentScopeStats(),
        liveScopes: liveScopeCount(),
        lifecycleSubscribers: lifecycle.subscriberCount(),
        navCount: doc.querySelectorAll('[data-app-nav]').length,
        navItems: navLinks.size,
        viewer: viewerStats(),
        toasts: toasts.count()
      };
    },
    destroy() {
      host.leave();
      scope.dispose();
    }
  };
}
