/*
 * Lab on a phone: a vertical flow, not the desktop board squeezed.
 *
 *   tool selector → input → result → history/context
 *
 * A1.0 ships the selector step and hands each tool to the web Lab; the
 * in-shell input/result steps arrive with A1.2 (Pro Lab mobile).
 */

import { h } from '../../ui/utilities/dom.js';

export const LAB_TOOLS = Object.freeze([
  { id: 'reactions', en: 'Balance a reaction', pt: 'Balancear uma reação' },
  { id: 'formula', en: 'Solve a formula', pt: 'Resolver uma fórmula' },
  { id: 'solutions', en: 'Prepare a solution', pt: 'Preparar uma solução' },
  { id: 'calculations', en: 'Stoichiometry', pt: 'Estequiometria' },
  { id: 'elements', en: 'Compare elements', pt: 'Comparar elementos' },
  { id: 'molecules', en: 'Compare molecules', pt: 'Comparar moléculas' }
]);

export default {
  mount({ root, scope, services }) {
    const el = h.scoped(scope);
    const lang = services.lang === 'pt' ? 'pt' : 'en';
    root.appendChild(el('section', { class: 'app-page app-lab' },
      el('h1', { class: 'app-page-title' }, services.t('lab.title')),
      el('h2', { class: 'app-section-title' }, services.t('lab.pick')),
      el('ul', { class: 'app-list', 'data-lab-tools': true }, LAB_TOOLS.map((tool) => el('li', null,
        el('a', { class: 'app-list-item', href: services.webHref(`/app?section=lab&panel=analysis&tool=${tool.id}`) }, tool[lang]))))));
    return {};
  }
};
