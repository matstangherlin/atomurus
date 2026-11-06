(function (global) {
  'use strict';
  global.atomurusInitAllotropeViewer = function atomurusInitAllotropeViewer() {
(function(){
  const canvas = document.getElementById('viewer3d');
  const paper = () => window.atomurusPaperLab;
  const renderer = (paper() && paper().createRenderer)
    ? paper().createRenderer(THREE, canvas)
    : new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
  if (paper()) paper().capDpr(renderer);
  else renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
  camera.position.set(0, 0.35, 7.6);
  const scene = new THREE.Scene();
  let paperGround = null;
  function updateBg(){
    if (paper()) paper().applyClear(renderer);
    else {
      const isDark = ((window.atomurusPaperLab && window.atomurusPaperLab.isDark) ? window.atomurusPaperLab.isDark() : document.documentElement.getAttribute('data-theme') === 'dark');
      renderer.setClearColor(isDark ? 0x0E0D0C : 0xF2EFE7, 1);
    }
    if (paper() && paper().setGround) {
      paperGround = paper().setGround(scene, THREE, paperGround, { scale: 1.6, y: -3.2 });
    } else {
      if (paperGround) scene.remove(paperGround);
      if (paper()) {
        paperGround = paper().ground(THREE, { scale: 1.6, y: -3.2 });
        scene.add(paperGround);
      }
    }
  }
  if (paper()) paper().lightScene(scene, THREE);
  else {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dL1 = new THREE.DirectionalLight(0xffffff, 1.0); dL1.position.set(5,10,7); scene.add(dL1);
    const dL2 = new THREE.DirectionalLight(0x88bbff, 0.5); dL2.position.set(-5,-3,-5); scene.add(dL2);
  }
  updateBg();
  window.addEventListener('atomurus:themechange', updateBg);

  let currentGroup = new THREE.Group();
  scene.add(currentGroup);

  let isDragging=false,lastX=0,lastY=0,rotX=0.42,rotY=0.5,autoRotate=!((paper() && paper().prefersReducedMotion && paper().prefersReducedMotion()));
  const intro = paper() && paper().introSpin ? paper().introSpin({ ms: 3200 }) : null;
  function spinning(){
    if (!intro) return autoRotate;
    const on = intro.spinning(autoRotate);
    if (!intro.isHeld() && autoRotate && !on) { autoRotate = false; updateRotateBtn(); }
    return on;
  }
  let rotVelX = 0, rotVelY = 0;
  const ROT_DAMPING = 0.92, ROT_SENS = 0.0085;
  const DEFAULT_CAM_Z = 7.6;  // framed close, as in the design
  const DEFAULT_TILT = 0.42;

  canvas.addEventListener('mousedown', e => {
    if (intro) intro.userToggle();
    isDragging=true; autoRotate=false; updateRotateBtn();
    rotVelX = 0; rotVelY = 0;
    lastX=e.clientX; lastY=e.clientY; canvas.style.cursor='grabbing';
  });
  window.addEventListener('mouseup', () => { isDragging=false; canvas.style.cursor='grab'; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = (e.clientX - lastX) * ROT_SENS;
    const dy = (e.clientY - lastY) * ROT_SENS;
    rotY += dx; rotX += dy;
    rotVelY = dx * 0.6 + rotVelY * 0.4;
    rotVelX = dy * 0.6 + rotVelX * 0.4;
    lastX=e.clientX; lastY=e.clientY;
  });
  if (paper() && paper().bindPageScrollWheel) {
    paper().bindPageScrollWheel(canvas, function (e) {
      camera.position.z = Math.max(3, Math.min(20, camera.position.z + e.deltaY*0.01));
    });
  } else {
    canvas.addEventListener('wheel', e => {
      camera.position.z = Math.max(3, Math.min(20, camera.position.z + e.deltaY*0.01));
      e.preventDefault();
    }, { passive:false });
  }
  if (paper()) {
    paper().bindTouchOrbit(canvas, {
      onDown: function () { if (intro) intro.userToggle(); isDragging=true; autoRotate=false; updateRotateBtn(); rotVelX=0; rotVelY=0; },
      onDrag: function (dx, dy) {
        rotY += dx; rotX += dy;
        rotVelY = dx * 0.6 + rotVelY * 0.4;
        rotVelX = dy * 0.6 + rotVelX * 0.4;
      },
      onUp: function () { isDragging=false; }
    });
  }
  function updateRotateBtn(){ const b=document.getElementById('vc-rotate'); if (b) b.classList.toggle('active', autoRotate); }

  function makeSphere(r,color,seg=16){
    if (paper() && paper().sphereMesh) return paper().sphereMesh(THREE, r, color, seg);
    const mat = new THREE.MeshStandardMaterial({color,roughness:0.4,metalness:0.15});
    return new THREE.Mesh(new THREE.SphereGeometry(r,seg,seg), mat);
  }
  function makeBond(p1,p2,color=0x888,r=0.06){
    if (paper() && paper().bondMesh) {
      const mesh = paper().bondMesh(THREE, p1, p2, r, color, 10);
      return mesh || new THREE.Group();
    }
    const dir=new THREE.Vector3().subVectors(p2,p1);
    const len=dir.length();
    const mid=new THREE.Vector3().addVectors(p1,p2).multiplyScalar(0.5);
    const cyl=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,12),
      new THREE.MeshStandardMaterial({color, roughness:0.5, metalness:0.05}));
    cyl.position.copy(mid);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
    return cyl;
  }
  function addAtoms(g, positions, color, r, segs){
    if (paper() && paper().addInstancedSpheres && positions.length > 4) {
      paper().addInstancedSpheres(g, THREE, positions, color, r, segs);
      return;
    }
    positions.forEach(p => { const a = makeSphere(r, color, segs); a.position.copy(p); g.add(a); });
  }
  function addBondList(g, pairs, color, r){
    if (paper() && paper().addInstancedBonds && pairs.length > 4) {
      paper().addInstancedBonds(g, THREE, pairs, color, r);
      return;
    }
    pairs.forEach(pair => g.add(makeBond(pair[0], pair[1], color, r)));
  }

  /* Structures come from AtomurusAllotropes (assets/chem/allotrope-data.js):
     generated in ångström from measured bond lengths, angles and lattice
     constants. The page UI (assets/chem/allo-lab.js) picks the form; this
     runtime only draws it. */
  const DATA = window.AtomurusAllotropes;
  const BOND_COLOR = 0x6A655B;
  const FRAME = 2.3;      // the farthest atom surface sits this far from the centre
  const MAX_BOND = 1.55;  // small molecules: a bond never gets longer than this on screen

  function buildAllotrope(key){
    const g = new THREE.Group();
    const form = DATA && DATA.FORMS[key];
    const m = form && DATA.model(key);
    if (!m) return g;
    const el = DATA.element(form.el);
    const a = m.analysis;
    const k = Math.min(FRAME / (a.reach + form.ball * a.minLength), MAX_BOND / a.minLength);
    const bondLen = a.minLength * k;
    const pts = m.atoms.map(p => new THREE.Vector3(p[0] * k, p[1] * k, p[2] * k));
    const ballR = Math.max(0.12, Math.min(0.5, form.ball * bondLen));
    const stickR = Math.max(0.035, Math.min(0.11, 0.075 * bondLen));
    addAtoms(g, pts, el.color, ballR, pts.length > 60 ? 12 : 18);
    const single = [], doubled = [];
    m.bonds.forEach(b => (b[2] === 2 ? doubled : single).push([pts[b[0]], pts[b[1]]]));
    addBondList(g, single, BOND_COLOR, stickR);
    doubled.forEach(pair => {
      const dir = new THREE.Vector3().subVectors(pair[1], pair[0]).normalize();
      const off = new THREE.Vector3(0, 1, 0).cross(dir);
      if (off.lengthSq() < 1e-6) off.set(1, 0, 0);
      off.normalize().multiplyScalar(stickR * 1.6);
      [1, -1].forEach(s => {
        g.add(makeBond(pair[0].clone().addScaledVector(off, s), pair[1].clone().addScaledVector(off, s), BOND_COLOR, stickR * 0.8));
      });
    });
    return g;
  }

  let currentAllotrope = null;
  let liveLoop = null;

  function rebuildScene(){
    if (paper() && paper().replaceChild) {
      currentGroup = paper().replaceChild(scene, currentGroup, buildAllotrope(currentAllotrope));
    } else {
      scene.remove(currentGroup);
      currentGroup = buildAllotrope(currentAllotrope);
      scene.add(currentGroup);
    }
    rotX = DEFAULT_TILT; rotY = 0.5;
    camera.position.set(0, 0.35, DEFAULT_CAM_Z);
    if (intro) intro.restart();
    if (!intro || !intro.isHeld()) {
      autoRotate = !((paper() && paper().prefersReducedMotion && paper().prefersReducedMotion()));
    }
    updateRotateBtn();
    if (liveLoop && liveLoop.wake) liveLoop.wake();
  }

  function show(key){
    if (!DATA || !DATA.FORMS[key] || key === currentAllotrope) return;
    currentAllotrope = key;
    rebuildScene();
  }
  window.AtomurusAlloViewer = { show: show, current: function () { return currentAllotrope; } };
  // Older inline handlers and embeds call setAllotrope('diamond').
  window.setAllotrope = function (key) {
    if (window.AtomurusAlloLab && window.AtomurusAlloLab.select) window.AtomurusAlloLab.select(key);
    else show(key);
  };

  window.toggleAutoRotate = function(){
    if (intro) intro.userToggle();
    autoRotate = !autoRotate; updateRotateBtn();
  };
  window.resetView = function(){
    rotX = DEFAULT_TILT; rotY = 0.5;
    camera.position.set(0, 0.35, DEFAULT_CAM_Z);
    if (intro && intro.isHeld()) {
      autoRotate = true; updateRotateBtn();
    } else {
      if (intro) intro.restart();
      autoRotate = !((paper() && paper().prefersReducedMotion && paper().prefersReducedMotion()));
      updateRotateBtn();
    }
  };
  window.zoomBy = function(direction){
    camera.position.z = Math.max(3, Math.min(20, camera.position.z + direction * 1.1));
  };
  window.toggleFullscreen = function(){
    const el = document.getElementById('canvas-wrap');
    if (!document.fullscreenElement) (el.requestFullscreen || (()=>{})).call(el);
    else (document.exitFullscreen || (()=>{})).call(document);
  };

  window.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); toggleAutoRotate(); }
    else if (k === 'r') resetView();
    else if (k === 'f') toggleFullscreen();
    else if (k === 't') toggleTheme();
    else if (k === '+' || k === '=') zoomBy(-1);
    else if (k === '-' || k === '_') zoomBy(1);
  });

  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (paper()) paper().capDpr(renderer, canvas);
    renderer.setSize(w, h, false);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let _docHidden = false;
  document.addEventListener('visibilitychange', () => { _docHidden = document.hidden; });

  function tickFrame(){
    if (_docHidden) return;
    if (!isDragging && (Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4)) {
      rotY += rotVelY; rotX += rotVelX;
      rotVelX *= ROT_DAMPING; rotVelY *= ROT_DAMPING;
    }
    if (spinning() && !isDragging && Math.abs(rotVelX) < 1e-4 && Math.abs(rotVelY) < 1e-4) {
      rotY += 0.004;
    }
    currentGroup.rotation.y = rotY;
    currentGroup.rotation.x = rotX;
    renderer.render(scene, camera);
  }
  if (paper() && paper().bindLiveLoop) {
    liveLoop = paper().bindLiveLoop(canvas, tickFrame, {
      renderer: renderer,
      busy: function () {
        return isDragging || spinning() || Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4;
      },
      priority: function () {
        return isDragging || Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4;
      }
    });
  } else {
    (function animate(){
      requestAnimationFrame(animate);
      tickFrame();
    })();
  }

  show((window.AtomurusAlloLab && window.AtomurusAlloLab.form && window.AtomurusAlloLab.form()) || 'graphite');
  try { window.dispatchEvent(new CustomEvent('atomurus:alloviewer-ready')); } catch (e) {}
})();
  };
})(typeof window !== 'undefined' ? window : this);
