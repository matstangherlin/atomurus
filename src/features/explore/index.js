/* Explore hub — secondary destinations as a compact list (no card wall). */

import { SECONDARY_NAV, getRoute } from '../../core/routing/routes.js';
import { h } from '../../ui/utilities/dom.js';
import { hashFor } from '../../app/router/router.js';

const LABELS = {
  en: { 'periodic-table': 'Periodic table', molecules: 'Molecules (3D)', 'atomic-models': 'Atomic models', calculators: 'Calculators' },
  pt: { 'periodic-table': 'Tabela periódica', molecules: 'Moléculas (3D)', 'atomic-models': 'Modelos atômicos', calculators: 'Calculadoras' }
};

export default {
  mount({ root, scope, services }) {
    const el = h.scoped(scope);
    const labels = LABELS[services.lang] || LABELS.en;
    const items = SECONDARY_NAV.explore.filter((id) => id !== 'explore').map(getRoute);
    root.appendChild(el('section', { class: 'app-page' },
      el('h1', { class: 'app-page-title' }, services.t('explore.title')),
      el('ul', { class: 'app-list' }, items.map((route) => el('li', null,
        el('a', { class: 'app-list-item', href: hashFor(route.id), 'data-explore': route.id }, labels[route.id] || route.id))))));
    return {};
  }
};
