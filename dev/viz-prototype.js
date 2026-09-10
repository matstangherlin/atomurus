(function () {
  'use strict';

  var COPY = {
    en: {
      kicker: 'Internal prototype · not indexed',
      title: 'Paper models',
      lede: 'The molecule already sits in a paper laboratory — cream stage, quieter light, light and dark. This page puts every atomic model in that same room, 3D beside 2D, without changing production viewers.',
      note: 'Prototype only. Production molecules, atomic models, allotropes and isomerism stay as they are until this direction is chosen.',
      compareTitle: 'Same molecule, two rooms',
      compareMeta: 'H₂O. Drag either canvas — both share the same orbit. Left is today’s lighting. Right is the paper scene you liked.',
      nowCap: 'Now · white void',
      paperCap: 'Paper laboratory',
      repTitle: 'Representations',
      repMeta: 'Ball-and-stick for bonding. Space-fill for volume. Stick for the skeleton. Same coordinates.',
      legend: 'O oxygen · H hydrogen · CPK colors, warmer hydrogen so it reads on cream.',
      atomTitle: 'Atomic models',
      atomMeta: 'Carbon, Z = 6. Same paper room as the molecule. Switch Dalton through Quantum. Keep 3D, 2D, or both — light and dark.',
      daltonCap: 'Dalton · 1803 · indivisible solid. No nucleus, no electrons.',
      thomsonCap: 'Thomson · 1897 · plum pudding. Electrons in a diffuse positive sphere.',
      rutherfordCap: 'Rutherford · 1911 · dense nucleus, planetary orbits. Same 6 electrons.',
      bohrCap: 'Bohr · 1913 · quantized K (2) and L (4) shells. Ink electrons, green orbits.',
      quantumCap: 'Quantum · 1926 · |ψ|² clouds. Carbon 1s² 2s² 2p², not a white-void point spray.',
      orbTitle: '2D orbital density',
      orbMeta: 'A 2p_z close-up on paper. Production quantum 3D is a point cloud in a white void.',
      nextTitle: 'If this direction holds',
      n1: 'Carry paper clear color, quieter lights and contact ground into molecule / atomic runtimes.',
      n2: 'Add ball-and-stick / space-fill / stick on molecules. Do not invent new pedagogy.',
      n3: 'Replace the five production atomic models with this paper 3D/2D pair. Keep Dalton–Quantum as history.',
      n4: 'Cap devicePixelRatio, add touch orbit on molecules and allotropes.',
      n5: 'Leave Open Lab public. Prototype stays on /dev/ until chosen.'
    },
    pt: {
      kicker: 'Protótipo interno · não indexado',
      title: 'Modelos em papel',
      lede: 'A molécula já está num laboratório de papel — fundo cream, luz quieta, claro e escuro. Esta página coloca todos os modelos atômicos nessa mesma sala, 3D ao lado do 2D, sem alterar os visualizadores de produção.',
      note: 'Só protótipo. Moléculas, modelos atômicos, alótropos e isomeria de produção continuam como estão até esta direção ser escolhida.',
      compareTitle: 'A mesma molécula, duas salas',
      compareMeta: 'H₂O. Arraste qualquer canvas — os dois compartilham a órbita. À esquerda, a luz de hoje. À direita, a cena de papel que você gostou.',
      nowCap: 'Hoje · vazio branco',
      paperCap: 'Laboratório de papel',
      repTitle: 'Representações',
      repMeta: 'Ball-and-stick para ligações. Space-fill para volume. Stick para o esqueleto. As mesmas coordenadas.',
      legend: 'O oxigênio · H hidrogênio · cores CPK, hidrogênio mais quente para ler no cream.',
      atomTitle: 'Modelos atômicos',
      atomMeta: 'Carbono, Z = 6. A mesma sala de papel da molécula. Dalton até Quântico. 3D, 2D ou os dois — claro e escuro.',
      daltonCap: 'Dalton · 1803 · sólido indivisível. Sem núcleo, sem elétrons.',
      thomsonCap: 'Thomson · 1897 · pudim de passas. Elétrons numa esfera positiva difusa.',
      rutherfordCap: 'Rutherford · 1911 · núcleo denso, órbitas planetárias. Os mesmos 6 elétrons.',
      bohrCap: 'Bohr · 1913 · cascas K (2) e L (4) quantizadas. Elétrons tinta, órbitas verdes.',
      quantumCap: 'Quântico · 1926 · nuvens |ψ|². Carbono 1s² 2s² 2p², não um spray no vazio branco.',
      orbTitle: 'Densidade orbital 2D',
      orbMeta: 'Um close de 2p_z em papel. O quântico 3D de produção é uma nuvem de pontos no vazio branco.',
      nextTitle: 'Se esta direção se confirmar',
      n1: 'Levar cor de fundo de papel, luz mais quieta e o chão de contato para os runtimes de molécula e átomo.',
      n2: 'Adicionar ball-and-stick / space-fill / stick nas moléculas. Sem pedagogia nova.',
      n3: 'Trocar os cinco modelos atômicos de produção por este par 3D/2D em papel. Manter Dalton–Quântico como história.',
      n4: 'Limitar devicePixelRatio e adicionar órbita por toque em moléculas e alótropos.',
      n5: 'Manter o Open Lab público. O protótipo fica em /dev/ até ser escolhido.'
    }
  };

  var WATER = {
    atoms: [
      { el: 'O', pos: [0, 0.12, 0], r: 0.38, color: 0xC94A3A, vdw: 0.70 },
      { el: 'H', pos: [-0.786, -0.54, 0], r: 0.22, color: 0xE7E2D4, vdw: 0.52 },
      { el: 'H', pos: [0.786, -0.54, 0], r: 0.22, color: 0xE7E2D4, vdw: 0.52 }
    ],
    bonds: [[0, 1, 1], [0, 2, 1]]
  };

  var PAPER = 0xF2EFE7;
  var PAPER_DARK = 0x0E0D0C;
  var INK = 0x14120E;
  var GREEN = 0x1E6A50;
  var PROTON = 0xC45C4A;
  var molOrbit = { rotX: 0.35, rotY: 0.6, z: 5.4 };
  var atomOrbit = { rotX: 0.28, rotY: 0.55, z: 6.6 };
  var repStyle = 'ball';
  var atomKey = 'bohr';
  var showAtom3d = true;
  var showAtom2d = true;
  var views = [];
  var molNowView;
  var molPaperView;
  var molRepView;
  var atomView;
  var _scratch = null;

  function langIsPt() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  }

  function pack() {
    return langIsPt() ? COPY.pt : COPY.en;
  }

  function applyCopy() {
    var p = pack();
    document.querySelectorAll('[data-copy]').forEach(function (node) {
      var key = node.getAttribute('data-copy');
      if (p[key]) node.textContent = p[key];
    });
    var langBtn = document.getElementById('viz-lang');
    if (langBtn) langBtn.textContent = langIsPt() ? 'EN' : 'PT';
    setAtomCaption();
  }

  function setAtomCaption() {
    var node = document.getElementById('atom-caption');
    var key = atomKey + 'Cap';
    if (node && pack()[key]) {
      node.textContent = pack()[key];
      node.setAttribute('data-copy', key);
    }
  }

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function sizeCanvas(canvas) {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.round(rect.width * dpr));
    var h = Math.max(2, Math.round(rect.height * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    return { w: rect.width, h: rect.height, dpr: dpr };
  }

  function vec() {
    if (!_scratch) {
      _scratch = {
        a: new THREE.Vector3(),
        b: new THREE.Vector3(),
        c: new THREE.Vector3(),
        e: new THREE.Euler()
      };
    }
    return _scratch;
  }

  function makeRenderer(canvas, paper, opts) {
    opts = opts || {};
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0, opts.y || 0.35, opts.z || 5.4);
    if (paper) {
      scene.add(new THREE.HemisphereLight(isDark() ? 0x3A4A44 : 0xF8F5EC, isDark() ? 0x1A1814 : 0x9A9480, 0.72));
      var key = new THREE.DirectionalLight(0xFFF6E8, 0.78);
      key.position.set(4.2, 7.5, 5.5);
      scene.add(key);
      var fill = new THREE.DirectionalLight(GREEN, 0.16);
      fill.position.set(-6, 1.5, 2);
      scene.add(fill);
      var rim = new THREE.DirectionalLight(0xE8DCC0, 0.28);
      rim.position.set(-2, 3, -8);
      scene.add(rim);
    } else {
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      var d1 = new THREE.DirectionalLight(0xffffff, 1.0);
      d1.position.set(5, 10, 7);
      scene.add(d1);
      var d2 = new THREE.DirectionalLight(0x88bbff, 0.5);
      d2.position.set(-5, -3, -5);
      scene.add(d2);
      var d3 = new THREE.DirectionalLight(0xffeecc, 0.3);
      d3.position.set(0, 5, -8);
      scene.add(d3);
    }
    return {
      renderer: renderer,
      scene: scene,
      camera: camera,
      paper: paper,
      group: null,
      camY: opts.y || 0.35,
      orbitState: opts.state || molOrbit,
      groundScale: opts.ground || 1
    };
  }

  function paintClear(view) {
    view.renderer.setClearColor(view.paper ? (isDark() ? PAPER_DARK : PAPER) : (isDark() ? 0x000000 : 0xffffff), 1);
  }

  function paperGround(scale) {
    scale = scale || 1;
    var geo = new THREE.CircleGeometry(3.6 * scale, 64);
    var mat = new THREE.MeshStandardMaterial({
      color: isDark() ? 0x171512 : 0xE6E1D3,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: 0.7
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1.15 * scale;
    var shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.15 * scale, 48),
      new THREE.MeshBasicMaterial({ color: 0x14120E, transparent: true, opacity: isDark() ? 0.35 : 0.12 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.12 * scale;
    shadow.scale.set(1.4, 0.55, 1);
    var g = new THREE.Group();
    g.add(mesh);
    g.add(shadow);
    return g;
  }

  function atomMaterial(color, paper) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: paper ? 0.48 : 0.35,
      metalness: paper ? 0.04 : 0.15
    });
  }

  function buildMolecule(mol, style, paper) {
    var g = new THREE.Group();
    var i;
    for (i = 0; i < mol.atoms.length; i += 1) {
      var a = mol.atoms[i];
      var radius = style === 'space' ? a.vdw : (style === 'stick' ? 0.09 : a.r);
      var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, style === 'space' ? 36 : 28, style === 'space' ? 36 : 28),
        atomMaterial(a.color, paper)
      );
      mesh.position.fromArray(a.pos);
      g.add(mesh);
    }
    if (style !== 'space') {
      for (i = 0; i < mol.bonds.length; i += 1) {
        var b = mol.bonds[i];
        var a1 = mol.atoms[b[0]];
        var a2 = mol.atoms[b[1]];
        var p1 = vec().a.fromArray(a1.pos);
        var p2 = vec().b.fromArray(a2.pos);
        var dir = vec().c.subVectors(p2, p1);
        var len = dir.length();
        var rBond = style === 'stick' ? 0.07 : 0.075;
        var cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(rBond, rBond, Math.max(0.08, len - (style === 'stick' ? 0.04 : a1.r + a2.r - 0.06)), 14),
          new THREE.MeshStandardMaterial({
            color: paper ? 0x5A554C : 0x888888,
            roughness: 0.55,
            metalness: 0.05
          })
        );
        cyl.position.copy(p1).add(p2).multiplyScalar(0.5);
        cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        g.add(cyl);
      }
    }
    return g;
  }

  function nucleonOrder() {
    var z = 6;
    var n = 6;
    var total = z + n;
    var order = [];
    var placedP = 0;
    var placedN = 0;
    var i;
    for (i = 0; i < total; i += 1) {
      var expectedP = Math.round((i + 1) * z / total);
      if (placedP < expectedP && placedP < z) {
        order.push('p');
        placedP += 1;
      } else if (placedN < n) {
        order.push('n');
        placedN += 1;
      } else {
        order.push('p');
        placedP += 1;
      }
    }
    return order;
  }

  function makeNucleus() {
    var g = new THREE.Group();
    var order = nucleonOrder();
    var total = order.length;
    var partR = 0.16;
    var clusterR = 0.52;
    var i;
    for (i = 0; i < total; i += 1) {
      var phi = Math.acos(1 - 2 * (i + 0.5) / total);
      var theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(partR, 16, 16),
        atomMaterial(order[i] === 'p' ? PROTON : GREEN, true)
      );
      mesh.position.set(
        clusterR * Math.cos(theta) * Math.sin(phi),
        clusterR * Math.sin(theta) * Math.sin(phi),
        clusterR * Math.cos(phi)
      );
      g.add(mesh);
    }
    return g;
  }

  function makeElectron(r) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(r || 0.11, 16, 16),
      atomMaterial(isDark() ? 0xE8E2D4 : INK, true)
    );
  }

  function makeOrbitRing(radius, tiltX, tiltY, tiltZ) {
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.018, 10, 120),
      new THREE.MeshStandardMaterial({
        color: GREEN,
        roughness: 0.55,
        metalness: 0.06,
        transparent: true,
        opacity: 0.55
      })
    );
    ring.rotation.set(tiltX, tiltY || 0, tiltZ || 0);
    return ring;
  }

  function buildDalton() {
    var g = new THREE.Group();
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 40, 40),
      new THREE.MeshStandardMaterial({
        color: isDark() ? 0x6B5A42 : 0x8A6A4A,
        roughness: 0.62,
        metalness: 0.04
      })
    ));
    return g;
  }

  function buildThomson() {
    var g = new THREE.Group();
    var pudding = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xD4A07A,
        transparent: true,
        opacity: isDark() ? 0.22 : 0.32,
        roughness: 0.86,
        metalness: 0,
        side: THREE.DoubleSide
      })
    );
    g.add(pudding);
    var points = [
      [0.72, 0.42, 0.28], [-0.82, 0.18, 0.62], [0.18, -0.98, 0.36],
      [-0.36, 0.82, -0.52], [0.9, -0.28, -0.72], [-0.64, -0.72, 0.44]
    ];
    var i;
    for (i = 0; i < 6; i += 1) {
      var e = makeElectron(0.12);
      e.position.fromArray(points[i]);
      g.add(e);
    }
    g.position.y = 0.22;
    return g;
  }

  function buildRutherford() {
    var g = new THREE.Group();
    g.add(makeNucleus());
    var orbits = [
      { r: 2.05, eX: Math.PI / 6, eY: 0, eZ: Math.PI / 4, n: 2, speed: 0.95 },
      { r: 2.05, eX: -Math.PI / 5, eY: Math.PI / 3, eZ: 0, n: 2, speed: 0.62 },
      { r: 2.05, eX: Math.PI / 2.5, eY: Math.PI / 1.5, eZ: 0.5, n: 2, speed: 0.48 }
    ];
    orbits.forEach(function (orb) {
      g.add(makeOrbitRing(orb.r, orb.eX, orb.eY, orb.eZ));
      var i;
      for (i = 0; i < orb.n; i += 1) {
        var e = makeElectron(0.11);
        e.userData = {
          kind: 'ruth',
          r: orb.r,
          phase: (i / orb.n) * Math.PI * 2,
          speed: orb.speed,
          eX: orb.eX,
          eY: orb.eY,
          eZ: orb.eZ
        };
        g.add(e);
      }
    });
    return g;
  }

  function buildBohr() {
    var g = new THREE.Group();
    g.add(makeNucleus());
    var shells = [
      { r: 1.35, n: 2, tilt: 0.12, speed: 1.05 },
      { r: 2.25, n: 4, tilt: -0.18, speed: 0.62 }
    ];
    shells.forEach(function (shell) {
      g.add(makeOrbitRing(shell.r, Math.PI / 2 + shell.tilt, 0, 0));
      var i;
      for (i = 0; i < shell.n; i += 1) {
        var e = makeElectron(0.11);
        e.userData = {
          kind: 'bohr',
          r: shell.r,
          tilt: shell.tilt,
          phase: (i / shell.n) * Math.PI * 2,
          speed: shell.speed
        };
        g.add(e);
      }
    });
    return g;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function buildQuantum() {
    var g = new THREE.Group();
    g.add(makeNucleus());
    var rnd = mulberry32(6 * 1926);
    var positions = [];
    var colors = [];
    var green = new THREE.Color(GREEN);
    var ink = new THREE.Color(isDark() ? 0xE8E2D4 : INK);
    var i;
    var r;
    var phi;
    var ct;
    var st;
    function push(x, y, z, color) {
      positions.push(x, y, z);
      colors.push(color.r, color.g, color.b);
    }
    for (i = 0; i < 220; i += 1) {
      r = 0.35 + rnd() * 0.55;
      phi = rnd() * Math.PI * 2;
      ct = 2 * rnd() - 1;
      st = Math.sqrt(Math.max(0, 1 - ct * ct));
      push(st * Math.cos(phi) * r, st * Math.sin(phi) * r, ct * r, green);
    }
    for (i = 0; i < 280; i += 1) {
      r = 1.05 + rnd() * 0.95;
      phi = rnd() * Math.PI * 2;
      ct = 2 * rnd() - 1;
      st = Math.sqrt(Math.max(0, 1 - ct * ct));
      push(st * Math.cos(phi) * r, st * Math.sin(phi) * r, ct * r, ink);
    }
    for (i = 0; i < 420; i += 1) {
      r = 0.9 + rnd() * 1.7;
      ct = Math.cbrt(2 * rnd() - 1);
      st = Math.sqrt(Math.max(0, 1 - ct * ct));
      phi = rnd() * Math.PI * 2;
      push(st * Math.cos(phi) * r * 0.55, st * Math.sin(phi) * r * 0.55, ct * r, ct >= 0 ? green : ink);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      sizeAttenuation: true,
      depthWrite: false
    })));
    return g;
  }

  function buildAtom(key) {
    if (key === 'dalton') return buildDalton();
    if (key === 'thomson') return buildThomson();
    if (key === 'rutherford') return buildRutherford();
    if (key === 'quantum') return buildQuantum();
    return buildBohr();
  }

  function bindOrbit(canvas, view) {
    var dragging = false;
    var lastX = 0;
    var lastY = 0;
    var state = view.orbitState;
    function onDown(x, y) {
      dragging = true;
      lastX = x;
      lastY = y;
    }
    function onMove(x, y) {
      if (!dragging) return;
      state.rotY += (x - lastX) * 0.008;
      state.rotX += (y - lastY) * 0.008;
      state.rotX = Math.max(-1.15, Math.min(1.15, state.rotX));
      lastX = x;
      lastY = y;
    }
    canvas.addEventListener('mousedown', function (e) { onDown(e.clientX, e.clientY); });
    window.addEventListener('mouseup', function () { dragging = false; });
    window.addEventListener('mousemove', function (e) { onMove(e.clientX, e.clientY); });
    canvas.addEventListener('touchstart', function (e) {
      onDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('wheel', function (e) {
      var minZ = state === atomOrbit ? 4.2 : 3.4;
      var maxZ = state === atomOrbit ? 14 : 12;
      state.z = Math.max(minZ, Math.min(maxZ, state.z + e.deltaY * 0.01));
      e.preventDefault();
    }, { passive: false });
  }

  function resizeView(view) {
    var el = view.renderer.domElement;
    if (el.closest && el.closest('.is-off')) return;
    var box = sizeCanvas(el);
    view.camera.aspect = Math.max(0.2, box.w / box.h);
    view.camera.updateProjectionMatrix();
    view.renderer.setSize(box.w, box.h, false);
  }

  function setGroup(view, group) {
    if (view.group) view.scene.remove(view.group);
    view.group = group;
    view.scene.add(group);
    if (view.paper) {
      if (view.ground) view.scene.remove(view.ground);
      view.ground = paperGround(view.groundScale || 1);
      view.scene.add(view.ground);
    }
  }

  function tickAtom(group, t) {
    var s = vec();
    group.children.forEach(function (child) {
      var d = child.userData;
      if (!d || !d.kind) return;
      var a = d.phase + t * d.speed;
      if (d.kind === 'bohr') {
        child.position.set(
          d.r * Math.cos(a),
          Math.sin(d.tilt) * d.r * 0.35 * Math.sin(a),
          d.r * Math.sin(a)
        );
        return;
      }
      if (d.kind === 'ruth') {
        s.a.set(d.r * Math.cos(a), 0, d.r * Math.sin(a));
        s.e.set(d.eX, d.eY, d.eZ);
        child.position.copy(s.a.applyEuler(s.e));
      }
    });
  }

  function paperFill(ctx, w, h) {
    ctx.fillStyle = isDark() ? '#0E0D0C' : '#F2EFE7';
    ctx.fillRect(0, 0, w, h);
  }

  function drawNucleus2d(ctx, cx, cy, s) {
    var order = nucleonOrder();
    var i;
    var total = order.length;
    var maxR = s * 0.16;
    var partR = Math.max(3, s * 0.055);
    for (i = 0; i < total; i += 1) {
      var a = i * Math.PI * (3 - Math.sqrt(5));
      var r = Math.sqrt((i + 0.5) / total) * maxR;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, partR, 0, Math.PI * 2);
      ctx.fillStyle = order[i] === 'p' ? '#C45C4A' : '#1E6A50';
      ctx.fill();
    }
  }

  function drawElectron2d(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = isDark() ? '#E8E2D4' : '#14120E';
    ctx.fill();
  }

  function drawAtom2d(canvas, key, t) {
    if (canvas.closest && canvas.closest('.is-off')) return;
    var box = sizeCanvas(canvas);
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var dark = isDark();
    var dpr = box.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    paperFill(ctx, w, h);
    var cx = w / 2;
    var cy = h / 2;
    var s = Math.min(w, h) / 2.35;
    var time = t || 0;
    var i;
    var cap = pack()[key + 'Cap'] || key;

    if (key === 'dalton') {
      var grad = ctx.createRadialGradient(cx - s * 0.22, cy - s * 0.24, s * 0.08, cx, cy, s * 0.72);
      grad.addColorStop(0, dark ? '#8A7358' : '#C8A880');
      grad.addColorStop(1, dark ? '#4A4438' : '#7A5C38');
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    } else if (key === 'thomson') {
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.78, 0, Math.PI * 2);
      ctx.fillStyle = dark ? 'rgba(212,160,122,0.22)' : 'rgba(212,160,122,0.32)';
      ctx.fill();
      ctx.strokeStyle = dark ? 'rgba(212,160,122,0.45)' : 'rgba(138,106,74,0.4)';
      ctx.lineWidth = Math.max(1.2, w / 420);
      ctx.stroke();
      [[0.72, 0.42], [-0.82, 0.18], [0.18, -0.98], [-0.36, 0.82], [0.9, -0.28], [-0.64, -0.72]].forEach(function (p) {
        drawElectron2d(ctx, cx + p[0] * s * 0.55, cy + p[1] * s * 0.55, Math.max(3.4, w / 85));
      });
    } else if (key === 'rutherford') {
      var ellipses = [
        { rx: 0.82, ry: 0.38, rot: Math.PI / 7, n: 2, sp: 0.42 },
        { rx: 0.82, ry: 0.38, rot: -Math.PI / 4.5, n: 2, sp: 0.32 },
        { rx: 0.82, ry: 0.38, rot: Math.PI / 2.2, n: 2, sp: 0.24 }
      ];
      ctx.strokeStyle = dark ? '#2A6B55' : '#1E6A50';
      ctx.lineWidth = Math.max(1.2, w / 420);
      ctx.globalAlpha = 0.7;
      ellipses.forEach(function (o) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(o.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, s * o.rx, s * o.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      ellipses.forEach(function (o) {
        for (i = 0; i < o.n; i += 1) {
          var a = time * o.sp + (i / o.n) * Math.PI * 2;
          var lx = s * o.rx * Math.cos(a);
          var ly = s * o.ry * Math.sin(a);
          drawElectron2d(
            ctx,
            cx + lx * Math.cos(o.rot) - ly * Math.sin(o.rot),
            cy + lx * Math.sin(o.rot) + ly * Math.cos(o.rot),
            Math.max(3.2, w / 90)
          );
        }
      });
      drawNucleus2d(ctx, cx, cy, s);
    } else if (key === 'quantum') {
      drawOrbitalField(ctx, w, h, cx, cy, Math.min(w, h) * 0.16);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(4, s * 0.045), 0, Math.PI * 2);
      ctx.fillStyle = '#1E6A50';
      ctx.fill();
    } else {
      ctx.strokeStyle = dark ? '#2A6B55' : '#1E6A50';
      ctx.lineWidth = Math.max(1.2, w / 420);
      ctx.globalAlpha = 0.7;
      [0.42, 0.72].forEach(function (r) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * r, s * r * 0.92, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      drawNucleus2d(ctx, cx, cy, s * 0.85);
      var electrons = [
        [0.42, -0.4, 1.05], [0.42, 2.6, 1.05],
        [0.72, 0.3, 0.62], [0.72, 1.8, 0.62], [0.72, 3.4, 0.62], [0.72, 4.9, 0.62]
      ];
      electrons.forEach(function (e) {
        var a = e[1] + time * e[2];
        drawElectron2d(ctx, cx + Math.cos(a) * s * e[0], cy + Math.sin(a) * s * e[0] * 0.92, Math.max(3, w / 90));
      });
    }

    ctx.font = (10 * dpr) + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = dark ? '#B8B3A4' : '#58544A';
    ctx.textAlign = 'left';
    ctx.fillText(cap.split(' · ').slice(0, 2).join('  ·  '), 16 * dpr, h - 16 * dpr);
  }

  function drawOrbitalField(ctx, w, h, cx, cy, scale) {
    var dark = isDark();
    var paper = dark ? [14, 13, 12] : [242, 239, 231];
    var plus = dark ? [122, 186, 158] : [30, 106, 80];
    var minus = dark ? [232, 226, 212] : [20, 18, 14];
    var img = ctx.createImageData(w, h);
    var data = img.data;
    var norm = Math.E * Math.E / 4;
    var px;
    var pz;
    var x;
    var z;
    var r;
    var tt;
    var i;
    var ch;
    for (pz = 0; pz < h; pz += 1) {
      z = (cy - pz) * (5.4 / Math.max(1, Math.min(h, w) * 0.42));
      for (px = 0; px < w; px += 1) {
        x = (px - cx) * (5.4 / Math.max(1, Math.min(h, w) * 0.42));
        r = Math.sqrt(x * x + z * z);
        tt = Math.min(1, z * z * Math.exp(-r) * norm);
        tt = Math.pow(tt, 0.62);
        i = (pz * w + px) * 4;
        ch = z >= 0 ? plus : minus;
        data[i] = paper[0] + (ch[0] - paper[0]) * tt;
        data[i + 1] = paper[1] + (ch[1] - paper[1]) * tt;
        data[i + 2] = paper[2] + (ch[2] - paper[2]) * tt;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawOrbital2d(canvas) {
    var box = sizeCanvas(canvas);
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var dark = isDark();
    drawOrbitalField(ctx, w, h, w / 2, h / 2);
    ctx.strokeStyle = dark ? 'rgba(242,239,231,.22)' : 'rgba(20,18,14,.16)';
    ctx.lineWidth = Math.max(1, box.dpr);
    ctx.beginPath();
    ctx.moveTo(24 * box.dpr, h / 2);
    ctx.lineTo(w - 24 * box.dpr, h / 2);
    ctx.stroke();
    ctx.font = (10 * box.dpr) + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = dark ? '#B8B3A4' : '#58544A';
    ctx.fillText('2p_z  ·  |ψ|²', 16 * box.dpr, h - 16 * box.dpr);
    ctx.fillText('nodal plane', 16 * box.dpr, h / 2 - 8 * box.dpr);
  }

  function fitView(view) {
    resizeView(view);
    paintClear(view);
  }

  function syncAtomStages() {
    var split = document.getElementById('atom-split');
    var s3 = document.getElementById('atom-3d-stage');
    var s2 = document.getElementById('atom-2d-stage');
    s3.classList.toggle('is-off', !showAtom3d);
    s2.classList.toggle('is-off', !showAtom2d);
    split.classList.toggle('is-one', !(showAtom3d && showAtom2d));
    s3.classList.toggle('viz-stage-tall', showAtom3d && !showAtom2d);
    s2.classList.toggle('viz-stage-tall', showAtom2d && !showAtom3d);
    document.querySelectorAll('[data-atom-view]').forEach(function (btn) {
      var on = btn.getAttribute('data-atom-view') === '3d' ? showAtom3d : showAtom2d;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (atomView) fitView(atomView);
    drawAtom2d(document.getElementById('atom-2d'), atomKey, 0);
  }

  function loadAtom() {
    if (!atomView) return;
    setGroup(atomView, buildAtom(atomKey));
    setAtomCaption();
    drawAtom2d(document.getElementById('atom-2d'), atomKey, 0);
  }

  function start() {
    if (!window.THREE) return;
    applyCopy();
    molNowView = makeRenderer(document.getElementById('mol-now'), false, { state: molOrbit, z: 5.4 });
    molPaperView = makeRenderer(document.getElementById('mol-paper'), true, { state: molOrbit, z: 5.4 });
    molRepView = makeRenderer(document.getElementById('mol-rep'), true, { state: molOrbit, z: 5.4 });
    atomView = makeRenderer(document.getElementById('atom-3d'), true, {
      state: atomOrbit,
      z: 6.6,
      y: 0.2,
      ground: 1.15
    });
    setGroup(molNowView, buildMolecule(WATER, 'ball', false));
    setGroup(molPaperView, buildMolecule(WATER, 'ball', true));
    setGroup(molRepView, buildMolecule(WATER, 'ball', true));
    setGroup(atomView, buildAtom(atomKey));
    bindOrbit(molNowView.renderer.domElement, molNowView);
    bindOrbit(molPaperView.renderer.domElement, molPaperView);
    bindOrbit(molRepView.renderer.domElement, molRepView);
    bindOrbit(atomView.renderer.domElement, atomView);
    views = [molNowView, molPaperView, molRepView, atomView];
    views.forEach(fitView);
    drawAtom2d(document.getElementById('atom-2d'), atomKey, 0);
    drawOrbital2d(document.getElementById('orbital-2d'));

    document.querySelectorAll('[data-rep]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-rep]').forEach(function (el) { el.classList.remove('is-on'); });
        btn.classList.add('is-on');
        repStyle = btn.getAttribute('data-rep');
        setGroup(molRepView, buildMolecule(WATER, repStyle, true));
      });
    });

    document.querySelectorAll('[data-atom]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-atom]').forEach(function (el) { el.classList.remove('is-on'); });
        btn.classList.add('is-on');
        atomKey = btn.getAttribute('data-atom');
        loadAtom();
      });
    });

    document.querySelectorAll('[data-atom-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var which = btn.getAttribute('data-atom-view');
        if (which === '3d') {
          if (showAtom3d && !showAtom2d) return;
          showAtom3d = !showAtom3d;
        } else {
          if (showAtom2d && !showAtom3d) return;
          showAtom2d = !showAtom2d;
        }
        syncAtomStages();
      });
    });

    var t0 = performance.now();
    function frame(nowT) {
      var t = (nowT - t0) / 1000;
      views.forEach(function (view) {
        var el = view.renderer.domElement;
        if (el.closest && el.closest('.is-off')) return;
        var st = view.orbitState;
        view.camera.position.y = view.camY;
        view.camera.position.z = st.z;
        if (view.group) {
          view.group.rotation.x = st.rotX;
          view.group.rotation.y = st.rotY;
        }
        if (view === atomView && view.group) tickAtom(view.group, t);
        view.renderer.render(view.scene, view.camera);
      });
      if (showAtom2d && (atomKey === 'bohr' || atomKey === 'rutherford')) {
        drawAtom2d(document.getElementById('atom-2d'), atomKey, t);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.addEventListener('resize', function () {
      views.forEach(fitView);
      drawAtom2d(document.getElementById('atom-2d'), atomKey, 0);
      drawOrbital2d(document.getElementById('orbital-2d'));
    });
  }

  function refreshTheme() {
    if (!views.length) return;
    views.forEach(paintClear);
    setGroup(molPaperView, buildMolecule(WATER, 'ball', true));
    setGroup(molRepView, buildMolecule(WATER, repStyle, true));
    loadAtom();
    drawOrbital2d(document.getElementById('orbital-2d'));
  }

  document.getElementById('viz-lang').addEventListener('click', function () {
    var next = langIsPt() ? 'en' : 'pt';
    document.documentElement.lang = next === 'pt' ? 'pt-BR' : 'en-US';
    try { localStorage.setItem('atomurus-lang', next); } catch (e) {}
    applyCopy();
    drawAtom2d(document.getElementById('atom-2d'), atomKey, 0);
  });
  document.getElementById('viz-theme').addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('atomurus-theme', next); } catch (e) {}
    refreshTheme();
  });

  if (window.THREE) start();
  else {
    var s = document.querySelector('script[src*="three.min.js"]');
    if (s) s.addEventListener('load', start);
  }
})();
