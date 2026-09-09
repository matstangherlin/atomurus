(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'atomurus-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    try { localStorage.setItem(KEY, root.getAttribute('data-theme')); } catch (e) {}
  }

  try {
    var saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') applyTheme(saved);
  } catch (e) {}

  document.querySelectorAll('[data-ui-theme]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(btn.getAttribute('data-ui-theme'));
    });
  });

  var form = document.getElementById('ui-demo-form');
  var email = document.getElementById('ui-demo-email');
  var field = document.getElementById('ui-demo-email-field');
  var err = document.getElementById('ui-demo-email-error');
  if (form && email && field && err) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var invalid = !email.value.trim();
      field.classList.toggle('is-error', invalid);
      email.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      err.hidden = !invalid;
    });
  }

  document.querySelectorAll('[data-password-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-password-toggle');
      var input = document.getElementById(id);
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
      btn.textContent = show ? 'Hide' : 'Show';
    });
  });

  var host = document.getElementById('ui-dialog-host');
  var openBtn = document.getElementById('ui-dialog-open');
  var closeBtn = document.getElementById('ui-dialog-close');
  var dialog = host && host.querySelector('.ui-dialog');

  function closeDialog() {
    if (!host) return;
    host.classList.remove('is-open');
    host.setAttribute('hidden', '');
    document.body.classList.remove('ui-dialog-open');
    if (openBtn) openBtn.focus();
  }

  function openDialog() {
    if (!host || !dialog) return;
    host.hidden = false;
    host.classList.add('is-open');
    document.body.classList.add('ui-dialog-open');
    var focusable = dialog.querySelector('button, [href], input, select, textarea');
    if (focusable) focusable.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openDialog);
  if (closeBtn) closeBtn.addEventListener('click', closeDialog);
  if (host) {
    host.addEventListener('click', function (event) {
      if (event.target.classList.contains('ui-dialog-backdrop')) closeDialog();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && host && host.classList.contains('is-open')) {
      event.preventDefault();
      closeDialog();
    }
  });
})();
