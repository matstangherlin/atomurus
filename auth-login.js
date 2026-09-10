(function () {
  'use strict';

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

  function auth() {
    return window.AtomurusAuth;
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
    if (!text) return t('common.auth.signupError', 'Could not create this account. Try signing in or use another email.');
    if (/already registered|already exists|already in use|already has an account/i.test(text)) {
      return t('common.auth.emailTaken', 'This email already has an account. Sign in or reset your password.');
    }
    if (/username.*already|already.*username/i.test(text)) {
      return t('common.auth.usernameTaken', 'This username is already in use. Choose another.');
    }
    if (/password/i.test(text) && /character|special|weak|short/i.test(text)) {
      return text;
    }
    if (/too many|rate limit/i.test(text)) {
      return t('common.auth.rateLimited', 'Too many attempts. Wait a few minutes and try again.');
    }
    return text;
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) return;
    var span = button.querySelector('span');
    button.disabled = busy;
    button.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (!span) return;
    if (busy) {
      span.dataset.readyLabel = span.dataset.readyLabel || span.textContent;
      span.textContent = busyLabel;
    } else if (span.dataset.readyLabel) {
      span.textContent = span.dataset.readyLabel;
    }
  }

  function setFormBusy(form, busy) {
    if (!form) return;
    form.querySelectorAll('input, button').forEach(function (el) {
      if (el.getAttribute('data-password-toggle')) return;
      if (busy) el.setAttribute('data-was-disabled', el.disabled ? '1' : '0');
      if (el.id && el.id.indexOf('submit') !== -1) return;
      if (el.getAttribute('data-password-toggle') != null) return;
      if (el.type === 'button') return;
      el.disabled = busy ? true : el.getAttribute('data-was-disabled') === '1';
    });
  }

  function validUsername(username) {
    return /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/.test(username);
  }

  function passwordPolicyError(password) {
    if (password.length < 9) return t('common.auth.passwordLength', 'Use a password with at least 9 characters.');
    if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) {
      return t('common.auth.passwordSpecial', 'Use at least one special character in your password.');
    }
    return '';
  }

  function friendlyLoginError(err) {
    var status = err && err.status;
    var code = err && err.code;
    if (code === 'email_not_confirmed') {
      return t('common.auth.emailNotConfirmed', 'Confirm your email before signing in. Check your inbox for the confirmation link.');
    }
    if (code === 'network' || status === 0) {
      return t('common.auth.networkError', 'Network problem. Check your connection and try again.');
    }
    if (code === 'timeout' || code === 'upstream_timeout' || status === 503) {
      return t('common.auth.unavailable', 'Authentication is temporarily unavailable. Try again shortly.');
    }
    if (status === 403) {
      return t('common.auth.originBlocked', 'Sign-in was blocked for this site address. Open atomurus.com/login and try again.');
    }
    if (status === 429) {
      return t('common.auth.rateLimited', 'Too many attempts. Wait a few minutes and try again.');
    }
    if (status >= 500) {
      return t('common.auth.unavailable', 'Authentication is temporarily unavailable. Try again shortly.');
    }
    return t('common.auth.loginError', 'Invalid email or password.');
  }

  function hashParam(name) {
    if (!location.hash || location.hash.length < 2) return '';
    return new URLSearchParams(location.hash.slice(1)).get(name) || '';
  }

  function searchParam(name) {
    return new URLSearchParams(location.search).get(name) || '';
  }

  function pickParam(name) {
    return hashParam(name) || searchParam(name) || '';
  }

  function stripSensitiveAuthParams() {
    if (!history || !history.replaceState) return;
    var url = new URL(location.href);
    [
      'token_hash',
      'confirmation_token',
      'recovery_token',
      'type',
      'access_token',
      'refresh_token',
      'error',
      'error_code',
      'error_description',
      'code'
    ].forEach(function (key) {
      url.searchParams.delete(key);
    });
    var client = auth();
    var next = url.searchParams.get('next');
    if (next) {
      var safe = client ? client.safeNextPath(next, '') : '';
      if (safe) url.searchParams.set('next', safe);
      else url.searchParams.delete('next');
    }
    var lang = url.searchParams.get('lang') || searchParam('lang');
    if (lang) url.searchParams.set('lang', lang);
    else url.searchParams.delete('lang');
    history.replaceState(null, document.title, url.pathname + url.search);
  }

  function currentMode() {
    var path = (location.pathname || '').replace(/\/+$/, '');
    var mode = (searchParam('mode') || '').toLowerCase();
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'recover';
    if (path === '/reset-password' || path === '/login/reset') return 'reset';
    if (mode === 'signup' || mode === 'recover' || mode === 'reset') return mode;
    return 'login';
  }

  function preservedAuthQuery() {
    var params = [];
    var lang = searchParam('lang');
    if (lang) params.push('lang=' + encodeURIComponent(lang));
    var client = auth();
    var rawNext = searchParam('next');
    var next = rawNext ? (client ? client.safeNextPath(rawNext, '') : '') : '';
    if (next) params.push('next=' + encodeURIComponent(next));
    return params.length ? '?' + params.join('&') : '';
  }

  function authScreenPath(mode) {
    var path = '/login';
    if (mode === 'signup') path = '/signup';
    if (mode === 'recover') path = '/forgot-password';
    if (mode === 'reset') path = '/reset-password';
    return path + preservedAuthQuery();
  }

  function applyAuthTitle(mode) {
    var keys = {
      login: ['common.auth.loginTitle', 'Login'],
      signup: ['common.auth.signupTitle', 'Create account'],
      recover: ['common.auth.recoverTitle', 'Forgot your password?'],
      reset: ['common.auth.resetTitle', 'Set new password']
    };
    var pair = keys[mode] || keys.login;
    var label = t(pair[0], pair[1]);
    document.title = label + ' — Atomurus';
    var og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute('content', document.title);
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
    applyAuthTitle(mode);
    if (!options.skipHistory && history && history.replaceState) {
      history.replaceState(null, document.title, authScreenPath(mode));
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

  function bindPasswordToggles() {
    document.querySelectorAll('[data-password-toggle]').forEach(function (button) {
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';
      button.addEventListener('click', function () {
        var input = $(button.getAttribute('data-password-toggle'));
        if (!input) return;
        var showPassword = input.type === 'password';
        input.type = showPassword ? 'text' : 'password';
        button.setAttribute('aria-pressed', showPassword ? 'true' : 'false');
        button.textContent = showPassword
          ? t('common.auth.hidePassword', 'Hide')
          : t('common.auth.showPassword', 'Show');
      });
    });
  }

  async function initAuthCallbacks() {
    var client = auth();
    if (!client) return false;

    var accessToken = pickParam('access_token');
    var refreshToken = pickParam('refresh_token');
    var tokenHash = pickParam('token_hash');
    var callbackType = pickParam('type');
    var confirmationToken = pickParam('confirmation_token') || (tokenHash && callbackType === 'signup' ? tokenHash : '');
    var recoveryToken = pickParam('recovery_token') || (tokenHash && (callbackType === 'recovery' || callbackType === 'invite') ? tokenHash : '');
    var loginOk = $('auth-login-ok');
    var loginErr = $('auth-login-err');

    if (accessToken && refreshToken) {
      try {
        await client.establishSession(accessToken, refreshToken);
        stripSensitiveAuthParams();
        if (callbackType === 'recovery') {
          var panel = $('auth-password-panel');
          if (panel) {
            panel.dataset.recoveryToken = '';
            panel.dataset.recoveryType = 'recovery';
            setMode('reset', { skipHistory: true });
            if (panel.scrollIntoView) panel.scrollIntoView({ block: 'start' });
          }
          return true;
        }
        client.redirectAfterLogin();
        return true;
      } catch (_err) {
        stripSensitiveAuthParams();
        show(loginErr, t('common.auth.confirmError', 'Email confirmation link is invalid or expired.'));
        return true;
      }
    }

    if (confirmationToken) {
      setMode('login', { skipHistory: true });
      hide(loginOk);
      hide(loginErr);
      try {
        await client.confirmEmail(confirmationToken, callbackType || 'signup');
        stripSensitiveAuthParams();
        show(loginOk, t('common.auth.confirmed', 'Email confirmed. Entering your workspace…'));
        client.redirectAfterLogin();
      } catch (_err) {
        stripSensitiveAuthParams();
        show(loginErr, t('common.auth.confirmError', 'Email confirmation link is invalid or expired.'));
      }
      return true;
    }

    if (recoveryToken) {
      var resetPanel = $('auth-password-panel');
      if (resetPanel) {
        resetPanel.dataset.recoveryToken = recoveryToken;
        resetPanel.dataset.recoveryType = callbackType || 'recovery';
        setMode('reset', { skipHistory: true });
        stripSensitiveAuthParams();
        if (resetPanel.scrollIntoView) resetPanel.scrollIntoView({ block: 'start' });
      } else {
        stripSensitiveAuthParams();
      }
      return true;
    }

    return false;
  }

  async function handleLoginSubmit() {
    var button = $('auth-login-submit');
    var form = $('auth-login-form');
    var errBox = $('auth-login-err');
    var okBox = $('auth-login-ok');
    if (button && button.disabled) return;
    hide(errBox);
    hide(okBox);

    var identifier = ($('auth-email').value || '').trim();
    var password = $('auth-password').value || '';
    setBusy(button, true, t('common.auth.signingIn', t('common.auth.entering', 'Signing in…')));
    setFormBusy(form, true);
    var signedIn = false;
    try {
      await auth().login(identifier, password);
      signedIn = true;
      show(okBox, t('common.auth.loginOk', 'Signed in. Opening your workspace…'));
      auth().redirectAfterLogin();
    } catch (err) {
      show(errBox, friendlyLoginError(err));
    } finally {
      if (!signedIn) {
        setBusy(button, false);
        setFormBusy(form, false);
      }
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
      show(errBox, t('common.auth.nameInvalid', 'Enter your name with at least 2 characters.'));
      return;
    }
    if (!validUsername(username)) {
      show(errBox, t('common.auth.usernameInvalid', 'Choose a username with 3 to 30 letters, numbers, dot, underscore or hyphen.'));
      return;
    }
    var passwordError = passwordPolicyError(password);
    if (passwordError) {
      show(errBox, passwordError);
      return;
    }
    if (password !== passwordConfirm) {
      show(errBox, t('common.auth.passwordMismatch', 'Password confirmation does not match.'));
      return;
    }
    setBusy(button, true, t('common.auth.creatingAccount', t('common.auth.creating', 'Creating account…')));
    setFormBusy(form, true);
    try {
      var data = await auth().signup({
        fullName: fullName,
        username: username,
        email: email,
        password: password,
        passwordConfirm: passwordConfirm
      });
      if (data.signedIn && !data.needsConfirmation) {
        show(okBox, t('common.auth.signupOkEnter', 'Account created. Opening your workspace…'));
        auth().redirectAfterLogin();
        return;
      }
      form.reset();
      setMode('login');
      hide(okBox);
      hide(errBox);
      hide($('auth-login-err'));
      show(
        $('auth-login-ok'),
        t('common.auth.signupOk', 'Account created. Check your email if confirmation is required, then sign in.')
      );
    } catch (err) {
      show(errBox, friendlySignupError(err && err.message ? err.message : t('common.auth.signupError', 'Could not create this account. Try signing in or use another email.')));
    } finally {
      setBusy(button, false);
      setFormBusy(form, false);
    }
  }

  async function handlePasswordResetSubmit() {
    var panel = $('auth-password-panel');
    var form = $('auth-password-form');
    var button = $('auth-password-submit');
    var errBox = $('auth-password-err');
    if (!panel || (button && button.disabled)) return;
    hide(errBox);

    var token = panel.dataset.recoveryToken || '';
    var recoveryType = panel.dataset.recoveryType || 'recovery';
    var password = $('auth-new-password').value || '';
    var passwordError = passwordPolicyError(password);
    if (passwordError) {
      show(errBox, passwordError);
      return;
    }
    setBusy(button, true, t('common.auth.saving', 'Saving...'));
    setFormBusy(form, true);
    try {
      await auth().resetPassword({ token: token, password: password, type: recoveryType });
      auth().redirectAfterLogin();
    } catch (err) {
      show(errBox, err && err.message ? err.message : t('common.auth.resetError', 'Password reset link is invalid or expired.'));
    } finally {
      setBusy(button, false);
      setFormBusy(form, false);
    }
  }

  async function handleRecoverySubmit() {
    var button = $('auth-reset-submit');
    var form = $('auth-reset-form');
    var okBox = $('auth-reset-ok');
    var errBox = $('auth-reset-err');
    if (button && button.disabled) return;
    hide(okBox);
    hide(errBox);

    var email = ($('auth-reset-email').value || '').trim();
    setBusy(button, true, t('common.auth.sending', 'Sending…'));
    setFormBusy(form, true);
    try {
      await auth().recoverPassword(email);
      show(okBox, t('common.auth.recoverOk', 'If this email has access, we sent recovery instructions.'));
    } catch (err) {
      if (err && (err.code === 'network' || err.status === 0)) {
        show(errBox, t('common.auth.networkError', 'Network problem. Check your connection and try again.'));
      } else {
        show(errBox, t('common.auth.recoverError', 'Could not send right now. Please try again later.'));
      }
    } finally {
      setBusy(button, false);
      setFormBusy(form, false);
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

  function bindAuthForms() {
    bindAuthForm('auth-login-form', handleLoginSubmit);
    bindAuthForm('auth-signup-form', handleSignupSubmit);
    bindAuthForm('auth-password-form', handlePasswordResetSubmit);
    bindAuthForm('auth-reset-form', handleRecoverySubmit);
  }

  var authPageBound = false;
  var authPageBooted = false;
  var signedInCheckInFlight = false;

  async function maybeRedirectSignedIn() {
    var client = auth();
    if (!client) return;
    if (currentMode() === 'reset') return;
    if (signedInCheckInFlight) return;
    signedInCheckInFlight = true;
    try {
      var session = await client.getSession();
      if (session && session.signedIn) client.redirectAfterLogin();
    } catch (err) {
      if (err && (err.status === 401 || err.code === 'session_expired')) return;
      // Network / 5xx must not block the login page.
    } finally {
      signedInCheckInFlight = false;
    }
  }

  function bindPasswordHints() {
    ['auth-signup-password', 'auth-new-password'].forEach(function (id) {
      var input = $(id);
      var box = document.querySelector('[data-pw-for="' + id + '"]');
      if (!input || !box || box.dataset.bound === '1') return;
      box.dataset.bound = '1';
      function paint() {
        var value = input.value || '';
        box.querySelectorAll('[data-req]').forEach(function (item) {
          var ok = false;
          if (item.getAttribute('data-req') === 'length') ok = value.length >= 9;
          if (item.getAttribute('data-req') === 'special') ok = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(value);
          item.classList.toggle('is-ok', ok);
        });
      }
      input.addEventListener('input', paint);
      paint();
    });
  }

  function bindAuthPage() {
    if (authPageBound) return;
    authPageBound = true;
    bindModeLinks();
    bindAuthForms();
    bindPasswordToggles();
    bindPasswordHints();
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(function () {
        applyAuthTitle(currentMode());
      });
    }
  }

  function revealAuthPanels() {
    document.documentElement.classList.remove('auth-checking');
    var boot = $('auth-session-boot');
    if (boot) boot.hidden = true;
  }

  async function startAuthPage() {
    if (authPageBooted) return;
    authPageBooted = true;
    bindAuthPage();
    setMode(currentMode(), { skipHistory: true });
    var fallback = setTimeout(revealAuthPanels, 8000);
    try {
      var handledCallback = await initAuthCallbacks();
      if (!handledCallback) await maybeRedirectSignedIn();
    } finally {
      clearTimeout(fallback);
      revealAuthPanels();
    }
  }

  function onPageShow(event) {
    if (!event || event.persisted !== true) return;
    void maybeRedirectSignedIn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAuthPage);
  } else {
    void startAuthPage();
  }
  window.addEventListener('pageshow', onPageShow);
})();
