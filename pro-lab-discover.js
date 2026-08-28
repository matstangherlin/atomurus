(function () {
  'use strict';

  if (window.AtomurusProLabDiscoverBound) return;
  window.AtomurusProLabDiscoverBound = true;

  function langIsPt() {
    var lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.indexOf('pt') === 0) return true;
    try { return localStorage.getItem('atomurus-lang') === 'pt'; } catch (_err) { return false; }
  }

  function copy() {
    var pt = langIsPt();
    return {
      badge: 'PRO',
      calcTitle: pt ? 'Compare vários cenários e salve seus cálculos.' : 'Compare multiple scenarios and save your calculations.',
      calcCta: pt ? 'Abrir Advanced Calculations' : 'Open Advanced Calculations',
      elTitle: pt ? 'Compare até 4 elementos e salve a análise.' : 'Compare up to 4 elements and save the analysis.',
      elCta: pt ? 'Advanced Compare' : 'Advanced Compare',
      molTitle: pt ? 'Compare moléculas lado a lado.' : 'Compare molecules side by side.',
      molCta: pt ? 'Comparar moléculas' : 'Compare molecules',
      atomTitle: pt ? 'Compare estruturas eletrônicas.' : 'Compare electronic structures.',
      atomCta: pt ? 'Comparar modelos atômicos' : 'Compare atomic models',
      unlockTitle: pt ? 'Liberar o Pro Lab' : 'Unlock Pro Lab',
      unlockBody: pt ? 'Crie uma conta Atomurus e receba 30 dias de acesso Pro.' : 'Create an Atomurus account and get 30 days of Pro access.',
      create: pt ? 'Criar conta' : 'Create account',
      signIn: pt ? 'Entrar' : 'Sign in',
      lockedTitle: pt ? 'Esta ferramenta faz parte do Atomurus Pro.' : 'This tool is available with Atomurus Pro.',
      upgrade: pt ? 'Assinar o Pro' : 'Upgrade to Pro',
      close: pt ? 'Fechar' : 'Close'
    };
  }

  function toolHref(tool) {
    return '/app?section=pro-lab&tool=' + encodeURIComponent(tool);
  }

  function nextFor(tool) {
    return toolHref(tool);
  }

  function adsState() {
    return window.__ATOMURUS_ADS__ || { signedIn: false, isPro: false, ready: false };
  }

  function openDialog(opts) {
    var existing = document.getElementById('pro-lab-discover-dialog');
    if (existing) existing.remove();
    var host = document.createElement('div');
    host.id = 'pro-lab-discover-dialog';
    host.className = 'pro-lab-discover-dialog';
    var backdrop = document.createElement('div');
    backdrop.className = 'pro-lab-discover-backdrop';
    var panel = document.createElement('div');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.className = 'pro-lab-discover-panel';
    var h = document.createElement('h2');
    h.textContent = opts.title;
    var p = document.createElement('p');
    p.textContent = opts.body;
    var actions = document.createElement('div');
    opts.actions.forEach(function (action) {
      var a = document.createElement(action.href ? 'a' : 'button');
      if (!action.href) a.type = 'button';
      else a.href = action.href;
      a.textContent = action.label;
      a.className = action.primary ? 'pro-lab-discover-primary' : 'pro-lab-discover-ghost';
      a.addEventListener('click', function () {
        if (!action.href) host.remove();
      });
      actions.appendChild(a);
    });
    panel.appendChild(h);
    panel.appendChild(p);
    panel.appendChild(actions);
    backdrop.addEventListener('click', function () { host.remove(); });
    host.appendChild(backdrop);
    host.appendChild(panel);
    document.body.appendChild(host);
    var focus = panel.querySelector('a, button');
    if (focus) focus.focus();
  }

  function onCta(tool) {
    var c = copy();
    var href = toolHref(tool);
    var ads = adsState();
    function go() {
      if (!ads.signedIn) {
        var next = encodeURIComponent(nextFor(tool));
        openDialog({
          title: c.unlockTitle,
          body: c.unlockBody,
          actions: [
            { label: c.create, href: '/signup?next=' + next, primary: true },
            { label: c.signIn, href: '/login?next=' + next },
            { label: c.close }
          ]
        });
        return;
      }
      if (!ads.isPro) {
        openDialog({
          title: c.lockedTitle,
          body: c.elTitle,
          actions: [
            { label: c.upgrade, href: '/pricing', primary: true },
            { label: c.close }
          ]
        });
        return;
      }
      window.location.assign(href);
    }
    if (ads.ready) {
      go();
      return;
    }
    document.addEventListener('atomurus-ads-ready', function once() {
      document.removeEventListener('atomurus-ads-ready', once);
      ads = adsState();
      go();
    }, { once: true });
    window.setTimeout(function () {
      ads = adsState();
      if (ads.ready) go();
      else go();
    }, 1200);
  }

  function mount(host) {
    var tool = host.getAttribute('data-pro-lab-tool') || 'calculations';
    var c = copy();
    var map = {
      calculations: { title: c.calcTitle, cta: c.calcCta },
      elements: { title: c.elTitle, cta: c.elCta },
      molecules: { title: c.molTitle, cta: c.molCta },
      atomic: { title: c.atomTitle, cta: c.atomCta }
    };
    var spec = map[tool] || map.calculations;
    host.textContent = '';
    host.classList.add('pro-lab-discover');
    var badge = document.createElement('span');
    badge.className = 'pro-lab-discover-badge';
    badge.textContent = c.badge;
    var p = document.createElement('p');
    p.textContent = spec.title;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pro-lab-discover-cta';
    btn.textContent = spec.cta;
    btn.addEventListener('click', function () { onCta(tool); });
    host.appendChild(badge);
    host.appendChild(p);
    host.appendChild(btn);
  }

  function ensureCss() {
    if (document.getElementById('pro-lab-discover-css')) return;
    var style = document.createElement('style');
    style.id = 'pro-lab-discover-css';
    style.textContent =
      '.pro-lab-discover{margin:16px 0;padding:12px 14px;border:1px solid color-mix(in oklab,var(--lc-green,#1E6A50) 35%, var(--lc-rule,#D8D2BF));border-radius:10px;background:color-mix(in oklab,var(--lc-paper,#F8F5EC) 88%, transparent);max-width:42rem}' +
      '.pro-lab-discover-badge{font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--lc-green,#1E6A50)}' +
      '.pro-lab-discover p{margin:6px 0 10px;color:var(--lc-ink-2,#58544A);font-size:14px}' +
      '.pro-lab-discover-cta,.pro-lab-discover-primary{font:inherit;border:0;border-radius:6px;padding:8px 12px;background:var(--lc-green,#1E6A50);color:#fff;cursor:pointer;text-decoration:none;display:inline-block}' +
      '.pro-lab-discover-ghost{font:inherit;margin-left:8px;background:transparent;border:1px solid var(--lc-rule,#D8D2BF);border-radius:6px;padding:8px 12px;cursor:pointer;text-decoration:none;color:inherit;display:inline-block}' +
      '.pro-lab-discover-dialog{position:fixed;inset:0;z-index:80;display:grid;place-items:center}' +
      '.pro-lab-discover-backdrop{position:absolute;inset:0;background:rgba(20,18,14,.45)}' +
      '.pro-lab-discover-panel{position:relative;z-index:1;background:var(--lc-paper,#F8F5EC);color:var(--lc-ink,#14120E);padding:20px;border-radius:12px;max-width:22rem;width:calc(100% - 32px);border:1px solid var(--lc-rule,#D8D2BF)}' +
      '.pro-lab-discover-panel h2{font-family:"Instrument Serif",Georgia,serif;font-size:28px;font-weight:400;margin:0 0 8px}' +
      '.pro-lab-discover-panel p{margin:0 0 14px;color:var(--lc-ink-2,#58544A)}' +
      '[data-theme="dark"] .pro-lab-discover{background:color-mix(in oklab,var(--lc-paper,#161410) 88%, transparent)}' +
      '[data-theme="dark"] .pro-lab-discover-panel{background:var(--lc-paper,#161410);color:var(--lc-ink,#F4F0E6);border-color:var(--lc-rule,#3a352c)}';
    document.head.appendChild(style);
  }

  function boot() {
    ensureCss();
    document.querySelectorAll('[data-pro-lab-tool]').forEach(mount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
