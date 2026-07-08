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

  function validUsername(username) {
    return /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/.test(username);
  }

  function passwordPolicyError(password) {
    if (password.length < 9) return 'Use a password with at least 9 characters.';
    if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) {
      return 'Use at least one special character in your password.';
    }
    return '';
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

  function searchParam(name) {
    return new URLSearchParams(location.search).get(name) || '';
  }

  function clearHash() {
    if (history && history.replaceState) {
      history.replaceState(null, document.title, location.pathname + location.search);
    }
  }

  function currentMode() {
    var path = (location.pathname || '').replace(/\/+$/, '');
    var mode = (searchParam('mode') || '').toLowerCase();
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'recover';
    if (path === '/login/reset') return 'reset';
    if (mode === 'signup' || mode === 'recover' || mode === 'reset') return mode;
    return 'login';
  }

  function setMode(mode, options) {
    options = options || {};
    document.querySelectorAll('[data-auth-panel]').forEach(function (panel) {
      var active = panel.getAttribute('data-auth-panel') === mode;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
    document.querySelectorAll('[data-auth-route]').forEach(function (tab) {
      var active = tab.getAttribute('data-auth-route') === mode;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    if (!options.skipHistory) {
      var nextPath = '/login';
      if (mode === 'signup') nextPath = '/signup';
      if (mode === 'recover') nextPath = '/forgot-password';
      if (mode === 'reset') nextPath = '/login/reset';
      if (history && history.replaceState) history.replaceState(null, document.title, nextPath);
    }
  }

  function bindModeLinks() {
    document.querySelectorAll('[data-auth-route]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        setMode(link.getAttribute('data-auth-route'));
      });
    });
  }

  async function initAuthCallbacks() {
    var tokenHash = hashParam('token_hash') || searchParam('token_hash');
    var callbackType = hashParam('type') || searchParam('type');
    var confirmationToken = hashParam('confirmation_token') || (tokenHash && callbackType === 'signup' ? tokenHash : '');
    var recoveryToken = hashParam('recovery_token') || (tokenHash && callbackType === 'recovery' ? tokenHash : '');
    var loginOk = $('auth-login-ok');
    var loginErr = $('auth-login-err');

    if (confirmationToken) {
      setMode('login', { skipHistory: true });
      hide(loginOk);
      hide(loginErr);
      try {
        await postJson('/api/auth/confirm', {
          token: confirmationToken,
          type: callbackType || 'signup'
        });
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
        panel.dataset.recoveryToken = recoveryToken;
        panel.dataset.recoveryType = callbackType || 'recovery';
        setMode('reset', { skipHistory: true });
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

      var identifier = ($('auth-email').value || '').trim();
      var password = $('auth-password').value || '';
      setBusy(button, true, t('auth.entering', 'Entering…'));
      try {
        await postJson('/api/auth/login', { identifier: identifier, password: password });
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

      var fullName = ($('auth-signup-name').value || '').trim();
      var username = ($('auth-signup-username').value || '').trim().toLowerCase();
      var email = ($('auth-signup-email').value || '').trim();
      var password = $('auth-signup-password').value || '';
      var passwordConfirm = $('auth-signup-password-confirm').value || '';
      if (fullName.length < 2) {
        show(errBox, t('auth.nameInvalid', 'Enter your name with at least 2 characters.'));
        return;
      }
      if (!validUsername(username)) {
        show(errBox, t('auth.usernameInvalid', 'Choose a username with 3 to 30 letters, numbers, dot, underscore or hyphen.'));
        return;
      }
      var passwordError = passwordPolicyError(password);
      if (passwordError) {
        show(errBox, t('auth.passwordWeak', passwordError));
        return;
      }
      if (password !== passwordConfirm) {
        show(errBox, t('auth.passwordMismatch', 'Password confirmation does not match.'));
        return;
      }
      setBusy(button, true, t('auth.creating', 'Creating...'));
      try {
        var data = await postJson('/api/auth/signup', {
          fullName: fullName,
          username: username,
          email: email,
          password: password,
          passwordConfirm: passwordConfirm
        });
        if (data.signedIn && !data.needsConfirmation) {
          window.location.assign('/app');
          return;
        }
        show(okBox, t('auth.signupOk', 'Account created. Check your email if confirmation is required, then sign in.'));
        form.reset();
        setMode('login');
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
      var recoveryType = panel.dataset.recoveryType || 'recovery';
      var password = $('auth-new-password').value || '';
      setBusy(button, true, t('auth.saving', 'Saving...'));
      try {
        await postJson('/api/auth/reset', { token: token, password: password, type: recoveryType });
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
    bindModeLinks();
    setMode(currentMode(), { skipHistory: true });
    initAuthCallbacks();
    initLogin();
    initSignup();
    initPasswordReset();
    initRecovery();
  });
})();
