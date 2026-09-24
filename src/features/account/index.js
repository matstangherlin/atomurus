/*
 * Account + mobile login, built only from the shared primitives
 * (ui-field / ui-input / ui-btn / tokens) — no login-only visual system.
 *
 * Mobile rules: single column; email field with type/inputmode/autocomplete
 * so the right keyboard and the password manager show up; 44px+ controls;
 * the submit button scrolls into view when the keyboard opens; loading and
 * error are explicit (offline ≠ wrong password ≠ server down).
 */

import { AuthErrorCode, mapAuthError } from '../../core/auth/auth-errors.js';
import { createEntitlement } from '../../core/entitlement/entitlement.js';
import { h, clear } from '../../ui/utilities/dom.js';

const ERROR_KEY = {
  [AuthErrorCode.INVALID_CREDENTIALS]: 'account.badCredentials',
  [AuthErrorCode.OFFLINE]: 'account.offline',
  [AuthErrorCode.TIMEOUT]: 'account.unavailable',
  [AuthErrorCode.SERVER_UNAVAILABLE]: 'account.unavailable',
  [AuthErrorCode.RATE_LIMITED]: 'account.unavailable'
};

export default {
  async mount({ root, scope, services }) {
    const t = services.t;
    const el = h.scoped(scope);
    const page = el('section', { class: 'app-page app-account' }, el('h1', { class: 'app-page-title' }, t('account.title')));
    const body = el('div', { class: 'app-account-body', 'aria-busy': 'true' }, el('div', { class: 'ui-skeleton' }));
    page.appendChild(body);
    root.appendChild(page);

    function renderSignedIn(user) {
      clear(body);
      body.removeAttribute('aria-busy');
      const ent = createEntitlement(user, { platform: services.platform.getPlatform() });
      body.appendChild(el('div', { class: 'ui-card', 'data-account': 'signed-in' },
        el('p', { class: 'ui-body ui-text-muted' }, t('account.signedInAs')),
        el('p', { class: 'ui-h3' }, user.displayName || user.email || ''),
        el('p', { class: 'ui-body' }, `${t('account.plan')}: `, el('span', { class: 'ui-badge' }, ent.isPro() ? 'Pro' : 'Free')),
        el('button', { class: 'ui-btn ui-btn-secondary', type: 'button', 'data-account-signout': true, onclick: async () => {
          await services.auth.logout();
          renderSignedOut();
        } }, t('account.signOut'))));
    }

    function renderSignedOut() {
      clear(body);
      body.removeAttribute('aria-busy');
      const error = el('p', { class: 'ui-field-error', role: 'alert', hidden: true, 'data-login-error': true });
      const identifier = el('input', { class: 'ui-input', id: 'app-login-id', name: 'username', type: 'text', inputmode: 'email', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true, enterkeyhint: 'next' });
      const password = el('input', { class: 'ui-input', id: 'app-login-pw', name: 'password', type: 'password', autocomplete: 'current-password', required: true, enterkeyhint: 'go' });
      const submit = el('button', { class: 'ui-btn ui-btn-primary app-primary-cta', type: 'submit', 'data-login-submit': true }, t('account.signIn'));
      const form = el('form', { class: 'app-form', 'data-login-form': true, novalidate: true },
        el('div', { class: 'ui-field' }, el('label', { class: 'ui-label', for: 'app-login-id' }, t('account.email')), identifier),
        el('div', { class: 'ui-field' }, el('label', { class: 'ui-label', for: 'app-login-pw' }, t('account.password')), password),
        error,
        el('div', { class: 'app-form-actions' }, submit));

      /* Keyboard open → keep the focused field and the CTA on screen. The
         layout uses dvh, so the visible viewport already shrinks; this makes
         sure the scroll owner follows. */
      const reveal = () => scope.timeout(() => submit.scrollIntoView({ block: 'nearest' }), 250);
      scope.listen(form, 'focusin', reveal);
      const vv = globalThis.visualViewport;
      if (vv) scope.listen(vv, 'resize', () => {
        const active = form.ownerDocument.activeElement;
        if (active && form.contains(active)) reveal();
      });

      scope.listen(form, 'submit', async (event) => {
        event.preventDefault();
        error.hidden = true;
        submit.disabled = true;
        submit.classList.add('is-loading');
        submit.textContent = t('account.signingIn');
        try {
          const session = await services.auth.login({ identifier: identifier.value.trim(), password: password.value });
          if (!scope.disposed) renderSignedIn(session.user);
        } catch (err) {
          if (scope.disposed) return;
          error.textContent = t(ERROR_KEY[mapAuthError(err, { phase: 'login' })] || 'account.unavailable');
          error.hidden = false;
          submit.disabled = false;
          submit.classList.remove('is-loading');
          submit.textContent = t('account.signIn');
        }
      });
      body.appendChild(form);
    }

    try {
      const session = await services.auth.getSession();
      if (scope.disposed) return {};
      if (session.signedIn) renderSignedIn(session.user);
      else renderSignedOut();
    } catch (_err) {
      if (!scope.disposed) renderSignedOut();
    }
    return {};
  }
};
