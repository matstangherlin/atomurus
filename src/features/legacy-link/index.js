/*
 * Legacy hand-off — areas the app shell has not migrated yet open their
 * existing web page. Listed as remaining legacy in the A1.0 report.
 */

import { getRoute, webUrlFor } from '../../core/routing/routes.js';
import { h } from '../../ui/utilities/dom.js';

export default {
  mount({ root, scope, services, params }) {
    const el = h.scoped(scope);
    const route = getRoute(params.routeId) || getRoute('home');
    const href = services.webHref(webUrlFor(route.id));
    root.appendChild(el('section', { class: 'app-page', 'data-legacy-feature': route.id },
      el('h1', { class: 'app-page-title' }, route.id),
      el('p', { class: 'ui-body ui-text-muted' }, services.t('legacy.body')),
      el('a', { class: 'ui-btn ui-btn-primary', href }, services.t('legacy.open'))));
    return {};
  }
};
