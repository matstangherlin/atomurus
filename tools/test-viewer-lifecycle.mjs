// A1.0 — viewer lifecycle with a fake Three.js: open/close ×20 keeps a single
// renderer and a single animation loop, disposes geometry/material/texture,
// pauses in background and off-screen, caps the mobile pixel ratio, and never
// imports Three before a viewer mounts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createViewerHost, capPixelRatio, disposeObject3D, viewerStats, DPR_CAP } from '../src/features/viewer/viewer-host.js';
import { buildMolecule } from '../src/features/molecules/index.js';

function fakeThree(counters) {
  class Disposable { constructor(kind) { this.kind = kind; counters.created[kind] = (counters.created[kind] || 0) + 1; } dispose() { counters.disposed[this.kind] = (counters.disposed[this.kind] || 0) + 1; } }
  class Object3D {
    constructor() { this.children = []; this.position = new Vector3(); this.rotation = { x: 0, y: 0 }; this.quaternion = { setFromUnitVectors() {} }; }
    add(c) { this.children.push(c); }
    traverse(fn) { fn(this); for (const c of this.children) c.traverse ? c.traverse(fn) : fn(c); }
  }
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { return this.set(v.x, v.y, v.z); }
    clone() { return new Vector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
    normalize() { return this; }
  }
  class Texture extends Disposable { constructor() { super('texture'); this.isTexture = true; } }
  class Material extends Disposable { constructor() { super('material'); } }
  class Geometry extends Disposable { constructor() { super('geometry'); } }
  class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
  return {
    Texture,
    Scene: class extends Object3D {},
    Group: class extends Object3D {},
    Mesh,
    Vector3,
    SphereGeometry: Geometry,
    CylinderGeometry: Geometry,
    MeshStandardMaterial: Material,
    AmbientLight: class extends Object3D {},
    DirectionalLight: class extends Object3D {},
    PerspectiveCamera: class extends Object3D { updateProjectionMatrix() {} },
    WebGLRenderer: class {
      constructor(opts) { counters.renderers += 1; counters.live += 1; this.opts = opts; }
      setPixelRatio(r) { counters.pixelRatio = r; }
      setSize() {}
      render() { counters.renders += 1; }
      dispose() { counters.live -= 1; counters.rendererDisposed += 1; }
      forceContextLoss() { counters.contextLost += 1; }
    }
  };
}

function fakeEnv({ dpr = 3, width = 390 } = {}) {
  let id = 1;
  const frames = new Map();
  const observers = [];
  const listeners = new Map();
  const doc = { createElement: () => ({ className: '', parentNode: null }) };
  class IO { constructor(cb) { this.cb = cb; this.connected = true; observers.push(this); } observe() {} disconnect() { this.connected = false; } }
  class RO { constructor(cb) { this.cb = cb; this.connected = true; observers.push(this); } observe() {} disconnect() { this.connected = false; } }
  return {
    frames, observers,
    document: doc,
    devicePixelRatio: dpr,
    innerWidth: width,
    navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 15) Mobile' },
    IntersectionObserver: IO,
    ResizeObserver: RO,
    requestAnimationFrame(fn) { const i = id++; frames.set(i, fn); return i; },
    cancelAnimationFrame(i) { frames.delete(i); },
    setTimeout, clearTimeout, setInterval, clearInterval,
    addEventListener(t, fn) { listeners.set(fn, t); },
    removeEventListener(t, fn) { listeners.delete(fn); },
    listeners,
    flush() { const due = Array.from(frames.values()); frames.clear(); due.forEach((fn) => fn(16)); }
  };
}

function fakeContainer() {
  return { clientWidth: 360, clientHeight: 300, children: [], appendChild(c) { c.parentNode = this; this.children.push(c); }, removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; } };
}

function fakeLifecycle() {
  const subs = { pause: new Set(), resume: new Set() };
  let paused = false;
  return {
    onAppPause: (fn) => { subs.pause.add(fn); return () => subs.pause.delete(fn); },
    onAppResume: (fn) => { subs.resume.add(fn); return () => subs.resume.delete(fn); },
    state: () => ({ paused }),
    pause() { paused = true; subs.pause.forEach((f) => f()); },
    resume() { paused = false; subs.resume.forEach((f) => f()); },
    count: () => subs.pause.size + subs.resume.size
  };
}

