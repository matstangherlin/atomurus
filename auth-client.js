(function () {
  'use strict';

  if (window.AtomurusAuth) return;

  var PUBLIC_AUTH_PATHS = {
    '/login': true,
    '/signup': true,
    '/forgot-password': true,
    '/reset-password': true,
    '/login/reset': true
  };
  var PROTECTED_PREFIXES = ['/app'];
  var listeners = [];
  var verified = false;
  var refreshTimer = null;
  var sessionPromise = null;
  var sync = null;

  var state = {
    ready: false,
    signedIn: false,
    user: null,
    error: null
  };

  function copyState() {
    return {
      ready: state.ready,
      signedIn: state.signedIn,
      user: state.user,
      error: state.error
    };
  }

  function emit() {
    window.__ATOMURUS_AUTH__ = copyState();
    var snapshot = copyState();
    document.dispatchEvent(new CustomEvent('atomurus-auth-change', { detail: snapshot }));
    listeners.slice().forEach(function (fn) {
      try { fn(snapshot); } catch (_err) {}
    });
  }

  function setState(patch) {
    var key;
    for (key in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) state[key] = patch[key];
    }
    emit();
  }

  function pathnameOf(value) {
    var raw = String(value || '').split('?')[0].split('#')[0];
    if (!raw || raw === '/') return '/';
    return raw.replace(/\/+$/, '') || '/';
  }

  function isPublicAuthPath(pathname) {
    return Boolean(PUBLIC_AUTH_PATHS[pathnameOf(pathname)]);
  }

  function isProtectedPath(pathname) {
    var path = pathnameOf(pathname);
    if (path === '/app.html') path = '/app';
    return PROTECTED_PREFIXES.some(function (prefix) {
      return path === prefix || path.indexOf(prefix + '/') === 0;
    });
  }

  function fullyDecode(value) {
    var current = String(value || '');
    var i;
    for (i = 0; i < 5; i += 1) {
      try {
        var next = decodeURIComponent(current.replace(/\+/g, '%20'));
        if (next === current) break;
        current = next;
      } catch (_err) {
        break;
      }
    }
    return current;
  }

  function hasBackslash(value) {
    return String(value || '').indexOf('\\') !== -1 || /%5c/i.test(String(value || ''));
  }

  // Keep in sync with netlify/lib/auth-redirect.mjs
  function safeNextPath(raw, fallback) {
    if (fallback === undefined) fallback = '/app';
    var value = String(raw || '').trim();
    if (!value) return fallback;
    if (hasBackslash(value)) return fallback;

    var decoded = fullyDecode(value);
    if (hasBackslash(decoded)) return fallback;
    if (value.charAt(0) !== '/' || value.indexOf('//') === 0 || decoded.indexOf('//') === 0) return fallback;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return fallback;

    var url;
    try {
      url = new URL(value, location.origin);
    } catch (_err) {
      return fallback;
    }
    if (url.origin !== location.origin) return fallback;
    if (url.username || url.password) return fallback;
    if (url.pathname.indexOf('//') === 0) return fallback;

    var decodedPath = fullyDecode(url.pathname);
    if (decodedPath.indexOf('//') === 0 || hasBackslash(decodedPath)) return fallback;
    if (isPublicAuthPath(url.pathname) || isPublicAuthPath(decodedPath)) return fallback;

    return url.pathname + url.search;
  }

  function currentPath() {
    return pathnameOf(location.pathname);
  }

  function currentNextCandidate() {
    if (isPublicAuthPath(location.pathname)) return '/app';
    return location.pathname + location.search;
  }

  function queryParam(name) {
    try {
      return new URLSearchParams(location.search).get(name) || '';
    } catch (_err) {
      return '';
    }
  }

  function loginUrl(nextPath) {
    var next = safeNextPath(nextPath || currentNextCandidate(), '/app');
    var url = '/login?next=' + encodeURIComponent(next);
    var lang = queryParam('lang');
    if (lang) url += '&lang=' + encodeURIComponent(lang);
    return url;
  }

  function redirectAfterLogin() {
    location.replace(safeNextPath(queryParam('next'), '/app'));
  }

  function redirectToLogin(nextPath) {
    location.replace(loginUrl(nextPath || currentNextCandidate()));
  }

  async function request(url, options) {
    var opts = options || {};
    var headers = Object.assign({ Accept: 'application/json' }, opts.headers || {});
    var res;
    try {
      res = await fetch(url, Object.assign({
        credentials: 'include'
      }, opts, { headers: headers }));
    } catch (_err) {
      var networkErr = new Error('network');
      networkErr.status = 0;
      networkErr.code = 'network';
      throw networkErr;
    }
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok || data.ok === false) {
      var err = new Error(data.error || 'Request failed');
      err.status = res.status;
      err.code = data.code;
      err.payload = data;
      throw err;
    }
    return data;
  }

  function applyUser(user, ready) {
    verified = true;
    setState({
      ready: ready !== false,
      signedIn: Boolean(user),
      user: user || null,
      error: null
    });
  }

  function publishSync(type) {
    if (sync && typeof sync.publish === 'function') sync.publish(type);
  }

  function hidePrivateWorkspace() {
    try {
      document.documentElement.classList.remove('auth-ready');
      document.documentElement.classList.add('auth-pending');
    } catch (_err) {}
  }

  function handleRemoteAuth(_event, action) {
    if (action === 'sign-out') {
      stopRefreshTimer();
      applyUser(null, true);
      hidePrivateWorkspace();
      if (isProtectedPath(location.pathname)) redirectToLogin(currentNextCandidate());
      return;
    }
    if (action === 'revalidate') {
      getSession({ force: true }).then(function (snapshot) {
        if (snapshot.signedIn && isPublicAuthPath(location.pathname)) redirectAfterLogin();
      }).catch(function () {});
    }
  }

  function bindAuthSync() {
    if (sync) return;
    var factory = window.AtomurusAuthSync;
    if (!factory || typeof factory.createAuthSync !== 'function') return;
    sync = factory.createAuthSync();
    sync.subscribe(handleRemoteAuth);
  }

  function ingestPublicSession(user, signedIn) {
    if (verified) return copyState();
    if (isProtectedPath(location.pathname)) return copyState();
    setState({
      ready: true,
      signedIn: Boolean(signedIn && user),
      user: user || null,
      error: null
    });
    return copyState();
  }

  async function getSession(options) {
    options = options || {};
    if (sessionPromise) return sessionPromise;
    if (!options.force && verified && state.ready && !state.error) {
      return copyState();
    }

    var run = (async function () {
      try {
        var data = await request('/api/auth/me');
        applyUser(data.user, true);
        return copyState();
      } catch (err) {
        if (err.status === 401) {
          applyUser(null, true);
          return copyState();
        }
        if (err.code === 'network') {
          setState({ ready: true, error: 'network' });
          throw err;
        }
        setState({ ready: true, error: err.code || 'unavailable' });
        throw err;
      }
    })();

    sessionPromise = run;
    try {
      return await run;
    } finally {
      if (sessionPromise === run) sessionPromise = null;
    }
  }

  async function refreshSession() {
    var data = await request('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    applyUser(data.user, true);
    return copyState();
  }

  async function login(identifier, password) {
    var data = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier, password: password })
    });
    applyUser(data.user, true);
    publishSync('signed-in');
    return data;
  }

  async function signup(payload) {
    var data = await request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (data.signedIn && data.user) {
      applyUser(data.user, true);
      publishSync('signed-in');
    } else if (data.user && !data.needsConfirmation) {
      applyUser(data.user, true);
      publishSync('signed-in');
    } else {
      verified = true;
      setState({ ready: true, signedIn: false, user: null, error: null });
    }
    return data;
  }

  async function logout() {
    try {
      await request('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
    } catch (_err) {}
    stopRefreshTimer();
    applyUser(null, true);
    publishSync('signed-out');
    return copyState();
  }

  async function recoverPassword(email) {
    return request('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    });
  }

  async function resetPassword(payload) {
    var data = await request('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    if (data.user) {
      applyUser(data.user, true);
      publishSync('signed-in');
    }
    return data;
  }

  async function confirmEmail(token, type) {
    var data = await request('/api/auth/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, type: type || 'signup' })
    });
    if (data.user) {
      applyUser(data.user, true);
      publishSync('signed-in');
    }
    return data;
  }

  async function establishSession(accessToken, refreshToken) {
    var data = await request('/api/auth/establish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: accessToken, refreshToken: refreshToken })
    });
    applyUser(data.user, true);
    publishSync('signed-in');
    return data;
  }

  async function requireSession(options) {
    options = options || {};
    var snapshot;
    try {
      snapshot = await getSession();
    } catch (err) {
      if (err.status === 0 || err.code === 'network' || err.status >= 500) throw err;
      snapshot = { ready: true, signedIn: false, user: null, error: err.code || null };
    }
    if (!snapshot.signedIn) {
      if (options.redirect !== false) redirectToLogin(options.next);
      var missing = new Error('Sign in required');
      missing.status = 401;
      missing.code = 'session_expired';
      throw missing;
    }
    return snapshot;
  }

  async function requireGuest(options) {
    options = options || {};
    var snapshot = await getSession();
    if (snapshot.signedIn && options.redirect !== false) redirectAfterLogin();
    return snapshot;
  }

  function getCurrentUser() {
    return state.user;
  }

  function getState() {
    return copyState();
  }

  function isVerified() {
    return verified;
  }

  function onChange(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (item) { return item !== fn; });
    };
  }

  function stopRefreshTimer() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function startRefreshTimer() {
    stopRefreshTimer();
    if (!isProtectedPath(currentPath())) return;
    refreshTimer = setInterval(function () {
      if (!state.signedIn) return;
      refreshSession().catch(function (err) {
        if (err && err.status === 401) redirectToLogin(currentNextCandidate());
      });
    }, 10 * 60 * 1000);
  }

  window.AtomurusAuth = {
    login: login,
    logout: logout,
    signup: signup,
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    refreshSession: refreshSession,
    recoverPassword: recoverPassword,
    resetPassword: resetPassword,
    confirmEmail: confirmEmail,
    establishSession: establishSession,
    requireSession: requireSession,
    requireGuest: requireGuest,
    redirectToLogin: redirectToLogin,
    redirectAfterLogin: redirectAfterLogin,
    loginUrl: loginUrl,
    safeNextPath: safeNextPath,
    isPublicAuthPath: isPublicAuthPath,
    isProtectedPath: isProtectedPath,
    ingestPublicSession: ingestPublicSession,
    getState: getState,
    onChange: onChange,
    isVerified: isVerified,
    startRefreshTimer: startRefreshTimer,
    stopRefreshTimer: stopRefreshTimer
  };

  bindAuthSync();
  window.__ATOMURUS_AUTH__ = copyState();
})();
