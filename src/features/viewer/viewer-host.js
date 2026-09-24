/*
 * Viewer host — lifecycle for Three.js/WebGL viewers inside the app shell.
 *
 *   app open, no viewer     → 0 renderers, Three not even downloaded
 *   user opens a molecule   → dynamic import of Three → one renderer
 *   app goes to background  → render loop paused (no invisible GPU work)
 *   canvas scrolls away     → loop paused (IntersectionObserver)
 *   user leaves the viewer  → loop cancelled, observers/listeners removed,
 *                              geometries/materials/textures disposed,
 *                              renderer disposed, context released
 *
 * The legacy page runtimes (viewer/runtime/*.js) keep their own lifecycle —
 * a full page navigation reclaims them. Anything the app shell mounts goes
 * through this host so it can be mounted and unmounted twenty times without
 * growing.
 */

import { createScope } from '../../core/lifecycle/scope.js';
import { trackViewer, viewerStats } from './viewer-stats.js';

export { viewerStats };

/* Mobile GPUs pay for every extra pixel. Values are the starting point for
   A1.3 benchmarking on low/mid-range Android, not final. */
export const DPR_CAP = Object.freeze({ mobile: 1.5, desktop: 2 });

export function capPixelRatio(devicePixelRatio, { mobile = false, cap } = {}) {
  const dpr = Number(devicePixelRatio) > 0 ? Number(devicePixelRatio) : 1;
  const limit = cap || (mobile ? DPR_CAP.mobile : DPR_CAP.desktop);
  return Math.min(dpr, limit);
}

const TEXTURE_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'envMap', 'lightMap', 'displacementMap', 'specularMap', 'gradientMap', 'matcap'];

export function disposeObject3D(root) {
  const counts = { geometries: 0, materials: 0, textures: 0 };
  if (!root || typeof root.traverse !== 'function') return counts;
  const seen = new Set();
  root.traverse((obj) => {
    if (obj.geometry && !seen.has(obj.geometry)) {
      seen.add(obj.geometry);
      obj.geometry.dispose();
      counts.geometries += 1;
    }
    const mats = Array.isArray(obj.material) ? obj.material : (obj.material ? [obj.material] : []);
    for (const mat of mats) {
      if (seen.has(mat)) continue;
      seen.add(mat);
      for (const slot of TEXTURE_SLOTS) {
        const tex = mat[slot];
        if (tex && tex.isTexture && !seen.has(tex)) {
          seen.add(tex);
          tex.dispose();
          counts.textures += 1;
        }
      }
      mat.dispose();
      counts.materials += 1;
    }
  });
  return counts;
}

/**
 * @param {object} opts
 * @param {HTMLElement} opts.container
 * @param {() => Promise<object>} opts.loadThree   dynamic import of Three
 * @param {object} [opts.lifecycle]                createAppLifecycle() result
 * @param {object} [opts.env]                      window-like (rAF, devicePixelRatio, IntersectionObserver, ResizeObserver)
 */
export function createViewerHost({ container, loadThree, lifecycle, env = globalThis, mobile } = {}) {
  if (!container) throw new Error('viewer host needs a container');
  if (typeof loadThree !== 'function') throw new Error('viewer host needs loadThree()');

  let scope = null;
  let renderer = null;
  let scene = null;
  let loop = null;
  let canvas = null;
  let mounted = false;
  let mountToken = 0;
  let visible = true;
  let paused = false;
  let lastDispose = null;

  function isMobile() {
    if (typeof mobile === 'boolean') return mobile;
    const w = env.innerWidth || 1024;
    return w < 768 || /Android|Mobi/i.test((env.navigator && env.navigator.userAgent) || '');
  }

  function syncLoop() {
    if (!loop) return;
    if (mounted && visible && !paused) loop.start();
    else loop.stop();
  }

  async function mount(build) {
    if (mounted || scope) unmount();
    const token = ++mountToken;
    scope = createScope('viewer', env);
    const localScope = scope;
    const THREE = await loadThree();
    if (token !== mountToken || localScope.disposed) return null; /* left before Three arrived */

    canvas = (env.document || globalThis.document).createElement('canvas');
    canvas.className = 'viewer-canvas';
    container.appendChild(canvas);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile(), alpha: true, powerPreference: 'low-power' });
    trackViewer('renderers', 1);
    renderer.setPixelRatio(capPixelRatio(env.devicePixelRatio, { mobile: isMobile() }));

    scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const built = (typeof build === 'function' ? build(THREE, scene, camera) : null) || {};

    function resize() {
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    if (typeof env.ResizeObserver === 'function') {
      const ro = new env.ResizeObserver(resize);
      ro.observe(container);
      localScope.observe(ro);
    } else {
      localScope.listen(env, 'resize', resize);
    }

    if (typeof env.IntersectionObserver === 'function') {
      const io = new env.IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        syncLoop();
      });
      io.observe(canvas);
      localScope.observe(io);
    }

    if (lifecycle) {
      paused = Boolean(lifecycle.state && lifecycle.state().paused);
      localScope.add(lifecycle.onAppPause(() => { paused = true; syncLoop(); }));
      localScope.add(lifecycle.onAppResume(() => { paused = false; syncLoop(); }));
    }

    loop = localScope.frameLoop((ts) => {
      if (typeof built.tick === 'function') built.tick(ts);
      renderer.render(scene, camera);
    });
    trackViewer('loops', 1);
    localScope.add(() => { trackViewer('loops', -1); });

    localScope.add(() => {
      lastDispose = disposeObject3D(scene);
      if (typeof built.dispose === 'function') built.dispose();
      renderer.dispose();
      if (typeof renderer.forceContextLoss === 'function') renderer.forceContextLoss();
      trackViewer('renderers', -1);
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      renderer = null;
      scene = null;
      canvas = null;
      loop = null;
    });

    mounted = true;
    syncLoop();
    return { renderer, scene, camera };
  }

  function unmount() {
    mountToken += 1;
    mounted = false;
    if (scope) {
      scope.dispose();
      scope = null;
    }
    visible = true;
  }

  return {
    mount,
    unmount,
    get mounted() { return mounted; },
    get running() { return Boolean(loop && loop.running); },
    lastDispose: () => lastDispose
  };
}
