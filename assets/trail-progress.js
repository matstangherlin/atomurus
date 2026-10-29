/* Trail progress (prompt 32): «Concluí» marks a step, explicitly; the list is
   kept in this browser only (storage-policy: atomurus-trail-progress). */
(function () {
  var KEY = 'atomurus-trail-progress';
  var root = document.querySelector('[data-trail]');
  if (!root) return;
  var id = root.getAttribute('data-trail');
  var buttons = root.querySelectorAll('[data-trail-done]');
  var out = root.querySelector('[data-trail-count]');
  var total = root.querySelectorAll('[data-trail-done]:not([data-optional])').length;
  function all() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; }
  }
  function done() { var v = all()[id]; return Array.isArray(v) ? v : []; }
  function save(list) {
    try { var v = all(); v[id] = list; localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
  }
  function paint() {
    var list = done();
    var n = 0;
    Array.prototype.forEach.call(buttons, function (b) {
      var on = list.indexOf(b.getAttribute('data-trail-done')) !== -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? b.getAttribute('data-label-on') : b.getAttribute('data-label-off');
      b.parentNode.classList.toggle('is-done', on);
      if (on && !b.hasAttribute('data-optional')) n += 1;
    });
    if (out) out.textContent = out.getAttribute('data-template').replace('{n}', n).replace('{total}', total);
  }
  Array.prototype.forEach.call(buttons, function (b) {
    b.addEventListener('click', function () {
      var step = b.getAttribute('data-trail-done');
      var list = done();
      var at = list.indexOf(step);
      if (at === -1) list.push(step); else list.splice(at, 1);
      save(list);
      paint();
    });
  });
  var reset = root.querySelector('[data-trail-reset]');
  if (reset) reset.addEventListener('click', function () { save([]); paint(); });
  paint();
})();
