(function (global) {
  'use strict';
  global.atomurusInitMoleculeViewer = function atomurusInitMoleculeViewer() {
return (function(){
  const canvas = document.getElementById('viewer3d');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
  const paper = () => window.atomurusPaperLab;
  if (paper()) paper().capDpr(renderer);
  else renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  let paperGround = null;
  var paperMolForGround = null;
  function updateBg(){
    if (paper()) paper().applyClear(renderer);
    else {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      renderer.setClearColor(isDark ? 0x0E0D0C : 0xF2EFE7, 1);
    }
    if (paperGround) scene.remove(paperGround);
    if (paper() && typeof THREE !== 'undefined') {
      paperGround = paper().ground(THREE, paper().moleculeGroundOpts(paperMolForGround));
      scene.add(paperGround);
    }
  }

  const camera = new THREE.PerspectiveCamera(paper() ? 42 : 50, 2, 0.1, 100);
  camera.position.set(0, 0.35, paper() ? 6.2 : 10);
  const scene = new THREE.Scene();
  if (paper()) paper().lightScene(scene, THREE);
  else {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dL1 = new THREE.DirectionalLight(0xffffff, 1.0); dL1.position.set(5,10,7); scene.add(dL1);
    const dL2 = new THREE.DirectionalLight(0x88bbff, 0.5); dL2.position.set(-5,-3,-5); scene.add(dL2);
    const dL3 = new THREE.DirectionalLight(0xffeecc, 0.3); dL3.position.set(0,5,-8); scene.add(dL3);
  }
  updateBg();
  window.addEventListener('atomurus:themechange', updateBg);

  let currentGroup = new THREE.Group();
  scene.add(currentGroup);

  let isDragging=false, lastX=0, lastY=0, rotX=0, rotY=0, autoRotate=true;
  let rotVelX = 0, rotVelY = 0;
  const ROT_DAMPING = 0.92, ROT_SENS = 0.0085;
  let labelsVisible = !paper();
  const DEFAULT_CAM_Z = paper() ? 6.2 : 10;

  canvas.addEventListener('mousedown', e => {
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
  canvas.addEventListener('wheel', e => {
    camera.position.z = Math.max(2.8, Math.min(20, camera.position.z + e.deltaY*0.01));
    e.preventDefault();
  }, { passive:false });
  if (paper()) {
    paper().bindTouchOrbit(canvas, {
      onDown: function () { isDragging=true; autoRotate=false; updateRotateBtn(); rotVelX=0; rotVelY=0; },
      onDrag: function (dx, dy) {
        rotY += dx; rotX += dy;
        rotVelY = dx * 0.6 + rotVelY * 0.4;
        rotVelX = dy * 0.6 + rotVelX * 0.4;
      }
    });
  }

  function updateRotateBtn(){
    const b=document.getElementById('vc-rotate');
    if (b) b.classList.toggle('active', autoRotate);
  }

  // ── Helpers ──
  const ATOM_SCALE = paper() ? 1 : 1.4;
  const BOND_R     = 0.10;
  // Bond cylinder pokes slightly INTO the atom so there's no visible gap at the joint.
  const BOND_GAP   = -0.04;

  function bondRadius() {
    if (!paper()) return BOND_R;
    return molRep === 'stick' ? 0.07 : 0.075;
  }
  function paperOrbit() {
    return paper() ? { rotX: 0.35, rotY: 0.6 } : { rotX: 0.18, rotY: 0.35 };
  }
  function paperCamZ() {
    if (paper() && paper().camZForMol) return paper().camZForMol(molData[currentMolecule]);
    return DEFAULT_CAM_Z;
  }
  function applyDefaultOrbit() {
    const o = paperOrbit();
    rotX = o.rotX; rotY = o.rotY;
    camera.position.set(0, 0.35, paperCamZ());
  }

  function makeSphere(r,color,seg=32){
    const mat = paper()
      ? paper().mat(THREE, color)
      : new THREE.MeshStandardMaterial({color,roughness:0.35,metalness:0.15});
    return new THREE.Mesh(new THREE.SphereGeometry(r,seg,seg), mat);
  }
  function makeBond(p1,p2,r1,r2,color1,color2,order=1){
    const group = new THREE.Group();
    const dir = new THREE.Vector3().subVectors(p2,p1);
    const len = dir.length();
    if (len < 0.01) return group;
    const unit = dir.clone().normalize();

    // Bond starts at each atom's surface (+ a small visual gap)
    const start = p1.clone().add(unit.clone().multiplyScalar(r1 + BOND_GAP));
    const end   = p2.clone().sub(unit.clone().multiplyScalar(r2 + BOND_GAP));
    if (start.distanceTo(end) < 0.05) return group;

    // Perpendicular axis for double/triple-bond offset.
    // Prefer the Y axis so parallel cylinders sit side-by-side in the default front view.
    let perp;
    const yAxis = new THREE.Vector3(0, 1, 0);
    perp = yAxis.clone().sub(unit.clone().multiplyScalar(yAxis.dot(unit)));
    if (perp.lengthSq() < 0.01) {
      // Bond is along Y — fall back to projecting X
      const xAxis = new THREE.Vector3(1, 0, 0);
      perp = xAxis.clone().sub(unit.clone().multiplyScalar(xAxis.dot(unit)));
    }
    perp.normalize();

    function addCyl(s, e, color, r) {
      const mid = new THREE.Vector3().addVectors(s,e).multiplyScalar(0.5);
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, s.distanceTo(e), 12),
        paper()
          ? paper().mat(THREE, color, { roughness: 0.55, metalness: 0.05 })
          : new THREE.MeshStandardMaterial({color, roughness:0.48, metalness:0.05})
      );
      cyl.position.copy(mid);
      const d = new THREE.Vector3().subVectors(e,s).normalize();
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d);
      group.add(cyl);
    }
    function addPair(s, e, r) {
      const mid = new THREE.Vector3().addVectors(s,e).multiplyScalar(0.5);
      addCyl(s,   mid, color1, r);
      addCyl(mid, e,   color2, r);
    }

    const br = bondRadius();
    if (paper()) {
      color1 = paper().BOND;
      color2 = paper().BOND;
    }
    if (order === 2) {
      const off = perp.clone().multiplyScalar(br * 1.4);
      const thinR = br * 0.62;
      addPair(start.clone().add(off), end.clone().add(off), thinR);
      addPair(start.clone().sub(off), end.clone().sub(off), thinR);
    } else if (order === 3) {
      const off = perp.clone().multiplyScalar(br * 1.8);
      const thinR = br * 0.55;
      addPair(start, end, thinR);
      addPair(start.clone().add(off), end.clone().add(off), thinR);
      addPair(start.clone().sub(off), end.clone().sub(off), thinR);
    } else if (paper()) {
      addCyl(start, end, paper().BOND, br);
    } else {
      addPair(start, end, BOND_R);
    }
    return group;
  }

  const COLOR_TO_ELEMENT = {
    0xdddddd:'H', 0xe8e8e8:'H', 0xe7e2d4:'H',
    0xee3333:'O', 0xc94a3a:'O',
    0x666666:'C', 0x555555:'C', 0x444444:'C', 0x333333:'C', 0x222222:'C', 0x5a554c:'C',
    0x3399ff:'N',
    0x44dd44:'Cl',
    0xaaaaff:'Na',
    0xffcc33:'S', 0xddaa00:'S', 0xeecc22:'S',
    0xff8833:'P', 0xffdd44:'P', 0xcc3311:'P',
    0xcc6633:'Fe',
    0xb3ff3a:'F',
    0xa62929:'Br'
  };

  // Dynamic lab data: formula, molar mass and elemental composition derived
  // straight from the 3D atom data (same values as the periodic table).
  const ATOMIC_MASS = { H:1.008, He:4.003, C:12.011, N:14.007, O:15.999, F:18.998, Ne:20.180, Na:22.990, Mg:24.305, Al:26.982, Si:28.085, P:30.974, S:32.06, Cl:35.45, K:39.098, Ca:40.078, Fe:55.845, Cu:63.546, Zn:65.38, Br:79.904, Ag:107.868, I:126.904, Ba:137.327, Pt:195.084, Au:196.967, Hg:200.592, Pb:207.2 };
  const SUB_DIGITS = ['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉'];
  function subNum(n){ return String(n).split('').map(d => SUB_DIGITS[+d] || d).join(''); }
  // A few formulas whose conventional order differs from the alphabetical fallback.
  const FORMULA_OVERRIDE = { ammonia:'NH₃', so2:'SO₂', nacl:'NaCl', h2so4:'H₂SO₄', h3po4:'H₃PO₄', hcn:'HCN', pcl3:'PCl₃', sf6:'SF₆' };
  function computeMolStats(key, md){
    if (!md || !md.atoms || !md.atoms.length) return '';
    const counts = {};
    md.atoms.forEach(a => {
      const el = COLOR_TO_ELEMENT[a.color] || '';
      if (el) counts[el] = (counts[el] || 0) + 1;
    });
    const els = Object.keys(counts);
    if (!els.length) return '';
    let total = 0;
    els.forEach(el => { total += (ATOMIC_MASS[el] || 0) * counts[el]; });
    if (!total) return '';
    const order = { C:0, H:1 };
    els.sort((a,b) => {
      const oa = order[a] !== undefined ? order[a] : 10;
      const ob = order[b] !== undefined ? order[b] : 10;
      return (oa - ob) || (a < b ? -1 : 1);
    });
    let formula = FORMULA_OVERRIDE[key] || '';
    if (!formula) {
      els.forEach(el => { formula += el + (counts[el] > 1 ? subNum(counts[el]) : ''); });
    }
    const parts = els.map(el => el + ' ' + ((ATOMIC_MASS[el] * counts[el]) / total * 100).toFixed(1) + '%');
    return formula + ' · MM ' + total.toFixed(2) + ' g/mol · ' + parts.join(' · ');
  }

  // ── Molecule data ──
  const molData = Object.create(null);
  const molFetch = Object.create(null);
  function isSafeMolKey(key) {
    return typeof key === 'string' && /^[a-z][a-z0-9-]{0,62}$/.test(key);
  }
  function fetchMolecule(key) {
    if (!isSafeMolKey(key)) return Promise.reject(new Error('invalid molecule'));
    if (molData[key] && molData[key].atoms) return Promise.resolve(molData[key]);
    if (molFetch[key]) return molFetch[key];
    molFetch[key] = fetch('/api/pro-lab/viewer/molecule?key=' + encodeURIComponent(key), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data || !data.ok || !data.molecule || !Array.isArray(data.molecule.atoms)) {
          throw new Error((data && data.error) || 'molecule unavailable');
        }
        molData[key] = data.molecule;
        return data.molecule;
      });
    }).catch(function (err) {
      delete molFetch[key];
      throw err;
    });
    return molFetch[key];
  }

  let trackedAtoms = [];
  let bondCount = 0;
  let currentMolecule = 'water';
  let mirrorMode = false;

  let molRep = 'ball';

  function atomRadius(a){
    const el = COLOR_TO_ELEMENT[a.color] || '';
    if (molRep === 'space') {
      return paper() ? paper().vdwRadius(a, el) : a.r * ATOM_SCALE * 1.85;
    }
    if (molRep === 'stick') return paper() ? 0.09 : 0.12;
    return a.r * ATOM_SCALE;
  }

  function buildMolecule(key){
    const g=new THREE.Group(); trackedAtoms=[];
    const mol=molData[key];
    const sx = mirrorMode ? -1 : 1;
    const meshes=mol.atoms.map(a=>{
      const radius=atomRadius(a);
      const m=makeSphere(radius,a.color);
      const pos = [a.pos[0]*sx, a.pos[1], a.pos[2]];
      m.position.fromArray(pos);
      const label = COLOR_TO_ELEMENT[a.color] || '';
      trackedAtoms.push({mesh:m, label, radius, color:a.color, pos});
      g.add(m); return m;
    });
    if (molRep !== 'space') {
      mol.bonds.forEach(b=>{
        const i = b[0], j = b[1], order = b[2] || 1;
        const a1 = mol.atoms[i], a2 = mol.atoms[j];
        const r1 = atomRadius(a1), r2 = atomRadius(a2);
        g.add(makeBond(meshes[i].position, meshes[j].position, r1, r2, a1.color, a2.color, order));
      });
    }
    bondCount = mol.bonds.length;
    return g;
  }

  function rebuildScene(){
    scene.remove(currentGroup);
    currentGroup = buildMolecule(currentMolecule);
    scene.add(currentGroup);
    paperMolForGround = molData[currentMolecule];
    updateBg();
    applyDefaultOrbit();
    autoRotate = true; updateRotateBtn();
    refreshLabels();
  }

  window.setMolRep = function(style){
    if (style !== 'ball' && style !== 'space' && style !== 'stick') return;
    molRep = style;
    document.querySelectorAll('[data-mol-rep]').forEach(function (b) {
      const on = b.getAttribute('data-mol-rep') === style;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (!molData[currentMolecule]) return;
    scene.remove(currentGroup);
    currentGroup = buildMolecule(currentMolecule);
    scene.add(currentGroup);
    refreshLabels();
    if (viewMode === '2d') draw2DMolecule(0);
  };

  // ── Label sprites ──
  function makeLabelSprite(text, atomRadius){
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const ctx = c.getContext('2d');
    // Labels live INSIDE the atom — text color contrasts against the sphere itself,
    // not the page background. Use light text on coloured atoms, dark on H/light atoms.
    ctx.font = 'bold 56px "DM Sans", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,.55)';
    ctx.lineWidth = 5;
    ctx.strokeText(text, 64, 32);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 64, 32);
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthTest:false, depthWrite:false}));
    const r = atomRadius || 0.5;
    const w = Math.max(0.45, r * 1.7);
    sp.scale.set(w, w * 0.5, 1);
    sp.renderOrder = 999;
    return sp;
  }
  function refreshLabels(){
    trackedAtoms.forEach(a=>{
      if (a.labelSprite){ a.mesh.remove(a.labelSprite); a.labelSprite = null; }
    });
    if (!labelsVisible) return;
    trackedAtoms.forEach(a=>{
      if (!a.label) return;
      const sp = makeLabelSprite(a.label, a.radius);
      // Center the label inside the atom (depthTest:false keeps it visible through the sphere)
      sp.position.set(0, 0, 0);
      a.mesh.add(sp); a.labelSprite = sp;
    });
  }

  // ── 2D viewer ──
  const viewer2d = document.getElementById('viewer2d-full');
  const ctx2d    = viewer2d.getContext('2d');
  let viewMode   = '3d';
  let anim2dEnabled = false;
  let zoom2d = 1.0;
  let pan2d = { x:0, y:0 };
  let dragging2d = false;
  let dragStart  = { x:0, y:0 };
  let panStart   = { x:0, y:0 };

  function resize2d(){
    const wrap = document.getElementById('canvas-wrap');
    const w = (wrap && wrap.clientWidth) || canvas.clientWidth || 800;
    const h = (wrap && wrap.clientHeight) || canvas.clientHeight || 460;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewer2d.width  = Math.max(1, w) * dpr;
    viewer2d.height = Math.max(1, h) * dpr;
    viewer2d.style.width  = '100%';
    viewer2d.style.height = Math.max(1, h) + 'px';
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Hex color (e.g. 0xee3333) → CSS '#ee3333'
  function hexCSS(c){ return '#' + c.toString(16).padStart(6, '0'); }

  function draw2DMolecule(time){
    if (viewMode !== '2d') return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = viewer2d.width / dpr, H = viewer2d.height / dpr;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    ctx2d.save();
    ctx2d.clearRect(0, 0, W, H);
    ctx2d.fillStyle = paper() ? paper().fillCss() : (isDark ? '#0E0D0C' : '#F2EFE7');
    ctx2d.fillRect(0, 0, W, H);

    const mol = molData[currentMolecule];
    if (!mol || !mol.atoms.length) { ctx2d.restore(); return; }

    // Blend color toward white for specular highlights
    function lighten(hex, amt) {
      const c = hex.replace('#','');
      const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
      return '#' + [r,g,b].map(v => Math.min(255, Math.round(v + (255-v)*amt)).toString(16).padStart(2,'0')).join('');
    }

    function elemColor(lbl) {
      if (!lbl) return 0xaaaaaa;
      const l = lbl.toUpperCase();
      let raw = 0x666666;
      if (l === 'O' || l === 'OH') raw = 0xee3333;
      else if (l === 'N' || l === 'NH' || l === 'NH2') raw = 0x3399ff;
      else if (l === 'S') raw = 0xffcc33;
      else if (l === 'P') raw = 0xff8833;
      else if (l === 'CL') raw = 0x44dd44;
      else if (l === 'BR') raw = 0xa62929;
      else if (l === 'F') raw = 0xb3ff3a;
      else if (l === 'NA') raw = 0xaaaaff;
      else if (l === 'FE') raw = 0xcc6633;
      else if (l.match(/^H\d?$/)) raw = 0xdddddd;
      return paper() ? paper().atomColor(raw) : raw;
    }
    function elemRadius(lbl) {
      if (!lbl) return 0.40;
      const l = lbl.toUpperCase();
      if (l.match(/^H\d?$/)) return 0.26;
      if (l === 'F') return 0.32;
      if (l === 'O' || l === 'OH') return 0.38;
      if (l === 'N' || l === 'NH' || l === 'NH2') return 0.38;
      if (l === 'C') return 0.40;
      if (l === 'NA') return 0.42;
      if (l === 'CL') return 0.46;
      if (l === 'S') return 0.48;
      if (l === 'P') return 0.48;
      if (l === 'FE') return 0.52;
      if (l === 'BR') return 0.52;
      return 0.40;
    }

    let atomsToDraw = [];
    let bondsToDraw = [];

    if (mol.draw2d && mol.draw2d.atoms && mol.draw2d.bonds) {
      // ── Structural formula mode ──
      let maxExt = 0;
      mol.draw2d.atoms.forEach(a => { maxExt = Math.max(maxExt, Math.abs(a.x), Math.abs(a.y)); });
      maxExt = Math.max(1, maxExt + 1.5);
      const z = Math.min(W, H) / (2 * maxExt) * 0.8 * zoom2d;
      const cx = W / 2 + pan2d.x;
      const cy = H / 2 + pan2d.y;
      const ang = anim2dEnabled ? (time || 0) * 0.18 : 0;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      // Chiral mirror: flip horizontally (x sign) when mirrorMode is on.
      const mx = (mol.chiral && mirrorMode) ? -1 : 1;
      const project = (p) => ({
        x: cx + ((p.x * mx) * cosA - p.y * sinA) * z,
        y: cy - ((p.x * mx) * sinA + p.y * cosA) * z
      });

      atomsToDraw = mol.draw2d.atoms.map(a => {
        const p = project(a);
        const col = elemColor(a.label);
        return { p, r: z * elemRadius(a.label), color: col, label: a.label || '' };
      });
      bondsToDraw = mol.draw2d.bonds.map(b => ({
        p1: atomsToDraw[b.a].p, p2: atomsToDraw[b.b].p,
        order: b.order || 1,
        c1: atomsToDraw[b.a].color, c2: atomsToDraw[b.b].color
      }));
    } else {
      // ── Atom-position mode ──
      let maxExt = 0;
      mol.atoms.forEach(a => {
        const [x, y] = a.pos;
        maxExt = Math.max(maxExt, Math.abs(x), Math.abs(y));
      });
      maxExt = Math.max(0.5, maxExt + 0.8);
      const z = Math.min(W, H) / (2 * maxExt) * 0.72 * zoom2d;
      const cx = W / 2 + pan2d.x;
      const cy = H / 2 + pan2d.y;
      const ang = anim2dEnabled ? (time || 0) * 0.25 : 0;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      // Chiral mirror: flip horizontally (x sign) when mirrorMode is on.
      const mx = (mol.chiral && mirrorMode) ? -1 : 1;
      const project = (pos) => ({
        x: cx + ((pos[0] * mx) * cosA - pos[1] * sinA) * z,
        y: cy - ((pos[0] * mx) * sinA + pos[1] * cosA) * z
      });

      atomsToDraw = mol.atoms.map(a => {
        const label = COLOR_TO_ELEMENT[a.color] || '';
        const col = paper() ? paper().atomColor(a.color) : a.color;
        return { p: project(a.pos), r: a.r * z * 1.5, color: col, label };
      });
      bondsToDraw = mol.bonds.map(([i, j]) => ({
        p1: atomsToDraw[i].p, p2: atomsToDraw[j].p,
        order: 1,
        c1: atomsToDraw[i].color, c2: atomsToDraw[j].color
      }));
    }

    // ── Draw bonds (behind atoms) ──
    ctx2d.lineCap = 'round';
    bondsToDraw.forEach(b => {
      const dx = b.p2.x - b.p1.x, dy = b.p2.y - b.p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const thickness = Math.max(4, len * 0.09);

      if (paper()) {
        ctx2d.strokeStyle = hexCSS(paper().BOND);
      } else {
        const grad = ctx2d.createLinearGradient(b.p1.x, b.p1.y, b.p2.x, b.p2.y);
        grad.addColorStop(0, hexCSS(b.c1));
        grad.addColorStop(0.48, hexCSS(b.c1));
        grad.addColorStop(0.52, hexCSS(b.c2));
        grad.addColorStop(1, hexCSS(b.c2));
        ctx2d.strokeStyle = grad;
      }

      if (b.order === 2) {
        const sep = thickness * 1.6;
        const ox = nx * sep * 0.5, oy = ny * sep * 0.5;
        ctx2d.lineWidth = thickness * 0.7;
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x + ox, b.p1.y + oy); ctx2d.lineTo(b.p2.x + ox, b.p2.y + oy); ctx2d.stroke();
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x - ox, b.p1.y - oy); ctx2d.lineTo(b.p2.x - ox, b.p2.y - oy); ctx2d.stroke();
      } else if (b.order === 3) {
        const sep = thickness * 2;
        const ox = nx * sep * 0.5, oy = ny * sep * 0.5;
        ctx2d.lineWidth = thickness * 0.6;
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x, b.p1.y); ctx2d.lineTo(b.p2.x, b.p2.y); ctx2d.stroke();
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x + ox, b.p1.y + oy); ctx2d.lineTo(b.p2.x + ox, b.p2.y + oy); ctx2d.stroke();
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x - ox, b.p1.y - oy); ctx2d.lineTo(b.p2.x - ox, b.p2.y - oy); ctx2d.stroke();
      } else {
        ctx2d.lineWidth = thickness;
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x, b.p1.y); ctx2d.lineTo(b.p2.x, b.p2.y); ctx2d.stroke();
      }
    });

    // ── Draw atoms (on top of bonds) ──
    atomsToDraw.forEach(a => {
      const r = a.r;
      const css = hexCSS(a.color);

      // Realistic 3D sphere: specular highlight upper-left
      const hlX = a.p.x - r * 0.3, hlY = a.p.y - r * 0.3;
      const grad = ctx2d.createRadialGradient(hlX, hlY, r * 0.05, a.p.x, a.p.y, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.12, lighten(css, 0.6));
      grad.addColorStop(0.35, css);
      grad.addColorStop(0.80, shade(css, -0.30));
      grad.addColorStop(1.0,  shade(css, -0.55));

      ctx2d.beginPath();
      ctx2d.arc(a.p.x, a.p.y, r, 0, Math.PI * 2);
      ctx2d.fillStyle = grad;
      ctx2d.fill();

      // Subtle outline matching the dark edge
      ctx2d.strokeStyle = shade(css, -0.40);
      ctx2d.lineWidth = Math.max(0.5, r * 0.025);
      ctx2d.stroke();

      // Label
      if (a.label && labelsVisible) {
        const fontSize = Math.max(11, r * 0.85);
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        const txtColor = labelColor(a.color);
        ctx2d.fillStyle = txtColor;

        let txt = a.label;
        if (/[0-9]/.test(txt) && txt.length > 1) {
          // Multi-char with subscripts (CH3, CH2, NH2, etc.)
          let totalW = 0;
          for (let i = 0; i < txt.length; i++) {
            const isNum = /[0-9]/.test(txt[i]);
            ctx2d.font = 'bold ' + (isNum ? fontSize * 0.7 : fontSize) + 'px Arial, "DM Sans", sans-serif';
            totalW += ctx2d.measureText(txt[i]).width;
          }
          let drawX = a.p.x - totalW / 2;
          for (let i = 0; i < txt.length; i++) {
            const c = txt[i];
            const isNum = /[0-9]/.test(c);
            const fs = isNum ? fontSize * 0.7 : fontSize;
            ctx2d.font = 'bold ' + fs + 'px Arial, "DM Sans", sans-serif';
            const cw = ctx2d.measureText(c).width;
            ctx2d.fillText(c, drawX + cw / 2, a.p.y + (isNum ? fontSize * 0.2 : 0));
            drawX += cw;
          }
        } else {
          ctx2d.font = 'bold ' + fontSize + 'px Arial, "DM Sans", sans-serif';
          ctx2d.fillText(txt, a.p.x, a.p.y + 1);
        }
      }
    });

    // Footer
    ctx2d.fillStyle = isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)';
    ctx2d.font = '500 11px "DM Mono", monospace';
    ctx2d.textAlign = 'left'; ctx2d.textBaseline = 'bottom';
    ctx2d.fillText('VIEW 2D · ' + (mol.name || '').toUpperCase(), 14, H - 12);
    ctx2d.restore();
  }

  function shade(hex, pct){
    // hex like '#aabbcc', pct -1..1
    const c = hex.replace('#','');
    const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
    const f = pct < 0 ? 1 + pct : 1 - pct;
    const nr = Math.round(r * f), ng = Math.round(g * f), nb = Math.round(b * f);
    return '#' + [nr,ng,nb].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
  }
  // Pick a readable text colour against a hex bg
  function labelColor(hex){
    const r = ((hex >> 16) & 255) / 255;
    const g = ((hex >> 8)  & 255) / 255;
    const b = ((hex)       & 255) / 255;
    const L = 0.2126*r + 0.7152*g + 0.0722*b;
    return L > 0.55 ? '#111' : '#fff';
  }

  // 2D pan + zoom
  viewer2d.addEventListener('mousedown', e => {
    if (viewMode !== '2d') return;
    dragging2d = true;
    dragStart = { x: e.clientX, y: e.clientY };
    panStart  = { x: pan2d.x,   y: pan2d.y   };
    viewer2d.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!dragging2d) return;
    pan2d.x = panStart.x + (e.clientX - dragStart.x);
    pan2d.y = panStart.y + (e.clientY - dragStart.y);
    draw2DMolecule(_t2dFrozen);
  });
  window.addEventListener('mouseup', () => {
    if (!dragging2d) return;
    dragging2d = false;
    viewer2d.style.cursor = 'grab';
  });
  viewer2d.addEventListener('wheel', e => {
    if (viewMode !== '2d') return;
    e.preventDefault();
    const step = e.deltaY > 0 ? -0.12 : 0.12;
    zoom2d = Math.max(0.3, Math.min(4.0, zoom2d + step));
    draw2DMolecule(anim2dEnabled ? t : _t2dFrozen);
  }, { passive:false });

  // ── Public API ──
  let t = 0;
  let _t2dFrozen = 0;

  function _i18nTr(k, fb){
    return (window.I18N && window.I18N.t) ? window.I18N.t(k, { fallback: fb }) : fb;
  }
  function syncMoleculeUrl(key){
    if (!window.history || !window.history.replaceState) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('mol', key);
      window.history.replaceState({ mol:key }, '', url);
    } catch (_) {}
  }
  let molRequest = 0;
  window.setMolecule = function(key, skipUrl){
    const req = ++molRequest;
    return fetchMolecule(key).then(function () {
      if (req !== molRequest) return;
      applyMolecule(key, skipUrl);
    }).catch(function () {
      if (req !== molRequest) return;
      if (typeof window.atomurusShowProViewerError === 'function') {
        window.atomurusShowProViewerError(document.getElementById('viewer3d'));
      }
    });
  };
  function applyMolecule(key, skipUrl){
    if (!molData[key] || !molData[key].atoms) return;
    currentMolecule = key;
    mirrorMode = false;
    rebuildScene();
    const md = molData[key];
    const tName  = _i18nTr('molecules.mol.' + key + '.name',  md.name);
    const tDesc  = _i18nTr('molecules.mol.' + key + '.desc',  md.desc);
    const tShort = _i18nTr('molecules.mol.' + key + '.short', key);
    const lAtoms = _i18nTr('molecules.metaAtoms',    'atoms');
    const lBonds = _i18nTr('molecules.metaBonds',    'bonds');
    const lGeom  = _i18nTr('molecules.metaGeometry', 'geometry');
    const nameEl = document.getElementById('model-name');
    const descEl = document.getElementById('model-desc');
    nameEl.setAttribute('data-i18n', 'molecules.mol.' + key + '.name');
    descEl.setAttribute('data-i18n', 'molecules.mol.' + key + '.desc');
    nameEl.textContent = tName;
    descEl.textContent = tDesc;
    const statsEl = document.getElementById('model-stats');
    if (statsEl) statsEl.textContent = computeMolStats(key, md);
    const lConfig = _i18nTr('molecules.metaConfig', 'config.');
    const configLabel = md.chiral ? '<span>' + lConfig + ' <b>R</b></span>' : '';
    document.getElementById('info-meta').innerHTML =
      '<span><b>' + md.atoms.length + '</b> ' + lAtoms + '</span>' +
      '<span><b>' + bondCount + '</b> ' + lBonds + '</span>' +
      '<span>' + lGeom + ' <b>3D</b></span>' + configLabel;
    document.getElementById('av-mol').textContent = tShort;
    const chiralPanel = document.getElementById('chiral-panel');
    const mirrorBtn = document.getElementById('vc-mirror');
    if (chiralPanel) chiralPanel.classList.toggle('visible', !!md.chiral);
    if (mirrorBtn) {
      mirrorBtn.style.display = md.chiral ? '' : 'none';
      mirrorBtn.classList.remove('chiral-on');
    }
    document.querySelectorAll('.mol-btn').forEach(b => {
      const isActive = b.dataset.mol === key;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    document.querySelectorAll('.mol-elem-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    if (!skipUrl) syncMoleculeUrl(key);
    if (viewMode === '2d') draw2DMolecule(anim2dEnabled ? t : _t2dFrozen);
  };

  window.toggleMirror = function(){
    const md = molData[currentMolecule];
    if (!md || !md.chiral) return;
    mirrorMode = !mirrorMode;
    rebuildScene();
    // Reflect the 2D rendering too when the mirror is engaged.
    if (viewMode === '2d') draw2DMolecule(anim2dEnabled ? t : _t2dFrozen);
    const btn = document.getElementById('vc-mirror');
    if (btn) btn.classList.toggle('chiral-on', mirrorMode);
    const meta = document.getElementById('info-meta');
    if (meta) {
      const lConfig = _i18nTr('molecules.metaConfig', 'config.');
      meta.innerHTML = meta.innerHTML.replace(
        /<span>[^<]*<b>[RS]<\/b><\/span>$/,
        '<span>' + lConfig + ' <b>' + (mirrorMode ? 'S' : 'R') + '</b></span>'
      );
    }
  };

  const elementToMolecule = { H:'water',C:'methane',N:'ammonia',O:'water',Na:'nacl',Cl:'hcl',S:'h2so4',P:'h3po4',Fe:'fe2o3' };
  window.setMoleculeByElement = function(elem){
    const k = elementToMolecule[elem]; if (!k) return;
    setMolecule(k);
    document.querySelectorAll('.mol-elem-btn').forEach(b => {
      const isActive = b.dataset.elem === elem;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  window.toggleAutoRotate = function(){
    autoRotate = !autoRotate; updateRotateBtn();
  };
  window.resetView = function(){
    if (viewMode === '2d') {
      zoom2d = 1.0; pan2d = { x:0, y:0 };
      draw2DMolecule(anim2dEnabled ? t : _t2dFrozen);
    } else {
      applyDefaultOrbit();
      autoRotate = true; updateRotateBtn();
      autoRotate = true; updateRotateBtn();
    }
  };
  window.zoomBy = function(direction){
    if (viewMode === '2d') {
      const step = direction === -1 ? 0.15 : -0.15;
      zoom2d = Math.max(0.3, Math.min(4.0, zoom2d + step));
      draw2DMolecule(anim2dEnabled ? t : _t2dFrozen);
    } else {
      camera.position.z = Math.max(2.8, Math.min(20, camera.position.z + direction * 1.1));
    }
  };
  window.toggleLabels = function(){
    labelsVisible = !labelsVisible;
    document.getElementById('vc-labels').classList.toggle('active', labelsVisible);
    refreshLabels();
    if (viewMode === '2d') draw2DMolecule(anim2dEnabled ? t : _t2dFrozen);
  };
  window.toggleFullscreen = function(){
    const el = document.getElementById('canvas-wrap');
    if (!document.fullscreenElement) (el.requestFullscreen || (()=>{})).call(el);
    else (document.exitFullscreen || (()=>{})).call(document);
  };
  window.toggle2DAnim = function(){
    anim2dEnabled = !anim2dEnabled;
    const btn = document.getElementById('vc-2d-play');
    const icon = document.getElementById('vc-2d-play-icon');
    if (btn) btn.classList.toggle('active', anim2dEnabled);
    if (icon) icon.innerHTML = anim2dEnabled
      ? '<rect x="4.5" y="3" width="2.5" height="10" fill="currentColor"/><rect x="9" y="3" width="2.5" height="10" fill="currentColor"/>'
      : '<path d="M5 3l8 5-8 5V3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" fill="currentColor"/>';
    if (!anim2dEnabled) {
      _t2dFrozen = t;
      if (viewMode === '2d') draw2DMolecule(_t2dFrozen);
    }
  };
  window.setViewerMode = function(mode){
    if (mode !== '2d' && mode !== '3d') return;
    viewMode = mode;
    const is3d = mode === '3d';
    const wrap = document.getElementById('canvas-wrap');
    if (wrap) wrap.classList.toggle('is-2d', !is3d);
    canvas.style.visibility = 'visible';
    canvas.style.pointerEvents = is3d ? 'auto' : 'none';
    viewer2d.style.visibility = is3d ? 'hidden' : 'visible';
    viewer2d.style.pointerEvents = is3d ? 'none' : 'auto';
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
    const rot = document.getElementById('vc-rotate');
    if (rot) rot.style.display = is3d ? '' : 'none';
    const av = document.getElementById('av-view');
    if (av) av.textContent = is3d ? '3d' : '2d';
    if (!is3d) {
      resize2d();
      draw2DMolecule(anim2dEnabled ? t : _t2dFrozen);
    } else {
      resize();
      renderer.render(scene, camera);
    }
  };

  // ── Keyboard ──
  window.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); toggleAutoRotate(); }
    else if (k === 'r') resetView();
    else if (k === 'l') toggleLabels();
    else if (k === 'f') toggleFullscreen();
    else if (k === 't') toggleTheme();
    else if (k === '+' || k === '=') zoomBy(-1);
    else if (k === '-' || k === '_') zoomBy(1);
    else if (k === '2') setViewerMode(viewMode === '2d' ? '3d' : '2d');
    else if (k === 'p') toggle2DAnim();
  });

  window.addEventListener('atomurus:themechange', () => {
    refreshLabels();
    if (viewMode === '2d') draw2DMolecule(anim2dEnabled ? t : _t2dFrozen);
  });

  // ── Resize / Animate ──
  function resize(){
    const wrap = document.getElementById('canvas-wrap');
    const w = (wrap && wrap.clientWidth) || canvas.clientWidth || 800;
    const h = (wrap && wrap.clientHeight) || canvas.clientHeight || 460;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', () => { resize(); if (viewMode === '2d') { resize2d(); draw2DMolecule(anim2dEnabled ? t : _t2dFrozen); } });
  resize(); resize2d();

  let _docHidden = false;
  document.addEventListener('visibilitychange', () => { _docHidden = document.hidden; });

  let _last2dFrame = 0;
  function animate(){
    requestAnimationFrame(animate);
    if (_docHidden) return;
    if (!isDragging && (Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4)) {
      rotY += rotVelY; rotX += rotVelX;
      rotVelX *= ROT_DAMPING; rotVelY *= ROT_DAMPING;
    }
    t += 0.016;
    if (autoRotate && !isDragging && Math.abs(rotVelX) < 1e-4 && Math.abs(rotVelY) < 1e-4) {
      rotY += 0.004;
    }
    currentGroup.rotation.y = rotY;
    currentGroup.rotation.x = rotX;
    renderer.render(scene, camera);

    // 2D animation drive
    if (anim2dEnabled && viewMode === '2d') {
      const now = performance.now();
      if (now - _last2dFrame >= 33) { _last2dFrame = now; draw2DMolecule(t); }
    }
  }

  // Initial state (supports deep-link: ?mol=ethanol, ?mol=chfclbr, etc.)
  let initialMol = 'water';
  try {
    const qMol = new URLSearchParams(location.search).get('mol');
    if (qMol && isSafeMolKey(qMol)) initialMol = qMol;
  } catch (_) {}
  // Re-render molecule strings when user switches language (and retry until I18N is ready)
  (function wireI18n(){
    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(function () {
        if (currentMolecule) window.setMolecule(currentMolecule, true);
      });
    } else {
      setTimeout(wireI18n, 50);
    }
  })();

  const bootReq = ++molRequest;
  const labelsBtn = document.getElementById('vc-labels');
  if (labelsBtn) labelsBtn.classList.toggle('active', labelsVisible);
  return fetchMolecule(initialMol).then(function () {
    if (bootReq === molRequest) applyMolecule(initialMol, true);
    animate();
  });
})();
  };
})(typeof window !== 'undefined' ? window : this);
