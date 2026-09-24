/*
 * Toast — one global, aria-live host owned by the AppShell. Features call
 * shell.toast('Saved', { tone: 'success' }). Toasts sit above the bottom
 * navigation and the gesture bar (see toast.css + safe-area tokens), expire on
 * their own, and every timer is cleared when the shell is destroyed.
 */

import { h } from '../utilities/dom.js';

export function createToastHost({ parent, scope, maxVisible = 3, durationMs = 4000 }) {
  const host = h('div', { class: 'ui-toast-host', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'false' });
  parent.appendChild(host);
  scope.add(() => host.remove());

  function dismiss(node) {
    if (node.parentNode) node.parentNode.removeChild(node);
  }

  return {
    element: host,
    show(message, { tone = 'neutral', action } = {}) {
      while (host.children.length >= maxVisible) dismiss(host.firstChild);
      const node = h('div', { class: `ui-toast ui-toast-${tone}` },
        h('span', { class: 'ui-toast-text' }, message),
        action ? h('button', { class: 'ui-btn ui-btn-ghost ui-btn-sm', type: 'button', onclick: () => { dismiss(node); action.run(); } }, action.label) : null
      );
      host.appendChild(node);
      scope.timeout(() => dismiss(node), durationMs);
      return () => dismiss(node);
    },
    count: () => host.children.length
  };
}
