/*
 * Study in the app shell (routes study, study/sets, study/review).
 *
 * Reads Study Sets through the migrated Study API → core API client → the
 * same /api/study/* Functions → the same Supabase rows the web workspace
 * uses. A set created on the PC shows up here, and the other way round.
 *
 * States are explicit: loading (skeleton) · signed out · offline · failed ·
 * ready. Secondary Study destinations live in a sheet, not the bottom bar.
 */

import { ApiErrorKind } from '../../core/api/api-errors.js';
import { SECONDARY_NAV, getRoute, webUrlFor } from '../../core/routing/routes.js';
import { h, clear } from '../../ui/utilities/dom.js';
import { hashFor } from '../../app/router/router.js';
import { createStudyApi } from './study-api.js';

const SECONDARY_LABELS = {
  en: { study: 'Overview', 'study/sets': 'Sets', 'study/review': 'Review', 'study/practice': 'Practice', 'study/insights': 'Insights', 'study/work': 'Notes & history' },
  pt: { study: 'Visão geral', 'study/sets': 'Conjuntos', 'study/review': 'Revisão', 'study/practice': 'Prática', 'study/insights': 'Insights', 'study/work': 'Notas e histórico' }
};

export default {
  async mount({ root, scope, services, params }) {
    const t = services.t;
    const el = h.scoped(scope);
    const study = createStudyApi(services.api);
    const labels = SECONDARY_LABELS[services.lang] || SECONDARY_LABELS.en;
    const controller = new AbortController();
    scope.add(() => controller.abort()); /* leaving Study cancels its requests */

    const body = el('div', { class: 'app-study-body', 'aria-busy': 'true' },
      el('div', { class: 'ui-skeleton ui-skeleton-title' }), el('div', { class: 'ui-skeleton' }));
    const moreBtn = el('button', { class: 'ui-btn ui-btn-ghost ui-btn-sm', type: 'button', 'data-study-more': true, onclick: openMore }, t('study.more'));
    root.appendChild(el('section', { class: 'app-page app-study', 'data-study-route': params.routeId || 'study' },
      el('div', { class: 'app-page-head' }, el('h1', { class: 'app-page-title' }, t('study.title')), moreBtn),
      body));

    function openMore() {
      const list = h('ul', { class: 'app-list' }, SECONDARY_NAV.study.map((id) => h('li', null,
        h('a', { class: 'app-list-item', href: hashFor(id), 'data-study-nav': id, onclick: () => sheet.close() }, labels[id] || getRoute(id).id))));
      const sheet = services.shell.openSheet({ title: t('study.title'), content: list });
    }

    function state(name, ...children) {
      clear(body);
      body.removeAttribute('aria-busy');
      body.setAttribute('data-study-state', name);
      children.forEach((c) => body.appendChild(c));
    }

    try {
      const data = await study.listSets(false);
      if (scope.disposed) return {};
      const sets = (data && data.sets) || [];
      const due = sets.reduce((sum, s) => sum + (Number(s.dueCount) || 0), 0);
      state('ready',
        el('p', { class: 'app-stat' }, el('strong', { class: 'ui-num' }, String(due)), ' ', t('study.due')),
        el('a', { class: 'ui-btn ui-btn-primary app-primary-cta', href: services.webHref(`${webUrlFor('study/review')}&start=1`), 'data-study-start': true }, t('study.start')),
        el('h2', { class: 'app-section-title' }, t('study.sets')),
        el('ul', { class: 'app-list' }, sets.map((s) => el('li', null,
          el('a', { class: 'app-list-item', href: services.webHref(webUrlFor('study/sets', { set: s.id })) },
            el('span', null, s.title), el('span', { class: 'app-list-meta ui-num' }, String(s.dueCount || 0)))))));
    } catch (err) {
      if (scope.disposed || err.kind === ApiErrorKind.ABORTED) return {};
      if (err.kind === ApiErrorKind.UNAUTHORIZED) {
        state('signed-out', el('p', { class: 'ui-body' }, t('study.signIn')),
          el('a', { class: 'ui-btn ui-btn-primary app-primary-cta', href: hashFor('account'), 'data-study-signin': true }, t('study.signInCta')));
      } else if (err.kind === ApiErrorKind.OFFLINE || err.kind === ApiErrorKind.NETWORK_ERROR) {
        state('offline', el('p', { class: 'ui-body' }, t('study.offline')));
      } else {
        state('failed', el('p', { class: 'ui-body' }, t('state.failed')),
          el('button', { class: 'ui-btn ui-btn-secondary', type: 'button', onclick: () => services.shell.navigate(params.routeId || 'study', { r: Date.now() }) }, t('state.retry')));
      }
    }
    return {};
  }
};
