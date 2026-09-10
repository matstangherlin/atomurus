/* ════════════════════════════════════════════════════════════
   ATOMURUS — Explore per-theme 3D molecule viewer (shared engine)
   Ball-and-stick renderer (three.js r128). Reads a molecule from
   window.MOL_DATA = { atoms:[{pos:[x,y,z], r, color}], bonds:[[i,j,order?]] }.
   Reuses the look of /viewer/molecules.html but standalone and data-driven,
   so each Explore theme can ship its own viewer page (paired EN/PT files).
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { return; }
  var canvas = document.getElementById('mvwr-canvas');
  if (!canvas || !window.MOL_DATA) return;

  var lab = window.atomurusPaperLab;
  var renderer = lab && lab.createRenderer
    ? lab.createRenderer(THREE, canvas)
    : new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: (window.devicePixelRatio || 1) < 1.25,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false
      });
  if (!lab || !lab.createRenderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  function updateBg() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    renderer.setClearColor(dark ? 0x0E0D0C : 0xffffff, 1);
  }
  updateBg();
  window.addEventListener('atomurus:themechange', updateBg);
  // Theme toggle on these pages flips data-theme directly; observe it too.
  new MutationObserver(updateBg).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  var camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
  var DEFAULT_CAM_Z = 9;
  camera.position.set(0, 0, DEFAULT_CAM_Z);

  var scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  var dL1 = new THREE.DirectionalLight(0xffffff, 1.0); dL1.position.set(5, 10, 7); scene.add(dL1);
  var dL2 = new THREE.DirectionalLight(0x88bbff, 0.5); dL2.position.set(-5, -3, -5); scene.add(dL2);
  var dL3 = new THREE.DirectionalLight(0xffeecc, 0.3); dL3.position.set(0, 5, -8); scene.add(dL3);

  var currentGroup = new THREE.Group();
  scene.add(currentGroup);

  var isDragging = false, lastX = 0, lastY = 0, rotX = 0.18, rotY = 0.35, autoRotate = !(lab && lab.prefersReducedMotion && lab.prefersReducedMotion());
  var intro = lab && lab.introSpin ? lab.introSpin({ ms: 3200 }) : null;
  function spinning() {
    if (!intro) return autoRotate;
    var on = intro.spinning(autoRotate);
    if (!intro.isHeld() && autoRotate && !on) { autoRotate = false; updateRotateBtn(); }
    return on;
  }
  var rotVelX = 0, rotVelY = 0;
  var ROT_DAMPING = 0.92, ROT_SENS = 0.0085;
  var labelsVisible = true;
  var trackedAtoms = [];

  var COLOR_TO_ELEMENT = {
    0xdddddd: 'H', 0xe8e8e8: 'H', 0xee3333: 'O', 0x666666: 'C', 0x555555: 'C',
    0x444444: 'C', 0x333333: 'C', 0x3399ff: 'N', 0x44dd44: 'Cl', 0xaaaaff: 'Na',
    0xffcc33: 'S', 0xff8833: 'P', 0xcc6633: 'Fe', 0xb3ff3a: 'F', 0xa62929: 'Br'
  };

  var ATOM_SCALE = 1.4, BOND_R = 0.10, BOND_GAP = -0.04;

  function makeSphere(r, color) {
    if (lab && lab.sphereMesh) return lab.sphereMesh(THREE, r, color, lab.sphereSegments ? lab.sphereSegments(8) : 16);
    return new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.35, metalness: 0.15 }));
  }
  function makeBond(p1, p2, r1, r2, color1, color2, order) {
    order = order || 1;
    var group = new THREE.Group();
    var dir = new THREE.Vector3().subVectors(p2, p1);
    var len = dir.length();
    if (len < 0.01) return group;
    var unit = dir.clone().normalize();
    var start = p1.clone().add(unit.clone().multiplyScalar(r1 + BOND_GAP));
    var end = p2.clone().sub(unit.clone().multiplyScalar(r2 + BOND_GAP));
    if (start.distanceTo(end) < 0.05) return group;
    var yAxis = new THREE.Vector3(0, 1, 0);
    var perp = yAxis.clone().sub(unit.clone().multiplyScalar(yAxis.dot(unit)));
    if (perp.lengthSq() < 0.01) {
      var xAxis = new THREE.Vector3(1, 0, 0);
      perp = xAxis.clone().sub(unit.clone().multiplyScalar(xAxis.dot(unit)));
    }
    perp.normalize();
    function addCyl(s, e, color, r) {
      var mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
      var cyl;
      if (lab && lab.bondMesh) {
        cyl = lab.bondMesh(THREE, s, e, r, color, 10);
        if (!cyl) return;
      } else {
        cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, s.distanceTo(e), 12),
          new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.1 })
        );
        cyl.position.copy(mid);
        var d = new THREE.Vector3().subVectors(e, s).normalize();
        cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      }
      group.add(cyl);
    }
    function addPair(s, e, r) {
      var mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
      addCyl(s, mid, color1, r); addCyl(mid, e, color2, r);
    }
    if (order === 2) {
      var off2 = perp.clone().multiplyScalar(BOND_R * 1.4), thin2 = BOND_R * 0.62;
      addPair(start.clone().add(off2), end.clone().add(off2), thin2);
      addPair(start.clone().sub(off2), end.clone().sub(off2), thin2);
    } else if (order === 3) {
      var off3 = perp.clone().multiplyScalar(BOND_R * 1.8), thin3 = BOND_R * 0.55;
      addPair(start, end, thin3);
      addPair(start.clone().add(off3), end.clone().add(off3), thin3);
      addPair(start.clone().sub(off3), end.clone().sub(off3), thin3);
    } else {
      addPair(start, end, BOND_R);
    }
    return group;
  }

  function makeLabelSprite(text, atomRadius) {
    var c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    var ctx = c.getContext('2d');
    ctx.font = 'bold 56px "Inter Tight", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 5;
    ctx.strokeText(text, 64, 32);
    ctx.fillStyle = '#ffffff'; ctx.fillText(text, 64, 32);
    var tex = new THREE.CanvasTexture(c); tex.needsUpdate = true;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    var r = atomRadius || 0.5, w = Math.max(0.45, r * 1.7);
    sp.scale.set(w, w * 0.5, 1); sp.renderOrder = 999;
    return sp;
  }

  function buildMolecule(mol) {
    var g = new THREE.Group();
    trackedAtoms = [];
    var meshes = mol.atoms.map(function (a) {
      var radius = a.r * ATOM_SCALE;
      var m = makeSphere(radius, a.color);
      m.position.fromArray(a.pos);
      trackedAtoms.push({ mesh: m, label: COLOR_TO_ELEMENT[a.color] || '', radius: radius });
      g.add(m); return m;
    });
    mol.bonds.forEach(function (b) {
      var i = b[0], j = b[1], order = b[2] || 1;
      var a1 = mol.atoms[i], a2 = mol.atoms[j];
      g.add(makeBond(meshes[i].position, meshes[j].position, a1.r * ATOM_SCALE, a2.r * ATOM_SCALE, a1.color, a2.color, order));
    });
    return g;
  }

  function refreshLabels() {
    trackedAtoms.forEach(function (a) { if (a.labelSprite) { a.mesh.remove(a.labelSprite); a.labelSprite = null; } });
    if (!labelsVisible) return;
    trackedAtoms.forEach(function (a) {
      if (!a.label) return;
      var sp = makeLabelSprite(a.label, a.radius);
      var localY = (lab && lab.sphereMesh) ? (1 + 0.05) : 0;
      sp.position.set(0, localY, 0); a.mesh.add(sp); a.labelSprite = sp;
    });
  }

  var liveLoop = null;
  function rebuild() {
    if (lab && lab.replaceChild) {
      currentGroup = lab.replaceChild(scene, currentGroup, buildMolecule(window.MOL_DATA));
    } else {
      scene.remove(currentGroup);
      currentGroup = buildMolecule(window.MOL_DATA);
      scene.add(currentGroup);
    }
    refreshLabels();
    if (liveLoop && liveLoop.wake) liveLoop.wake();
  }
  rebuild();

  // ── Interaction ──
  canvas.addEventListener('mousedown', function (e) {
    if (intro) intro.userToggle();
    isDragging = true; autoRotate = false; updateRotateBtn();
    rotVelX = 0; rotVelY = 0; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', function () { isDragging = false; canvas.style.cursor = 'grab'; });
  window.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    var dx = (e.clientX - lastX) * ROT_SENS, dy = (e.clientY - lastY) * ROT_SENS;
    rotY += dx; rotX += dy;
    rotVelY = dx * 0.6 + rotVelY * 0.4; rotVelX = dy * 0.6 + rotVelX * 0.4;
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('touchstart', function (e) {
    if (!e.touches.length) return;
    if (intro) intro.userToggle();
    isDragging = true; autoRotate = false; updateRotateBtn();
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (!isDragging || !e.touches.length) return;
    var dx = (e.touches[0].clientX - lastX) * ROT_SENS, dy = (e.touches[0].clientY - lastY) * ROT_SENS;
    rotY += dx; rotX += dy; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', function () { isDragging = false; });
  if (lab && lab.bindPageScrollWheel) {
    lab.bindPageScrollWheel(canvas, function (e) {
      camera.position.z = Math.max(4, Math.min(18, camera.position.z + e.deltaY * 0.01));
    });
  } else {
    canvas.addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      camera.position.z = Math.max(4, Math.min(18, camera.position.z + e.deltaY * 0.01));
      e.preventDefault();
    }, { passive: false });
  }

  function updateRotateBtn() {
    var b = document.getElementById('mvwr-rotate');
    if (b) b.setAttribute('aria-pressed', autoRotate ? 'true' : 'false');
  }

  // ── Controls ──
  var rotateBtn = document.getElementById('mvwr-rotate');
  if (rotateBtn) rotateBtn.addEventListener('click', function () {
    if (intro) intro.userToggle();
    autoRotate = !autoRotate; updateRotateBtn();
  });
  var labelsBtn = document.getElementById('mvwr-labels');
  if (labelsBtn) labelsBtn.addEventListener('click', function () {
    labelsVisible = !labelsVisible; labelsBtn.setAttribute('aria-pressed', labelsVisible ? 'true' : 'false'); refreshLabels();
  });
  var resetBtn = document.getElementById('mvwr-reset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    rotX = 0.18; rotY = 0.35; camera.position.set(0, 0, DEFAULT_CAM_Z);
    if (intro) intro.restart();
    if (!intro || !intro.isHeld()) autoRotate = !(lab && lab.prefersReducedMotion && lab.prefersReducedMotion());
    else autoRotate = true;
    updateRotateBtn();
  });
  updateRotateBtn();

  // ── Resize ──
  function resize() {
    var w = canvas.clientWidth || 800, h = canvas.clientHeight || 460;
    if (lab) lab.capDpr(renderer, canvas);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Render loop ──
  function tickFrame() {
    if (spinning()) { rotY += 0.005; }
    else if (!isDragging) {
      rotY += rotVelY; rotX += rotVelX;
      rotVelX *= ROT_DAMPING; rotVelY *= ROT_DAMPING;
      if (Math.abs(rotVelX) < 0.00001) rotVelX = 0;
      if (Math.abs(rotVelY) < 0.00001) rotVelY = 0;
    }
    rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
    currentGroup.rotation.y = rotY;
    currentGroup.rotation.x = rotX;
    renderer.render(scene, camera);
  }
  function isBusy() {
    return isDragging || spinning() || Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4;
  }
  if (lab && lab.bindLiveLoop) {
    liveLoop = lab.bindLiveLoop(canvas, tickFrame, {
      renderer: renderer,
      busy: isBusy,
      priority: function () {
        return isDragging || Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4;
      }
    });
  } else {
    var _hidden = document.hidden;
    var _onscreen = true;
    var _raf = 0;
    var _last = 0;
    function shouldRun() { return !_hidden && _onscreen; }
    function isPriority() {
      return isDragging || Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4;
    }
    function loop(now) {
      _raf = 0;
      if (!shouldRun()) return;
      if (isBusy()) {
        if (isPriority() || now - _last >= 33) { _last = now; tickFrame(); }
        _raf = requestAnimationFrame(loop);
        return;
      }
      tickFrame();
    }
    function kick() {
      if (isPriority()) _last = 0;
      if (!_raf && shouldRun()) _raf = requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', function () {
      _hidden = document.hidden;
      if (!_hidden) kick();
    });
    if (typeof IntersectionObserver === 'function') {
      var io = new IntersectionObserver(function (entries) {
        _onscreen = !!(entries[0] && entries[0].isIntersecting);
        if (_onscreen) kick();
      }, { rootMargin: '64px', threshold: 0.01 });
      io.observe(canvas);
    }
    canvas.addEventListener('pointerdown', kick);
    canvas.addEventListener('pointermove', function (e) {
      if (e.buttons || e.pointerType === 'touch' || e.pointerType === 'pen') kick();
    });
    document.addEventListener('click', kick, true);
    kick();
  }
})();
