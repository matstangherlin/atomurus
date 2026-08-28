(function (root) {
  'use strict';

  if (root.AtomurusWorkspaceUI) return;

  var TOAST_ID = 'ws-toast-host';
  var DIALOG_ID = 'ws-dialog-host';
  var FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var lastFocus = null;
  var inertNodes = [];

  function focusables(root) {
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE)).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function trapTab(event, root) {
    if (event.key !== 'Tab' || !root) return;
    var nodes = focusables(root);
    if (!nodes.length) {
      event.preventDefault();
      return;
    }
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!root.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function setBackgroundInert(on) {
    inertNodes.forEach(function (node) {
      node.removeAttribute('inert');
      node.removeAttribute('aria-hidden');
    });
    inertNodes = [];
    if (!on) return;
    var shell = document.getElementById('ws-shell');
    var skip = document.getElementById('ws-skip');
    [shell, skip].forEach(function (node) {
      if (!node) return;
      node.setAttribute('inert', '');
      node.setAttribute('aria-hidden', 'true');
      inertNodes.push(node);
    });
  }

  function ensureHost(id, role) {
    if (!document.getElementById('atomurus-workspace-ui-css')) {
      var link = document.createElement('link');
      link.id = 'atomurus-workspace-ui-css';
      link.rel = 'stylesheet';
      link.href = '/assets/app-workspace.css?v=202608280600';
      document.head.appendChild(link);
    }
    var node = document.getElementById(id);
    if (node) return node;
    node = document.createElement('div');
    node.id = id;
    if (role === 'toast') {
      node.className = 'ws-toast-host';
      node.setAttribute('aria-live', 'polite');
      node.setAttribute('aria-relevant', 'additions text');
    } else {
      node.className = 'ws-dialog-host';
    }
    document.body.appendChild(node);
    return node;
  }

  function toast(message, options) {
    options = options || {};
    var host = ensureHost(TOAST_ID, 'toast');
    var item = document.createElement('div');
    item.className = 'ws-toast ws-toast-' + (options.tone || 'info');
    item.setAttribute('role', options.tone === 'danger' ? 'alert' : 'status');
    var text = document.createElement('span');
    text.textContent = String(message || '');
    item.appendChild(text);
    if (options.actionLabel && typeof options.onAction === 'function') {
      var action = document.createElement('button');
      action.type = 'button';
      action.className = 'ws-toast-action';
      action.textContent = options.actionLabel;
      action.addEventListener('click', function () {
        options.onAction();
        if (item.parentNode) item.parentNode.removeChild(item);
      });
      item.appendChild(action);
    }
    host.appendChild(item);
    window.setTimeout(function () {
      item.classList.add('is-out');
      window.setTimeout(function () {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 220);
    }, options.ms || 3200);
    return item;
  }

  function closeDialog() {
    var host = document.getElementById(DIALOG_ID);
    if (!host) return;
    host.textContent = '';
    host.classList.remove('is-open');
    document.body.classList.remove('ws-dialog-open');
    document.removeEventListener('keydown', onDialogKey);
    setBackgroundInert(false);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch (_err) {}
    }
    lastFocus = null;
  }

  function onDialogKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    trapTab(event, document.getElementById(DIALOG_ID));
  }

  function openDialog(options) {
    options = options || {};
    lastFocus = document.activeElement;
    var host = ensureHost(DIALOG_ID, 'dialog');
    host.textContent = '';
    host.classList.add('is-open');
    document.body.classList.add('ws-dialog-open');
    setBackgroundInert(true);

    var backdrop = document.createElement('div');
    backdrop.className = 'ws-dialog-backdrop';
    backdrop.addEventListener('click', function () {
      if (options.dismissible !== false) closeDialog();
    });

    var dialog = document.createElement('div');
    dialog.className = 'ws-dialog' + (options.danger ? ' is-danger' : '');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    if (options.title) dialog.setAttribute('aria-labelledby', 'ws-dialog-title');

    var title = document.createElement('h2');
    title.id = 'ws-dialog-title';
    title.className = 'ws-dialog-title';
    title.textContent = options.title || '';

    var body = document.createElement('div');
    body.className = 'ws-dialog-body';
    if (options.bodyNode) body.appendChild(options.bodyNode);
    else body.textContent = options.body || '';

    var actions = document.createElement('div');
    actions.className = 'ws-dialog-actions';
    (options.actions || []).forEach(function (action) {
      var btn = document.createElement(action.href ? 'a' : 'button');
      btn.className = 'ws-btn ' + (action.kind || 'ws-btn-ghost');
      if (!action.href) btn.type = 'button';
      else btn.href = action.href;
      btn.textContent = action.label || '';
      if (action.autofocus) btn.setAttribute('data-autofocus', '1');
      btn.addEventListener('click', function (event) {
        if (action.href) return;
        event.preventDefault();
        if (typeof action.onClick === 'function') action.onClick();
        if (action.close !== false) closeDialog();
      });
      actions.appendChild(btn);
    });

    dialog.appendChild(title);
    dialog.appendChild(body);
    dialog.appendChild(actions);
    host.appendChild(backdrop);
    host.appendChild(dialog);
    document.addEventListener('keydown', onDialogKey);

    var focus = dialog.querySelector('[data-autofocus], button, a, input, textarea');
    if (focus) window.setTimeout(function () { focus.focus(); }, 20);
    return dialog;
  }

  function confirmDialog(options) {
    options = options || {};
    return new Promise(function (resolve) {
      openDialog({
        title: options.title || '',
        body: options.body || '',
        danger: Boolean(options.danger),
        actions: [
          {
            label: options.cancelLabel || 'Cancel',
            kind: 'ws-btn-ghost',
            onClick: function () { resolve(false); }
          },
          {
            label: options.confirmLabel || 'Confirm',
            kind: options.danger ? 'ws-btn-danger' : 'ws-btn-primary',
            autofocus: !options.danger,
            onClick: function () { resolve(true); }
          }
        ]
      });
    });
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) return;
    button.disabled = Boolean(busy);
    button.setAttribute('aria-busy', busy ? 'true' : 'false');
    var label = button.querySelector('[data-busy-label], span') || button;
    if (busy) {
      if (!button.dataset.readyLabel) button.dataset.readyLabel = label.textContent || '';
      if (busyLabel) label.textContent = busyLabel;
    } else if (button.dataset.readyLabel) {
      label.textContent = button.dataset.readyLabel;
    }
  }

  root.AtomurusWorkspaceUI = {
    toast: toast,
    openDialog: openDialog,
    closeDialog: closeDialog,
    confirmDialog: confirmDialog,
    setBusy: setBusy,
    trapTab: trapTab
  };
})(typeof window !== 'undefined' ? window : globalThis);