test('open/close ×20: single renderer, single loop, everything disposed', async () => {
  const counters = { created: {}, disposed: {}, renderers: 0, live: 0, renders: 0, rendererDisposed: 0, contextLost: 0 };
  const THREE = fakeThree(counters);
  const env = fakeEnv();
  const container = fakeContainer();
  const lifecycle = fakeLifecycle();
  let imports = 0;
  const host = createViewerHost({ container, env, lifecycle, loadThree: async () => { imports += 1; return THREE; } });

  assert.equal(imports, 0, 'creating the host does not import Three');
  for (let i = 0; i < 20; i += 1) {
    await host.mount((T, scene) => {
      const group = buildMolecule(T, scene);
      const tex = new T.Texture();
      group.children[0].material.map = tex;
      return { tick() {} };
    });
    assert.equal(counters.live, 1, 'exactly one live renderer');
    assert.equal(viewerStats().renderers, 1);
    assert.equal(viewerStats().loops, 1);
    assert.equal(env.frames.size, 1, 'exactly one animation frame pending');
    env.flush();
    assert.equal(env.frames.size, 1, 'the loop does not fork');
    host.unmount();
    assert.equal(counters.live, 0);
    assert.equal(env.frames.size, 0, 'animation frame cancelled on unmount');
    assert.equal(container.children.length, 0, 'canvas removed');
    assert.ok(env.observers.every((o) => !o.connected), 'observers disconnected');
    assert.equal(lifecycle.count(), 0, 'lifecycle subscriptions removed');
  }
  assert.equal(counters.renderers, 20);
  assert.equal(counters.rendererDisposed, 20);
  assert.equal(counters.contextLost, 20);
  assert.equal(counters.disposed.geometry, counters.created.geometry, 'every geometry disposed');
  assert.equal(counters.disposed.material, counters.created.material, 'every material disposed');
  assert.equal(counters.disposed.texture, counters.created.texture, 'every texture disposed');
  assert.deepEqual(viewerStats(), { renderers: 0, loops: 0 });
});

test('background pauses the render loop; resume restarts it only while mounted', async () => {
  const counters = { created: {}, disposed: {}, renderers: 0, live: 0, renders: 0, rendererDisposed: 0, contextLost: 0 };
  const env = fakeEnv();
  const lifecycle = fakeLifecycle();
  const host = createViewerHost({ container: fakeContainer(), env, lifecycle, loadThree: async () => fakeThree(counters) });
  await host.mount(() => ({}));
  assert.equal(host.running, true);
  lifecycle.pause();
  assert.equal(host.running, false);
  assert.equal(env.frames.size, 0, 'no GPU work in background');
  const rendersWhilePaused = counters.renders;
  env.flush();
  assert.equal(counters.renders, rendersWhilePaused);
  lifecycle.resume();
  assert.equal(host.running, true);
  env.flush();
  assert.ok(counters.renders > rendersWhilePaused);
  host.unmount();
  lifecycle.resume();
  assert.equal(env.frames.size, 0, 'resume after leaving does not revive the viewer');
});

test('off-screen canvas pauses the loop (IntersectionObserver)', async () => {
  const counters = { created: {}, disposed: {}, renderers: 0, live: 0, renders: 0, rendererDisposed: 0, contextLost: 0 };
  const env = fakeEnv();
  const host = createViewerHost({ container: fakeContainer(), env, loadThree: async () => fakeThree(counters) });
  await host.mount(() => ({}));
  const io = env.observers.find((o) => o.constructor.name === 'IO');
  io.cb([{ isIntersecting: false }]);
  assert.equal(host.running, false);
  io.cb([{ isIntersecting: true }]);
  assert.equal(host.running, true);
  host.unmount();
});

test('leaving before Three finishes loading creates no renderer', async () => {
  const counters = { created: {}, disposed: {}, renderers: 0, live: 0, renders: 0, rendererDisposed: 0, contextLost: 0 };
  let release;
  const env = fakeEnv();
  const host = createViewerHost({ container: fakeContainer(), env, loadThree: () => new Promise((r) => { release = () => r(fakeThree(counters)); }) });
  const pending = host.mount(() => ({}));
  host.unmount();
  release();
  assert.equal(await pending, null);
  assert.equal(counters.renderers, 0);
  assert.equal(env.frames.size, 0);
});

test('mobile pixel ratio is capped', async () => {
  assert.equal(capPixelRatio(3, { mobile: true }), DPR_CAP.mobile);
  assert.equal(capPixelRatio(1, { mobile: true }), 1);
  assert.equal(capPixelRatio(3, { mobile: false }), DPR_CAP.desktop);
  const counters = { created: {}, disposed: {}, renderers: 0, live: 0, renders: 0, rendererDisposed: 0, contextLost: 0 };
  const host = createViewerHost({ container: fakeContainer(), env: fakeEnv({ dpr: 3.5 }), loadThree: async () => fakeThree(counters) });
  await host.mount(() => ({}));
  assert.equal(counters.pixelRatio, DPR_CAP.mobile);
  host.unmount();
});

test('disposeObject3D handles shared resources once', () => {
  const counters = { created: {}, disposed: {} };
  const T = fakeThree(counters);
  const scene = new T.Scene();
  const g = new T.SphereGeometry();
  const m = new T.MeshStandardMaterial();
  scene.add(new T.Mesh(g, m));
  scene.add(new T.Mesh(g, [m]));
  const out = disposeObject3D(scene);
  assert.deepEqual(out, { geometries: 1, materials: 1, textures: 0 });
});

test('bootstrap graph never reaches Three.js', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  for (const file of ['src/app/bootstrap/web-main.js', 'src/app/shell/app-shell.js', 'src/app/router/feature-registry.js', 'src/features/viewer/viewer-host.js', 'src/app/bootstrap/legacy-bridge.js']) {
    const src = read(file);
    assert.ok(!/from\s+['"][^'"]*three/i.test(src), `${file} must not statically import three`);
    assert.ok(!/import\(['"][^'"]*three/i.test(src), `${file} must not import three`);
  }
  const core = read('assets/core/atomurus-core.js');
  assert.ok(!/WebGLRenderer/.test(core), 'legacy core bundle must not contain Three');
});
