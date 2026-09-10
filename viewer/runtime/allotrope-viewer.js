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
  camera.position.set(0, 0.35, 10);
  const scene = new THREE.Scene();
  let paperGround = null;
  function updateBg(){
    if (paper()) paper().applyClear(renderer);
    else {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
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

  let isDragging=false,lastX=0,lastY=0,rotX=0,rotY=0,autoRotate=!((paper() && paper().prefersReducedMotion && paper().prefersReducedMotion()));
  const intro = paper() && paper().introSpin ? paper().introSpin({ ms: 3200 }) : null;
  function spinning(){
    if (!intro) return autoRotate;
    const on = intro.spinning(autoRotate);
    if (!intro.isHeld() && autoRotate && !on) { autoRotate = false; updateRotateBtn(); }
    return on;
  }
  let rotVelX = 0, rotVelY = 0;
  const ROT_DAMPING = 0.92, ROT_SENS = 0.0085;
  const DEFAULT_CAM_Z = 10;

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
  function makeGlow(r,color){
    if (paper() && paper().glowMesh) return paper().glowMesh(THREE, r, color);
    return new THREE.Mesh(new THREE.SphereGeometry(r,12,12),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.08}));
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
  function addGlows(g, positions, color, r){
    if (paper() && paper().addInstancedSpheres && positions.length > 4) {
      paper().addInstancedSpheres(g, THREE, positions, color, r, 12, { basic: true, opacity: 0.08 });
      return;
    }
    positions.forEach(p => { const glow = makeGlow(r, color); glow.position.copy(p); g.add(glow); });
  }
  function addBondsNear(g, positions, maxDist, color, r){
    const pairs = (paper() && paper().nearbyPairs)
      ? paper().nearbyPairs(positions, maxDist)
      : (function(){
          const out = [];
          for (let i = 0; i < positions.length; i++)
            for (let j = i + 1; j < positions.length; j++)
              if (positions[i].distanceTo(positions[j]) < maxDist) out.push([positions[i], positions[j]]);
          return out;
        })();
    if (paper() && paper().addInstancedBonds && pairs.length > 4) {
      paper().addInstancedBonds(g, THREE, pairs, color, r);
      return;
    }
    pairs.forEach(pair => g.add(makeBond(pair[0], pair[1], color, r)));
  }
  function addBondList(g, pairs, color, r){
    if (paper() && paper().addInstancedBonds && pairs.length > 4) {
      paper().addInstancedBonds(g, THREE, pairs, color, r);
      return;
    }
    pairs.forEach(pair => g.add(makeBond(pair[0], pair[1], color, r)));
  }

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
    const g = new THREE.Group();
    if (key === 'graphite'){
      const layerY = [-0.9, 0, 0.9];
      layerY.forEach((y, li) => {
        const offset = (li % 2) * 0.72 * Math.sqrt(3) / 2;
        const b = 0.72, dx = b * Math.sqrt(3);
        const rows = 4, cols = 3;
        const pos = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const ax = col * dx + (row % 2) * (dx / 2) + offset;
            const az = row * (b * 1.5);
            pos.push(new THREE.Vector3(ax, y, az));
            pos.push(new THREE.Vector3(ax, y, az + b));
          }
        }
        const xs = pos.map(p => p.x), zs = pos.map(p => p.z);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
        pos.forEach(p => { p.x -= cx; p.z -= cz; });
        const shade = li === 1 ? 0x555555 : 0x333333;
        addAtoms(g, pos, shade, 0.16, 10);
        addBondsNear(g, pos, b * 1.1, 0x666666, 0.055);
      });
    }
    else if (key === 'diamond'){
      const a0 = 1.7;
      const basis = [[0,0,0],[0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
        [0.25,0.25,0.25],[0.75,0.75,0.25],[0.75,0.25,0.75],[0.25,0.75,0.75]];
      const sites = [];
      for (let ix=0; ix<=1; ix++)
        for (let iy=0; iy<=1; iy++)
          for (let iz=0; iz<=1; iz++)
            basis.forEach(([bx,by,bz]) => {
              sites.push(new THREE.Vector3((ix+bx)*a0 - a0, (iy+by)*a0 - a0, (iz+bz)*a0 - a0));
            });
      const uniq = [];
      sites.forEach(s => { if (!uniq.some(u => u.distanceTo(s) < 0.05)) uniq.push(s); });
      addAtoms(g, uniq, 0x99ddff, 0.22, 14);
      addGlows(g, uniq, 0x88ccff, 0.34);
      const bondLen = a0 * Math.sqrt(3) / 4, tol = bondLen * 1.08;
      addBondsNear(g, uniq, tol, 0xaaddff, 0.07);
    }
    else if (key === 'fullerene'){
      const phi = (1 + Math.sqrt(5)) / 2;
      const baseTriples = [[0,1,3*phi],[1,2+phi,2*phi],[2,1+2*phi,phi]];
      const rawV = [];
      baseTriples.forEach(([a,b,c]) => {
        const cycs = [[a,b,c],[b,c,a],[c,a,b]];
        cycs.forEach(([x,y,z]) => {
          const sX = (x===0)?[0]:[x,-x], sY = (y===0)?[0]:[y,-y], sZ = (z===0)?[0]:[z,-z];
          sX.forEach(xx => sY.forEach(yy => sZ.forEach(zz => { rawV.push([xx,yy,zz]); })));
        });
      });
      const uniqVerts = [];
      rawV.forEach(v => {
        if (!uniqVerts.some(u => Math.abs(u[0]-v[0])<0.001 && Math.abs(u[1]-v[1])<0.001 && Math.abs(u[2]-v[2])<0.001))
          uniqVerts.push(v);
      });
      const targetR = 2.4;
      const sampleLen = Math.sqrt(uniqVerts[0][0]**2 + uniqVerts[0][1]**2 + uniqVerts[0][2]**2);
      const scale = targetR / sampleLen;
      const pts = uniqVerts.map(v => new THREE.Vector3(v[0]*scale, v[1]*scale, v[2]*scale));
      addAtoms(g, pts, 0x333333, 0.18, 14);
      const bondDist = 2 * scale * 1.08;
      addBondsNear(g, pts, bondDist, 0x666666, 0.055);
    }
    else if (key === 'graphene'){
      const rows = 4, cols = 5;
      const pos = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * 1.4 + (row % 2) * 0.7 - 3.5;
          const z = row * 1.21 - 2.4;
          pos.push(new THREE.Vector3(x, 0, z));
        }
      }
      addAtoms(g, pos, 0x222222, 0.18, 12);
      addBondsNear(g, pos, 1.5, 0x444444, 0.055);
    }
    else if (key === 'nanotube'){
      const R = 1.5, segs = 10, rings = 8;
      const pos = [];
      for (let ring = 0; ring < rings; ring++) {
        const y = (ring - rings / 2) * 0.7;
        for (let s = 0; s < segs; s++) {
          const a = (s / segs) * Math.PI * 2 + (ring % 2) * (Math.PI / segs);
          const x = Math.cos(a) * R, z = Math.sin(a) * R;
          pos.push(new THREE.Vector3(x, y, z));
        }
      }
      addAtoms(g, pos, 0x333333, 0.16, 12);
      addBondsNear(g, pos, 1.0, 0x555555, 0.05);
    }
    else if (key === 'o2'){
      const a1 = makeSphere(0.5, 0xee3333), a2 = makeSphere(0.5, 0xee3333);
      a1.position.set(-0.7, 0, 0); a2.position.set(0.7, 0, 0);
      const g1 = makeGlow(0.75, 0xff2200); g1.position.copy(a1.position);
      const g2 = makeGlow(0.75, 0xff2200); g2.position.copy(a2.position);
      g.add(a1); g.add(a2); g.add(g1); g.add(g2);
      g.add(makeBond(a1.position, a2.position, 0xcc2222, 0.1));
      g.add(makeBond(new THREE.Vector3(-0.7,0.12,0), new THREE.Vector3(0.7,0.12,0), 0xcc2222, 0.1));
    }
    else if (key === 'ozone'){
      [[-1.1,-0.3,0],[0,0.5,0],[1.1,-0.3,0]].forEach(([x,y,z]) => {
        const a = makeSphere(0.45, 0x5599ff);
        a.position.set(x,y,z); g.add(a);
        const glow = makeGlow(0.65, 0x4488ff); glow.position.set(x,y,z); g.add(glow);
      });
      g.add(makeBond(new THREE.Vector3(-1.1,-0.3,0), new THREE.Vector3(0,0.5,0), 0x4477cc, 0.09));
      g.add(makeBond(new THREE.Vector3(0,0.5,0), new THREE.Vector3(1.1,-0.3,0), 0x4477cc, 0.09));
    }
    else if (key === 's_rhombic' || key === 's_mono'){
      const N = 8, r = 2.0; const sPos = [];
      const col = key === 's_rhombic' ? 0xddaa00 : 0xeecc22;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const y = (i % 2 === 0) ? 0.4 : -0.4;
        sPos.push(new THREE.Vector3(Math.cos(a)*r, y, Math.sin(a)*r));
      }
      addAtoms(g, sPos, col, 0.38, 16);
      const ring = [];
      for (let i = 0; i < N; i++) ring.push([sPos[i], sPos[(i+1)%N]]);
      addBondList(g, ring, 0xaa8800, 0.1);
    }
    else if (key === 'p_white'){
      const h = Math.sqrt(2/3) * 2.0;
      const pSites = [[0,h*0.75,0],[-1.15,-h*0.25,1.0],[1.15,-h*0.25,1.0],[0,-h*0.25,-1.5]];
      pSites.forEach(([x,y,z]) => {
        const a = makeSphere(0.4, 0xffdd44, 16); a.position.set(x,y,z); g.add(a);
        const glow = makeGlow(0.6, 0xffcc00); glow.position.set(x,y,z); g.add(glow);
      });
      [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]].forEach(([i,j]) => {
        g.add(makeBond(new THREE.Vector3(...pSites[i]), new THREE.Vector3(...pSites[j]), 0xddaa00, 0.09));
      });
    }
    else if (key === 'p_red'){
      const chain = [];
      for (let i = 0; i < 8; i++) {
        const x = (i - 3.5) * 0.9;
        const y = (i % 2 === 0) ? 0.5 : -0.5;
        const z = Math.sin(i * 0.8) * 0.4;
        chain.push(new THREE.Vector3(x,y,z));
      }
      addAtoms(g, chain, 0xcc3311, 0.32, 16);
      const links = [];
      for (let i = 0; i < chain.length - 1; i++) links.push([chain[i], chain[i+1]]);
      addBondList(g, links, 0xaa2200, 0.09);
    }
    else if (key === 'p_black'){
      const a = 1.1, pucker = 0.45, cols = 4, rows = 5;
      [-0.95, 0.95].forEach((yBase, li) => {
        const positions = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x0 = col * a * 2 - cols * a, z0 = row * a * 1.4 - rows * 0.7;
            positions.push(new THREE.Vector3(x0, yBase+pucker, z0));
            positions.push(new THREE.Vector3(x0+a, yBase+pucker, z0));
            positions.push(new THREE.Vector3(x0+a*0.5, yBase-pucker, z0+a*0.7));
            positions.push(new THREE.Vector3(x0+a*1.5, yBase-pucker, z0+a*0.7));
          }
        }
        const xs = positions.map(p=>p.x), zs = positions.map(p=>p.z);
        const cx = (Math.min(...xs)+Math.max(...xs))/2;
        const cz = (Math.min(...zs)+Math.max(...zs))/2;
        positions.forEach(p => { p.x -= cx; p.z -= cz; });
        const shade = li === 0 ? 0x4a1d6b : 0x6b2d8a;
        addAtoms(g, positions, shade, 0.26, 12);
        addGlows(g, positions, 0x7c3aed, 0.38);
        addBondsNear(g, positions, a * 1.15, 0x5b21b6, 0.06);
      });
    }
    return g;
  }

  let currentAllotrope = 'graphite';
  let currentElement   = 'carbon';

  function rebuildScene(){
    if (paper() && paper().replaceChild) {
      currentGroup = paper().replaceChild(scene, currentGroup, buildAllotrope(currentAllotrope));
    } else {
      scene.remove(currentGroup);
      currentGroup = buildAllotrope(currentAllotrope);
      scene.add(currentGroup);
    }
    rotX = 0; rotY = 0;
    camera.position.set(0, 0.35, DEFAULT_CAM_Z);
    if (intro) intro.restart();
    if (!intro || !intro.isHeld()) {
      autoRotate = !((paper() && paper().prefersReducedMotion && paper().prefersReducedMotion()));
    }
    updateRotateBtn();
  }

  function _i18nTr(k, fb){
    return (window.I18N && window.I18N.t) ? window.I18N.t(k, { fallback: fb }) : fb;
  }

  // Per-allotrope molecular formula + dynamic molar mass.
  const alloFormula = {
    graphite:'C', diamond:'C', fullerene:'C₆₀', graphene:'C', nanotube:'C',
    o2:'O₂', ozone:'O₃',
    s_rhombic:'S₈', s_mono:'S₈',
    p_white:'P₄', p_red:'P', p_black:'P'
  };
  const ATOMIC_MASS = { H:1.008, He:4.003, C:12.011, N:14.007, O:15.999, F:18.998, Ne:20.180, Na:22.990, Mg:24.305, Al:26.982, Si:28.085, P:30.974, S:32.06, Cl:35.45, K:39.098, Ca:40.078, Fe:55.845, Cu:63.546, Zn:65.38, Br:79.904, Ag:107.868, I:126.904, Ba:137.327, Pt:195.084, Au:196.967, Hg:200.592, Pb:207.2 };
  function computeAlloStats(formula){
    const flat = String(formula || '').replace(/[₀-₉]/g, c => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)));
    const re = /([A-Z][a-z]?)(\d*)/g;
    const counts = {};
    let total = 0, cur, ok = true;
    while ((cur = re.exec(flat))) {
      const el = cur[1], n = cur[2] ? parseInt(cur[2], 10) : 1;
      if (!ATOMIC_MASS[el]) { ok = false; break; }
      counts[el] = (counts[el] || 0) + n;
    }
    if (!ok || !Object.keys(counts).length) return '';
    Object.keys(counts).forEach(el => { total += ATOMIC_MASS[el] * counts[el]; });
    return formula + ' · MM ' + total.toFixed(2) + ' g/mol';
  }

  window.setAlloElement = function(elem){
    if (!alloElements[elem]) return;
    currentElement = elem;
    const variants = alloElements[elem];
    currentAllotrope = variants[0];
    const container = document.getElementById('allo-variants');
    container.innerHTML = '';
    variants.forEach((v, idx) => {
      const btn = document.createElement('button');
      btn.className = 'pill purple allo-btn' + (idx===0 ? ' active' : '');
      btn.dataset.allo = v;
      btn.setAttribute('data-i18n', 'allotropes.allo.' + v + '.short');
      btn.textContent = _i18nTr('allotropes.allo.' + v + '.short', alloVariantLabels[v]);
      btn.onclick = () => setAllotrope(v);
      container.appendChild(btn);
    });
    document.querySelectorAll('.allo-elem-btn').forEach(b => b.classList.toggle('active', b.dataset.elem === elem));
    document.getElementById('av-elem').textContent = _i18nTr('allotropes.elem.' + elem + '.short', elem);
    setAllotrope(currentAllotrope, true);
  };

  window.setAllotrope = function(key, skipBtn){
    if (!alloMeta[key]) return;
    currentAllotrope = key;
    rebuildScene();
    const tName  = _i18nTr('allotropes.allo.' + key + '.name',  alloMeta[key].name);
    const tDesc  = _i18nTr('allotropes.allo.' + key + '.desc',  alloMeta[key].desc);
    const tShort = _i18nTr('allotropes.allo.' + key + '.short', alloVariantLabels[key].toLowerCase());
    const nameEl = document.getElementById('model-name');
    const descEl = document.getElementById('model-desc');
    nameEl.setAttribute('data-i18n', 'allotropes.allo.' + key + '.name');
    descEl.setAttribute('data-i18n', 'allotropes.allo.' + key + '.desc');
    nameEl.textContent = tName;
    descEl.textContent = tDesc;
    const statsEl = document.getElementById('model-stats');
    if (statsEl) statsEl.textContent = computeAlloStats(alloFormula[key] || '');
    document.getElementById('av-allo').textContent = tShort;
    if (!skipBtn) {
      document.querySelectorAll('.allo-btn').forEach(b => b.classList.toggle('active', b.dataset.allo === key));
    }
  };

  window.toggleAutoRotate = function(){
    if (intro) intro.userToggle();
    autoRotate = !autoRotate; updateRotateBtn();
  };
  window.resetView = function(){
    rotX = 0; rotY = 0;
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
    paper().bindLiveLoop(canvas, tickFrame, {
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

  setAlloElement('carbon');

  // Allotrope / element quick search.
  (function initAlloSearch(){
    const inp = document.querySelector('.allo-search');
    if (!inp) return;
    const none = document.querySelector('.allo-search-none');
    const SUBSCRIPT = '₀₁₂₃₄₅₆₇₈₉';
    function norm(s){
      return String(s || '').toLowerCase()
        .replace(/[₀-₉]/g, c => String(SUBSCRIPT.indexOf(c)))
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    function allKeys(){
      const out = [];
      Object.keys(alloElements).forEach(el => alloElements[el].forEach(v => out.push({ el, v })));
      return out;
    }
    function apply(){
      const q = norm(inp.value.trim());
      const matches = [];
      if (q) {
        allKeys().forEach(item => {
          const v = item.v;
          const hay = norm(_i18nTr('allotropes.allo.' + v + '.short', alloVariantLabels[v])) + ' ' +
                      norm(_i18nTr('allotropes.allo.' + v + '.name', alloMeta[v].name)) + ' ' +
                      norm(alloFormula[v] || '');
          if (hay.indexOf(q) !== -1) matches.push(item);
        });
      }
      document.querySelectorAll('.allo-elem-btn').forEach(b => {
        const el = b.dataset.elem;
        const elHay = norm(_i18nTr('allotropes.elem.' + el + '.label', el));
        const show = !q || elHay.indexOf(q) !== -1 || matches.some(m => m.el === el);
        b.style.display = show ? '' : 'none';
      });
      if (q && matches.length) {
        if (none) none.style.display = 'none';
        const matchedEls = matches.map(m => m.el);
        const targetEl = matchedEls.indexOf(currentElement) !== -1 ? currentElement : matchedEls[0];
        if (targetEl !== currentElement) setAlloElement(targetEl);
        if (!matches.some(m => m.v === currentAllotrope)) setAllotrope(matches[0].v);
        document.querySelectorAll('.allo-btn').forEach(b => {
          b.style.display = matches.some(m => m.v === b.dataset.allo) ? '' : 'none';
        });
      } else {
        if (none) none.style.display = (q && !matches.length) ? '' : 'none';
        document.querySelectorAll('.allo-btn').forEach(b => { b.style.display = ''; });
      }
    }
    inp.addEventListener('input', apply);
    if (window.I18N && window.I18N.onChange) window.I18N.onChange(apply);
  })();

  // Re-render dynamic strings when user switches language (retry until I18N is ready)
  (function wireI18n(){
    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(function () {
        if (currentElement) window.setAlloElement(currentElement);
      });
      if (currentElement) window.setAlloElement(currentElement);
    } else {
      setTimeout(wireI18n, 50);
    }
  })();
})();
  };
})(typeof window !== 'undefined' ? window : this);
