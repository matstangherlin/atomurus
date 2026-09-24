/*
 * App Home — mobile-first answer to "what can I do now?". One primary action,
 * two secondary ones. No metric wall, no institutional copy, no desktop grid
 * squeezed onto a phone.
 */

import { h } from '../../ui/utilities/dom.js';
import { hashFor } from '../../app/router/router.js';

export default {
  mount({ root, scope, services }) {
    const t = services.t;
    const el = h.scoped(scope);
    const action = (id, label, hint, primary) => el('a', { class: `app-action${primary ? ' is-primary' : ''}`, href: hashFor(id), 'data-home-action': id },
      el('span', { class: 'app-action-label' }, label),
      hint ? el('span', { class: 'app-action-hint' }, hint) : null);

    root.appendChild(el('section', { class: 'app-page app-home' },
      el('h1', { class: 'app-page-title' }, t('home.title')),
      el('div', { class: 'app-actions' },
        action('study', t('home.review'), t('home.reviewHint'), true),
        action('periodic-table', t('home.table'), t('home.tableHint')),
        action('lab', t('home.lab'), t('home.labHint'))),
      el('p', { class: 'app-inline-links' }, el('a', { href: hashFor('molecules'), 'data-home-action': 'molecules' }, t('home.molecule')))));
    return {};
  }
};
