/*
 * Tiny DOM helper for app-shell features. Text is always set as text (no
 * innerHTML with data), so element names, set titles and server messages can
 * never become markup.
 *
 *   h('button', { class: 'ui-btn ui-btn-primary', onclick: go }, 'Start')
 *
 * `on*` handlers are attached with addEventListener; pass a scope to have
 * them removed when the feature unmounts: h.scoped(scope)('button', …).
 */

function append(el, child) {
  if (child == null || child === false) return;
  if (Array.isArray(child)) { child.forEach((c) => append(el, c)); return; }
  el.appendChild(typeof child === 'object' && child.nodeType ? child : el.ownerDocument.createTextNode(String(child)));
}

function build(doc, scope, tag, attrs, children) {
  const el = doc.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      const type = key.slice(2).toLowerCase();
      if (scope) scope.listen(el, type, value);
      else el.addEventListener(type, value);
    } else if (key === 'class') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }
  append(el, children);
  return el;
}

export function h(tag, attrs, ...children) {
  return build(globalThis.document, null, tag, attrs, children);
}

h.scoped = (scope, doc = globalThis.document) => (tag, attrs, ...children) => build(doc, scope, tag, attrs, children);

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
