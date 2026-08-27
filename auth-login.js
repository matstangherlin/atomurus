(function () {
  'use strict';

  var booted = false;

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, fallback) {
    try {
      return (window.I18N && window.I18N.t && window.I18N.t(key)) || fallback;
    } catch (_err) {
      return fallback;
    }
  }

  function hide(node) {
    if (!node) return;
    node.classList.remove('show');
    node.style.display = '';
    node.hidden = false;
  }

  function show(node, message) {
    if (!node) return;
    if (message) node.textContent = message;
    node.classList.add('show');
    node.style.display = 'block';
    node.hidden = false;
    if (node.scrollIntoView) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function friendlySignupError(message) {
    var text = String(message || '').trim();
    if (!text) return 'Não foi possível criar a conta. Tente entrar ou use outro email.';
    if (/already registered|already exists|already in use/i.test(text)) {
      return 'Este email já tem conta. Vá em Login e entre com sua senha.';
    }
    if (/username.*already|already.*username/i.test(text)) {
      return 'Este nome de usuário já está em uso. Escolha outro.';
    }
    if (/password/i.test(text) && /character|special|weak|short/i.test(text)) {
      return text;
    }
    if (/too many|rate limit/i.test(text)) {
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
    }
    return text;
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

  async function requestJson(url, options) {
    var res = await fetch(url, Object.assign({
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    }, options || {}));
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok || data.ok === false) {
      var err = new Error(data.error || 'Request failed');
      err.status = res.status;
      err.code = data.code;
      throw err;
    }
    return data;
  }

  async function postJson(url, payload) {
    return requestJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  function friendlyLoginError(err) {
    var status = err && err.status;
    if (status === 403) {
      return t('auth.originBlocked', 'Sign-in was blocked for this site address. Open atomurus.com/login and try again.');
    }
    if (status === 429) {
      return t('auth.rateLimited', 'Too many attempts. Wait a few minutes and try again.');
    }
    if (status >= 500) {
      return t('auth.unavailable', 'Authentication is temporarily unavailable. Try again shortly.');
    }
    return t('auth.loginError', 'Invalid email or password.');
  }

  function searchParam(name) {
    return new URLSearchParams(location.search).get(name) || '';
  }

  function safeNextPath(raw) {
    var value = String(raw || '').trim();
    if (!value || value.charAt(0) !== '/' || value.slice(0, 2) === '//' || value.indexOf('\\') !== -1) return '';
    try {
      var decoded = decodeURIComponent(value);
      if (decoded.slice(0, 2) === '//' || decoded.indexOf('\\') !== -1) return '';
      var url = new URL(value, location.origin);
      if (url.origin !== location.origin) return '';
      var normalizedPath = (url.pathname || '/').replace(/\/+$/, '') || '/';
      if (
        normalizedPath === '/login' ||
        normalizedPath === '/signup' ||
        normalizedPath === '/forgot-password' ||
        normalizedPath === '/login/reset'
      ) {
        return '';
      }
      return url.pathname + url.search + url.hash;
    } catch (_err) {
      return '';
    }
  }

  function nextPath() {
    return safeNextPath(searchParam('next'));
  }

  function enterApp() {
    window.location.assign(nextPath() || '/app');
  }

  function hashParam(name) {
    if (!location.hash || location.hash.length < 2) return '';
    return new URLSearchParams(location.hash.slice(1)).get(name) || '';
  }

  function clearAuthCallbackParams() {
    if (!history || !history.replaceState) return;
    var params = new URLSearchParams(location.search);
    ['token_hash', 'type', 'confirmation_token', 'recovery_token'].forEach(function (name) {
      params.delete(name);
    });
    var query = params.toString();
    history.replaceState(null, document.title, location.pathname + (query ? '?' + query : ''));
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

  function routeForMode(mode) {
    if (mode === 'signup') return '/signup';
    if (mode === 'recover') return '/forgot-password';
    if (mode === 'reset') return '/login/reset';
    return '/login';
  }

  function authRouteWithNext(mode) {
    var path = routeForMode(mode);
    var next = nextPath();
    return next ? path + '?next=' + encodeURIComponent(next) : path;
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
    if (!options.skipHistory && history && history.replaceState) {
      history.replaceState(null, document.title, authRouteWithNext(mode));
    }
  }

  function bindModeLinks() {
    document.querySelectorAll('[data-auth-route]').forEach(function (link) {
      if (link.dataset.authRouteBound === '1') return;
      link.dataset.authRouteBound = '1';
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
        clearAuthCallbackParams();
        enterApp();
      } catch (_err) {
        clearAuthCallbackParams();
        show(loginErr, t('auth.confirmError', 'Email confirmation link is invalid or expired.'));
      }
      return true;
    }

    if (recoveryToken) {
      var panel = $('auth-password-panel');
      if (panel) {
        panel.dataset.recoveryToken = recoveryToken;
        panel.dataset.recoveryType = callbackType || 'recovery';
        setMode('reset', { skipHistory: true });
        clearAuthCallbackParams();
        if (panel.scrollIntoView) panel.scrollIntoView({ block: 'start' });
      }
      return true;
    }

    return false;
  }

  async function redirectExistingSession() {
    var mode = currentMode();
    if (mode !== 'login' && mode !== 'signup') return;
    try {
      await requestJson('/api/auth/me');
      enterApp();
    } catch (err) {
      if (!err || err.status !== 401) {
        // Keep the auth page usable if the session probe is temporarily unavailable.
      }
    }
  }

  async function handleLoginSubmit() {
    var button = $('auth-login-submit');
    var errBox = $('auth-login-err');
    if (button && button.disabled) return;
    hide(errBox);

    var identifier = ($('auth-email').value || '').trim();
    var password = $('auth-password').value || '';
    setBusy(button, true, t('auth.entering', 'Entering…'));
    try {
      await postJson('/api/auth/login', { identifier: identifier, password: password });
      enterApp();
    } catch (err) {
      show(errBox, friendlyLoginError(err));
      setBusy(button, false);
    }
  }

  async function handleSignupSubmit() {
    var form = $('auth-signup-form');
    var button = $('auth-signup-submit');
    var okBox = $('auth-signup-ok');
    var errBox = $('auth-signup-err');
    if (!form || (button && button.disabled)) return;
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
        enterApp();
        return;
      }
      form.reset();
      setMode('login');
      show(
        $('auth-login-ok'),
        t('auth.signupOk', 'Account created. Check your email if confirmation is required, then sign in.')
      );
    } catch (err) {
      show(errBox, friendlySignupError(err && err.message ? err.message : t('auth.signupError', 'Could not create this account. Try signing in or use another email.')));
    } finally {
      setBusy(button, false);
    }
  }

  async function handlePasswordResetSubmit() {
    var panel = $('auth-password-panel');
    var button = $('auth-password-submit');
    var errBox = $('auth-password-err');
    if (!panel || (button && button.disabled)) return;
    hide(errBox);

    var token = panel.dataset.recoveryToken || '';
    var recoveryType = panel.dataset.recoveryType || 'recovery';
    var password = $('auth-new-password').value || '';
    var passwordError = passwordPolicyError(password);
    if (passwordError) {
      show(errBox, t('auth.passwordWeak', passwordError));
      return;
    }
    setBusy(button, true, t('auth.saving', 'Saving...'));
    try {
      await postJson('/api/auth/reset', { token: token, password: password, type: recoveryType });
      enterApp();
    } catch (err) {
      show(errBox, err && err.message ? err.message : t('auth.resetError', 'Password reset link is invalid or expired.'));
    } finally {
      setBusy(button, false);
    }
  }

  async function handleRecoverySubmit() {
    var button = $('auth-reset-submit');
    var okBox = $('auth-reset-ok');
    var errBox = $('auth-reset-err');
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
  }

  function bindAuthForm(formId, handler) {
    var form = $(formId);
    if (!form || form.dataset.authBound === '1') return;
    form.dataset.authBound = '1';
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      void handler();
    });
  }

  function bindAuthButton(buttonId, handler) {
    var button = $(buttonId);
    if (!button || button.dataset.authClickBound === '1') return;
    button.dataset.authClickBound = '1';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      void handler();
    });
  }

  function bindAuthForms() {
    bindAuthForm('auth-login-form', handleLoginSubmit);
    bindAuthForm('auth-signup-form', handleSignupSubmit);
    bindAuthForm('auth-password-form', handlePasswordResetSubmit);
    bindAuthForm('auth-reset-form', handleRecoverySubmit);
    bindAuthButton('auth-login-submit', handleLoginSubmit);
    bindAuthButton('auth-signup-submit', handleSignupSubmit);
    bindAuthButton('auth-password-submit', handlePasswordResetSubmit);
    bindAuthButton('auth-reset-submit', handleRecoverySubmit);
  }

  async function bootAuth() {
    if (!booted) {
      booted = true;
      bindModeLinks();
      bindAuthForms();
    }
    setMode(currentMode(), { skipHistory: true });
    var handledCallback = await initAuthCallbacks();
    if (!handledCallback) await redirectExistingSession();
  }

  window.AtomurusAuth = {
    login: function (event) {
      if (event) event.preventDefault();
      void handleLoginSubmit();
    },
    signup: function (event) {
      if (event) event.preventDefault();
      void handleSignupSubmit();
    },
    recover: function (event) {
      if (event) event.preventDefault();
      void handleRecoverySubmit();
    },
    resetPassword: function (event) {
      if (event) event.preventDefault();
      void handlePasswordResetSubmit();
    },
    boot: bootAuth
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { void bootAuth(); }, { once: true });
  } else {
    void bootAuth();
  }
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) void bootAuth();
  });
})();
