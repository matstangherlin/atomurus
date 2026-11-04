/*
 * Periodic table (app shell). Data: /assets/app/elements.json through
 * CacheStorage (opens instantly on the second visit, survives offline once
 * cached). One delegated listener per container — not 118 — and no layout
 * reads in loops.
 */

import { createStaticLoader } from '../../core/api/static-loader.js';
import { h, clear } from '../../ui/utilities/dom.js';
import { CATEGORIES, SORTS, VIEW_MODES, categoryOf, defaultMode, filterElements } from './view-modes.js';

const DATA_URL = '/assets/app/elements.json';
const DAY = 24 * 3600 * 1000;

export default {
  async mount({ root, scope, services }) {
    const t = services.t;
    const lang = services.lang;
    const el = h.scoped(scope);
    const load = createStaticLoader();
    let mode = defaultMode({ width: globalThis.innerWidth, height: globalThis.innerHeight });
    let sort = 'z';
    let query = '';
    let elements = [];
    let highlight = null;
    let selected = null;

    const search = el('input', {
      class: 'ui-input', type: 'search', inputmode: 'search', enterkeyhint: 'search', autocomplete: 'off',
      'aria-label': t('table.search'), placeholder: t('table.search'), 'data-table-search': true
    });
    const tabs = el('div', { class: 'ui-tabs app-tabs', role: 'tablist', 'aria-label': t('table.title') },
      VIEW_MODES.map((m) => el('button', { class: 'ui-tab', role: 'tab', type: 'button', 'data-mode': m, 'aria-selected': String(m === mode) }, t(`table.${m === 'table' ? 'grid' : m}`))));
    const sortSelect = el('select', { class: 'ui-select', 'aria-label': t('table.sortBy'), hidden: mode !== 'property', 'data-table-sort': true },
      el('option', { value: 'z' }, t('table.z')), el('option', { value: 'mass' }, t('table.mass')), el('option', { value: 'chi' }, t('table.en')));
    const view = el('div', { class: 'app-table-view', 'aria-busy': 'true' },
      el('div', { class: 'ui-skeleton' }), el('div', { class: 'ui-skeleton' }), el('div', { class: 'ui-skeleton' }));

    const chips = el('div', { class: 'app-chips', role: 'group', 'aria-label': t('table.categories'), 'data-table-cats': true },
      CATEGORIES.map((id) => el('button', { class: 'app-chip', type: 'button', 'data-cat': id, 'aria-pressed': 'false' },
        el('span', { class: 'app-chip-dot', 'data-cat': id, 'aria-hidden': 'true' }), t(`cat.${id}`))));
    const card = el('aside', { class: 'app-element-card', hidden: true, 'aria-live': 'polite', 'data-element-card': true });

    root.appendChild(el('section', { class: 'app-page app-periodic', 'data-periodic': true },
      el('h1', { class: 'app-page-title' }, t('table.title')),
      el('div', { class: 'app-toolbar' }, search, sortSelect),
      chips, tabs, view, card));

    function name(e) { return lang === 'pt' ? e.pt : e.en; }
    function num(v) { return v == null ? '—' : (lang === 'pt' ? String(v).replace('.', ',') : String(v)); }

    function renderCard() {
      clear(card);
      if (!selected) { card.hidden = true; return; }
      const e = selected;
      const cat = categoryOf(e.z);
      const where = [e.group && cat !== 'lan' && cat !== 'act' ? `${t('table.group')} ${e.group}` : null,
        e.period ? `${t('table.period')} ${e.period}` : null, `${num(e.mass)} u`].filter(Boolean).join(' · ');
      card.hidden = false;
      card.appendChild(h('div', { class: 'app-element-card-row' },
        h('span', { class: 'app-element-card-tile', 'data-cat': cat },
          h('span', { class: 'app-element-card-z ui-num' }, e.z),
          h('span', { class: 'app-element-card-sym' }, e.sym)),
        h('span', { class: 'app-element-card-text' },
          h('span', { class: 'app-element-card-cat' }, t(`cat.${cat}`)),
          h('span', { class: 'app-element-card-name' }, name(e)),
          h('span', { class: 'app-element-card-where ui-num' }, where))));
      card.appendChild(h('a', {
        class: 'ui-btn ui-btn-primary app-element-card-cta',
        href: e.slug ? `/periodic-table/${e.slug}.html` : '/periodic-table.html'
      }, `${t('table.seeAll')} ${name(e)}`));
    }

    function paintHighlight() {
      for (const chip of chips.children) chip.setAttribute('aria-pressed', String(chip.getAttribute('data-cat') === highlight));
      for (const node of view.querySelectorAll('[data-cat]')) {
        node.classList.toggle('is-dim', Boolean(highlight) && node.getAttribute('data-cat') !== highlight);
      }
    }

    function render() {
      clear(view);
      view.removeAttribute('aria-busy');
      view.setAttribute('data-mode', mode);
      const rows = filterElements(elements, query, lang);
      if (mode === 'table') {
        const grid = h('div', { class: 'app-ptable', role: 'grid', 'aria-label': t('table.title') });
        for (const e of rows) {
          grid.appendChild(h('button', {
            class: `app-pcell cat-${e.cat}${selected && selected.z === e.z ? ' is-selected' : ''}`, type: 'button', 'data-z': e.z, 'data-cat': categoryOf(e.z), role: 'gridcell',
            style: `grid-column:${e.col};grid-row:${e.row}`, 'aria-label': `${name(e)} ${e.z}`
          }, h('span', { class: 'app-pcell-z ui-num' }, e.z), h('span', { class: 'app-pcell-sym' }, e.sym)));
        }
        view.appendChild(h('div', { class: 'app-pan-x', 'data-pan-x': true, tabindex: '0' }, grid));
        paintHighlight();
        return;
      }
      const sorted = mode === 'property' ? rows.slice().sort(SORTS[sort]) : rows;
      const list = h('ul', { class: 'app-list app-element-list' });
      for (const e of sorted) {
        const metric = mode === 'property' && sort !== 'z' ? (sort === 'mass' ? e.mass : e.chi) : e.mass;
        list.appendChild(h('li', null, h('button', { class: 'app-list-item app-element-row', type: 'button', 'data-z': e.z, 'data-cat': categoryOf(e.z) },
          h('span', { class: 'app-element-z ui-num' }, e.z),
          h('span', { class: 'app-element-sym' }, e.sym),
          h('span', { class: 'app-element-name' }, name(e)),
          h('span', { class: 'app-list-meta ui-num' }, metric == null ? '—' : String(metric)))));
      }
      view.appendChild(list);
      paintHighlight();
    }

    scope.listen(tabs, 'click', (event) => {
      const btn = event.target.closest('[data-mode]');
      if (!btn) return;
      mode = btn.getAttribute('data-mode');
      for (const tab of tabs.children) tab.setAttribute('aria-selected', String(tab === btn));
      sortSelect.hidden = mode !== 'property';
      render();
    });
    scope.listen(search, 'input', () => { query = search.value; render(); });
    scope.listen(sortSelect, 'change', () => { sort = sortSelect.value; render(); });
    scope.listen(view, 'click', (event) => {
      const cell = event.target.closest('[data-z]');
      if (!cell) return;
      const e = elements.find((x) => String(x.z) === cell.getAttribute('data-z'));
      if (!e) return;
      selected = e;
      for (const node of view.querySelectorAll('.is-selected')) node.classList.remove('is-selected');
      cell.classList.add('is-selected');
      renderCard();
    });
    scope.listen(chips, 'click', (event) => {
      const chip = event.target.closest('[data-cat]');
      if (!chip || !chips.contains(chip)) return;
      const id = chip.getAttribute('data-cat');
      highlight = highlight === id ? null : id;
      paintHighlight();
    });

    try {
      const loaded = services.cache
        ? (await services.cache.getOrFetch('elements:v2', () => load(DATA_URL), { ttlMs: 7 * DAY })).value
        : await load(DATA_URL);
      if (scope.disposed) return {};
      elements = loaded.elements || [];
      render();
    } catch (err) {
      if (scope.disposed) return {};
      clear(view);
      view.removeAttribute('aria-busy');
      view.appendChild(h('p', { class: 'ui-body', 'data-table-error': err.kind || 'error' }, t(err.kind === 'OFFLINE' || err.kind === 'NETWORK_ERROR' ? 'net.offline' : 'state.failed')));
    }
    return {};
  }
};
