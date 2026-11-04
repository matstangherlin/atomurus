/*
 * App Home — mobile-first answer to "what can I do now?". One primary action
 * (continue studying), three destinations and one short read. No metric wall,
 * no institutional copy, no desktop grid squeezed onto a phone.
 */

import { h } from '../../ui/utilities/dom.js';
import { hashFor } from '../../app/router/router.js';

const ICONS = {
  table: 'M4 15h3v-3H4zM8.5 15h3v-3h-3zM13 15h3v-3h-3zM4 10.5h3v-3H4zM13 10.5h3v-3h-3zM4 6h3V3H4zM13 6h3V3h-3z',
  lab: 'M8 3h4M9 3v5l-4.5 7.5A1 1 0 0 0 5.4 17h9.2a1 1 0 0 0 .9-1.5L11 8V3',
  molecule: 'M6 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM14.5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14.5 16.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8.2 8.9l4.4-2.6M8.2 11.1l4.4 2.6',
  chevron: 'm8 5 5 5-5 5'
};

function svg(doc, d, size = 20) {
  const ns = 'http://www.w3.org/2000/svg';
  const el = doc.createElementNS(ns, 'svg');
  el.setAttribute('viewBox', '0 0 20 20');
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('aria-hidden', 'true');
  const path = doc.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.6');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  el.appendChild(path);
  return el;
}

export default {
  mount({ root, scope, services }) {
    const t = services.t;
    const doc = root.ownerDocument;
    const el = h.scoped(scope, doc);

    const row = (id, icon, label, hint) => el('a', { class: 'app-action app-action-row', href: hashFor(id), 'data-home-action': id },
      el('span', { class: 'app-action-icon' }, svg(doc, ICONS[icon])),
      el('span', { class: 'app-action-text' },
        el('span', { class: 'app-action-label' }, label),
        el('span', { class: 'app-action-hint' }, hint)),
      el('span', { class: 'app-action-chevron' }, svg(doc, ICONS.chevron, 18)));

    root.appendChild(el('section', { class: 'app-page app-home' },
      el('h1', { class: 'app-page-title' }, t('home.title')),
      el('a', { class: 'app-action is-primary app-hero-card', href: hashFor('study'), 'data-home-action': 'study' },
        el('span', { class: 'app-action-kicker' }, t('home.review')),
        el('span', { class: 'app-action-label' }, t('home.reviewTitle')),
        el('span', { class: 'app-hero-foot' },
          el('span', { class: 'app-action-hint' }, t('home.reviewHint')),
          el('span', { class: 'app-hero-cta' }, t('home.reviewCta')))),
      el('div', { class: 'app-actions' },
        row('periodic-table', 'table', t('home.tableShort'), t('home.tableHint')),
        row('lab', 'lab', t('home.lab'), t('home.labHint')),
        row('molecules', 'molecule', t('home.molecule'), t('home.moleculeHint'))),
      el('a', { class: 'app-read-card', href: '/periodic-table/aurum.html', 'data-home-action': 'read' },
        el('span', { class: 'app-read-tile', 'aria-hidden': 'true' },
          el('span', { class: 'app-read-tile-z' }, '79'),
          el('span', { class: 'app-read-tile-sym' }, 'Au')),
        el('span', { class: 'app-action-text' },
          el('span', { class: 'app-action-hint' }, t('home.readKicker')),
          el('span', { class: 'app-action-label' }, t('home.readTitle'))))));
    return {};
  }
};
