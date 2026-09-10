(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusStudyCurriculum = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Study Hub learning paths.
   *
   * Live paths map onto existing Atomurus pages. Planned paths are
   * architecture only — no synthetic lesson bodies.
   */
  var PATHS = [
    {
      id: 'foundations',
      status: 'live',
      href: '/explore/what-is-an-atom.html',
      hrefPt: '/explore/what-is-an-atom.pt.html',
      title: { en: 'Chemistry Foundations', pt: 'Fundamentos de Química' },
      pages: [
        { href: '/explore/what-is-an-atom.html', hrefPt: '/explore/what-is-an-atom.pt.html' }
      ]
    },
    {
      id: 'atomic-structure',
      status: 'live',
      href: '/viewer/atomic-models.html',
      hrefPt: '/viewer/atomic-models.pt.html',
      title: { en: 'Atomic Structure', pt: 'Estrutura atômica' },
      pages: [
        { href: '/viewer/atomic-models.html', hrefPt: '/viewer/atomic-models.pt.html' },
        { href: '/explore/what-are-isotopes.html', hrefPt: '/explore/what-are-isotopes.pt.html' }
      ]
    },
    {
      id: 'periodic-table',
      status: 'live',
      href: '/periodic-table.html',
      title: { en: 'Periodic Table', pt: 'Tabela periódica' },
      pages: [
        { href: '/periodic-table.html' },
        { href: '/explore/what-is-the-periodic-table.html', hrefPt: '/explore/what-is-the-periodic-table.pt.html' }
      ]
    },
    {
      id: 'chemical-bonding',
      status: 'live',
      href: '/explore/what-is-chemical-bonding.html',
      hrefPt: '/explore/what-is-chemical-bonding.pt.html',
      title: { en: 'Chemical Bonding', pt: 'Ligações químicas' },
      pages: [
        { href: '/explore/what-is-chemical-bonding.html', hrefPt: '/explore/what-is-chemical-bonding.pt.html' }
      ]
    },
    {
      id: 'stoichiometry',
      status: 'planned',
      href: '',
      title: { en: 'Stoichiometry', pt: 'Estequiometria' },
      pages: []
    },
    {
      id: 'solutions',
      status: 'planned',
      href: '',
      title: { en: 'Solutions', pt: 'Soluções' },
      pages: []
    },
    {
      id: 'acids-bases',
      status: 'planned',
      href: '',
      title: { en: 'Acids and Bases', pt: 'Ácidos e bases' },
      pages: []
    },
    {
      id: 'gases',
      status: 'planned',
      href: '',
      title: { en: 'Gases', pt: 'Gases' },
      pages: []
    },
    {
      id: 'thermochemistry',
      status: 'planned',
      href: '',
      title: { en: 'Thermochemistry', pt: 'Termoquímica' },
      pages: []
    },
    {
      id: 'organic',
      status: 'live',
      href: '/explore/what-is-isomerism.html',
      hrefPt: '/explore/what-is-isomerism.pt.html',
      title: { en: 'Organic Chemistry Fundamentals', pt: 'Fundamentos de química orgânica' },
      pages: [
        { href: '/explore/what-is-isomerism.html', hrefPt: '/explore/what-is-isomerism.pt.html' },
        { href: '/viewer/isomerism.html' }
      ]
    }
  ];

  function label(entry, lang) {
    if (!entry) return '';
    var titles = entry.title;
    if (titles && typeof titles === 'object') {
      return String((lang === 'pt' ? titles.pt : titles.en) || titles.en || '');
    }
    return String(titles || '');
  }

  function hrefFor(entry, lang) {
    if (!entry) return '';
    if (lang === 'pt' && entry.hrefPt) return entry.hrefPt;
    return entry.href || '';
  }

  function isLive(entry) {
    return Boolean(entry && entry.status === 'live' && entry.href);
  }

  function live(limit) {
    var rows = PATHS.filter(isLive);
    var n = Number(limit);
    return n > 0 ? rows.slice(0, n) : rows;
  }

  function planned() {
    return PATHS.filter(function (entry) { return entry.status === 'planned'; });
  }

  return {
    PATHS: PATHS,
    label: label,
    hrefFor: hrefFor,
    isLive: isLive,
    live: live,
    planned: planned
  };
});
