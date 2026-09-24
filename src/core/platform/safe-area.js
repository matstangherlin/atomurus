/*
 * Safe-area insets as numbers, read from the same CSS tokens the layout uses
 * (src/ui/tokens/safe-area.css):
 *
 *   --app-safe-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px))
 *
 * On the web env() comes from the browser (viewport-fit=cover). In a native
 * shell the platform may inject --safe-area-inset-* instead (edge-to-edge
 * Android WebViews that do not report env()). Tests inject the same variables
 * to simulate a notch or a gesture bar.
 */

export const SIDES = ['top', 'right', 'bottom', 'left'];
export const ZERO_INSETS = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });

export function readSafeAreaFromCss(doc = globalThis.document) {
  if (!doc || !doc.body || typeof doc.createElement !== 'function') return { ...ZERO_INSETS };
  const view = doc.defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') return { ...ZERO_INSETS };
  const probe = doc.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = [
    'position:fixed', 'visibility:hidden', 'pointer-events:none', 'inset:0 auto auto 0', 'width:0', 'height:0',
    'padding-top:var(--app-safe-top, env(safe-area-inset-top, 0px))',
    'padding-right:var(--app-safe-right, env(safe-area-inset-right, 0px))',
    'padding-bottom:var(--app-safe-bottom, env(safe-area-inset-bottom, 0px))',
    'padding-left:var(--app-safe-left, env(safe-area-inset-left, 0px))'
  ].join(';');
  doc.body.appendChild(probe);
  try {
    const cs = view.getComputedStyle(probe);
    return {
      top: parseFloat(cs.paddingTop) || 0,
      right: parseFloat(cs.paddingRight) || 0,
      bottom: parseFloat(cs.paddingBottom) || 0,
      left: parseFloat(cs.paddingLeft) || 0
    };
  } finally {
    probe.remove();
  }
}
