(function () {
  'use strict';

  var COPY = {
    en: {
      kicker: 'Internal prototype · not indexed',
      title: 'Paper models',
      lede: 'The Open Lab chrome is already Atomurus. The WebGL still looks like a white void with plastic spheres. This page tests a paper laboratory look — cream stage, quieter light, 2D beside 3D — without changing production viewers.',
      note: 'Prototype only. Molecules, atomic models, allotropes and isomerism stay as they are until this direction is chosen.',
      compareTitle: 'Same molecule, two rooms',
      compareMeta: 'H₂O. Drag either canvas — both share the same orbit. Left is today’s lighting. Right is the paper scene.',
      nowCap: 'Now · white void',
      paperCap: 'Paper laboratory',
      repTitle: 'Representations',
      repMeta: 'Ball-and-stick for bonding. Space-fill for volume. Stick for the skeleton. Same coordinates.',
      legend: 'O oxygen · H hydrogen · CPK colors, warmer hydrogen so it reads on cream.',
      bohrTitle: 'Bohr, 3D and 2D together',
      bohrMeta: 'Carbon, 6 electrons. The 3D shell should feel like the 2D diagram — ink, green, paper — not chrome tori in a white studio.',
      orbTitle: '2D orbital density',
      orbMeta: 'A 2p_z-like cloud on paper. Production quantum 3D is a point cloud in a white void. This tests whether 2D can carry the same scientific tone.',
      nextTitle: 'If this direction holds',
      n1: 'Carry paper clear color, quieter lights and contact ground into molecule / atomic runtimes.',
      n2: 'Add ball-and-stick / space-fill / stick on molecules. Do not invent new pedagogy.',
      n3: 'Restyle Bohr orbits to match the 2D canvas; keep Dalton–Quantum as history, not chrome toys.',
      n4: 'Cap devicePixelRatio, add touch orbit on molecules and allotropes.',
      n5: 'Leave Open Lab public. Prototype stays on /dev/ until chosen.'
    },
    pt: {
      kicker: 'Protótipo interno · não indexado',
      title: 'Modelos em papel',
      lede: 'O chrome do Open Lab já é Atomurus. O WebGL ainda parece um vazio branco com esferas plásticas. Esta página testa um laboratório de papel — fundo cream, luz mais quieta, 2D ao lado do 3D — sem alterar os visualizadores de produção.',
      note: 'Só protótipo. Moléculas, modelos atômicos, alótropos e isomeria continuam como estão até esta direção ser escolhida.',
      compareTitle: 'A mesma molécula, duas salas',
      compareMeta: 'H₂O. Arraste qualquer canvas — os dois compartilham a órbita. À esquerda, a luz de hoje. À direita, a cena de papel.',
      nowCap: 'Hoje · vazio branco',
      paperCap: 'Laboratório de papel',
      repTitle: 'Representações',
      repMeta: 'Ball-and-stick para ligações. Space-fill para volume. Stick para o esqueleto. As mesmas coordenadas.',
      legend: 'O oxigênio · H hidrogênio · cores CPK, hidrogênio mais quente para ler no cream.',
      bohrTitle: 'Bohr, 3D e 2D juntos',
      bohrMeta: 'Carbono, 6 elétrons. A casca 3D deve parecer o diagrama 2D — tinta, verde, papel — não toros cromados num estúdio branco.',
      orbTitle: 'Densidade orbital 2D',
      orbMeta: 'Uma nuvem no espírito de 2p_z em papel. O quântico 3D de produção é uma nuvem de pontos no vazio branco. Isto testa se o 2D carrega o mesmo tom científico.',
      nextTitle: 'Se esta direção se confirmar',
      n1: 'Levar cor de fundo de papel, luz mais quieta e o chão de contato para os runtimes de molécula e átomo.',
      n2: 'Adicionar ball-and-stick / space-fill / stick nas moléculas. Sem pedagogia nova.',
      n3: 'Reestilizar as órbitas de Bohr para o canvas 2D; manter Dalton–Quantum como história, não brinquedos cromados.',
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
  var shared = { rotX: 0.35, rotY: 0.6, z: 6.2 };
  var repStyle = 'ball';
  var views = [];

  function langIsPt() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  }

  function applyCopy() {
    var pack = langIsPt() ? COPY.pt : COPY.en;
    document.querySelectorAll('[data-copy]').forEach(function (node) {
      var key = node.getAttribute('data-copy');
      if (pack[key]) node.textContent = pack[key];
    });
    var langBtn = document.getElementById('viz-lang');
    if (langBtn) langBtn.textContent = langIsPt() ? 'EN' : 'PT';
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

  function makeRenderer(canvas, paper) {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0, 0.35, 6.2);
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
    return { renderer: renderer, scene: scene, camera: camera, paper: paper, group: null };
  }

  function paintClear(view) {
    view.renderer.setClearColor(view.paper ? (isDark() ? PAPER_DARK : PAPER) : (isDark() ? 0x000000 : 0xffffff), 1);
  }

  function paperGround() {
    var geo = new THREE.CircleGeometry(3.6, 64);
    var mat = new THREE.MeshStandardMaterial({
      color: isDark() ? 0x171512 : 0xE6E1D3,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: 0.7
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1.15;
    var shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.15, 48),
      new THREE.MeshBasicMaterial({ color: 0x14120E, transparent: true, opacity: isDark() ? 0.35 : 0.12 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.12;
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
        var p1 = new THREE.Vector3().fromArray(a1.pos);
        var p2 = new THREE.Vector3().fromArray(a2.pos);
        var dir = new THREE.Vector3().subVectors(p2, p1);
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

  function buildBohr() {
    var g = new THREE.Group();
    var nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 32, 32),
      new THREE.MeshStandardMaterial({ color: GREEN, roughness: 0.42, metalness: 0.08 })
    );
    g.add(nucleus);
    var shells = [
      { r: 1.35, n: 2, tilt: 0.12, speed: 1.05 },
      { r: 2.25, n: 4, tilt: -0.18, speed: 0.62 }
    ];
    shells.forEach(function (shell) {
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(shell.r, 0.018, 10, 120),
        new THREE.MeshStandardMaterial({
          color: GREEN,
          roughness: 0.55,
          metalness: 0.06,
          transparent: true,
          opacity: 0.55
        })
      );
      ring.rotation.x = Math.PI / 2 + shell.tilt;
      g.add(ring);
      var i;
      for (i = 0; i < shell.n; i += 1) {
        var e = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 16, 16),
          new THREE.MeshStandardMaterial({ color: INK, roughness: 0.4, metalness: 0.05 })
        );
        e.userData = { r: shell.r, tilt: shell.tilt, phase: (i / shell.n) * Math.PI * 2, speed: shell.speed };
        g.add(e);
      }
    });
    return g;
  }

  function bindOrbit(canvas, view) {
    var dragging = false;
    var lastX = 0;
    var lastY = 0;
    function onDown(x, y) {
      dragging = true;
      lastX = x;
      lastY = y;
    }
    function onMove(x, y) {
      if (!dragging) return;
      shared.rotY += (x - lastX) * 0.008;
      shared.rotX += (y - lastY) * 0.008;
      shared.rotX = Math.max(-1.15, Math.min(1.15, shared.rotX));
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
      shared.z = Math.max(3.4, Math.min(12, shared.z + e.deltaY * 0.01));
      e.preventDefault();
    }, { passive: false });
    view.orbit = true;
  }

  function resizeView(view) {
    var box = sizeCanvas(view.renderer.domElement);
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
      view.ground = paperGround();
      view.scene.add(view.ground);
    }
  }

  function tickBohr(group, t) {
    group.children.forEach(function (child) {
      var d = child.userData;
      if (!d || !d.r) return;
      var a = d.phase + t * d.speed;
      child.position.set(
        d.r * Math.cos(a),
        Math.sin(d.tilt) * d.r * 0.35 * Math.sin(a),
        d.r * Math.sin(a)
      );
    });
  }

  function drawBohr2d(canvas) {
    var box = sizeCanvas(canvas);
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var dark = isDark();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = dark ? '#0E0D0C' : '#F2EFE7';
    ctx.fillRect(0, 0, w, h);
    var cx = w / 2;
    var cy = h / 2;
    var s = Math.min(w, h) / 2.4;
    ctx.strokeStyle = dark ? '#2A6B55' : '#1E6A50';
    ctx.lineWidth = Math.max(1.2, w / 420);
    ctx.globalAlpha = 0.7;
    [0.42, 0.72].forEach(function (r) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * r, s * r * 0.92, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1E6A50';
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark ? '#F2EFE7' : '#14120E';
    var electrons = [
      [0.42, -0.4], [0.42, 2.6],
      [0.72, 0.3], [0.72, 1.8], [0.72, 3.4], [0.72, 4.9]
    ];
    electrons.forEach(function (e) {
      ctx.beginPath();
      ctx.arc(cx + Math.cos(e[1]) * s * e[0], cy + Math.sin(e[1]) * s * e[0] * 0.92, Math.max(3, w / 90), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.font = (10 * box.dpr) + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = dark ? '#B8B3A4' : '#58544A';
    ctx.fillText('C  ·  1s² 2s² 2p²', 16 * box.dpr, h - 16 * box.dpr);
  }

  function drawOrbital2d(canvas) {
    var box = sizeCanvas(canvas);
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var dark = isDark();
    ctx.fillStyle = dark ? '#0E0D0C' : '#F2EFE7';
    ctx.fillRect(0, 0, w, h);
    var cx = w / 2;
    var cy = h / 2;
    var scale = Math.min(w, h) * 0.16;
    var i;
    ctx.globalAlpha = 0.22;
    for (i = 0; i < 2400; i += 1) {
      var x = (Math.random() * 2 - 1) * 3.2;
      var y = (Math.random() * 2 - 1) * 3.2;
      var z = (Math.random() * 2 - 1) * 3.2;
      var r = Math.sqrt(x * x + y * y + z * z);
      if (r < 0.12 || r > 3.1) continue;
      var dens = (z * z) * Math.exp(-r * 1.35);
      if (Math.random() > dens * 1.8) continue;
      ctx.fillStyle = z >= 0 ? '#1E6A50' : (dark ? '#D8D2BF' : '#14120E');
      ctx.fillRect(cx + x * scale, cy - z * scale, 1.4 * box.dpr, 1.4 * box.dpr);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = dark ? 'rgba(242,239,231,.18)' : 'rgba(20,18,14,.12)';
    ctx.beginPath();
    ctx.moveTo(cx, 24 * box.dpr);
    ctx.lineTo(cx, h - 24 * box.dpr);
    ctx.stroke();
    ctx.font = (10 * box.dpr) + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = dark ? '#B8B3A4' : '#58544A';
    ctx.fillText('2p_z  ·  |ψ|²', 16 * box.dpr, h - 16 * box.dpr);
  }

  function fitView(view) {
    resizeView(view);
    paintClear(view);
  }

  function start() {
    if (!window.THREE) return;
    applyCopy();
    var now = makeRenderer(document.getElementById('mol-now'), false);
    var paper = makeRenderer(document.getElementById('mol-paper'), true);
    var rep = makeRenderer(document.getElementById('mol-rep'), true);
    var bohr = makeRenderer(document.getElementById('bohr-3d'), true);
    setGroup(now, buildMolecule(WATER, 'ball', false));
    setGroup(paper, buildMolecule(WATER, 'ball', true));
    setGroup(rep, buildMolecule(WATER, 'ball', true));
    setGroup(bohr, buildBohr());
    bindOrbit(now.renderer.domElement, now);
    bindOrbit(paper.renderer.domElement, paper);
    bindOrbit(rep.renderer.domElement, rep);
    bindOrbit(bohr.renderer.domElement, bohr);
    views = [now, paper, rep, bohr];
    views.forEach(fitView);
    drawBohr2d(document.getElementById('bohr-2d'));
    drawOrbital2d(document.getElementById('orbital-2d'));

    document.querySelectorAll('[data-rep]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-rep]').forEach(function (el) { el.classList.remove('is-on'); });
        btn.classList.add('is-on');
        repStyle = btn.getAttribute('data-rep');
        setGroup(rep, buildMolecule(WATER, repStyle, true));
      });
    });

    var t0 = performance.now();
    function frame(nowT) {
      var t = (nowT - t0) / 1000;
      views.forEach(function (view) {
        view.camera.position.z = shared.z;
        if (view.group) {
          view.group.rotation.x = shared.rotX;
          view.group.rotation.y = shared.rotY;
        }
        if (view === bohr && view.group) tickBohr(view.group, t);
        view.renderer.render(view.scene, view.camera);
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.addEventListener('resize', function () {
      views.forEach(fitView);
      drawBohr2d(document.getElementById('bohr-2d'));
      drawOrbital2d(document.getElementById('orbital-2d'));
    });
  }

  document.getElementById('viz-lang').addEventListener('click', function () {
    var next = langIsPt() ? 'en' : 'pt';
    document.documentElement.lang = next === 'pt' ? 'pt-BR' : 'en-US';
    try { localStorage.setItem('atomurus-lang', next); } catch (e) {}
    applyCopy();
  });
  document.getElementById('viz-theme').addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('atomurus-theme', next); } catch (e) {}
    if (!views.length) return;
    views.forEach(paintClear);
    setGroup(views[1], buildMolecule(WATER, 'ball', true));
    setGroup(views[2], buildMolecule(WATER, repStyle, true));
    setGroup(views[3], buildBohr());
    drawBohr2d(document.getElementById('bohr-2d'));
    drawOrbital2d(document.getElementById('orbital-2d'));
  });

  if (window.THREE) start();
  else {
    var s = document.querySelector('script[src*="three.min.js"]');
    if (s) s.addEventListener('load', start);
  }
})();
