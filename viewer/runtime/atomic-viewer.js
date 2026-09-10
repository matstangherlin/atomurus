(function (global) {
  'use strict';
  global.atomurusInitAtomicViewer = function atomurusInitAtomicViewer() {
(function(){
  const canvas = document.getElementById('viewer3d');
  const paper = () => window.atomurusPaperLab;
  const renderer = (paper() && paper().createRenderer)
    ? paper().createRenderer(THREE, canvas)
    : new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
  if (paper()) paper().capDpr(renderer);
  else renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const camera = new THREE.PerspectiveCamera(paper() && paper().FOV ? paper().FOV : 42, 2, 0.1, 100);
  camera.position.set(0, 0.2, (paper() && paper().ATOM_CAM_Z) || 6.6);

  const scene = new THREE.Scene();
  let paperGround = null;
  function updateRendererBg(){
    if (paper()) paper().applyClear(renderer);
    else {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      renderer.setClearColor(isDark ? 0x0E0D0C : 0xF2EFE7, 1);
    }
    if (paperGround) scene.remove(paperGround);
    if (paper()) {
      paperGround = paper().ground(THREE, paper().atomGroundOpts ? paper().atomGroundOpts() : { scale: 1.15, y: -1.35 });
      scene.add(paperGround);
    }
  }
  if (paper()) paper().lightScene(scene, THREE);
  else {
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5,10,7); scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0x88bbff, 0.5);
    dirLight2.position.set(-5,-3,-5); scene.add(dirLight2);
    const dirLight3 = new THREE.DirectionalLight(0xffeecc, 0.3);
    dirLight3.position.set(0,5,-8); scene.add(dirLight3);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  }
  updateRendererBg();
  window.addEventListener('atomurus:themechange', updateRendererBg);

  let currentGroup = new THREE.Group();
  scene.add(currentGroup);

  // Mouse / touch orbit + state
  let isDragging=false,lastX=0,lastY=0,rotX=(paper() && paper().ATOM_ORBIT_X) || 0.28,rotY=(paper() && paper().ATOM_ORBIT_Y) || 0.55,autoRotate=!((paper() && paper().prefersReducedMotion && paper().prefersReducedMotion()));
  let staticMode=false, labelsVisible=false;
  const DEFAULT_CAM_Z=(paper() && paper().ATOM_CAM_Z) || 6.6;

  // Rotation with inertia: track velocity, decay each frame when not dragging
  let rotVelX = 0, rotVelY = 0;
  const ROT_DAMPING = 0.92;     // velocity decay per frame
  const ROT_SENS    = 0.0085;   // mouse → angle sensitivity

  canvas.addEventListener('mousedown', e => {
    if (staticMode) return;
    isDragging=true; autoRotate=false; updateRotateBtn();
    rotVelX = 0; rotVelY = 0;
    lastX=e.clientX; lastY=e.clientY; canvas.style.cursor='grabbing';
  });
  window.addEventListener('mouseup', () => { isDragging=false; if(!staticMode) canvas.style.cursor='grab'; });
  window.addEventListener('mousemove', e => {
    if (!isDragging || staticMode) return;
    const dx = (e.clientX - lastX) * ROT_SENS;
    const dy = (e.clientY - lastY) * ROT_SENS;
    rotY += dx; rotX += dy;
    // Capture velocity for inertia after release
    rotVelY = dx * 0.6 + rotVelY * 0.4;
    rotVelX = dy * 0.6 + rotVelX * 0.4;
    lastX=e.clientX; lastY=e.clientY;
  });
  if (paper() && paper().bindPageScrollWheel) {
    paper().bindPageScrollWheel(canvas, function (e) {
      if (staticMode) return;
      camera.position.z = Math.max(3, Math.min(20, camera.position.z + e.deltaY*0.01));
    });
  } else {
    canvas.addEventListener('wheel', e => {
      if (staticMode) return;
      camera.position.z = Math.max(3, Math.min(20, camera.position.z + e.deltaY*0.01));
      e.preventDefault();
    }, { passive:false });
  }
  let lastTouchX=0,lastTouchY=0;
  canvas.addEventListener('touchstart', e => {
    if (staticMode) return;
    autoRotate=false; updateRotateBtn();
    lastTouchX=e.touches[0].clientX; lastTouchY=e.touches[0].clientY;
  });
  canvas.addEventListener('touchmove', e => {
    if (staticMode) return;
    const dx = (e.touches[0].clientX - lastTouchX) * 0.011;
    const dy = (e.touches[0].clientY - lastTouchY) * 0.011;
    rotY += dx; rotX += dy;
    rotVelY = dx * 0.6 + rotVelY * 0.4;
    rotVelX = dy * 0.6 + rotVelX * 0.4;
    lastTouchX=e.touches[0].clientX; lastTouchY=e.touches[0].clientY;
    e.preventDefault();
  }, { passive:false });

  function updateRotateBtn(){
    const b=document.getElementById('vc-rotate');
    if (b) b.classList.toggle('active', autoRotate);
  }

  // ── Particle color palette (spec from design doc) ──
  const PROTON_COLOR   = (paper() && paper().PROTON) || 0xC45C4A;
  const NEUTRON_COLOR  = (paper() && paper().NEUTRON) || 0x1E6A50;
  function ELECTRON_COLOR(){ return paper() ? paper().electronColor() : 0x14120E; }
  const ORBIT_COLOR    = (paper() && paper().GREEN) || 0x1E6A50;

  // Helpers
  function makeSphere(r,color,segments=24){
    const mat = paper()
      ? paper().mat(THREE, color)
      : new THREE.MeshStandardMaterial({color,roughness:0.35,metalness:0.15});
    return new THREE.Mesh(new THREE.SphereGeometry(r,segments,segments), mat);
  }
  function makeGlow(r,color){
    return new THREE.Mesh(new THREE.SphereGeometry(r,24,24),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.08}));
  }
  function makeOrbit(radius,color=ORBIT_COLOR,opacity=0.85,tilt=0){
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.018, 8, 80),
      paper() ? paper().orbitMat(THREE, { opacity: opacity * 0.7 })
        : new THREE.MeshStandardMaterial({ color, metalness:0.06, roughness:0.55, transparent:true, opacity })
    );
    torus.rotation.x = tilt;
    return torus;
  }

  function makeBareParticle(r, color, segments=24){
    const g = new THREE.Group();
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(r, segments, segments),
      paper()
        ? paper().mat(THREE, color, { roughness: 0.48, metalness: 0.04 })
        : new THREE.MeshStandardMaterial({color, roughness:0.42, metalness:0.06})
    ));
    return g;
  }

  // Make a labeled particle sphere (proton +, electron −). Paper lab uses bare spheres.
  function makeLabeledParticle(r, color, label, segments=24){
    if (paper()) return makeBareParticle(r, color, segments);
    const g = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(r, segments, segments),
      new THREE.MeshStandardMaterial({color, roughness:0.42, metalness:0.06})
    );
    g.add(sphere);
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx2d = c.getContext('2d');
    ctx2d.font = 'bold 38px sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillStyle = 'rgba(255,255,255,0.95)';
    ctx2d.fillText(label, 32, 34);
    const tex = new THREE.CanvasTexture(c);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
    sp.scale.set(r*1.6, r*1.6, 1);
    g.add(sp);
    return g;
  }

  // ── Quantum subshell machinery (shared by the 3D cloud and 2D diagrams) ──
  // Carbon's real ground state is 1s² 2s² 2p². Each subshell is sampled from
  // its hydrogen-like radial probability density P(r) = r²·R(r)² (visual
  // scale units, not picometers):
  //   1s — dense sphere, peak ~1.1        →  P ∝ r²·e^(−2r/a₁)
  //   2s — sphere with RADIAL NODE at 2a₂ →  P ∝ r²·(2−r/a₂)²·e^(−r/a₂)
  //   2p — dumbbell lobes, peak ~4a₃      →  P ∝ r⁴·e^(−r/a₃) · cos²θ
  const _Q_A1S = 1.1, _Q_A2S = 0.75, _Q_A2P = 0.8;
  function _qPdf1s(r){ return r * r * Math.exp(-2 * r / _Q_A1S); }
  function _qPdf2s(r){ const rho = r / _Q_A2S, f = 2 - rho; return r * r * f * f * Math.exp(-rho); }
  function _qPdf2p(r){ return Math.pow(r, 4) * Math.exp(-r / _Q_A2P); }

  // Inverse-CDF sampler over a tabulated radial pdf — stable, no rejection loops.
  function _radialSampler(pdf, rMax, bins){
    bins = bins || 160;
    const cdf = new Float32Array(bins);
    let acc = 0;
    for (let i = 0; i < bins; i++) {
      acc += pdf((i + 0.5) * rMax / bins);
      cdf[i] = acc;
    }
    return function(){
      const u = Math.random() * acc;
      let lo = 0, hi = bins - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid + 1; else hi = mid; }
      return (lo + Math.random()) * rMax / bins;
    };
  }

  // Aufbau + Hund: how el electrons fill 1s / 2s / 2p (px, py, pz singly first).
  function _qOccupancy(el){
    const s1 = Math.min(el, 2);
    const s2 = Math.min(2, Math.max(0, el - 2));
    const rest = Math.min(6, Math.max(0, el - 4));
    const p = [0, 0, 0];
    for (let i = 0; i < rest; i++) p[i % 3]++;
    return { s1: s1, s2: s2, p: p };
  }

  // Subshell tints (keyed so cached 2D points survive theme switches).
  function _qShellColors3D(isDark){
    return isDark
      ? { s1: [0.48, 0.73, 0.62], s2: [0.91, 0.89, 0.83], p: [0.91, 0.89, 0.83] }
      : { s1: [0.12, 0.42, 0.31], s2: [0.35, 0.33, 0.29], p: [0.08, 0.07, 0.05] };
  }
  function _qShellColors2D(isDark){
    return isDark
      ? { s1: '122,186,158', s2: '232,226,212', p: '232,226,212' }
      : { s1: '30,106,80',  s2: '90,85,76',    p: '20,18,14' };
  }

  // ── Stable subshell-aware point caches for the 2D Quantum cloud
  // (generated once per model/charge change so the cloud doesn't flicker)
  let _quantumMiniPts = null;
  let _quantumFullPts = null;
  function genQuantumPoints(scalePx, density){
    const el = Math.max(0, 6 - charge);
    const occ = _qOccupancy(el);
    const pts = [];
    const rand1s = _radialSampler(_qPdf1s, 3.0);
    const rand2s = _radialSampler(_qPdf2s, 5.6);
    const rand2p = _radialSampler(_qPdf2p, 6.2);
    function push(r, a, key){
      // p-lobe points slightly bigger/brighter so the dumbbells read clearly
      // against the isotropic 2s background at the same radius
      const isP = key === 'p';
      pts.push({
        r: r * scalePx, a: a,
        op: (isP ? 0.45 : 0.30) + Math.random() * 0.5,
        sz: (isP ? 1.3 : 1.0) + Math.random(),
        k: key
      });
    }
    for (let i = 0; i < occ.s1 * density; i++) push(rand1s(), Math.random() * Math.PI * 2, 's1');
    for (let i = 0; i < occ.s2 * density; i++) push(rand2s(), Math.random() * Math.PI * 2, 's2');
    // 2p lobes: px along x, py along y (cos²α in-plane); pz points at the
    // viewer — drawn as a foreshortened central halo when occupied (ions).
    occ.p.forEach(function(n, axis){
      for (let i = 0; i < n * density; i++) {
        if (axis === 2) { push(rand2p() * 0.45, Math.random() * Math.PI * 2, 'p'); continue; }
        let a;
        do { a = Math.random() * Math.PI * 2; } while (Math.random() > Math.pow(Math.cos(a), 2));
        if (axis === 1) a += Math.PI / 2;
        push(rand2p(), a, 'p');
      }
    });
    return pts;
  }
  function regenQuantumPoints(){
    _quantumMiniPts = genQuantumPoints(24, 170);
    _quantumFullPts = genQuantumPoints(40, 380);
  }

  // Build an interleaved proton/neutron sequence so particles intermix on the Fibonacci sphere
  // (avoids the "two coloured blobs" effect when z and n are consecutive index ranges).
  function buildNucleonOrder(z, n){
    const order = new Array(z + n);
    let placedP = 0, placedN = 0;
    for (let i = 0; i < z + n; i++) {
      const expectedP = Math.round((i + 1) * z / (z + n));
      if (placedP < expectedP && placedP < z) { order[i] = 'p'; placedP++; }
      else if (placedN < n)                    { order[i] = 'n'; placedN++; }
      else                                     { order[i] = 'p'; placedP++; }
    }
    return order;
  }

  function makeNucleus(z, n, scale=1){
    const g = new THREE.Group();
    const total = z + n;
    if (total === 0) return g;
    const order = buildNucleonOrder(z, n);
    const partR = paper() ? 0.16 * scale : 0.22 * scale;
    const clusterR = paper()
      ? 0.52 * scale
      : Math.max(0.30, Math.pow(total, 1/3) * 0.34) * scale;
    for (let i = 0; i < total; i++) {
      const isProton = order[i] === 'p';
      const color = isProton ? PROTON_COLOR : NEUTRON_COLOR;
      let p;
      if (isProton) {
        p = makeLabeledParticle(partR, color, '+', 16);
      } else {
        p = new THREE.Group();
        p.add(new THREE.Mesh(new THREE.SphereGeometry(partR,16,16),
          paper()
            ? paper().mat(THREE, NEUTRON_COLOR, { roughness: 0.4, metalness: 0.1 })
            : new THREE.MeshStandardMaterial({color:NEUTRON_COLOR,roughness:0.4,metalness:0.1})));
      }
      const phi   = Math.acos(1 - 2 * (i + 0.5) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      p.position.set(
        clusterR * Math.cos(theta) * Math.sin(phi),
        clusterR * Math.sin(theta) * Math.sin(phi),
        clusterR * Math.cos(phi)
      );
      g.add(p);
    }
    if (!paper()) g.add(makeGlow(clusterR + 0.45, 0xff4422));
    return g;
  }
  function makeBond(p1,p2,color=0x888,r=0.06){
    const dir=new THREE.Vector3().subVectors(p2,p1);
    const len=dir.length();
    const mid=new THREE.Vector3().addVectors(p1,p2).multiplyScalar(0.5);
    const cyl=new THREE.Mesh(
      new THREE.CylinderGeometry(r,r,len,12),
      new THREE.MeshPhongMaterial({color,shininess:40})
    );
    cyl.position.copy(mid);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
    return cyl;
  }

  let electrons=[];
  let trackedAtoms=[]; // {mesh, label, radius} — for label sprites + info-meta
  let bondCount=0;

  // Element color → symbol (label rendering)
  const COLOR_TO_ELEMENT = {
    0xdddddd:'H', 0xe8e8e8:'H',
    0xee3333:'O',
    0x666666:'C', 0x555555:'C', 0x444444:'C', 0x333333:'C', 0x222222:'C',
    0x3399ff:'N',
    0x44dd44:'Cl',
    0xaaaaff:'Na',
    0xffcc33:'S', 0xddaa00:'S', 0xeecc22:'S',
    0xff8833:'P', 0xffdd44:'P', 0xcc3311:'P',
    0xcc6633:'Fe'
  };

  // ═══ ATOMIC MODELS ═══
  // Each model is built around Carbon as the canonical example (Z=6):
  //   - 6 protons (red, +) + 6 neutrons (green) packed as nucleus
  //   - 6 electrons (blue, –) — distribution depends on the historical model
  // Inspired by the user's reference images: real-looking nuclei made of
  // distinct proton/neutron spheres, with electrons on solid tube orbits.
  const atomicModels = {
    dalton: () => {
      const g = new THREE.Group(); electrons = []; trackedAtoms = []; bondCount = 0;
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(paper() ? 1.18 : 2.0, 40, 40),
        paper()
          ? paper().mat(THREE, paper().isDark() ? 0x6B5A42 : 0x8A6A4A, { roughness: 0.62, metalness: 0.04 })
          : new THREE.MeshStandardMaterial({color:0x8A6A4A, roughness:0.62, metalness:0.04})
      );
      if (!paper()) ball.add(makeGlow(2.5, 0xaa8855));
      g.add(ball);
      return g;
    },
    thomson: (el = 6) => {
      const g = new THREE.Group(); electrons = []; trackedAtoms = []; bondCount = 0;
      const pudding = new THREE.Mesh(
        new THREE.SphereGeometry(paper() ? 1.55 : 2.5, 32, 32),
        paper()
          ? paper().mat(THREE, 0xD4A07A, { transparent: true, opacity: paper().isDark() ? 0.22 : 0.32, roughness: 0.86, metalness: 0, side: THREE.DoubleSide })
          : new THREE.MeshStandardMaterial({ color: 0xff9966, transparent: true, opacity: 0.22, roughness:0.8 })
      );
      g.add(pudding);
      if (!paper()) g.add(makeGlow(2.7, 0xff5533));
      const points = paper()
        ? [[0.72,0.42,0.28],[-0.82,0.18,0.62],[0.18,-0.98,0.36],[-0.36,0.82,-0.52],[0.9,-0.28,-0.72],[-0.64,-0.72,0.44],[0.5,-0.5,0.9],[-0.3,-0.6,-0.8],[0.9,0.7,-0.2],[-0.8,0.8,0.1]]
        : [[0.8,0.5,0.3],[-0.9,0.2,0.7],[0.2,-1.1,0.4],[-0.4,0.9,-0.6],[1.0,-0.3,-0.8],[-0.7,-0.8,0.5],[0.5,-0.5,0.9],[-0.3,-0.6,-0.8],[0.9,0.7,-0.2],[-0.8,0.8,0.1]];
      for (let i = 0; i < el; i++) {
        const p = points[i % points.length];
        const eg = makeLabeledParticle(paper() ? 0.12 : 0.22, ELECTRON_COLOR(), '−', 20);
        eg.position.set(p[0], p[1], p[2]);
        eg.userData = { orbitR: 0, phase: 0, speed: 0 };
        g.add(eg);
      }
      if (paper()) g.position.y = 0.22;
      return g;
    },
    rutherford: (el = 6) => {
      const g = new THREE.Group(); electrons = []; trackedAtoms = []; bondCount = 0;
      g.add(makeNucleus(6, 6));

      const orbitR = paper() ? 2.05 : 2.6;
      const orbits = [
        { r: orbitR, eX: Math.PI / 6,    eY: 0,            eZ: Math.PI / 4 },
        { r: orbitR, eX: -Math.PI / 5,   eY: Math.PI / 3,  eZ: 0 },
        { r: orbitR, eX: Math.PI / 2.5,  eY: Math.PI / 1.5, eZ: 0.5 }
      ];

      const baseCount = Math.floor(el / 3);
      const remainder = el % 3;

      orbits.forEach((orb, idx) => {
        const count = baseCount + (idx < remainder ? 1 : 0);
        if (count <= 0) return;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(orb.r, 0.018, 8, 80),
          paper() ? paper().orbitMat(THREE, { opacity: 0.55 })
            : new THREE.MeshStandardMaterial({ color: ORBIT_COLOR, metalness:0.06, roughness:0.55, transparent:true, opacity:0.55 })
        );
        ring.rotation.set(orb.eX, orb.eY, orb.eZ);
        g.add(ring);
        for (let i = 0; i < count; i++) {
          const eg = makeLabeledParticle(paper() ? 0.11 : 0.20, ELECTRON_COLOR(), '−', 20);
          eg.userData = {
            orbitR: orb.r,
            phase: (i / count) * Math.PI * 2,
            speed: 0.95 / (idx + 1),
            euler: { x: orb.eX, y: orb.eY, z: orb.eZ },
            elliptic: true
          };
          electrons.push(eg); g.add(eg);
        }
      });
      return g;
    },
    bohr: (el = 6) => {
      const g = new THREE.Group(); electrons = []; trackedAtoms = []; bondCount = 0;
      g.add(makeNucleus(6, 6));

      const kCount = Math.min(el, 2);
      const lCount = Math.min(8, Math.max(0, el - 2));
      const mCount = Math.max(0, el - 10);

      const orbDef = [];
      if (kCount > 0) orbDef.push({ r: paper() ? 1.35 : 1.8, count: kCount, tilt: paper() ? 0.12 : 0,            speed: 1.05 });
      if (lCount > 0) orbDef.push({ r: paper() ? 2.25 : 3.0, count: lCount, tilt: paper() ? -0.18 : Math.PI*0.06, speed: 0.7  });
      if (mCount > 0) orbDef.push({ r: paper() ? 3.15 : 4.2, count: mCount, tilt: paper() ? 0.08 : -Math.PI*0.06, speed: 0.5  });

      orbDef.forEach((od) => {
        g.add(makeOrbit(od.r, ORBIT_COLOR, 0.55, od.tilt));
        for (let i = 0; i < od.count; i++) {
          const eg = makeLabeledParticle(paper() ? 0.11 : 0.22, ELECTRON_COLOR(), '−', 24);
          eg.userData = {
            orbitR: od.r,
            phase: (i / od.count) * Math.PI * 2,
            speed: od.speed,
            tilt: od.tilt
          };
          electrons.push(eg); g.add(eg);
        }
      });
      return g;
    },
    quantum: (el = 6) => {
      // 1926 — Schrödinger. Carbon's real ground state (1s² 2s² 2p²) rendered
      // as separate |ψ|² probability clouds per subshell:
      //   1s — dense spherical core (cyan)
      //   2s — wider sphere with a visible radial node (blue)
      //   2p — perpendicular dumbbell lobes px/py, Hund's rule (violet)
      // Ionic charge shifts occupancy via Aufbau (e.g. C⁻ gains a pz lobe).
      const g = new THREE.Group(); electrons = []; trackedAtoms = []; bondCount = 0;
      g.add(makeNucleus(6, 6));

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const COL = _qShellColors3D(isDark);
      const occ = _qOccupancy(el);
      const PTS_PER_E = 220;

      const rand1s = _radialSampler(_qPdf1s, 3.0);
      const rand2s = _radialSampler(_qPdf2s, 5.6);
      const rand2p = _radialSampler(_qPdf2p, 6.2);

      function isoDir(){
        const phi = Math.random() * Math.PI * 2;
        const ct = 2 * Math.random() - 1;
        const st = Math.sqrt(1 - ct * ct);
        return [st * Math.cos(phi), st * Math.sin(phi), ct];
      }
      function sphSample(rand){
        return function(){
          const r = rand(), d = isoDir();
          return [d[0] * r, d[1] * r, d[2] * r];
        };
      }
      // Dumbbell along `axis` (0=x,1=y,2=z): cosθ sampled with pdf ∝ cos²θ
      // (inverse CDF: cosθ = ∛(2u−1) — both lobes emerge naturally).
      function pSample(rand, axis){
        return function(){
          const r = rand();
          const c = Math.cbrt(2 * Math.random() - 1);
          const s = Math.sqrt(Math.max(0, 1 - c * c));
          const phi = Math.random() * Math.PI * 2;
          const out = [0, 0, 0];
          out[axis]           = c * r;
          out[(axis + 1) % 3] = s * Math.cos(phi) * r;
          out[(axis + 2) % 3] = s * Math.sin(phi) * r;
          return out;
        };
      }

      function addCloud(count, color, sampleFn, size){
        if (count <= 0) return;
        const positions = new Float32Array(count * 3);
        const colors    = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const p = sampleFn();
          positions[i*3] = p[0]; positions[i*3 + 1] = p[1]; positions[i*3 + 2] = p[2];
          const t = 0.75 + Math.random() * 0.25;
          colors[i*3] = color[0] * t; colors[i*3 + 1] = color[1] * t; colors[i*3 + 2] = color[2] * t;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
        const cloud = new THREE.Points(geo, new THREE.PointsMaterial({
          size: paper() ? 0.055 : size,
          vertexColors: true,
          transparent: true,
          opacity: paper() ? 0.78 : 0.85,
          sizeAttenuation: true,
          depthWrite: false
        }));
        cloud.userData.isCloud = true;
        g.add(cloud);
      }

      const paperInk = paper()
        ? (isDark ? [0.91, 0.89, 0.83] : [0.08, 0.07, 0.05])
        : null;
      const paperGreen = paper() ? [0.12, 0.42, 0.31] : null;
      addCloud(occ.s1 * PTS_PER_E, paperGreen || COL.s1, sphSample(rand1s), 0.07);
      addCloud(occ.s2 * PTS_PER_E, paperInk || COL.s2, sphSample(rand2s), 0.08);
      occ.p.forEach((n, axis) => addCloud(n * PTS_PER_E, paperInk || COL.p, pSample(rand2p, axis), 0.085));
      return g;
    }
  };

  // ═══ MOLECULES ═══
  const molData = {
    water:{name:'H₂O — Água',desc:'Geometria angular (104,5°) · Polar · Pontes de hidrogênio',
      atoms:[{pos:[0,0,0],r:0.38,color:0xee3333},{pos:[-0.96,-0.58,0],r:0.22,color:0xdddddd},{pos:[0.96,-0.58,0],r:0.22,color:0xdddddd}],
      bonds:[[0,1],[0,2]]},
    ethanol:{name:'C₂H₅OH — Etanol',desc:'Cadeia aberta · Grupo hidroxila OH · Polar e apolar',
      atoms:[{pos:[-1.2,0,0],r:0.35,color:0x666666},{pos:[1.2,0,0],r:0.35,color:0x666666},{pos:[2.4,-0.5,0],r:0.30,color:0xee3333},{pos:[3.5,-0.5,0],r:0.20,color:0xdddddd},{pos:[-1.2,1.1,0],r:0.20,color:0xdddddd},{pos:[-1.2,-1.1,0],r:0.20,color:0xdddddd},{pos:[-2.3,0,0],r:0.20,color:0xdddddd},{pos:[1.2,1.1,0.6],r:0.20,color:0xdddddd},{pos:[1.2,1.1,-0.6],r:0.20,color:0xdddddd}],
      bonds:[[0,1],[1,2],[2,3],[0,4],[0,5],[0,6],[1,7],[1,8]]},
    co2:{name:'CO₂ — Dióxido de Carbono',desc:'Geometria linear · Apolar · Duplas C=O',
      atoms:[{pos:[0,0,0],r:0.36,color:0x444444},{pos:[-1.6,0,0],r:0.34,color:0xee3333},{pos:[1.6,0,0],r:0.34,color:0xee3333}],
      bonds:[[0,1],[0,2]]},
    ammonia:{name:'NH₃ — Amônia',desc:'Geometria piramidal trigonal · Polar · Básica',
      atoms:[{pos:[0,0.4,0],r:0.33,color:0x3399ff},{pos:[-1.0,-0.5,0.6],r:0.20,color:0xdddddd},{pos:[1.0,-0.5,0.6],r:0.20,color:0xdddddd},{pos:[0,-0.5,-1.0],r:0.20,color:0xdddddd}],
      bonds:[[0,1],[0,2],[0,3]]},
    methane:{name:'CH₄ — Metano',desc:'Geometria tetraédrica · Apolar · Gás natural',
      atoms:[{pos:[0,0,0],r:0.36,color:0x555555},{pos:[1.0,1.0,1.0],r:0.20,color:0xdddddd},{pos:[-1.0,-1.0,1.0],r:0.20,color:0xdddddd},{pos:[-1.0,1.0,-1.0],r:0.20,color:0xdddddd},{pos:[1.0,-1.0,-1.0],r:0.20,color:0xdddddd}],
      bonds:[[0,1],[0,2],[0,3],[0,4]]},
    hcl:{name:'HCl — Ácido Clorídrico',desc:'Linear · Polar · Ácido forte · Diatômico',
      atoms:[{pos:[-0.7,0,0],r:0.20,color:0xdddddd},{pos:[0.7,0,0],r:0.42,color:0x44dd44}],
      bonds:[[0,1]]},
    nacl:{name:'NaCl — Sal (cloreto de sódio)',desc:'Rede cristalina cúbica · Ligação iônica · Octaédrica',
      atoms:[{pos:[-1,-1,-1],r:0.32,color:0xaaaaff},{pos:[1,-1,-1],r:0.42,color:0x44dd44},{pos:[-1,1,-1],r:0.42,color:0x44dd44},{pos:[1,1,-1],r:0.32,color:0xaaaaff},{pos:[-1,-1,1],r:0.42,color:0x44dd44},{pos:[1,-1,1],r:0.32,color:0xaaaaff},{pos:[-1,1,1],r:0.32,color:0xaaaaff},{pos:[1,1,1],r:0.42,color:0x44dd44}],
      bonds:[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]]},
    h2so4:{name:'H₂SO₄ — Ácido Sulfúrico',desc:'Tetraédrica em torno do S · Diprótico · Ác. forte',
      atoms:[{pos:[0,0,0],r:0.40,color:0xffcc33},{pos:[0,1.3,0],r:0.32,color:0xee3333},{pos:[0,-1.3,0],r:0.32,color:0xee3333},{pos:[1.2,0.4,0.6],r:0.32,color:0xee3333},{pos:[-1.2,0.4,-0.6],r:0.32,color:0xee3333},{pos:[2.0,1.0,0.6],r:0.18,color:0xdddddd},{pos:[-2.0,1.0,-0.6],r:0.18,color:0xdddddd}],
      bonds:[[0,1],[0,2],[0,3],[0,4],[3,5],[4,6]]},
    h3po4:{name:'H₃PO₄ — Ácido Fosfórico',desc:'Tetraédrica em torno do P · DNA, ATP, fertilizantes',
      atoms:[{pos:[0,0,0],r:0.40,color:0xff8833},{pos:[0,1.3,0],r:0.32,color:0xee3333},{pos:[1.2,-0.5,0.6],r:0.32,color:0xee3333},{pos:[-1.2,-0.5,0.6],r:0.32,color:0xee3333},{pos:[0,-0.5,-1.3],r:0.32,color:0xee3333},{pos:[2.0,-1.1,0.6],r:0.18,color:0xdddddd},{pos:[-2.0,-1.1,0.6],r:0.18,color:0xdddddd},{pos:[0,-1.1,-2.1],r:0.18,color:0xdddddd}],
      bonds:[[0,1],[0,2],[0,3],[0,4],[2,5],[3,6],[4,7]]},
    fe2o3:{name:'Fe₂O₃ — Ferrugem (óxido férrico)',desc:'Rede cristalina hematita · Óxido férrico · Corrosão',
      atoms:[{pos:[-1.4,0,0],r:0.42,color:0xcc6633},{pos:[1.4,0,0],r:0.42,color:0xcc6633},{pos:[0,1.0,0],r:0.32,color:0xee3333},{pos:[0,-1.0,0],r:0.32,color:0xee3333},{pos:[0,0,1.0],r:0.32,color:0xee3333}],
      bonds:[[0,2],[0,3],[0,4],[1,2],[1,3],[1,4]]}
  };

  function buildMolecule(key){
    const g=new THREE.Group(); electrons=[]; trackedAtoms=[];
    const mol=molData[key];
    const meshes=mol.atoms.map(a=>{
      const radius=a.r*2.2;
      const m=makeSphere(radius,a.color);
      m.position.fromArray(a.pos);
      const label = COLOR_TO_ELEMENT[a.color] || '';
      trackedAtoms.push({mesh:m, label, radius});
      g.add(m); return m;
    });
    mol.bonds.forEach(([i,j])=>{
      g.add(makeBond(meshes[i].position,meshes[j].position,0x999999,0.08));
    });
    bondCount = mol.bonds.length;
    return g;
  }

  // ═══ ALLOTROPES ═══
  const alloMeta = {
    graphite:{name:'Grafite — Carbono',desc:'Camadas hexagonais (grafeno) AB-stacked · sp² · Condutor elétrico'},
    diamond:{name:'Diamante — Carbono',desc:'Rede cúbica tetraédrica · sp³ · Material mais duro · Isolante'},
    fullerene:{name:'Fulereno C₆₀ — Carbono',desc:'60 átomos · 20 hex + 12 pent · Icosaedro truncado · Nobel 1996'},
    graphene:{name:'Grafeno — Carbono',desc:'Monocamada hexagonal sp² · Condutor 2D · Nobel de Física 2010'},
    nanotube:{name:'Nanotubo de Carbono',desc:'Grafeno enrolado · Resistência 100× o aço · Condutor/semicondutor'},
    o2:{name:'O₂ — Oxigênio Molecular',desc:'Ligação dupla σ+π · Paramagnético · Estado fundamental estável'},
    ozone:{name:'O₃ — Ozônio',desc:'Angular 117,5° · Ressonância · Escudo UV · Forte oxidante'},
    s_rhombic:{name:'Enxofre Rômbico α-S₈',desc:'Anel coroa S₈ · Estável à temperatura ambiente · Amarelo'},
    s_mono:{name:'Enxofre Monoclínico β-S₈',desc:'Anel S₈ · Estável 96–119°C · Outro empacotamento cristalino'},
    p_white:{name:'Fósforo Branco P₄',desc:'Tetraedro · Inflamável (~34°C) · Tóxico · Fosforescente'},
    p_red:{name:'Fósforo Vermelho',desc:'Cadeia polimérica amorfa · Estável ao ar · Não tóxico'},
    p_black:{name:'Fósforo Negro / Fosforeno',desc:'Camadas corrugadas · Análogo 2D do grafeno · Semicondutor'}
  };
  const alloElements = {
    carbon:['graphite','diamond','fullerene','graphene','nanotube'],
    oxygen:['o2','ozone'],
    sulfur:['s_rhombic','s_mono'],
    phosphorus:['p_white','p_red','p_black']
  };
  const alloVariantLabels = {
    graphite:'Grafite',diamond:'Diamante',fullerene:'Fulereno C₆₀',graphene:'Grafeno',nanotube:'Nanotubo',
    o2:'O₂ Molecular',ozone:'O₃ Ozônio',
    s_rhombic:'Rômbico α-S₈',s_mono:'Monoclínico β-S₈',
    p_white:'P₄ Branco',p_red:'P Vermelho',p_black:'Fósforo Negro'
  };

  function buildAllotrope(key){
    const g=new THREE.Group(); electrons=[];

    if (key==='graphite'){
      const layerY=[-0.9,0,0.9];
      layerY.forEach((y,li)=>{
        const offset=(li%2)*0.72*Math.sqrt(3)/2;
        const b=0.72, dx=b*Math.sqrt(3);
        const rows=4,cols=3;
        const pos=[];
        for (let row=0;row<rows;row++){
          for (let col=0;col<cols;col++){
            const ax=col*dx+(row%2)*(dx/2)+offset;
            const az=row*(b*1.5);
            pos.push(new THREE.Vector3(ax,y,az));
            pos.push(new THREE.Vector3(ax,y,az+b));
          }
        }
        const xs=pos.map(p=>p.x),zs=pos.map(p=>p.z);
        const cx=(Math.min(...xs)+Math.max(...xs))/2;
        const cz=(Math.min(...zs)+Math.max(...zs))/2;
        pos.forEach(p=>{p.x-=cx; p.z-=cz;});
        const shade=li===1?0x555555:0x333333;
        pos.forEach(p=>{
          const a=makeSphere(0.16,shade,10);
          a.position.copy(p); g.add(a);
        });
        for (let i=0;i<pos.length;i++)
          for (let j=i+1;j<pos.length;j++)
            if (pos[i].distanceTo(pos[j])<b*1.1)
              g.add(makeBond(pos[i],pos[j],0x666666,0.055));
      });
    }
    else if (key==='diamond'){
      const a0=1.7;
      const basis=[[0,0,0],[0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
        [0.25,0.25,0.25],[0.75,0.75,0.25],[0.75,0.25,0.75],[0.25,0.75,0.75]];
      const sites=[];
      for (let ix=0;ix<=1;ix++)
        for (let iy=0;iy<=1;iy++)
          for (let iz=0;iz<=1;iz++)
            basis.forEach(([bx,by,bz])=>{
              sites.push(new THREE.Vector3((ix+bx)*a0-a0,(iy+by)*a0-a0,(iz+bz)*a0-a0));
            });
      const uniq=[];
      sites.forEach(s=>{ if (!uniq.some(u=>u.distanceTo(s)<0.05)) uniq.push(s); });
      uniq.forEach(s=>{
        const atom=makeSphere(0.22,0x99ddff,14);
        atom.position.copy(s); atom.add(makeGlow(0.34,0x88ccff));
        g.add(atom);
      });
      const bondLen=a0*Math.sqrt(3)/4;
      const tol=bondLen*1.08;
      for (let i=0;i<uniq.length;i++)
        for (let j=i+1;j<uniq.length;j++)
          if (uniq[i].distanceTo(uniq[j])<tol)
            g.add(makeBond(uniq[i],uniq[j],0xaaddff,0.07));
    }
    else if (key==='fullerene'){
      const phi=(1+Math.sqrt(5))/2;
      const baseTriples=[[0,1,3*phi],[1,2+phi,2*phi],[2,1+2*phi,phi]];
      const rawV=[];
      baseTriples.forEach(([a,b,c])=>{
        const cycs=[[a,b,c],[b,c,a],[c,a,b]];
        cycs.forEach(([x,y,z])=>{
          const sX=(x===0)?[0]:[x,-x];
          const sY=(y===0)?[0]:[y,-y];
          const sZ=(z===0)?[0]:[z,-z];
          sX.forEach(xx=>sY.forEach(yy=>sZ.forEach(zz=>{ rawV.push([xx,yy,zz]); })));
        });
      });
      const uniqVerts=[];
      rawV.forEach(v=>{
        if (!uniqVerts.some(u=>Math.abs(u[0]-v[0])<0.001 && Math.abs(u[1]-v[1])<0.001 && Math.abs(u[2]-v[2])<0.001))
          uniqVerts.push(v);
      });
      const targetR=2.4;
      const sampleLen=Math.sqrt(uniqVerts[0][0]**2+uniqVerts[0][1]**2+uniqVerts[0][2]**2);
      const scale=targetR/sampleLen;
      const pts=uniqVerts.map(v=>new THREE.Vector3(v[0]*scale,v[1]*scale,v[2]*scale));
      pts.forEach(p=>{
        const a=makeSphere(0.18,0x333333,14);
        a.position.copy(p); g.add(a);
      });
      const bondDist=2*scale*1.08;
      for (let i=0;i<pts.length;i++)
        for (let j=i+1;j<pts.length;j++)
          if (pts[i].distanceTo(pts[j])<bondDist)
            g.add(makeBond(pts[i],pts[j],0x666666,0.055));
    }
    else if (key==='graphene'){
      const rows=4,cols=5;
      const pos=[];
      for (let row=0;row<rows;row++){
        for (let col=0;col<cols;col++){
          const x=col*1.4+(row%2)*0.7-3.5;
          const z=row*1.21-2.4;
          pos.push(new THREE.Vector3(x,0,z));
          const atom=makeSphere(0.18,0x222222,12);
          atom.position.set(x,0,z); g.add(atom);
        }
      }
      for (let i=0;i<pos.length;i++)
        for (let j=i+1;j<pos.length;j++)
          if (pos[i].distanceTo(pos[j])<1.5)
            g.add(makeBond(pos[i],pos[j],0x444444,0.055));
    }
    else if (key==='nanotube'){
      const R=1.5,segs=10,rings=8;
      const pos=[];
      for (let ring=0;ring<rings;ring++){
        const y=(ring-rings/2)*0.7;
        for (let s=0;s<segs;s++){
          const a=(s/segs)*Math.PI*2+(ring%2)*(Math.PI/segs);
          const x=Math.cos(a)*R, z=Math.sin(a)*R;
          pos.push(new THREE.Vector3(x,y,z));
          const atom=makeSphere(0.16,0x333333,12);
          atom.position.set(x,y,z); g.add(atom);
        }
      }
      for (let i=0;i<pos.length;i++)
        for (let j=i+1;j<pos.length;j++)
          if (pos[i].distanceTo(pos[j])<1.0)
            g.add(makeBond(pos[i],pos[j],0x555555,0.05));
    }
    else if (key==='o2'){
      const a1=makeSphere(0.5,0xee3333), a2=makeSphere(0.5,0xee3333);
      a1.position.set(-0.7,0,0); a2.position.set(0.7,0,0);
      a1.add(makeGlow(0.75,0xff2200)); a2.add(makeGlow(0.75,0xff2200));
      g.add(a1); g.add(a2);
      g.add(makeBond(a1.position,a2.position,0xcc2222,0.1));
      g.add(makeBond(new THREE.Vector3(-0.7,0.12,0),new THREE.Vector3(0.7,0.12,0),0xcc2222,0.1));
    }
    else if (key==='ozone'){
      [[-1.1,-0.3,0],[0,0.5,0],[1.1,-0.3,0]].forEach(([x,y,z])=>{
        const a=makeSphere(0.45,0x5599ff);
        a.position.set(x,y,z); a.add(makeGlow(0.65,0x4488ff));
        g.add(a);
      });
      g.add(makeBond(new THREE.Vector3(-1.1,-0.3,0),new THREE.Vector3(0,0.5,0),0x4477cc,0.09));
      g.add(makeBond(new THREE.Vector3(0,0.5,0),new THREE.Vector3(1.1,-0.3,0),0x4477cc,0.09));
    }
    else if (key==='s_rhombic'||key==='s_mono'){
      const N=8,r=2.0;
      const sPos=[];
      for (let i=0;i<N;i++){
        const a=(i/N)*Math.PI*2;
        const y=(i%2===0)?0.4:-0.4;
        const col=key==='s_rhombic'?0xddaa00:0xeecc22;
        const atom=makeSphere(0.38,col,16);
        const pos=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
        atom.position.copy(pos); sPos.push(pos); g.add(atom);
      }
      for (let i=0;i<N;i++) g.add(makeBond(sPos[i],sPos[(i+1)%N],0xaa8800,0.1));
    }
    else if (key==='p_white'){
      const h=Math.sqrt(2/3)*2.0;
      const pSites=[[0,h*0.75,0],[-1.15,-h*0.25,1.0],[1.15,-h*0.25,1.0],[0,-h*0.25,-1.5]];
      pSites.forEach(([x,y,z])=>{
        const a=makeSphere(0.4,0xffdd44,16);
        a.position.set(x,y,z); a.add(makeGlow(0.6,0xffcc00));
        g.add(a);
      });
      [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]].forEach(([i,j])=>{
        g.add(makeBond(new THREE.Vector3(...pSites[i]),new THREE.Vector3(...pSites[j]),0xddaa00,0.09));
      });
    }
    else if (key==='p_red'){
      const chain=[];
      for (let i=0;i<8;i++){
        const x=(i-3.5)*0.9;
        const y=(i%2===0)?0.5:-0.5;
        const z=Math.sin(i*0.8)*0.4;
        chain.push(new THREE.Vector3(x,y,z));
        const a=makeSphere(0.32,0xcc3311,16);
        a.position.set(x,y,z); g.add(a);
      }
      for (let i=0;i<chain.length-1;i++) g.add(makeBond(chain[i],chain[i+1],0xaa2200,0.09));
    }
    else if (key==='p_black'){
      const a=1.1, pucker=0.45, cols=4, rows=5;
      [-0.95,0.95].forEach((yBase,li)=>{
        const positions=[];
        for (let row=0;row<rows;row++){
          for (let col=0;col<cols;col++){
            const x0=col*a*2-cols*a, z0=row*a*1.4-rows*0.7;
            positions.push(new THREE.Vector3(x0,yBase+pucker,z0));
            positions.push(new THREE.Vector3(x0+a,yBase+pucker,z0));
            positions.push(new THREE.Vector3(x0+a*0.5,yBase-pucker,z0+a*0.7));
            positions.push(new THREE.Vector3(x0+a*1.5,yBase-pucker,z0+a*0.7));
          }
        }
        const xs=positions.map(p=>p.x),zs=positions.map(p=>p.z);
        const cx=(Math.min(...xs)+Math.max(...xs))/2;
        const cz=(Math.min(...zs)+Math.max(...zs))/2;
        positions.forEach(p=>{p.x-=cx; p.z-=cz;});
        const shade=li===0?0x4a1d6b:0x6b2d8a;
        positions.forEach(p=>{
          const atom=makeSphere(0.26,shade,12);
          atom.position.copy(p); atom.add(makeGlow(0.38,0x7c3aed));
          g.add(atom);
        });
        for (let i=0;i<positions.length;i++)
          for (let j=i+1;j<positions.length;j++)
            if (positions[i].distanceTo(positions[j])<a*1.15)
              g.add(makeBond(positions[i],positions[j],0x5b21b6,0.06));
      });
    }
    return g;
  }

  // ═══ State + API ═══
  let currentAtomModel='bohr', currentMolecule='water', currentAllotrope='graphite';

  function rebuildScene(buildFn){
    scene.remove(currentGroup);
    currentGroup = buildFn();
    currentGroup.position.y = paper() ? 0.12 : 0.45;
    scene.add(currentGroup);
    rotX = (paper() && paper().ATOM_ORBIT_X) || 0.28;
    rotY = (paper() && paper().ATOM_ORBIT_Y) || 0.55;
    camera.position.set(0, paper() ? 0.2 : 0.35, DEFAULT_CAM_Z);
    if (!staticMode){ autoRotate=true; }
    if (typeof updateRotateBtn==='function') updateRotateBtn();
  }

  // Helper: read from I18N if available, fall back to provided default.
  function _atomI18n(key, fb){
    return (window.I18N && window.I18N.t) ? window.I18N.t(key, { fallback: fb }) : fb;
  }
  // modelMeta is i18n-aware: name/desc come from I18N at read-time
  const modelMeta = {
    bohr:       { get name(){return _atomI18n('atomicModels.modelMeta.bohrName','Bohr Model (1913)')},       get desc(){return _atomI18n('atomicModels.modelMeta.bohrDesc','Electron orbits in discrete energy levels')} },
    rutherford: { get name(){return _atomI18n('atomicModels.modelMeta.rutherfordName','Rutherford Model (1911)')}, get desc(){return _atomI18n('atomicModels.modelMeta.rutherfordDesc','Dense positive nucleus · electrons in 3D orbits')} },
    quantum:    { get name(){return _atomI18n('atomicModels.modelMeta.quantumName','Quantum Model (1926)')},    get desc(){return _atomI18n('atomicModels.modelMeta.quantumDesc','Electron probability cloud · Schrödinger')} },
    thomson:    { get name(){return _atomI18n('atomicModels.modelMeta.thomsonName','Thomson Model (1897)')},    get desc(){return _atomI18n('atomicModels.modelMeta.thomsonDesc','Diffuse positive sphere · "plum pudding"')} },
    dalton:     { get name(){return _atomI18n('atomicModels.modelMeta.daltonName','Dalton Model (1803)')},     get desc(){return _atomI18n('atomicModels.modelMeta.daltonDesc','Atom as a solid, indivisible sphere')} }
  };

  // Localized "Name · year" watermark labels (3D overlay + 2D captions).
  function _modelLabels(){
    return {
      dalton:     'Dalton · 1803',
      thomson:    'Thomson · 1897',
      rutherford: 'Rutherford · 1911',
      bohr:       'Bohr · 1913',
      quantum:    _atomI18n('atomicModels.labelQuantum', 'Quantum · 1926')
    };
  }

  // ── Model detail card (mirrors the molecules page: selecting an item
  //    reveals its full info). EN fallbacks live here; PT comes from I18N. ──
  const MODEL_DETAIL_FB = {
    dalton: {
      year: '1803', who: 'John Dalton',
      idea: 'Matter is made of tiny, indivisible and indestructible spheres. All atoms of one element are identical in mass, and compounds form by combining atoms in whole-number ratios.',
      ok:   'Gave atoms scientific footing: explains conservation of mass (Lavoisier) and the laws of definite and multiple proportions.',
      limit:'No internal structure — cannot explain electric charge, isotopes or light spectra. The electron would only be discovered in 1897.'
    },
    thomson: {
      year: '1897–1904', who: 'J.J. Thomson',
      idea: 'After discovering the electron in cathode-ray tubes (1897), Thomson pictured the atom as a diffuse positively-charged sphere with electrons embedded in it — the "plum pudding" (1904).',
      ok:   'First model with internal structure: accounts for the electron, negative charge and the overall electrical neutrality of the atom.',
      limit:'The gold-foil experiment (1909–1911) showed the positive charge is not spread out — it is concentrated in a tiny nucleus.'
    },
    rutherford: {
      year: '1911', who: 'Ernest Rutherford',
      idea: 'Firing alpha particles at gold foil revealed that nearly all mass and all positive charge sit in a tiny, dense nucleus, with electrons orbiting far away — the atom is mostly empty space.',
      ok:   'Discovered the nucleus and explained alpha scattering. Set the scale: atom ~10⁻¹⁰ m, nucleus ~10⁻¹⁵ m.',
      limit:'By classical physics an orbiting electron should radiate energy and spiral into the nucleus in ~10⁻¹¹ s — and the model cannot explain atomic spectra.'
    },
    bohr: {
      year: '1913', who: 'Niels Bohr',
      idea: 'Electrons occupy only quantized energy levels (shells K, L, M…). Jumping between levels absorbs or emits a photon of exact energy. For carbon: 2 electrons in shell K and 4 in shell L.',
      ok:   'Explains the hydrogen emission spectrum and atomic stability; basis of the electron-shell chemistry taught today.',
      limit:'Fails for the fine spectra of multi-electron atoms, and fixed orbits contradict the uncertainty principle (1927).'
    },
    quantum: {
      year: '1924–1926', who: 'Schrödinger · Heisenberg · de Broglie',
      idea: 'Electrons behave as standing waves described by the wavefunction ψ — |ψ|² gives only the probability of finding them. Carbon (1s² 2s² 2p²): two electrons in the dense spherical 1s, two in the wider 2s (with a radial node) and two unpaired electrons in perpendicular 2p lobes (Hund’s rule).',
      ok:   'The current model: explains the spectra of every element, chemical bonding, orbital shapes (s, p, d, f) and the structure of the periodic table.',
      limit:'There are no defined trajectories — the cloud shows where each electron is likely to be (the drawn boundary holds ~90% probability).'
    }
  };

  function renderModelDetail(key){
    const card = document.getElementById('model-detail');
    const fb = MODEL_DETAIL_FB[key];
    if (!card || !fb) return;
    const T = function(f){ return _atomI18n('atomicModels.detail.' + key + '.' + f, fb[f]); };
    document.getElementById('md-year').textContent  = fb.year;
    document.getElementById('md-who').textContent   = T('who');
    document.getElementById('md-idea').textContent  = T('idea');
    document.getElementById('md-ok').textContent    = T('ok');
    document.getElementById('md-limit').textContent = T('limit');
    document.getElementById('md-ok-label').textContent    = _atomI18n('atomicModels.detail.okLabel', 'What it explained');
    document.getElementById('md-limit-label').textContent = _atomI18n('atomicModels.detail.limitLabel', 'Limitations');
    document.getElementById('md-shells').classList.toggle('on', key === 'quantum');
    // Re-trigger the entrance animation on every switch
    card.classList.remove('show');
    void card.offsetWidth;
    card.classList.add('show');
  }

  window.switchTab = function(tab){
    document.getElementById('panel-atomic').style.display    = tab==='atomic'    ? 'block' : 'none';
    document.getElementById('panel-molecule').style.display  = tab==='molecule'  ? 'block' : 'none';
    document.getElementById('panel-allotrope').style.display = tab==='allotrope' ? 'block' : 'none';
    document.getElementById('mol-legend').style.display      = tab==='molecule'  ? 'block' : 'none';
    const _atomLegend = document.getElementById('atom-legend');
    if (_atomLegend) _atomLegend.style.display = tab==='atomic' ? 'block' : 'none';
    const _modelDetail = document.getElementById('model-detail');
    if (_modelDetail) _modelDetail.style.display = tab==='atomic' ? '' : 'none';
    // Explore button only makes sense for atomic models — hide on other tabs.
    const exploreBtn = document.getElementById('atom-explore-btn');
    if (exploreBtn) exploreBtn.style.display = tab==='atomic' ? 'inline-flex' : 'none';
    document.querySelectorAll('.tab').forEach(el=>{
      el.classList.toggle('active', el.dataset.tab===tab);
    });
    if (tab==='atomic')         setAtomModel(currentAtomModel, true);
    else if (tab==='molecule')  setMolecule(currentMolecule, true);
    else if (tab==='allotrope') setAllotrope(currentAllotrope, true);
  };

  window.setAtomModel = function(key, skipBtnUpdate){
    currentAtomModel = key;
    // Transition animation
    canvas.classList.remove('transitioning');
    void canvas.offsetWidth; // reflow
    canvas.classList.add('transitioning');
    setTimeout(()=>canvas.classList.remove('transitioning'), 400);
    
    // Number of electrons depends on ionic charge: e- = Z - charge (Carbon Z=6)
    let el = 6;
    if (key !== 'dalton') {
      el = Math.max(0, 6 - charge);
    }

    rebuildScene(() => {
      const g = atomicModels[key](el);
      return g;
    });
    // Drop the static data-i18n keys (they point at Bohr, the initial HTML
    // state) so a deferred i18n re-apply can't clobber the JS-set strings —
    // modelMeta getters already return localized text.
    const nameEl = document.getElementById('model-name');
    const descEl = document.getElementById('model-desc');
    nameEl.removeAttribute('data-i18n');
    descEl.removeAttribute('data-i18n');
    nameEl.textContent = modelMeta[key].name;
    descEl.textContent = modelMeta[key].desc;
    // Point the floating Explore button at the active model's dedicated page.
    const exploreBtn = document.getElementById('atom-explore-btn');
    if (exploreBtn) exploreBtn.href = 'atomic-models/' + key;
    // Centered model-name overlay (3D mode): same label format used by the 2D watermark.
    const nameOverlay = document.getElementById('atom-name-3d');
    if (nameOverlay) {
      const labels = _modelLabels();
      nameOverlay.textContent = (labels[key] || key).toUpperCase();
    }
    // Model detail card — appears/re-animates on every switch
    renderModelDetail(key);
    if (!skipBtnUpdate){
      document.querySelectorAll('[data-model]').forEach(b=>b.classList.toggle('active', b.dataset.model===key));
    }
    // Show/hide ion panel based on model
    const ionPanel = document.getElementById('ion-panel');
    if (ionPanel) ionPanel.style.display = (key === 'dalton' || key === 'thomson') ? 'none' : 'flex';
    // Regenerate stable quantum cloud points for any model/charge change
    if (key === 'quantum') regenQuantumPoints();
    update2DPanel(key);
    updateChargeUI();
    if (viewMode === '2d') {
      const tNow = anim2dEnabled ? t : _t2dFrozen;
      draw2DAtomFull(key, tNow);
    }
  };

  window.setMolecule = function(key, skipBtnUpdate){
    currentMolecule = key;
    rebuildScene(() => buildMolecule(key));
    const md = molData[key];
    document.getElementById('model-name').textContent = md.name;
    document.getElementById('model-desc').textContent = md.desc;
    if (!skipBtnUpdate){
      document.querySelectorAll('.mol-btn').forEach(b=>b.classList.toggle('active', b.dataset.mol===key));
    }
  };

  const elementToMolecule = { H:'water',C:'methane',N:'ammonia',O:'water',Na:'nacl',Cl:'hcl',S:'h2so4',P:'h3po4',Fe:'fe2o3' };
  window.setMoleculeByElement = function(elem){
    const molKey = elementToMolecule[elem];
    if (!molKey) return;
    setMolecule(molKey);
    document.querySelectorAll('.mol-elem-btn').forEach(b=>b.classList.toggle('active', b.dataset.elem===elem));
  };

  window.setAlloElement = function(elem){
    const variants = alloElements[elem];
    currentAllotrope = variants[0];
    const container = document.getElementById('allo-variants');
    container.innerHTML = '';
    variants.forEach((v, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'pill purple allo-btn' + (idx===0 ? ' active' : '');
      btn.dataset.allo = v;
      btn.textContent = alloVariantLabels[v];
      btn.onclick = () => setAllotrope(v);
      container.appendChild(btn);
    });
    document.querySelectorAll('.allo-elem-btn').forEach(b=>b.classList.toggle('active', b.dataset.elem===elem));
    setAllotrope(currentAllotrope, true);
  };

  window.setAllotrope = function(key, skipBtnUpdate){
    currentAllotrope = key;
    rebuildScene(() => buildAllotrope(key));
    const meta = alloMeta[key];
    document.getElementById('model-name').textContent = meta.name;
    document.getElementById('model-desc').textContent = meta.desc;
    if (!skipBtnUpdate){
      document.querySelectorAll('.allo-btn').forEach(b=>b.classList.toggle('active', b.dataset.allo===key));
    }
  };

  // ═══════ CONTROLS + LABELS + INFO-META ═══════
  const wrapEl = document.getElementById('canvas-wrap');
  const statusEl = document.getElementById('viewer-status');
  const metaEl = document.getElementById('info-meta');

  function updateInfoMeta(){
    if (!metaEl) return;
    const tab = currentTab;
    if (tab === 'molecule'){
      const atoms = trackedAtoms.length;
      const lAtoms = _atomI18n('atomicModels.meta.atoms', 'atoms');
      const lBonds = _atomI18n('atomicModels.meta.bonds', 'bonds');
      const lGeom  = _atomI18n('atomicModels.meta.geometry', 'geometry');
      metaEl.innerHTML = `<span><b>${atoms}</b> ${lAtoms}</span><span><b>${bondCount}</b> ${lBonds}</span><span>${lGeom} <b>3D</b></span>`;
    } else if (tab === 'atomic'){
      // Quantum model replaces electron meshes with a probability cloud → use logical count
      const isQuantum = currentAtomModel === 'quantum';
      const isDalton  = currentAtomModel === 'dalton';
      const isThomson = currentAtomModel === 'thomson';
      const electronCount = isDalton ? 0
                         : isQuantum  ? Math.max(0, 6 - charge)
                         : isThomson  ? Math.max(0, 6 - charge)
                         : electrons.length;
      const hasNucleus = !isDalton;
      const labelNucleus = _atomI18n('atomicModels.meta.nucleus', 'nucleus');
      const labelNoNucl  = _atomI18n('atomicModels.meta.noNucleus', 'no nucleus');
      const labelElec    = _atomI18n(electronCount === 1 ? 'atomicModels.meta.electron' : 'atomicModels.meta.electrons',
                                     electronCount === 1 ? 'electron' : 'electrons');
      const labelModel   = _atomI18n('atomicModels.meta.modelLabel', 'model');
      metaEl.innerHTML = `<span>${hasNucleus?'<b>1</b> '+labelNucleus:'<i>'+labelNoNucl+'</i>'}</span>` +
        (electronCount?`<span><b>${electronCount}</b> ${labelElec}</span>`:'') +
        `<span>${labelModel} <b>${currentAtomModel}</b></span>`;
    } else {
      metaEl.innerHTML = `<span>${_atomI18n('atomicModels.meta.crystal','crystal structure')} · <b>${currentAllotrope}</b></span>`;
    }
  }

  // Label sprites (texto orbitando os átomos)
  function makeLabelSprite(text){
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const ctx = c.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.font = 'bold 44px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,.95)';
    ctx.lineWidth = 7;
    ctx.strokeText(text, 64, 32);
    ctx.fillStyle = isDark ? '#fff' : '#111';
    ctx.fillText(text, 64, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({map:tex, transparent:true, depthTest:false, depthWrite:false});
    const sp = new THREE.Sprite(mat);
    sp.scale.set(0.85, 0.42, 1);
    sp.renderOrder = 999;
    return sp;
  }

  function refreshLabels(){
    // remove existing label sprites
    trackedAtoms.forEach(a=>{
      if (a.labelSprite){ a.mesh.remove(a.labelSprite); a.labelSprite = null; }
    });
    if (!labelsVisible) return;
    trackedAtoms.forEach(a=>{
      if (!a.label) return;
      const sp = makeLabelSprite(a.label);
      sp.position.set(0, a.radius + 0.42, 0);
      a.mesh.add(sp);
      a.labelSprite = sp;
    });
  }

  // ── State helpers
  function setVcBtn(id, on){
    const b = document.getElementById(id);
    if (b) b.classList.toggle('active', !!on);
  }
  function setStatusBadge(text, show){
    if (!statusEl) return;
    if (text) statusEl.textContent = text;
    statusEl.classList.toggle('show', !!show);
  }

  // ── Public controls
  window.toggleAutoRotate = function(){
    if (staticMode) return;
    autoRotate = !autoRotate;
    updateRotateBtn();
  };

  window.toggleStatic = function(){
    staticMode = !staticMode;
    wrapEl && wrapEl.classList.toggle('static', staticMode);
    setVcBtn('vc-static', staticMode);
    if (staticMode){
      autoRotate = false;
      rotX = (paper() && paper().ATOM_ORBIT_X) || 0.28;
      rotY = (paper() && paper().ATOM_ORBIT_Y) || 0.55;
      camera.position.set(0, paper() ? 0.2 : 0.35, DEFAULT_CAM_Z);
      canvas.style.cursor = 'default';
      canvas.style.cursor = 'default';
      setStatusBadge('Estático', true);
    } else {
      autoRotate = true;
      canvas.style.cursor = 'grab';
      setStatusBadge('', false);
    }
    updateRotateBtn();
  };

  window.resetView = function(){
    if (viewMode === '2d') {
      zoom2d = 1.0;
      pan2d = { x: 0, y: 0 };
      draw2DAtomFull(currentAtomModel);
    } else {
      rotX = (paper() && paper().ATOM_ORBIT_X) || 0.28;
      rotY = (paper() && paper().ATOM_ORBIT_Y) || 0.55;
      camera.position.set(0, paper() ? 0.2 : 0.35, DEFAULT_CAM_Z);
      if (!staticMode){ autoRotate = true; updateRotateBtn(); }
    }
  };

  window.zoomBy = function(direction){
    if (viewMode === '2d') {
      // direction: -1 zoom in, +1 zoom out
      const step = direction === -1 ? 0.15 : -0.15;
      zoom2d = Math.max(0.3, Math.min(4.0, zoom2d + step));
      draw2DAtomFull(currentAtomModel);
    } else {
      // direction: -1 zoom in, +1 zoom out
      const step = direction * 1.1;
      camera.position.z = Math.max(3, Math.min(20, camera.position.z + step));
    }
  };

  window.toggleLabels = function(){
    labelsVisible = !labelsVisible;
    setVcBtn('vc-labels', labelsVisible);
    refreshLabels();
  };

  // ── Show/hide vc-labels button per tab ──
  function updateLabelsBtnVisibility(tab){
    const btn = document.getElementById('vc-labels');
    if (!btn) return;
    // Hide on atomic models (no meaningful labels), keep on molecules/allotropes
    if (tab === 'atomic') {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
      if (!labelsVisible) {
        labelsVisible = true;
        setVcBtn('vc-labels', true);
        refreshLabels();
      }
    }
  }

  // ── Download viewer as PNG — branded composite with header + footer ──
  window.downloadViewer = function(){
    try {
      // Pick the right canvas based on current viewer mode.
      // 3D → WebGL renderer canvas; 2D → the 2D canvas (re-rendered to be current).
      let url;
      if (typeof viewMode !== 'undefined' && viewMode === '2d') {
        if (typeof draw2DAtomFull === 'function' && typeof currentAtomModel !== 'undefined') {
          draw2DAtomFull(currentAtomModel, performance.now() / 1000);
        }
        const src2d = document.getElementById('viewer2d-full');
        url = src2d.toDataURL('image/png');
      } else {
        renderer.render(scene, camera);
        url = renderer.domElement.toDataURL('image/png');
      }
      const img = new Image();
      img.onload = function(){
        // Read current state from the DOM
        const modelNameEl = document.getElementById('model-name');
        const modelDescEl = document.getElementById('model-desc');
        const infoMetaEl  = document.getElementById('info-meta');
        const tabEl       = document.querySelector('.tab.active');
        const fullName    = modelNameEl ? modelNameEl.textContent.trim() : 'Visualizador';
        const desc        = modelDescEl ? modelDescEl.textContent.trim() : '';
        const tabLabel    = tabEl ? tabEl.textContent.trim().replace(/^\d+\s*/, '') : '';
        const meta        = infoMetaEl ? infoMetaEl.textContent.trim().replace(/\s+/g,' · ') : '';
        const dateStr     = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });

        // Composite canvas: header (90px) + viewer (img.height) + footer (84px)
        const HEAD_H = 90;
        const FOOT_H = 84;
        const PAD    = 28;
        const W = img.width;
        const H = img.height + HEAD_H + FOOT_H;

        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');

        // Background — paper cream, matches Lab Console light
        ctx.fillStyle = '#F2EFE7';
        ctx.fillRect(0, 0, W, H);

        // ── HEADER bar
        ctx.fillStyle = '#F8F5EC';
        ctx.fillRect(0, 0, W, HEAD_H);
        // hairline at bottom of header
        ctx.fillStyle = '#D8D2BF';
        ctx.fillRect(0, HEAD_H - 1, W, 1);

        // Logo mark (small dark square + atom glyph)
        const logoSize = 36;
        const logoX = PAD, logoY = (HEAD_H - logoSize) / 2;
        ctx.fillStyle = '#14120E';
        ctx.fillRect(logoX, logoY, logoSize, logoSize);
        // atom glyph (3 ellipses + center dot)
        ctx.save();
        ctx.translate(logoX + logoSize/2, logoY + logoSize/2);
        ctx.strokeStyle = '#DEE9DF';
        ctx.lineWidth = 1.2;
        ctx.fillStyle = '#DEE9DF';
        const rx = 12, ry = 5;
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.rotate((i * 60) * Math.PI / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ATOMURUS title (mono uppercase) + build
        ctx.fillStyle = '#14120E';
        ctx.font = '600 13px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('ATOMURUS', logoX + logoSize + 14, logoY + 12);
        ctx.fillStyle = '#8E8978';
        ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText('3d-viewer · atomurus.com', logoX + logoSize + 14, logoY + 28);

        // Right side: tab + model name
        ctx.textAlign = 'right';
        ctx.fillStyle = '#8E8978';
        ctx.font = '500 10.5px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText((tabLabel || 'VIEWER').toUpperCase(), W - PAD, logoY + 12);
        ctx.fillStyle = '#14120E';
        ctx.font = '600 14px "Inter Tight", system-ui, sans-serif';
        ctx.fillText(fullName, W - PAD, logoY + 30);

        // ── VIEWER image
        ctx.drawImage(img, 0, HEAD_H);

        // ── FOOTER
        const footY = HEAD_H + img.height;
        ctx.fillStyle = '#F8F5EC';
        ctx.fillRect(0, footY, W, FOOT_H);
        ctx.fillStyle = '#D8D2BF';
        ctx.fillRect(0, footY, W, 1);

        // Footer left: description + meta chips
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#58544A';
        ctx.font = '500 12.5px "Inter Tight", system-ui, sans-serif';
        ctx.fillText(desc || '—', PAD, footY + 14);

        // meta chips (e.g. "1 núcleo · 6 elétrons · modelo bohr")
        if (meta) {
          ctx.fillStyle = '#8E8978';
          ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
          // Truncate if too long
          const maxW = W - PAD * 2 - 200;
          let text = meta;
          if (ctx.measureText(text).width > maxW) {
            while (ctx.measureText(text + '…').width > maxW && text.length > 1) text = text.slice(0, -1);
            text += '…';
          }
          ctx.fillText(text, PAD, footY + 38);
        }

        // Footer right: atomurus.com + date
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#1E6A50';
        ctx.font = '600 12.5px "Inter Tight", system-ui, sans-serif';
        ctx.fillText('atomurus.com', W - PAD, footY + 14);
        ctx.fillStyle = '#8E8978';
        ctx.font = '500 10.5px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText(dateStr.toLowerCase(), W - PAD, footY + 36);
        ctx.fillStyle = '#B2AC9C';
        ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText('© ATOMURUS · v1.11', W - PAD, footY + 54);

        // Top corner brackets (lab feel)
        const brkSize = 12, brkW = 1.4, brkM = 16;
        ctx.strokeStyle = '#14120E';
        ctx.lineWidth = brkW;
        // top-left
        ctx.beginPath();
        ctx.moveTo(brkM, brkM + brkSize); ctx.lineTo(brkM, brkM); ctx.lineTo(brkM + brkSize, brkM);
        ctx.stroke();
        // top-right
        ctx.beginPath();
        ctx.moveTo(W - brkM - brkSize, brkM); ctx.lineTo(W - brkM, brkM); ctx.lineTo(W - brkM, brkM + brkSize);
        ctx.stroke();
        // bottom-left
        ctx.beginPath();
        ctx.moveTo(brkM, H - brkM - brkSize); ctx.lineTo(brkM, H - brkM); ctx.lineTo(brkM + brkSize, H - brkM);
        ctx.stroke();
        // bottom-right
        ctx.beginPath();
        ctx.moveTo(W - brkM - brkSize, H - brkM); ctx.lineTo(W - brkM, H - brkM); ctx.lineTo(W - brkM, H - brkM - brkSize);
        ctx.stroke();

        const slug = (window._currentModelName || fullName.toLowerCase()).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
        const a = document.createElement('a');
        a.href = c.toDataURL('image/png');
        a.download = 'atomurus-' + (slug || 'viewer') + '.png';
        a.click();
      };
      img.src = url;
    } catch(e){ console.error(e); }
  };

  window.toggleFullscreen = function(){
    const el = wrapEl || canvas;
    if (!document.fullscreenElement){
      (el.requestFullscreen || el.webkitRequestFullscreen || (()=>{})).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || (()=>{})).call(document);
    }
  };
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function(ev) {
    document.addEventListener(ev, function() {
      setVcBtn('vc-fs', !!document.fullscreenElement);
      setTimeout(resize, 100);
      setTimeout(resize, 350); // segundo resize garante browsers lentos
    });
  });

  // ── Keyboard shortcuts
  window.addEventListener('keydown', e=>{
    if (e.target.matches('input,textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); toggleAutoRotate(); }
    else if (k === 's') toggleStatic();
    else if (k === 'r') resetView();
    else if (k === 'l') toggleLabels();
    else if (k === 'f') toggleFullscreen();
    else if (k === 't') (typeof toggleTheme==='function') && toggleTheme();
    else if (k === '+' || k === '=') zoomBy(-1);
    else if (k === '-' || k === '_') zoomBy(1);
    else if (k === 'c') resetCharge();
    else if (k === '2') setViewerMode(viewMode === '2d' ? '3d' : '2d');
    else if (k === 'p') toggle2DAnim();
  });

  // ── Theme change — redraw labels (colors swap)
  window.addEventListener('atomurus:themechange', ()=>{
    refreshLabels();
    updateRendererBg();
    if (typeof setAtomModel === 'function') setAtomModel(currentAtomModel, true);
  });

  // Track current tab for info-meta
  let currentTab = 'atomic';
  const _origSwitchTab = window.switchTab;
  window.switchTab = function(tab){
    currentTab = tab;
    _origSwitchTab(tab);
    updateInfoMeta();
    updateLabelsBtnVisibility(tab);
  };
  // Initial: atomic tab → hide labels button
  updateLabelsBtnVisibility('atomic');

  // ══════════════════════════════════════════
  // ION STATE SYSTEM — granular charge (Carbon, -4 .. +4)
  // ══════════════════════════════════════════
  let charge = 0;                // numeric ionic charge (positive = cation, negative = anion)
  const CHARGE_MIN = -4, CHARGE_MAX = 4;

  // View mode handling
  let viewMode = '3d';
  const viewer3d    = document.getElementById('viewer3d');
  const viewer2dFull = document.getElementById('viewer2d-full');
  // Full-screen 2D canvas state
  let zoom2d = 1.0;
  let pan2d = { x: 0, y: 0 };
  let dragging2d = false;
  let dragStart = { x: 0, y: 0 };
  let panStart  = { x: 0, y: 0 };

  function changeCharge(delta){
    const next = Math.max(CHARGE_MIN, Math.min(CHARGE_MAX, charge + delta));
    if (next === charge) return;
    charge = next;
    updateChargeUI();
    setAtomModel(currentAtomModel, true);
    updateInfoMeta();
  }
  function resetCharge(){
    if (charge === 0) return;
    charge = 0;
    updateChargeUI();
    setAtomModel(currentAtomModel, true);
    updateInfoMeta();
  }
  // Real ion examples per charge state — pedagogical reference
  // Sources: standard inorganic chemistry textbooks (Atkins, Brown)
  const IONS_BY_CHARGE = {
    '4':  'ex: raro — Ti⁴⁺, Zr⁴⁺, Sn⁴⁺ (estados altos de transição)',
    '3':  'ex: Al³⁺, Fe³⁺, Cr³⁺ (família 13 + metais de transição)',
    '2':  'ex: Mg²⁺, Ca²⁺, Fe²⁺, Zn²⁺, Cu²⁺ (alcalino-terrosos + transição)',
    '1':  'ex: Na⁺, K⁺, H⁺, Li⁺, Ag⁺ (alcalinos + hidrogênio + prata)',
    '0':  'qualquer átomo neutro — nº de prótons = nº de elétrons',
    '-1': 'ex: F⁻, Cl⁻, Br⁻, I⁻, OH⁻ (halogênios + hidróxido)',
    '-2': 'ex: O²⁻, S²⁻, Se²⁻ (calcogênios, óxidos e sulfetos)',
    '-3': 'ex: N³⁻, P³⁻ (família do nitrogênio em nitretos/fosfetos)',
    '-4': 'ex: raro — C⁴⁻, Si⁴⁻ (carbetos/silicetos iônicos)'
  };

  function updateChargeUI(){
    const valEl    = document.getElementById('charge-val');
    const badge    = document.getElementById('ion-badge');
    const btnUp    = document.getElementById('charge-up');
    const btnDown  = document.getElementById('charge-down');
    const eCountEl = document.getElementById('ion-ecount');
    const actionEl = document.getElementById('ion-action');
    const exEl     = document.getElementById('ion-examples');

    if (valEl)   valEl.textContent = charge > 0 ? ('+' + charge) : ('' + charge);
    if (btnUp)   btnUp.disabled   = charge >= CHARGE_MAX;
    if (btnDown) btnDown.disabled = charge <= CHARGE_MIN;

    // Main badge — abstract (no element symbol). Pulls labels from I18N.
    let cls;
    const tr = _atomI18n;
    if (charge === 0){
      if (badge) badge.textContent = tr('atomicModels.ion.badgeNeutral','NEUTRAL');
      cls = 'neutral';
    } else if (charge > 0){
      if (badge) badge.textContent = tr('atomicModels.ion.badgeCation','CATION') + ' ' + charge + '+';
      cls = 'cation';
    } else {
      if (badge) badge.textContent = tr('atomicModels.ion.badgeAnion','ANION') + ' ' + Math.abs(charge) + '−';
      cls = 'anion';
    }
    if (badge) badge.className = 'ion-badge ' + cls;

    // Educational sub-line — also i18n-aware
    const electrons = Math.max(0, 6 - charge);
    if (eCountEl) eCountEl.textContent = electrons + ' e⁻';
    if (actionEl){
      let txt;
      if (charge === 0) {
        txt = tr('atomicModels.ion.neutralAtom','neutral atom');
      } else if (charge > 0) {
        const n = charge;
        const tpl = tr(n === 1 ? 'atomicModels.ion.lostElectron' : 'atomicModels.ion.lostElectrons',
                       n === 1 ? 'lost {n} electron' : 'lost {n} electrons');
        txt = tpl.replace('{n}', n) + ' ' + tr('atomicModels.ion.positiveCharge','(positive charge)');
      } else {
        const n = Math.abs(charge);
        const tpl = tr(n === 1 ? 'atomicModels.ion.gainedElectron' : 'atomicModels.ion.gainedElectrons',
                       n === 1 ? 'gained {n} electron' : 'gained {n} electrons');
        txt = tpl.replace('{n}', n) + ' ' + tr('atomicModels.ion.negativeCharge','(negative charge)');
      }
      actionEl.textContent = txt;
      actionEl.className = 'ion-action ' + cls;
    }
    if (exEl){
      const key = charge >= 0 ? String(charge) : ('n' + Math.abs(charge));
      const adj = charge > 0 ? 'p' + charge : key;
      exEl.textContent = tr('atomicModels.ion.examples.' + adj, IONS_BY_CHARGE[String(charge)] || '');
    }
  }
  window.changeCharge = changeCharge;
  window.resetCharge  = resetCharge;

  // ══════════════════════════════════════════
  // 2D ATOMIC DIAGRAM PANEL
  // ══════════════════════════════════════════
  const p2dCanvas = document.getElementById('p2d-canvas');
  const p2dCtx = p2dCanvas ? p2dCanvas.getContext('2d') : null;
  let p2dVisible = true;
  let p2dLocked = false;

  // Sync the mini 2D canvas pixel size with its CSS size (DPR-aware, sharp)
  function resize2dMini(){
    if (!p2dCanvas) return;
    const cssW = p2dCanvas.clientWidth  || 220;
    const cssH = p2dCanvas.clientHeight || 180;
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    const needsResize = p2dCanvas.width !== Math.round(cssW * dpr) || p2dCanvas.height !== Math.round(cssH * dpr);
    if (needsResize) {
      p2dCanvas.width  = Math.round(cssW * dpr);
      p2dCanvas.height = Math.round(cssH * dpr);
      if (p2dCtx) p2dCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function draw2DAtom(modelKey, time){
    if (!p2dCtx) return;
    resize2dMini();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = p2dCanvas.width / dpr, H = p2dCanvas.height / dpr;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    p2dCtx.clearRect(0, 0, W, H);
    // Background
    p2dCtx.fillStyle = paper() ? paper().fillCss() : (isDark ? '#0E0D0C' : '#F2EFE7');
    p2dCtx.fillRect(0, 0, W, H);

    const tt = (typeof time === 'number') ? time : 0;
    const cx = W / 2, cy = H / 2;
    const colors = {
      proton: paper() ? '#C45C4A' : '#e53935',
      neutron: paper() ? '#1E6A50' : '#43a047',
      electron: paper() ? (isDark ? '#E8E2D4' : '#14120E') : '#1e88e5',
      orbit: paper() ? (isDark ? 'rgba(42,107,85,0.7)' : 'rgba(30,106,80,0.55)') : (isDark ? 'rgba(200,220,240,0.55)' : 'rgba(80,120,180,0.45)'),
      nucleus: isDark ? 'rgba(196,92,74,0.2)' : 'rgba(196,92,74,0.1)',
      mark: paper() ? (isDark ? '#14120E' : '#F2EFE7') : '#fff',
      text: isDark ? '#c0c0c0' : '#333333'
    };

    function drawOrbit(r, dashed = false) {
      p2dCtx.beginPath();
      p2dCtx.arc(cx, cy, r, 0, Math.PI * 2);
      p2dCtx.strokeStyle = colors.orbit;
      p2dCtx.lineWidth = 1.2;
      if (dashed) p2dCtx.setLineDash([4, 4]);
      else p2dCtx.setLineDash([]);
      p2dCtx.stroke();
      p2dCtx.setLineDash([]);
    }

    function drawElectron(x, y, label = '−') {
      p2dCtx.beginPath();
      p2dCtx.arc(x, y, 7, 0, Math.PI * 2);
      p2dCtx.fillStyle = colors.electron;
      p2dCtx.fill();
      p2dCtx.fillStyle = colors.mark;
      p2dCtx.font = 'bold 9px monospace';
      p2dCtx.textAlign = 'center';
      p2dCtx.textBaseline = 'middle';
      p2dCtx.fillText(label, x, y + 0.5);
    }

    function placeOnOrbit(r, count, startAngle, animSpeed) {
      if (count <= 0) return;
      const a0 = (startAngle == null) ? -Math.PI / 2 : startAngle;
      const sp = (animSpeed == null) ? 0.9 : animSpeed;
      const offset = tt * sp;
      for (let i = 0; i < count; i++) {
        const a = a0 + offset + (i / count) * Math.PI * 2;
        drawElectron(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
    }
    function placeOnEllipse(rx, ry, count, rot, animSpeed) {
      if (count <= 0) return;
      const sp = (animSpeed == null) ? 0.9 : animSpeed;
      const offset = tt * sp;
      for (let i = 0; i < count; i++) {
        const a = offset + (i / count) * Math.PI * 2;
        const lx = rx * Math.cos(a), ly = ry * Math.sin(a);
        const ex = lx * Math.cos(rot) - ly * Math.sin(rot);
        const ey = lx * Math.sin(rot) + ly * Math.cos(rot);
        drawElectron(cx + ex, cy + ey);
      }
    }

    function drawNucleus(zP, nP) {
      // Soft glow halo
      const grad = p2dCtx.createRadialGradient(cx, cy, 0, cx, cy, 26);
      grad.addColorStop(0, colors.proton + '55');
      grad.addColorStop(1, 'transparent');
      p2dCtx.beginPath();
      p2dCtx.arc(cx, cy, 26, 0, Math.PI * 2);
      p2dCtx.fillStyle = grad;
      p2dCtx.fill();

      // 2D Fibonacci packing with interleaved protons/neutrons
      const order = buildNucleonOrder(zP, nP);
      const total = order.length;
      const golden = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
      const maxR = 14;
      const partR = 5;
      for (let i = 0; i < total; i++) {
        const a = i * golden;
        const r = Math.sqrt((i + 0.5) / total) * maxR;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        const isP = order[i] === 'p';
        p2dCtx.beginPath();
        p2dCtx.arc(px, py, partR, 0, Math.PI * 2);
        p2dCtx.fillStyle = isP ? colors.proton : colors.neutron;
        p2dCtx.fill();
        p2dCtx.strokeStyle = 'rgba(255,255,255,0.22)';
        p2dCtx.lineWidth = 0.6;
        p2dCtx.stroke();
        if (isP) {
          p2dCtx.fillStyle = '#fff';
          p2dCtx.font = 'bold 7px monospace';
          p2dCtx.textAlign = 'center';
          p2dCtx.textBaseline = 'middle';
          p2dCtx.fillText('+', px, py + 0.5);
        }
      }
    }

    // Draw model-specific 2D diagram
    if (modelKey === 'dalton') {
      // Solid indivisible sphere — abstract atom (no element label)
      const grad = p2dCtx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, 60);
      grad.addColorStop(0, '#c8a880'); grad.addColorStop(1, '#7a5c38');
      p2dCtx.beginPath(); p2dCtx.arc(cx, cy, 60, 0, Math.PI * 2);
      p2dCtx.fillStyle = grad; p2dCtx.fill();
      // Subtle highlight only — no element symbol since model is abstract
      p2dCtx.beginPath();
      p2dCtx.arc(cx - 14, cy - 16, 14, 0, Math.PI * 2);
      p2dCtx.fillStyle = 'rgba(255,255,255,0.10)';
      p2dCtx.fill();

    } else if (modelKey === 'thomson') {
      // Pudding sphere
      p2dCtx.beginPath(); p2dCtx.arc(cx, cy, 70, 0, Math.PI * 2);
      p2dCtx.fillStyle = isDark ? 'rgba(255,150,100,0.18)' : 'rgba(255,150,100,0.22)';
      p2dCtx.fill();
      p2dCtx.strokeStyle = isDark ? 'rgba(255,120,80,0.4)' : 'rgba(200,80,50,0.35)';
      p2dCtx.lineWidth = 1.5; p2dCtx.stroke();
      [[0.8,0.5],[-.9,0.2],[0.2,-1.1],[-.4,.9],[1.0,-.3],[-.7,-.8]].forEach(([dx,dy]) => {
        drawElectron(cx + dx * 55, cy + dy * 55);
      });

    } else if (modelKey === 'rutherford') {
      // 3 elliptic orbits at distinct rotations (planetary look)
      const ellipses = [
        { rx: 60, ry: 30, rot:  Math.PI / 7,   sp: 0.42 },
        { rx: 60, ry: 30, rot: -Math.PI / 4.5, sp: 0.32 },
        { rx: 60, ry: 30, rot:  Math.PI / 2.2, sp: 0.24 }
      ];
      const totalE = Math.max(0, 6 - charge);
      const per = Math.ceil(totalE / 3);
      ellipses.forEach((o, oi) => {
        p2dCtx.save();
        p2dCtx.translate(cx, cy); p2dCtx.rotate(o.rot);
        p2dCtx.beginPath(); p2dCtx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI*2);
        p2dCtx.strokeStyle = colors.orbit; p2dCtx.lineWidth = 1.2; p2dCtx.stroke();
        p2dCtx.restore();
        const cnt = Math.min(per, Math.max(0, totalE - oi*per));
        placeOnEllipse(o.rx, o.ry, cnt, o.rot, o.sp);
      });
      drawNucleus(6, 6);

    } else if (modelKey === 'bohr') {
      const totalE = Math.max(0, 6 - charge);
      const k = Math.min(2, totalE);
      const l = Math.min(8, Math.max(0, totalE - 2));
      const m = Math.max(0, totalE - 10);
      drawOrbit(42);
      if (l > 0 || m > 0) drawOrbit(80);
      if (m > 0) drawOrbit(118, true);
      drawNucleus(6, 6);
      placeOnOrbit(42,  k, -Math.PI/2, 0.55);
      if (l > 0) placeOnOrbit(80,  l, -Math.PI/2, 0.35);
      if (m > 0) placeOnOrbit(118, m, -Math.PI/2, 0.25);

    } else if (modelKey === 'quantum') {
      // Stable cached subshell clouds (1s/2s/2p) — drift rotation only
      if (!_quantumMiniPts) regenQuantumPoints();
      const driftA = tt * 0.06;
      const pts = _quantumMiniPts;
      const shellCol = _qShellColors2D(isDark);
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        const a = pt.a + driftA;
        p2dCtx.beginPath();
        p2dCtx.arc(cx + Math.cos(a) * pt.r, cy + Math.sin(a) * pt.r, pt.sz, 0, Math.PI*2);
        p2dCtx.fillStyle = 'rgba(' + (shellCol[pt.k] || shellCol.p) + ',' + pt.op.toFixed(2) + ')';
        p2dCtx.fill();
      }
      drawNucleus(6, 6);
    }

    // Label
    const labelMap = _modelLabels();
    const el2d = document.getElementById('p2d-label');
    if (el2d) el2d.textContent = labelMap[modelKey] || modelKey;
  }

  function update2DPanel(modelKey) {
    if (p2dCtx) {
      // Small delay to let theme re-apply
      setTimeout(() => {
        const tNow = anim2dEnabled ? t : _t2dFrozen;
        draw2DAtom(modelKey || currentAtomModel, tNow);
      }, 30);
    }
  }

  // ══════════════════════════════════════════
  // FULL-SCREEN 2D VIEWER MODE
  // ══════════════════════════════════════════
  const view2dCanvas = viewer2dFull;
  const view2dCtx    = view2dCanvas ? view2dCanvas.getContext('2d') : null;

  function resize2dFull(){
    if (!view2dCanvas) return;
    const wrap = document.getElementById('canvas-wrap');
    const w = (wrap && wrap.clientWidth) || view2dCanvas.clientWidth || (canvas.clientWidth || 800);
    const h = (wrap && wrap.clientHeight) || view2dCanvas.clientHeight || canvas.clientHeight || 460;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    view2dCanvas.width  = Math.max(1, w) * dpr;
    view2dCanvas.height = Math.max(1, h) * dpr;
    view2dCanvas.style.width  = '100%';
    view2dCanvas.style.height = Math.max(1, h) + 'px';
    if (view2dCtx) view2dCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw2DAtomFull(modelKey, time){
    if (!view2dCtx || viewMode !== '2d') return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = view2dCanvas.width  / dpr;
    const H = view2dCanvas.height / dpr;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    view2dCtx.clearRect(0, 0, W, H);
    view2dCtx.fillStyle = paper() ? paper().fillCss() : (isDark ? '#0E0D0C' : '#F2EFE7');
    view2dCtx.fillRect(0, 0, W, H);

    const tt = (typeof time === 'number') ? time : 0;
    const cx = W / 2 + pan2d.x;
    const cy = H / 2 + pan2d.y;
    const z  = zoom2d;

    const colors = {
      proton: paper() ? '#C45C4A' : '#e53935',
      neutron: paper() ? '#1E6A50' : '#43a047',
      electron: paper() ? (isDark ? '#E8E2D4' : '#14120E') : '#1e88e5',
      orbit: paper() ? (isDark ? 'rgba(42,107,85,0.7)' : 'rgba(30,106,80,0.55)') : (isDark ? 'rgba(200,220,240,0.55)' : 'rgba(80,120,180,0.45)'),
      mark: paper() ? (isDark ? '#14120E' : '#F2EFE7') : '#fff',
      text: isDark ? '#c0c0c0' : '#333333'
    };

    function drawOrbit(r, dashed){
      view2dCtx.beginPath();
      view2dCtx.arc(cx, cy, r * z, 0, Math.PI * 2);
      view2dCtx.strokeStyle = colors.orbit;
      view2dCtx.lineWidth = 1.4;
      view2dCtx.setLineDash(dashed ? [6, 6] : []);
      view2dCtx.stroke();
      view2dCtx.setLineDash([]);
    }
    function drawElectron(x, y){
      const er = 9 * z;
      view2dCtx.beginPath();
      view2dCtx.arc(x, y, er, 0, Math.PI * 2);
      view2dCtx.fillStyle = colors.electron;
      view2dCtx.fill();
      view2dCtx.fillStyle = colors.mark;
      view2dCtx.font = 'bold ' + Math.max(8, 11 * z) + 'px "DM Mono", monospace';
      view2dCtx.textAlign = 'center';
      view2dCtx.textBaseline = 'middle';
      view2dCtx.fillText('−', x, y + 0.5);
    }
    function placeOnOrbit(r, count, startAngle, animSpeed){
      if (count <= 0) return;
      const a0 = (startAngle == null) ? -Math.PI/2 : startAngle;
      const sp = (animSpeed == null) ? 0.9 : animSpeed;
      const offset = tt * sp;
      for (let i = 0; i < count; i++){
        const a = a0 + offset + (i / count) * Math.PI * 2;
        drawElectron(cx + Math.cos(a) * r * z, cy + Math.sin(a) * r * z);
      }
    }
    function placeOnEllipse(rx, ry, count, rot, animSpeed){
      if (count <= 0) return;
      const sp = (animSpeed == null) ? 0.9 : animSpeed;
      const offset = tt * sp;
      for (let i = 0; i < count; i++){
        const a = offset + (i / count) * Math.PI * 2;
        const lx = rx * Math.cos(a), ly = ry * Math.sin(a);
        const ex = lx * Math.cos(rot) - ly * Math.sin(rot);
        const ey = lx * Math.sin(rot) + ly * Math.cos(rot);
        drawElectron(cx + ex * z, cy + ey * z);
      }
    }
    function drawNucleus(zP, nP){
      const order = buildNucleonOrder(zP, nP);
      const total = order.length;
      // Soft glow halo
      const haloR = 40 * z;
      const grad = view2dCtx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
      grad.addColorStop(0, colors.proton + '60');
      grad.addColorStop(1, 'transparent');
      view2dCtx.beginPath(); view2dCtx.arc(cx, cy, haloR, 0, Math.PI*2);
      view2dCtx.fillStyle = grad; view2dCtx.fill();

      // 2D Fibonacci packing — interleaved protons/neutrons, well-separated
      const golden = Math.PI * (3 - Math.sqrt(5));
      const maxR  = 22 * z;
      const partR = 8  * z;
      for (let i = 0; i < total; i++){
        const a = i * golden;
        const r = Math.sqrt((i + 0.5) / total) * maxR;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        const isP = order[i] === 'p';
        view2dCtx.beginPath(); view2dCtx.arc(px, py, partR, 0, Math.PI*2);
        view2dCtx.fillStyle = isP ? colors.proton : colors.neutron;
        view2dCtx.fill();
        view2dCtx.strokeStyle = 'rgba(255,255,255,0.22)';
        view2dCtx.lineWidth = 0.8;
        view2dCtx.stroke();
        if (isP){
          view2dCtx.fillStyle = '#fff';
          view2dCtx.font = 'bold ' + Math.max(7, 10 * z) + 'px "DM Mono", monospace';
          view2dCtx.textAlign = 'center'; view2dCtx.textBaseline = 'middle';
          view2dCtx.fillText('+', px, py + 0.5);
        }
      }
    }

    const totalE = Math.max(0, 6 - charge);

    if (modelKey === 'dalton'){
      // Solid indivisible sphere — abstract atom (no element label)
      const grad = view2dCtx.createRadialGradient(cx - 20*z, cy - 20*z, 6*z, cx, cy, 100*z);
      grad.addColorStop(0, '#c8a880'); grad.addColorStop(1, '#7a5c38');
      view2dCtx.beginPath(); view2dCtx.arc(cx, cy, 100*z, 0, Math.PI*2);
      view2dCtx.fillStyle = grad; view2dCtx.fill();
      // Subtle highlight only — no element symbol since model is abstract
      view2dCtx.beginPath();
      view2dCtx.arc(cx - 24*z, cy - 28*z, 24*z, 0, Math.PI*2);
      view2dCtx.fillStyle = 'rgba(255,255,255,0.10)';
      view2dCtx.fill();

    } else if (modelKey === 'thomson'){
      view2dCtx.beginPath(); view2dCtx.arc(cx, cy, 115*z, 0, Math.PI*2);
      view2dCtx.fillStyle = isDark ? 'rgba(255,150,100,0.18)' : 'rgba(255,150,100,0.22)';
      view2dCtx.fill();
      view2dCtx.strokeStyle = isDark ? 'rgba(255,120,80,0.4)' : 'rgba(200,80,50,0.35)';
      view2dCtx.lineWidth = 2; view2dCtx.stroke();
      const pts = [[0.8,0.5],[-.9,0.2],[0.2,-1.1],[-.4,.9],[1.0,-.3],[-.7,-.8],[0.5,-0.6],[-0.3,-0.4]];
      for (let i = 0; i < Math.min(totalE, pts.length); i++){
        const [dx, dy] = pts[i];
        drawElectron(cx + dx * 90 * z, cy + dy * 90 * z);
      }

    } else if (modelKey === 'rutherford'){
      // Three elliptic orbits, tilted at distinct angles
      const ellipses = [
        { rx: 110, ry: 55, rot:  Math.PI/7,    sp: 0.42 },
        { rx: 110, ry: 55, rot: -Math.PI/4.5,  sp: 0.32 },
        { rx: 110, ry: 55, rot:  Math.PI/2.2,  sp: 0.24 }
      ];
      const per = Math.ceil(totalE / 3);
      ellipses.forEach((o, oi) => {
        view2dCtx.save();
        view2dCtx.translate(cx, cy); view2dCtx.rotate(o.rot); view2dCtx.scale(z, z);
        view2dCtx.beginPath(); view2dCtx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI*2);
        view2dCtx.strokeStyle = colors.orbit; view2dCtx.lineWidth = 1.4 / z; view2dCtx.stroke();
        view2dCtx.restore();
        const cnt = Math.min(per, Math.max(0, totalE - oi*per));
        placeOnEllipse(o.rx, o.ry, cnt, o.rot, o.sp);
      });
      drawNucleus(6, 6);

    } else if (modelKey === 'bohr'){
      const k = Math.min(2, totalE);
      const l = Math.min(8, Math.max(0, totalE - 2));
      const m = Math.max(0, totalE - 10);
      drawOrbit(68);
      if (l > 0 || m > 0) drawOrbit(128);
      if (m > 0) drawOrbit(180, true);
      drawNucleus(6, 6);
      placeOnOrbit(68,  k, -Math.PI/2, 0.55);
      if (l > 0) placeOnOrbit(128, l, -Math.PI/2, 0.35);
      if (m > 0) placeOnOrbit(180, m, -Math.PI/2, 0.25);

    } else if (modelKey === 'quantum'){
      // Stable cached subshell clouds (1s/2s/2p), slow drift rotation
      if (!_quantumFullPts) regenQuantumPoints();
      const shellCol = _qShellColors2D(isDark);
      const driftA = tt * 0.06;
      const pts = _quantumFullPts;
      for (let i = 0; i < pts.length; i++){
        const pt = pts[i];
        const a = pt.a + driftA;
        view2dCtx.beginPath();
        view2dCtx.arc(cx + Math.cos(a) * pt.r * z, cy + Math.sin(a) * pt.r * z, pt.sz, 0, Math.PI*2);
        view2dCtx.fillStyle = 'rgba(' + (shellCol[pt.k] || shellCol.p) + ',' + pt.op.toFixed(2) + ')';
        view2dCtx.fill();
      }
      drawNucleus(6, 6);
    }

    // Footer caption
    const labelMap = _modelLabels();
    view2dCtx.fillStyle = isDark ? 'rgba(255,255,255,.42)' : 'rgba(0,0,0,.38)';
    view2dCtx.font = '500 11px "DM Mono", monospace';
    view2dCtx.textAlign = 'center'; view2dCtx.textBaseline = 'bottom';
    view2dCtx.fillText((labelMap[modelKey] || modelKey).toUpperCase(), W / 2, H - 12);
  }
  window.draw2DAtomFull = draw2DAtomFull;

  let _staticRendered = false;
  window.setViewerMode = function(mode){
    if (mode !== '2d' && mode !== '3d') return;
    viewMode = mode;
    const is3d = mode === '3d';
    const wrap = document.getElementById('canvas-wrap');
    if (wrap) wrap.classList.toggle('is-2d', !is3d);
    if (viewer3d) {
      viewer3d.style.visibility = 'visible';
      viewer3d.style.pointerEvents = is3d ? 'auto' : 'none';
    }
    if (viewer2dFull) {
      viewer2dFull.style.visibility = is3d ? 'hidden' : 'visible';
      viewer2dFull.style.pointerEvents = is3d ? 'none' : 'auto';
    }
    // Centered model-name overlay belongs only to 3D (in 2D the watermark is painted on the canvas).
    const _nameOv = document.getElementById('atom-name-3d');
    if (_nameOv) _nameOv.style.display = is3d ? 'block' : 'none';
    // "Animate 2D" button is meaningless in 3D — hide it there.
    const _play2d = document.getElementById('vc-2d-play');
    if (_play2d) _play2d.style.display = is3d ? 'none' : 'inline-flex';
    // Toggle button highlight
    const b3 = document.getElementById('mode-btn-3d');
    const b2 = document.getElementById('mode-btn-2d');
    if (b3) {
      b3.classList.toggle('active', is3d);
      b3.setAttribute('aria-pressed', is3d ? 'true' : 'false');
    }
    if (b2) {
      b2.classList.toggle('active', !is3d);
      b2.setAttribute('aria-pressed', is3d ? 'false' : 'true');
    }
    // Hide 3D-only controls in 2D mode (rotate / static / labels / fullscreen / download still useful)
    const rotBtn = document.getElementById('vc-rotate');
    const staBtn = document.getElementById('vc-static');
    if (rotBtn) rotBtn.style.display = is3d ? '' : 'none';
    if (staBtn) staBtn.style.display = is3d ? '' : 'none';
    if (!is3d){
      resize2dFull();
      draw2DAtomFull(currentAtomModel);
    } else {
      _staticRendered = false;
      resize();
      renderer.render(scene, camera);
    }
  };

  // 2D pan + zoom interaction
  if (view2dCanvas){
    view2dCanvas.addEventListener('mousedown', e => {
      if (viewMode !== '2d') return;
      dragging2d = true;
      dragStart = { x: e.clientX, y: e.clientY };
      panStart  = { x: pan2d.x,   y: pan2d.y   };
      view2dCanvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if (!dragging2d) return;
      pan2d.x = panStart.x + (e.clientX - dragStart.x);
      pan2d.y = panStart.y + (e.clientY - dragStart.y);
      draw2DAtomFull(currentAtomModel);
    });
    window.addEventListener('mouseup', () => {
      if (!dragging2d) return;
      dragging2d = false;
      view2dCanvas.style.cursor = 'grab';
    });
    view2dCanvas.addEventListener('wheel', e => {
      if (viewMode !== '2d') return;
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.12 : 0.12;
      zoom2d = Math.max(0.3, Math.min(4.0, zoom2d + step));
      draw2DAtomFull(currentAtomModel);
    }, { passive: false });
    // Touch pan
    let t2dLastX = 0, t2dLastY = 0;
    view2dCanvas.addEventListener('touchstart', e => {
      if (viewMode !== '2d' || !e.touches.length) return;
      t2dLastX = e.touches[0].clientX;
      t2dLastY = e.touches[0].clientY;
    });
    view2dCanvas.addEventListener('touchmove', e => {
      if (viewMode !== '2d' || !e.touches.length) return;
      pan2d.x += (e.touches[0].clientX - t2dLastX);
      pan2d.y += (e.touches[0].clientY - t2dLastY);
      t2dLastX = e.touches[0].clientX;
      t2dLastY = e.touches[0].clientY;
      draw2DAtomFull(currentAtomModel);
      e.preventDefault();
    }, { passive: false });
  }

  // Resize handler for 2D
  window.addEventListener('resize', () => { if (viewMode === '2d') { resize2dFull(); draw2DAtomFull(currentAtomModel); } });
  // Redraw 2D on theme change
  window.addEventListener('atomurus:themechange', () => { if (viewMode === '2d') draw2DAtomFull(currentAtomModel); });

  window.toggle2DPanel = function(){
    const panel = document.getElementById('panel2d');
    if (!panel) return;
    p2dVisible = !p2dVisible;
    panel.style.display = p2dVisible ? 'block' : 'none';
    setVcBtn('vc-2d', p2dVisible);
  };

  function toggle2DLock(){
    p2dLocked = !p2dLocked;
    const panel = document.getElementById('panel2d');
    const btn = document.getElementById('p2d-lock');
    if (panel) panel.classList.toggle('locked', p2dLocked);
    if (btn) btn.classList.toggle('locked', p2dLocked);
  }
  window.toggle2DLock = toggle2DLock;

  // Draggable 2D panel
  (function(){
    const panel = document.getElementById('panel2d');
    const header = document.getElementById('p2d-header');
    if (!panel || !header) return;
    let dragging = false, ox = 0, oy = 0, px2 = 0, py2 = 0;
    // Set initial position (fixed, bottom-right is already in CSS)
    panel.style.position = 'fixed';

    header.addEventListener('mousedown', e => {
      if (p2dLocked) return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      ox = e.clientX - rect.left; oy = e.clientY - rect.top;
      px2 = rect.left; py2 = rect.top;
      header.classList.add('dragging');
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
      panel.style.left = rect.left + 'px'; panel.style.top = rect.top + 'px';
    });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      panel.style.left = (e.clientX - ox) + 'px';
      panel.style.top  = (e.clientY - oy) + 'px';
    });
    window.addEventListener('mouseup', () => { dragging = false; header.classList.remove('dragging'); });
  })();

  // Redraw 2D on theme change
  window.addEventListener('atomurus:themechange', () => {
    update2DPanel(currentAtomModel);
  });

  // ════════════════════════════════
  let _docHidden = false;
  document.addEventListener('visibilitychange', function(){
    _docHidden = document.hidden;
  });

  // wrap setters so info-meta + labels refresh after each rebuild
  const _origSetAtomModel = window.setAtomModel;
  window.setAtomModel = function(k, skip){ _origSetAtomModel(k, skip); refreshLabels(); updateInfoMeta(); };
  const _origSetMolecule = window.setMolecule;
  window.setMolecule = function(k, skip){ _origSetMolecule(k, skip); refreshLabels(); updateInfoMeta(); };
  const _origSetAllotrope = window.setAllotrope;
  window.setAllotrope = function(k, skip){ _origSetAllotrope(k, skip); refreshLabels(); updateInfoMeta(); };

  // Sub data-strip — update on every state change
  function updateSubstrip(){
    const elT = document.getElementById('av-tab');
    const elM = document.getElementById('av-model');
    const elE = document.getElementById('av-element');
    if (!elT) return;
    const tabLabels = { atomic:'atomic-models', molecule:'3d-molecules', allotrope:'allotropes' };
    elT.textContent = tabLabels[currentTab] || currentTab;
    const name = (document.getElementById('model-name') || {}).textContent || '';
    // Substrip key/value depends on current tab — use known state keys, not text parsing
    if (currentTab === 'atomic') {
      elM.textContent = currentAtomModel;
      // All five historical models render the same reference atom: carbon-12
      elE.textContent = _atomI18n('atomicModels.avContextVal', 'reference: carbon-12 (Z = 6)');
    } else if (currentTab === 'molecule') {
      elM.textContent = currentMolecule;
      const md = molData[currentMolecule];
      elE.textContent = md ? md.name : '—';
    } else if (currentTab === 'allotrope') {
      elM.textContent = currentAllotrope;
      const meta = alloMeta[currentAllotrope];
      elE.textContent = meta ? meta.name : '—';
    } else {
      elM.textContent = name.toLowerCase();
      elE.textContent = '—';
    }
  }
  // Hook into the existing wrappers we just defined
  const _hookSwitch = window.switchTab;
  window.switchTab = function(tab){ _hookSwitch(tab); updateSubstrip(); };
  const _hookAtom = window.setAtomModel;
  window.setAtomModel = function(k, skip){ _hookAtom(k, skip); updateSubstrip(); };
  const _hookMol = window.setMolecule;
  window.setMolecule = function(k, skip){ _hookMol(k, skip); updateSubstrip(); };
  const _hookAllo = window.setAllotrope;
  window.setAllotrope = function(k, skip){ _hookAllo(k, skip); updateSubstrip(); };

  // Init — honor ?model=X query param if present, otherwise default to bohr.
  const _validModels = ['dalton','thomson','rutherford','bohr','quantum'];
  const _initModel = (window.__ATOM_INIT_MODEL && _validModels.indexOf(window.__ATOM_INIT_MODEL) !== -1)
                       ? window.__ATOM_INIT_MODEL : 'bohr';
  setAtomModel(_initModel, true);
  setAlloElement('carbon');
  setAtomModel(_initModel, true);  // back to atomic tab default
  updateInfoMeta();
  updateSubstrip();
  update2DPanel(_initModel);
  updateChargeUI();              // sync new ionic counter
  setVcBtn('vc-2d', true);       // 2D panel starts visible
  if (viewer2dFull) viewer2dFull.style.cursor = 'grab';
  resize2dFull();                // size the 2D full canvas eagerly

  // Re-render dynamic JS-driven strings (info-bar, ion-panel, meta) when
  // the user toggles language. Retries until I18N is loaded (deferred script).
  (function _wireAtomI18n(){
    if (window.I18N && window.I18N.onChange) {
      // I18N loads deferred — re-render the JS-driven strings (info-bar,
      // detail card, meta, substrip) once it's available, not only on change.
      if (currentTab === 'atomic' && currentAtomModel) window.setAtomModel(currentAtomModel, true);
      updateInfoMeta();
      updateSubstrip();
      window.I18N.onChange(function(){
        if (currentTab === 'atomic' && currentAtomModel) {
          // Re-run model-driven render (updates name/desc via I18N getters)
          const nameEl = document.getElementById('model-name');
          const descEl = document.getElementById('model-desc');
          if (nameEl) nameEl.textContent = modelMeta[currentAtomModel].name;
          if (descEl) descEl.textContent = modelMeta[currentAtomModel].desc;
          // Re-render the centered overlay (BOHR · 1913, etc.)
          if (typeof setAtomModel === 'function') setAtomModel(currentAtomModel, true);
        }
        updateChargeUI();
        updateInfoMeta();
      });
    } else {
      setTimeout(_wireAtomI18n, 50);
    }
  })();

  // Resize
  function resize(){
    const wrap = document.getElementById('canvas-wrap');
    const w = (wrap && wrap.clientWidth) || canvas.clientWidth || 800;
    const h = (wrap && wrap.clientHeight) || canvas.clientHeight || 460;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();
  // Force a delayed resize after embed-mode CSS has been applied & layout has settled
  // (iframes can mis-measure on first paint).
  if (document.documentElement.classList.contains('embed-mode')) {
    setTimeout(resize, 80);
    setTimeout(resize, 250);
    setTimeout(() => { resize(); resize2dFull(); }, 600);
  }

  // Reusable Euler for elliptic-orbit positioning (avoid GC)
  const _orbitEuler = new THREE.Euler();
  const _orbitVec   = new THREE.Vector3();

  // Render loop — 3D + 2D animation, rotation inertia
  let t = 0;
  function tickFrame(){
    if (_docHidden) return;
    if (viewMode === '2d') {
      if (currentTab === 'atomic') drive2D();
      return;
    }

    if (!isDragging && (Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4)) {
      rotY += rotVelY;
      rotX += rotVelX;
      rotVelX *= ROT_DAMPING;
      rotVelY *= ROT_DAMPING;
    }

    if (staticMode) {
      if (!_staticRendered) { renderer.render(scene, camera); _staticRendered = true; }
      if (currentTab === 'atomic') drive2D();
      return;
    }
    _staticRendered = false;
    t += 0.016;
    if (autoRotate && !isDragging && Math.abs(rotVelX) < 1e-4 && Math.abs(rotVelY) < 1e-4) {
      rotY += 0.004;
    }
    currentGroup.rotation.y = rotY;
    currentGroup.rotation.x = rotX;

    electrons.forEach(e => {
      const ud = e.userData;
      if (!ud.orbitR) return;
      const a = t * ud.speed + ud.phase;
      if (ud.elliptic && ud.euler) {
        _orbitVec.set(Math.cos(a) * ud.orbitR, Math.sin(a) * ud.orbitR, 0);
        _orbitEuler.set(ud.euler.x, ud.euler.y, ud.euler.z);
        _orbitVec.applyEuler(_orbitEuler);
        e.position.copy(_orbitVec);
      } else {
        const tilt = ud.tilt || 0;
        e.position.x = Math.cos(a) * ud.orbitR;
        e.position.y = Math.sin(a) * ud.orbitR * Math.cos(tilt);
        e.position.z = Math.sin(a) * ud.orbitR * Math.sin(tilt);
      }
    });
    currentGroup.children.forEach(c => { if (c.userData.isCloud) c.rotation.y += 0.0025; });
    renderer.render(scene, camera);

    if (currentTab === 'atomic') drive2D();
  }

  if (paper() && paper().bindLiveLoop) {
    paper().bindLiveLoop(canvas, tickFrame, {
      busy: function () {
        return isDragging || Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4 ||
          (!staticMode && viewMode === '3d') || anim2dEnabled;
      },
      active: function () { return viewMode === '3d' || anim2dEnabled; }
    });
  } else {
    (function animate(){
      requestAnimationFrame(animate);
      tickFrame();
    })();
  }

  // 2D animation toggle — defaults to OFF (static like original)
  let anim2dEnabled = false;
  let _t2dFrozen   = 0; // last time value used when paused
  window.toggle2DAnim = function(){
    anim2dEnabled = !anim2dEnabled;
    const btn  = document.getElementById('vc-2d-play');
    const icon = document.getElementById('vc-2d-play-icon');
    if (btn) btn.classList.toggle('active', anim2dEnabled);
    if (icon) {
      // Swap between play (▶) and pause (∥) glyphs
      icon.innerHTML = anim2dEnabled
        ? '<rect x="4.5" y="3" width="2.5" height="10" fill="currentColor"/><rect x="9" y="3" width="2.5" height="10" fill="currentColor"/>'
        : '<path d="M5 3l8 5-8 5V3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" fill="currentColor"/>';
    }
    if (!anim2dEnabled) {
      // Freeze: redraw once at the current time, then stop advancing
      _t2dFrozen = t;
      if (p2dCtx && p2dVisible) draw2DAtom(currentAtomModel, _t2dFrozen);
      if (viewMode === '2d' && view2dCtx) draw2DAtomFull(currentAtomModel, _t2dFrozen);
    }
  };

  // 2D animation driver — only redraws while animation is enabled
  let _last2dFrame = 0;
  function drive2D(){
    if (!anim2dEnabled) return;
    const now = performance.now();
    if (now - _last2dFrame < 33) return;   // ~30fps cap
    _last2dFrame = now;
    if (p2dCtx && p2dVisible) draw2DAtom(currentAtomModel, t);
    if (viewMode === '2d' && view2dCtx) draw2DAtomFull(currentAtomModel, t);
  }
})();
  };
})(typeof window !== 'undefined' ? window : this);
