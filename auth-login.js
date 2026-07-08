(function () {
  'use strict';

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, fallback) {
    return (window.I18N && window.I18N.t && window.I18N.t(key)) || fallback;
  }

  function hide(node) {
    if (node) node.classList.remove('show');
  }

  function show(node, message) {
    if (!node) return;
    if (message) node.textContent = message;
    node.classList.add('show');
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) return;
    var span = button.querySelector('span');
    button.disabled = busy;
    if (!span) return;
    if (busy) {
      span.dataset.readyLabel = span.dataset.readyLabel || span.textContent;
      span.textContent = busyLabel;
    } else if (span.dataset.readyLabel) {
      span.textContent = span.dataset.readyLabel;
    }
  }

  async function postJson(url, payload) {
    var res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok || data.ok === false) {
      var err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function hashParam(name) {
    if (!location.hash || location.hash.length < 2) return '';
    return new URLSearchParams(location.hash.slice(1)).get(name) || '';
  }

  function clearHash() {
    if (history && history.replaceState) {
      history.replaceState(null, document.title, location.pathname + location.search);
    }
  }

  async function initAuthCallbacks() {
    var confirmationToken = hashParam('confirmation_token');
    var recoveryToken = hashParam('recovery_token');
    var loginOk = $('auth-login-ok');
    var loginErr = $('auth-login-err');

    if (confirmationToken) {
      hide(loginOk);
      hide(loginErr);
      try {
        await postJson('/api/auth/confirm', { token: confirmationToken });
        clearHash();
        window.location.assign('/app');
      } catch (_err) {
        clearHash();
        show(loginErr, t('auth.confirmError', 'Email confirmation link is invalid or expired.'));
      }
      return;
    }

    if (recoveryToken) {
      var panel = $('auth-password-panel');
      if (panel) {
        panel.hidden = false;
        panel.dataset.recoveryToken = recoveryToken;
        clearHash();
        if (panel.scrollIntoView) panel.scrollIntoView({ block: 'start' });
      }
    }
  }

  function initLogin() {
    var form = $('auth-login-form');
    if (!form) return;
    var button = $('auth-login-submit');
    var errBox = $('auth-login-err');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (button && button.disabled) return; // block double submit
      hide(errBox);

      var email = ($('auth-email').value || '').trim();
      var password = $('auth-password').value || '';
      setBusy(button, true, t('auth.entering', 'Entering…'));
      try {
        await postJson('/api/auth/login', { email: email, password: password });
        window.location.assign('/app');
      } catch (_err) {
        show(errBox, t('auth.loginError', 'Invalid email or password.'));
        setBusy(button, false);
      }
    });
  }

  function initSignup() {
    var form = $('auth-signup-form');
    if (!form) return;
    var button = $('auth-signup-submit');
    var okBox = $('auth-signup-ok');
    var errBox = $('auth-signup-err');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (button && button.disabled) return;
      hide(okBox);
      hide(errBox);

      var email = ($('auth-signup-email').value || '').trim();
      var password = $('auth-signup-password').value || '';
      setBusy(button, true, t('auth.creating', 'Creating...'));
      try {
        var data = await postJson('/api/auth/signup', { email: email, password: password });
        if (data.signedIn && !data.needsConfirmation) {
          window.location.assign('/app');
          return;
        }
        show(okBox, t('auth.signupOk', 'Account created. Check your email if confirmation is required, then sign in.'));
        form.reset();
      } catch (err) {
        show(errBox, err && err.message ? err.message : t('auth.signupError', 'Could not create this account. Try signing in or use another email.'));
      } finally {
        setBusy(button, false);
      }
    });
  }

  function initPasswordReset() {
    var form = $('auth-password-form');
    var panel = $('auth-password-panel');
    if (!form || !panel) return;
    var button = $('auth-password-submit');
    var errBox = $('auth-password-err');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (button && button.disabled) return;
      hide(errBox);

      var token = panel.dataset.recoveryToken || '';
      var password = $('auth-new-password').value || '';
      setBusy(button, true, t('auth.saving', 'Saving...'));
      try {
        await postJson('/api/auth/reset', { token: token, password: password });
        window.location.assign('/app');
      } catch (err) {
        show(errBox, err && err.message ? err.message : t('auth.resetError', 'Password reset link is invalid or expired.'));
      } finally {
        setBusy(button, false);
      }
    });
  }

  function initRecovery() {
    var form = $('auth-reset-form');
    if (!form) return;
    var button = $('auth-reset-submit');
    var okBox = $('auth-reset-ok');
    var errBox = $('auth-reset-err');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (button && button.disabled) return;
      hide(okBox);
      hide(errBox);

      var email = ($('auth-reset-email').value || '').trim();
      setBusy(button, true, t('auth.sending', 'Sending…'));
      try {
        await postJson('/api/auth/recover', { email: email });
        show(okBox);
      } catch (_err) {
        show(errBox);
      } finally {
        setBusy(button, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAuthCallbacks();
    initLogin();
    initSignup();
    initPasswordReset();
    initRecovery();
  });
})();
