/* Shared paper-laboratory look for Open Lab 2D/3D viewers.
   Cream stage, quiet light, matte atoms. Loaded before each runtime. */
(function (global) {
  'use strict';

  var PAPER = 0xF2EFE7;
  var PAPER_DARK = 0x0E0D0C;
  var GREEN = 0x1E6A50;
  var INK = 0x14120E;
  var H_WARM = 0xE7E2D4;

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function clearColor() {
    return isDark() ? PAPER_DARK : PAPER;
  }

  function fillCss() {
    return isDark() ? '#0E0D0C' : '#F2EFE7';
  }

  function capDpr(renderer) {
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  function applyClear(renderer) {
    if (!renderer) return;
    renderer.setClearColor(clearColor(), 1);
  }

  function atomColor(color) {
    if (color === 0xdddddd || color === 0xe8e8e8) return H_WARM;
    return color;
  }

  function electronColor() {
    return isDark() ? 0xE8E2D4 : INK;
  }

  function lightScene(scene, THREE) {
    if (!scene || !THREE) return;
    scene.add(new THREE.HemisphereLight(
      isDark() ? 0x3A4A44 : 0xF8F5EC,
      isDark() ? 0x1A1814 : 0x9A9480,
      0.72
    ));
    var key = new THREE.DirectionalLight(0xFFF6E8, 0.78);
    key.position.set(4.2, 7.5, 5.5);
    scene.add(key);
    var fill = new THREE.DirectionalLight(GREEN, 0.16);
    fill.position.set(-6, 1.5, 2);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xE8DCC0, 0.28);
    rim.position.set(-2, 3, -8);
    scene.add(rim);
  }

  function ground(THREE, opts) {
    opts = opts || {};
    var scale = opts.scale || 1;
    var y = opts.y != null ? opts.y : -2.85;
    var g = new THREE.Group();
    g.name = 'paper-ground';
    var disk = new THREE.Mesh(
      new THREE.CircleGeometry(4.4 * scale, 64),
      new THREE.MeshStandardMaterial({
        color: isDark() ? 0x171512 : 0xE6E1D3,
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.7
      })
    );
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = y;
    var shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.35 * scale, 48),
      new THREE.MeshBasicMaterial({
        color: 0x14120E,
        transparent: true,
        opacity: isDark() ? 0.35 : 0.12
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = y + 0.04;
    shadow.scale.set(1.45, 0.55, 1);
    g.add(disk);
    g.add(shadow);
    return g;
  }

  function mat(THREE, color, extra) {
    extra = extra || {};
    var spec = {
      color: atomColor(color),
      roughness: extra.roughness != null ? extra.roughness : 0.48,
      metalness: extra.metalness != null ? extra.metalness : 0.04
    };
    Object.keys(extra).forEach(function (k) {
      if (k !== 'roughness' && k !== 'metalness') spec[k] = extra[k];
    });
    return new THREE.MeshStandardMaterial(spec);
  }

  function orbitMat(THREE, extra) {
    extra = extra || {};
    return new THREE.MeshStandardMaterial({
      color: GREEN,
      roughness: 0.55,
      metalness: 0.06,
      transparent: true,
      opacity: extra.opacity != null ? extra.opacity : 0.55
    });
  }

  function bindTouchOrbit(canvas, api) {
    if (!canvas || !api) return;
    var lastX = 0;
    var lastY = 0;
    canvas.addEventListener('touchstart', function (e) {
      if (!e.touches || !e.touches.length) return;
      if (api.enabled && !api.enabled()) return;
      if (api.onDown) api.onDown();
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (!e.touches || !e.touches.length) return;
      if (api.enabled && !api.enabled()) return;
      var dx = (e.touches[0].clientX - lastX) * 0.011;
      var dy = (e.touches[0].clientY - lastY) * 0.011;
      if (api.onDrag) api.onDrag(dx, dy);
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      e.preventDefault();
    }, { passive: false });
  }

  global.atomurusPaperLab = {
    PAPER: PAPER,
    PAPER_DARK: PAPER_DARK,
    GREEN: GREEN,
    INK: INK,
    H_WARM: H_WARM,
    PROTON: 0xC45C4A,
    NEUTRON: GREEN,
    isDark: isDark,
    clearColor: clearColor,
    fillCss: fillCss,
    capDpr: capDpr,
    applyClear: applyClear,
    atomColor: atomColor,
    electronColor: electronColor,
    lightScene: lightScene,
    ground: ground,
    mat: mat,
    orbitMat: orbitMat,
    bindTouchOrbit: bindTouchOrbit
  };
})(typeof window !== 'undefined' ? window : this);
