/*
 * Sheet / Dialog — one overlay primitive, two presentations:
 *
 *   variant 'sheet'   bottom sheet on phones (secondary navigation, contextual
 *                     actions), a side panel from tablet up
 *   variant 'dialog'  centered on tablet/desktop, bottom-anchored on phones
 *
 * Accessibility kept from the web: role=dialog + aria-modal, labelled title,
 * focus moves in and is trapped, Escape and backdrop close, focus returns to
 * the opener. Sized with dvh and the safe-area tokens so it always fits the
 * visible viewport (keyboard open, gesture bar, notch).
 */

import { h } from '../utilities/dom.js';

let seq = 0;
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function createOverlay({ parent, scope, variant = 'sheet', title, content, onClose }) {
  const doc = parent.ownerDocument;
  const id = `ui-overlay-${(seq += 1)}`;
  const opener = doc.activeElement;
  const local = scope.child('overlay');

  const closeBtn = h('button', { class: 'ui-icon-btn', type: 'button', 'aria-label': 'Close', 'data-overlay-close': true }, '×');
  const panel = h('div', {
    class: `ui-overlay-panel ui-${variant}`,
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': `${id}-title`,
    tabindex: '-1'
  },
  h('header', { class: 'ui-overlay-head' }, h('h2', { class: 'ui-overlay-title', id: `${id}-title` }, title), closeBtn),
  h('div', { class: 'ui-overlay-body' }, content));
  const backdrop = h('div', { class: 'ui-overlay-backdrop', 'data-overlay-backdrop': true });
  const root = h('div', { class: `ui-overlay ui-overlay-${variant}`, 'data-overlay': variant }, backdrop, panel);
  parent.appendChild(root);
  doc.body.classList.add('ui-overlay-open');

  let closed = false;
  let unregister = () => {};
  function close() {
    if (closed) return;
    closed = true;
    unregister();
    local.dispose();
    root.remove();
    if (!doc.querySelector('.ui-overlay')) doc.body.classList.remove('ui-overlay-open');
    if (opener && typeof opener.focus === 'function' && doc.contains(opener)) opener.focus();
    if (typeof onClose === 'function') onClose();
  }

  local.listen(closeBtn, 'click', close);
  local.listen(backdrop, 'click', close);
  local.listen(doc, 'keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const items = Array.from(panel.querySelectorAll(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  /* If the owning scope (feature or shell) goes away, the overlay goes too. */
  unregister = scope.add(close);

  const firstField = panel.querySelector('input,select,textarea') || closeBtn;
  firstField.focus();

  return { element: root, panel, close };
}
