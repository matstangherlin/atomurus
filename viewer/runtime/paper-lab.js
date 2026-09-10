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

  var geoCache = Object.create(null);
  var matCache = Object.create(null);
  var sharedSet = typeof WeakSet === 'function' ? new WeakSet() : null;
  var dummyObj = null;

  function markShared(res) {
    if (res && sharedSet) sharedSet.add(res);
    return res;
  }

  function isShared(res) {
    return !!(sharedSet && res && sharedSet.has(res));
  }

  function isMobile() {
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return true;
    try {
      return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches && (window.innerWidth || 0) < 900);
    } catch (e) {
      return false;
    }
  }

  function qualityTier() {
    try {
      var q = localStorage.getItem('atomurus-3d-quality');
      if (q === 'high' || q === 'balanced' || q === 'performance') return q;
    } catch (e) {}
    return 'auto';
  }

  function canvasCssArea(canvas) {
    var w = (canvas && (canvas.clientWidth || canvas.width)) || (typeof window !== 'undefined' ? window.innerWidth : 1280) || 1280;
    var h = (canvas && (canvas.clientHeight || canvas.height)) || Math.round(w * 0.56);
    return w * h;
  }

  function maxDpr(canvas) {
    var dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    var tier = qualityTier();
    var cap = 1.5;
    var area = canvasCssArea(canvas);
    var cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
    if (tier === 'performance') cap = 1;
    else if (tier === 'balanced') cap = 1.25;
    else if (tier === 'high') cap = 1.5;
    else if (isMobile() || cores <= 2) cap = 1;
    else if (area >= 1600 * 900) cap = 1;
    else if (area >= 1280 * 800) cap = 1.25;
    else cap = 1.5;
    return Math.min(dpr, cap);
  }

  function capDpr(renderer, canvas) {
    if (!renderer) return;
    var el = canvas || renderer.domElement;
    renderer.setPixelRatio(maxDpr(el));
  }

  function bindStats(renderer) {
    if (typeof global === 'undefined' || !renderer) return;
    global.__atomurusPaperStats = function () {
      var info = renderer.info || {};
      var mem = info.memory || {};
      var render = info.render || {};
      var el = renderer.domElement;
      return {
        calls: render.calls,
        triangles: render.triangles,
        geometries: mem.geometries,
        textures: mem.textures,
        dpr: renderer.getPixelRatio ? renderer.getPixelRatio() : null,
        canvas: el ? {
          w: el.width,
          h: el.height,
          cssW: el.clientWidth,
          cssH: el.clientHeight
        } : null
      };
    };
  }

  function createRenderer(THREE, canvas) {
    var dpr = maxDpr(canvas);
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: dpr < 1.25,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false
    });
    renderer.setPixelRatio(dpr);
    bindStats(renderer);
    return renderer;
  }

  function sphereSegments(countHint, kind) {
    var mobile = isMobile();
    var tier = qualityTier();
    if (kind === 'hero' || kind === 'nucleus') {
      if (tier === 'performance' || mobile) return 24;
      return 32;
    }
    if (kind === 'glow') return 12;
    var n = countHint || 1;
    if (n >= 40 || kind === 'dense') {
      if (tier === 'performance' || mobile) return 10;
      return 12;
    }
    if (n >= 12) return 16;
    if (tier === 'high') return 20;
    return 16;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function bindLiveLoop(canvas, tick, opts) {
    opts = opts || {};
    var hidden = document.hidden;
    var onscreen = true;
    var raf = 0;
    var last = 0;
    var idleMs = opts.idleMs != null ? opts.idleMs : 33;
    var paintOnce = true;
    function shouldRun() {
      if (hidden || !onscreen) return false;
      if (opts.active && !opts.active()) return false;
      return true;
    }
    function isPriority() {
      return !!(opts.priority && opts.priority());
    }
    function loop(now) {
      raf = 0;
      if (!shouldRun()) {
        paintOnce = true;
        return;
      }
      var busy = opts.busy && opts.busy();
      var priority = isPriority();
      if (busy) {
        if (priority || now - last >= idleMs) {
          last = now;
          tick(now);
        }
        raf = requestAnimationFrame(loop);
        return;
      }
      if (paintOnce) {
        last = now;
        tick(now);
        paintOnce = false;
      }
    }
    function kick() {
      paintOnce = true;
      if (isPriority()) last = 0;
      if (!raf && shouldRun()) raf = requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (!hidden) kick();
    });
    if (canvas && typeof IntersectionObserver === 'function') {
      var io = new IntersectionObserver(function (entries) {
        var e = entries[0];
        onscreen = !!(e && e.isIntersecting);
        if (onscreen) kick();
      }, { rootMargin: '64px', threshold: 0.01 });
      io.observe(canvas);
    }
    if (canvas) {
      canvas.addEventListener('pointerdown', kick);
      canvas.addEventListener('pointermove', function (e) {
        if (e.buttons || e.pointerType === 'touch' || e.pointerType === 'pen') kick();
      });
      canvas.addEventListener('touchmove', kick, { passive: true });
    }
    window.addEventListener('resize', function () {
      if (opts.renderer) capDpr(opts.renderer);
      kick();
    });
    document.addEventListener('click', kick, true);
    window.addEventListener('atomurus:themechange', kick);
    kick();
    return {
      stop: function () {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      wake: kick
    };
  }

  function bindPageScrollWheel(canvas, onZoom) {
    if (!canvas || typeof onZoom !== 'function') return;
    canvas.addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      onZoom(e);
      e.preventDefault();
    }, { passive: false });
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

  function cachedGeo(key, factory) {
    if (!geoCache[key]) geoCache[key] = markShared(factory());
    return geoCache[key];
  }

  function unitSphere(THREE, segs) {
    segs = segs || 16;
    return cachedGeo('sphere:' + segs, function () {
      return new THREE.SphereGeometry(1, segs, segs);
    });
  }

  function unitCylinder(THREE, radial) {
    radial = radial || 10;
    return cachedGeo('cyl:' + radial, function () {
      return new THREE.CylinderGeometry(1, 1, 1, radial);
    });
  }

  function unitCircle(THREE, segs) {
    segs = segs || 48;
    return cachedGeo('circle:' + segs, function () {
      return new THREE.CircleGeometry(1, segs);
    });
  }

  function matSpecKey(color, extra) {
    extra = extra || {};
    return [
      'std',
      atomColor(color),
      extra.roughness != null ? extra.roughness : 0.48,
      extra.metalness != null ? extra.metalness : 0.04,
      extra.transparent ? 1 : 0,
      extra.opacity != null ? extra.opacity : 1,
      extra.emissive || 0,
      extra.emissiveIntensity != null ? extra.emissiveIntensity : 0,
      extra.side || 0
    ].join('|');
  }

  function sharedMat(THREE, color, extra) {
    extra = extra || {};
    var key = matSpecKey(color, extra);
    if (!matCache[key]) matCache[key] = markShared(mat(THREE, color, extra));
    return matCache[key];
  }

  function sharedBasic(THREE, color, opacity) {
    var key = 'basic|' + atomColor(color) + '|' + (opacity != null ? opacity : 1) + '|' + (isDark() ? 'd' : 'l');
    if (!matCache[key]) {
      matCache[key] = markShared(new THREE.MeshBasicMaterial({
        color: atomColor(color),
        transparent: opacity != null && opacity < 1,
        opacity: opacity != null ? opacity : 1,
        depthWrite: opacity != null && opacity < 1 ? false : true
      }));
    }
    return matCache[key];
  }

  function sharedOrbitMat(THREE, extra) {
    extra = extra || {};
    var opacity = extra.opacity != null ? extra.opacity : 0.55;
    var key = 'orbit|' + opacity + '|' + (isDark() ? 'd' : 'l');
    if (!matCache[key]) matCache[key] = markShared(orbitMat(THREE, extra));
    return matCache[key];
  }

  function disposeMaterial(material) {
    if (!material || isShared(material)) return;
    var maps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'];
    for (var i = 0; i < maps.length; i++) {
      var tex = material[maps[i]];
      if (tex && tex.dispose && !isShared(tex)) tex.dispose();
    }
    if (material.dispose) material.dispose();
  }

  function disposeObject3D(root) {
    if (!root) return;
    root.traverse(function (obj) {
      if (obj.geometry && !isShared(obj.geometry) && obj.geometry.dispose) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(disposeMaterial);
      }
    });
  }

  function replaceChild(scene, previous, next) {
    if (previous) {
      disposeObject3D(previous);
      if (previous.parent) previous.parent.remove(previous);
      else if (scene) scene.remove(previous);
    }
    if (next && scene) scene.add(next);
    return next;
  }

  function dummy(THREE) {
    if (!dummyObj) dummyObj = new THREE.Object3D();
    return dummyObj;
  }

  function sphereMesh(THREE, r, color, segs, extra) {
    var mesh = new THREE.Mesh(unitSphere(THREE, segs || 16), sharedMat(THREE, color, extra));
    mesh.scale.set(r, r, r);
    return mesh;
  }

  function glowMesh(THREE, r, color) {
    var mesh = new THREE.Mesh(unitSphere(THREE, sphereSegments(1, 'glow')), sharedBasic(THREE, color, 0.08));
    mesh.scale.set(r, r, r);
    return mesh;
  }

  function bondMesh(THREE, p1, p2, r, color, radial) {
    var dir = new THREE.Vector3().subVectors(p2, p1);
    var len = dir.length();
    if (len < 1e-6) return null;
    var mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    var mesh = new THREE.Mesh(
      unitCylinder(THREE, radial || 10),
      sharedMat(THREE, color, { roughness: 0.5, metalness: 0.05 })
    );
    mesh.position.copy(mid);
    mesh.scale.set(r, len, r);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return mesh;
  }

  function addInstancedSpheres(group, THREE, positions, color, radius, segs, extra) {
    extra = extra || {};
    if (!positions || !positions.length) return null;
    var geo = unitSphere(THREE, segs || sphereSegments(positions.length, extra.kind || 'dense'));
    var material = extra.basic
      ? sharedBasic(THREE, color, extra.opacity != null ? extra.opacity : 0.08)
      : sharedMat(THREE, color, extra);
    var mesh = new THREE.InstancedMesh(geo, material, positions.length);
    var d = dummy(THREE);
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      d.position.set(p.x, p.y, p.z);
      d.quaternion.set(0, 0, 0, 1);
      d.scale.set(radius, radius, radius);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  }

  function addInstancedBonds(group, THREE, pairs, color, radius, radial) {
    if (!pairs || !pairs.length) return null;
    var geo = unitCylinder(THREE, radial || 10);
    var material = sharedMat(THREE, color, { roughness: 0.5, metalness: 0.05 });
    var mesh = new THREE.InstancedMesh(geo, material, pairs.length);
    var d = dummy(THREE);
    var yAxis = new THREE.Vector3(0, 1, 0);
    var dir = new THREE.Vector3();
    for (var i = 0; i < pairs.length; i++) {
      var a = pairs[i][0];
      var b = pairs[i][1];
      dir.set(b.x - a.x, b.y - a.y, b.z - a.z);
      var len = dir.length();
      if (len < 1e-6) {
        d.scale.set(0, 0, 0);
      } else {
        d.position.set((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, (a.z + b.z) * 0.5);
        d.quaternion.setFromUnitVectors(yAxis, dir.normalize());
        d.scale.set(radius, len, radius);
      }
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  }

  function nearbyPairs(positions, maxDist) {
    var pairs = [];
    var max2 = maxDist * maxDist;
    for (var i = 0; i < positions.length; i++) {
      for (var j = i + 1; j < positions.length; j++) {
        var a = positions[i];
        var b = positions[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dz = a.z - b.z;
        if (dx * dx + dy * dy + dz * dz < max2) pairs.push([a, b]);
      }
    }
    return pairs;
  }

  function introSpin(opts) {
    opts = opts || {};
    var ms = opts.ms != null ? opts.ms : 3200;
    var held = false;
    var until = prefersReducedMotion() ? 0 : Date.now() + ms;
    return {
      spinning: function (userOn) {
        if (held) return !!userOn;
        return Date.now() < until;
      },
      userToggle: function () {
        held = true;
      },
      restart: function () {
        if (held) return;
        until = prefersReducedMotion() ? 0 : Date.now() + ms;
      },
      isHeld: function () {
        return held;
      }
    };
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
    var diskMatKey = 'ground-disk|' + (isDark() ? 'd' : 'l');
    if (!matCache[diskMatKey]) {
      matCache[diskMatKey] = markShared(new THREE.MeshStandardMaterial({
        color: isDark() ? 0x171512 : 0xE6E1D3,
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.7
      }));
    }
    var disk = new THREE.Mesh(unitCircle(THREE, 48), matCache[diskMatKey]);
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = y;
    disk.scale.set(radius, radius, 1);
    var shadowKey = 'ground-shadow|' + (isDark() ? 'd' : 'l');
    if (!matCache[shadowKey]) {
      matCache[shadowKey] = markShared(new THREE.MeshBasicMaterial({
        color: 0x14120E,
        transparent: true,
        opacity: isDark() ? 0.35 : 0.12,
        depthWrite: false
      }));
    }
    var shadow = new THREE.Mesh(unitCircle(THREE, 32), matCache[shadowKey]);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = shadowY;
    shadow.scale.set(shadowR * 1.4, shadowR * 0.55, 1);
    g.add(disk);
    g.add(shadow);
    return g;
  }

  function setGround(scene, THREE, previous, opts) {
    return replaceChild(scene, previous, ground(THREE, opts || {}));
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
    function endTouch() {
      if (api.onUp) api.onUp();
    }
    canvas.addEventListener('touchend', endTouch);
    canvas.addEventListener('touchcancel', endTouch);
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
    ATOM_CAM_Z: 6.6,
    ATOM_ORBIT_X: 0.28,
    ATOM_ORBIT_Y: 0.55,
    ORBIT_X: 0.35,
    ORBIT_Y: 0.6,
    atomGroundOpts: function () {
      return { radius: 3.6, shadowRadius: 1.15, y: -1.35, shadowY: -1.32 };
    },
    isDark: isDark,
    clearColor: clearColor,
    fillCss: fillCss,
    capDpr: capDpr,
    maxDpr: maxDpr,
    createRenderer: createRenderer,
    prefersReducedMotion: prefersReducedMotion,
    bindLiveLoop: bindLiveLoop,
    bindPageScrollWheel: bindPageScrollWheel,
    applyClear: applyClear,
    atomColor: atomColor,
    electronColor: electronColor,
    lightScene: lightScene,
    ground: ground,
    setGround: setGround,
    moleculeGroundOpts: moleculeGroundOpts,
    camZForMol: camZForMol,
    vdwRadius: vdwRadius,
    mat: mat,
    sharedMat: sharedMat,
    sharedBasic: sharedBasic,
    sharedOrbitMat: sharedOrbitMat,
    orbitMat: orbitMat,
    unitSphere: unitSphere,
    unitCylinder: unitCylinder,
    sphereMesh: sphereMesh,
    glowMesh: glowMesh,
    bondMesh: bondMesh,
    sphereSegments: sphereSegments,
    disposeObject3D: disposeObject3D,
    replaceChild: replaceChild,
    addInstancedSpheres: addInstancedSpheres,
    addInstancedBonds: addInstancedBonds,
    nearbyPairs: nearbyPairs,
    introSpin: introSpin,
    qualityTier: qualityTier,
    isMobile: isMobile,
    bindTouchOrbit: bindTouchOrbit
  };
})(typeof window !== 'undefined' ? window : this);
