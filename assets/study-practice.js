(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusStudyPractice = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Study Hub practice catalog.
   *
   * Live types open existing Atomurus tools. Planned types are the
   * future quiz architecture — no synthetic question banks here.
   */
  var TYPES = [
    {
      id: 'molar-mass',
      status: 'live',
      href: '/calculators.html#molar',
      title: { en: 'Molar mass', pt: 'Massa molar' }
    },
    {
      id: 'find-element',
      status: 'live',
      href: '/periodic-table.html',
      title: { en: 'Find the element', pt: 'Encontrar o elemento' }
    },
    {
      id: 'unit-conversion',
      status: 'live',
      href: '/calculators.html#unit',
      title: { en: 'Unit conversion', pt: 'Conversão de unidades' }
    },
    {
      id: 'ph',
      status: 'live',
      href: '/calculators.html#ph',
      title: { en: 'pH', pt: 'pH' }
    },
    {
      id: 'ideal-gas',
      status: 'live',
      href: '/calculators.html#ideal',
      title: { en: 'Ideal gas', pt: 'Gás ideal' }
    },
    {
      id: 'isomerism-quiz',
      status: 'live',
      href: '/viewer/isomerism.html#iso-quiz',
      title: { en: 'Isomerism quiz', pt: 'Quiz de isomeria' }
    },
    {
      id: 'multiple-choice',
      status: 'planned',
      href: '',
      title: { en: 'Multiple choice', pt: 'Múltipla escolha' }
    },
    {
      id: 'formula-questions',
      status: 'planned',
      href: '',
      title: { en: 'Formula questions', pt: 'Questões de fórmula' }
    },
    {
      id: 'reaction-balancing',
      status: 'planned',
      href: '',
      title: { en: 'Reaction balancing', pt: 'Balanceamento de reações' }
    },
    {
      id: 'stoichiometry',
      status: 'planned',
      href: '',
      title: { en: 'Stoichiometry', pt: 'Estequiometria' }
    },
    {
      id: 'concept-questions',
      status: 'planned',
      href: '',
      title: { en: 'Concept questions', pt: 'Questões conceituais' }
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

  function isLive(entry) {
    return Boolean(entry && entry.status === 'live' && entry.href);
  }

  function live(limit) {
    var rows = TYPES.filter(isLive);
    var n = Number(limit);
    return n > 0 ? rows.slice(0, n) : rows;
  }

  function planned() {
    return TYPES.filter(function (entry) { return entry.status === 'planned'; });
  }

  return {
    TYPES: TYPES,
    label: label,
    isLive: isLive,
    live: live,
    planned: planned
  };
});
