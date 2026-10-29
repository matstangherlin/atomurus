/* «Solução comentada» (prompt 30): shows the steps a calculation already
   produced (assets/worked-steps.js describes the engine's steps[]). No
   arithmetic, no dependencies. Styles: assets/ui/worked-solution.css. */
(function (root) {
  'use strict';
  var LABELS = {
    en: { title: 'Worked solution', show: 'Show step by step', hide: 'Show only the result', answer: 'Answer' },
    pt: { title: 'Solução comentada', show: 'Mostrar passo a passo', hide: 'Mostrar só o resultado', answer: 'Resposta' }
  };
  var count = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* render(container, { steps: [{ text, expr }], answer, locale, labels, open })
     Empty steps (a failed calculation) clear the container: no solution. */
  function render(container, opts) {
    if (!container) return null;
    opts = opts || {};
    var steps = opts.steps || [];
    if (!steps.length) {
      container.innerHTML = '';
      return null;
    }
    var base = LABELS[opts.locale === 'pt' ? 'pt' : 'en'];
    var t = {};
    Object.keys(base).forEach(function (k) { t[k] = (opts.labels && opts.labels[k]) || base[k]; });
    var id = 'wsol-steps-' + (count += 1);
    container.innerHTML =
      '<section class="wsol" aria-label="' + esc(t.title) + '">' +
      (opts.answer ? '<p class="wsol-answer"><span>' + esc(t.answer) + '</span> <strong translate="no">' + esc(opts.answer) + '</strong></p>' : '') +
      '<button type="button" class="wsol-toggle" aria-expanded="false" aria-controls="' + id + '">' + esc(t.show) + '</button>' +
      '<ol class="wsol-steps is-collapsed" id="' + id + '" aria-label="' + esc(t.title) + '">' +
      steps.map(function (s) {
        return '<li><span class="wsol-text">' + esc(s.text) + '</span>' +
          (s.expr ? ' <span class="wsol-expr" translate="no">' + esc(s.expr) + '</span>' : '') + '</li>';
      }).join('') +
      '</ol></section>';
    var button = container.querySelector('.wsol-toggle');
    var list = container.querySelector('.wsol-steps');
    function set(open) {
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.textContent = open ? t.hide : t.show;
      list.classList.toggle('is-collapsed', !open);
    }
    button.addEventListener('click', function () {
      set(button.getAttribute('aria-expanded') !== 'true');
    });
    if (opts.open) set(true);
    return { expand: function () { set(true); }, collapse: function () { set(false); } };
  }

  root.AtomurusWorkedSolution = { render: render, LABELS: LABELS };
})(typeof window !== 'undefined' ? window : this);
