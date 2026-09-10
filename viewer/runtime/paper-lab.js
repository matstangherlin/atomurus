/* Shared paper-laboratory look for Open Lab 2D/3D viewers.
   Cream stage, quiet light, matte atoms. Loaded before each runtime. */
(function (global) {
  'use strict';

  var PAPER = 0xF2EFE7;
  var PAPER_DARK = 0x0E0D0C;
  var GREEN = 0x1E6A50;
  var INK = 0x14120E;
  var H_WARM = 0xE7E2D4;
  var BOND = 0x5A554C;
  var CPK = {};
  CPK[0xdddddd] = H_WARM;
  CPK[0xe8e8e8] = H_WARM;
  CPK[0xee3333] = 0xC94A3A;
  CPK[0x666666] = BOND;
  CPK[0x555555] = BOND;
  CPK[0x444444] = BOND;
  CPK[0x333333] = BOND;
  CPK[0x222222] = BOND;
  CPK[0x3399ff] = 0x4A7A9A;
  CPK[0x44dd44] = 0x5A9A62;
  CPK[0xaaaaff] = 0x8A8AB0;
  CPK[0xffcc33] = 0xC4A04A;
  CPK[0xddaa00] = 0xC4A04A;
  CPK[0xeecc22] = 0xC4A04A;
  CPK[0xff8833] = 0xC46A3A;
  CPK[0xffdd44] = 0xC46A3A;
  CPK[0xcc3311] = 0xC46A3A;
  CPK[0xcc6633] = 0xA05A3A;
  CPK[0xb3ff3a] = 0x8AAA4A;
  CPK[0xa62929] = 0x8A3A3A;

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
    if (CPK[color] != null) return CPK[color];
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
    var radius = opts.radius != null ? opts.radius : 4.4 * scale;
    var y = opts.y != null ? opts.y : -2.85;
    var shadowR = opts.shadowRadius != null ? opts.shadowRadius : radius * 0.32;
    var shadowY = opts.shadowY != null ? opts.shadowY : y + 0.04;
    var g = new THREE.Group();
    g.name = 'paper-ground';
    var disk = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 64),
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
      new THREE.CircleGeometry(shadowR, 48),
      new THREE.MeshBasicMaterial({
        color: 0x14120E,
        transparent: true,
        opacity: isDark() ? 0.35 : 0.12
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = shadowY;
    shadow.scale.set(1.4, 0.55, 1);
    g.add(disk);
    g.add(shadow);
    return g;
  }

  function moleculeExtent(mol) {
    var maxd = 1.05;
    if (!mol || !mol.atoms) return maxd;
    for (var i = 0; i < mol.atoms.length; i++) {
      var a = mol.atoms[i];
      var p = a.pos || [a.x || 0, a.y || 0, a.z || 0];
      var d = Math.sqrt((p[0] || 0) * (p[0] || 0) + (p[1] || 0) * (p[1] || 0) + (p[2] || 0) * (p[2] || 0)) + (a.r || 0.35);
      if (d > maxd) maxd = d;
    }
    return maxd;
  }

  function moleculeGroundOpts(mol) {
    var k = Math.max(1, moleculeExtent(mol) / 1.17);
    return {
      radius: 3.6 * k,
      shadowRadius: 1.15 * k,
      y: -1.15 * k,
      shadowY: -1.12 * k
    };
  }

  function camZForMol(mol) {
    return Math.max(5.2, Math.min(16, moleculeExtent(mol) * (5.4 / 1.17)));
  }

  function vdwRadius(a, el) {
    if (a && a.vdw) return a.vdw;
    if (el === 'H') return 0.52;
    if (el === 'O') return 0.70;
    if (el === 'C') return 0.77;
    if (el === 'N') return 0.75;
    if (a && a.r) return a.r * 1.85;
    return 0.70;
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
    BOND: BOND,
    PROTON: 0xC45C4A,
    NEUTRON: GREEN,
    FOV: 42,
    ORBIT_X: 0.35,
    ORBIT_Y: 0.6,
    isDark: isDark,
    clearColor: clearColor,
    fillCss: fillCss,
    capDpr: capDpr,
    applyClear: applyClear,
    atomColor: atomColor,
    electronColor: electronColor,
    lightScene: lightScene,
    ground: ground,
    moleculeGroundOpts: moleculeGroundOpts,
    camZForMol: camZForMol,
    vdwRadius: vdwRadius,
    mat: mat,
    orbitMat: orbitMat,
    bindTouchOrbit: bindTouchOrbit
  };
})(typeof window !== 'undefined' ? window : this);
