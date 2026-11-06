/**
 * Rebuilds the 3D coordinates of the curated viewer molecules from real
 * geometry: measured gas-phase bond lengths and angles (NIST CCCBDB / CRC,
 * the same values as assets/chem/mol-insight.js REFERENCE) for the small
 * inorganic molecules, and the isomer engine's VSEPR embedding — then
 * corrected to the measured bond lengths — for the organic ones.
 * Names, descriptions and 2D drawings are kept.
 *
 *   node tools/build-molecule-geometry.mjs          (rewrite the module)
 *   node tools/build-molecule-geometry.mjs --check  (exit 1 if out of date)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ISO = require(path.join(ROOT, 'assets/chem/isomer-engine.js'));
const MI = require(path.join(ROOT, 'assets/chem/mol-insight.js'));
const OUT = path.join(ROOT, 'netlify', 'lib', 'viewer-molecule-coords.mjs');
const mod = await import(OUT + '?t=' + Date.now());

/* vectors */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const rad = (d) => d * Math.PI / 180;
function perpTo(u) { const t = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; return norm(cross(u, t)); }
// three directions at 109.47° from u (u = direction of the existing bond)
function sp3From1(u, twist = 0) {
  const p = perpTo(u), q = cross(u, p);
  return [0, 1, 2].map((k) => {
    const a = twist + k * 2 * Math.PI / 3;
    return norm(add(mul(u, -1 / 3), mul(add(mul(p, Math.cos(a)), mul(q, Math.sin(a))), Math.sqrt(8) / 3)));
  });
}
// two directions completing a tetrahedron with the bonds u1, u2
function sp3From2(u1, u2) {
  const b = norm(mul(add(u1, u2), -1)), n = norm(cross(u1, u2));
  const h = rad(109.47 / 2);
  return [norm(add(mul(b, Math.cos(h)), mul(n, Math.sin(h)))), norm(sub(mul(b, Math.cos(h)), mul(n, Math.sin(h))))];
}
// AX3 pyramid with bond angle theta, apex up, bonds pointing down
function pyramid(theta) {
  const c2 = (2 * Math.cos(rad(theta)) + 1) / 3, ca = Math.sqrt(Math.max(0, c2)), sa = Math.sqrt(1 - c2);
  return [0, 1, 2].map((k) => [sa * Math.cos(k * 2 * Math.PI / 3), -ca, sa * Math.sin(k * 2 * Math.PI / 3)]);
}
// rotate direction d about axis k by angle a (Rodrigues)
function rot(d, k, a) {
  k = norm(k);
  return add(add(mul(d, Math.cos(a)), mul(cross(k, d), Math.sin(a))), mul(k, dot(k, d) * (1 - Math.cos(a))));
}

/* tiny builder */
function builder() {
  const atoms = [], bonds = [];
  return {
    atoms, bonds,
    at(el, pos) { atoms.push({ el, pos }); return atoms.length - 1; },
    bond(a, b, o = 1) { bonds.push([a, b, o]); },
    from(i, el, dir, length, o = 1) { const j = this.at(el, add(atoms[i].pos, mul(norm(dir), length))); this.bond(i, j, o); return j; }
  };
}

const HAND = {
  water() { const m = builder(); const o = m.at('O', [0, 0, 0]); const h = rad(104.5 / 2);
    m.from(o, 'H', [-Math.sin(h), -Math.cos(h), 0], 0.958); m.from(o, 'H', [Math.sin(h), -Math.cos(h), 0], 0.958); return m; },
  ammonia() { const m = builder(); const n = m.at('N', [0, 0, 0]); pyramid(106.7).forEach((d) => m.from(n, 'H', d, 1.012)); return m; },
  pcl3() { const m = builder(); const p = m.at('P', [0, 0, 0]); pyramid(100.3).forEach((d) => m.from(p, 'Cl', d, 2.043)); return m; },
  hcl() { const m = builder(); const h = m.at('H', [0, 0, 0]); m.from(h, 'Cl', [1, 0, 0], 1.275); return m; },
  nacl() { const m = builder(); const a = m.at('Na', [0, 0, 0]); m.from(a, 'Cl', [1, 0, 0], 2.361); return m; },
  n2() { const m = builder(); const a = m.at('N', [0, 0, 0]); m.from(a, 'N', [1, 0, 0], 1.098, 3); return m; },
  o2() { const m = builder(); const a = m.at('O', [0, 0, 0]); m.from(a, 'O', [1, 0, 0], 1.207, 2); return m; },
  co() { const m = builder(); const a = m.at('C', [0, 0, 0]); m.from(a, 'O', [1, 0, 0], 1.128, 3); return m; },
  co2() { const m = builder(); const c = m.at('C', [0, 0, 0]); m.from(c, 'O', [-1, 0, 0], 1.160, 2); m.from(c, 'O', [1, 0, 0], 1.160, 2); return m; },
  cs2() { const m = builder(); const c = m.at('C', [0, 0, 0]); m.from(c, 'S', [-1, 0, 0], 1.553, 2); m.from(c, 'S', [1, 0, 0], 1.553, 2); return m; },
  acetylene() { const m = builder(); const a = m.at('C', [-0.6015, 0, 0]); const b = m.at('C', [0.6015, 0, 0]); m.bond(a, b, 3);
    m.from(a, 'H', [-1, 0, 0], 1.063); m.from(b, 'H', [1, 0, 0], 1.063); return m; },
  hcn() { const m = builder(); const c = m.at('C', [0, 0, 0]); m.from(c, 'H', [-1, 0, 0], 1.066); m.from(c, 'N', [1, 0, 0], 1.153, 3); return m; },
  so2() { const m = builder(); const s = m.at('S', [0, 0, 0]); const h = rad(119.5 / 2);
    m.from(s, 'O', [-Math.sin(h), -Math.cos(h), 0], 1.431, 2); m.from(s, 'O', [Math.sin(h), -Math.cos(h), 0], 1.431, 2); return m; },
  sf6() { const m = builder(); const s = m.at('S', [0, 0, 0]);
    [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach((d) => m.from(s, 'F', d, 1.561)); return m; },
  h2o2() { const m = builder(); const o1 = m.at('O', [-0.7375, 0, 0]); const o2 = m.at('O', [0.7375, 0, 0]); m.bond(o1, o2);
    const a = rad(94.8), phi = rad(111.5);
    m.from(o1, 'H', [Math.cos(a), Math.sin(a), 0], 0.950);
    m.from(o2, 'H', [-Math.cos(a), Math.sin(a) * Math.cos(phi), Math.sin(a) * Math.sin(phi)], 0.950); return m; },
  hno3() { const m = builder(); const n = m.at('N', [0, 0, 0]);
    const oh = m.from(n, 'O', [-1, 0, 0], 1.406);
    m.from(n, 'O', [Math.cos(rad(64.1)), Math.sin(rad(64.1)), 0], 1.199, 2);
    m.from(n, 'O', [Math.cos(rad(-66.1)), Math.sin(rad(-66.1)), 0], 1.211);
    m.from(oh, 'H', [Math.cos(rad(102.2)), -Math.sin(rad(102.2)), 0], 0.964); return m; },
  h2so4() { const m = builder(); const s = m.at('S', [0, 0, 0]);
    const a = rad(123.3 / 2), b = rad(101.3 / 2);
    m.from(s, 'O', [Math.sin(a), 0, Math.cos(a)], 1.422, 2); m.from(s, 'O', [-Math.sin(a), 0, Math.cos(a)], 1.422, 2);
    [1, -1].forEach((sg) => {
      const d = [0, sg * Math.sin(b), -Math.cos(b)];
      const o = m.from(s, 'O', d, 1.574);
      const back = mul(d, -1);
      m.from(o, 'H', rot(back, cross(back, [sg, 0, 0]), rad(-108.5)), 0.97);
    });
    return m; },
  h3po4() { const m = builder(); const p = m.at('P', [0, 0, 0]); m.from(p, 'O', [0, 1, 0], 1.52, 2);
    pyramid(109.47).forEach((d, k) => {
      const o = m.from(p, 'O', d, 1.57);
      const back = mul(d, -1);
      const side = [Math.cos(k * 2 * Math.PI / 3 + Math.PI / 2), 0, Math.sin(k * 2 * Math.PI / 3 + Math.PI / 2)];
      m.from(o, 'H', rot(back, cross(back, side), rad(-115)), 0.96);
    });
    return m; },
  benzene() { const m = builder(); const c = [];
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.push(m.at('C', [1.397 * Math.cos(a), 1.397 * Math.sin(a), 0])); }
    for (let k = 0; k < 6; k++) m.bond(c[k], c[(k + 1) % 6], k % 2 ? 1 : 2);
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; m.from(c[k], 'H', [Math.cos(a), Math.sin(a), 0], 1.080); }
    return m; },
  cyclohexane() { const m = builder(); const L = 1.536, target = 111.4;
    let lo = 0.01, hi = 0.7, rho = 0, h = 0;
    const P = (k, r, z) => [r * Math.cos(k * Math.PI / 3), r * Math.sin(k * Math.PI / 3), k % 2 ? -z : z];
    for (let it = 0; it < 80; it++) {
      h = (lo + hi) / 2; rho = Math.sqrt(L * L - 4 * h * h);
      const a = sub(P(5, rho, h), P(0, rho, h)), b = sub(P(1, rho, h), P(0, rho, h));
      const ang = Math.acos(dot(a, b) / (Math.hypot(...a) * Math.hypot(...b))) * 180 / Math.PI;
      if (ang < target) hi = h; else lo = h; // more pucker → smaller angle
    }
    const c = [];
    for (let k = 0; k < 6; k++) c.push(m.at('C', P(k, rho, h)));
    for (let k = 0; k < 6; k++) m.bond(c[k], c[(k + 1) % 6]);
    for (let k = 0; k < 6; k++) {
      const me = m.atoms[c[k]].pos;
      const u1 = norm(sub(m.atoms[c[(k + 5) % 6]].pos, me)), u2 = norm(sub(m.atoms[c[(k + 1) % 6]].pos, me));
      sp3From2(u1, u2).forEach((d) => m.from(c[k], 'H', d, 1.097));
    }
    return m; },
  'methyl-isocyanate'() { const m = builder(); const n = m.at('N', [0, 0, 0]);
    const c2 = m.from(n, 'C', [1, 0, 0], 1.20, 2); m.from(c2, 'O', [1, 0, 0], 1.17, 2);
    const c1 = m.from(n, 'C', [Math.cos(rad(140.3)), Math.sin(rad(140.3)), 0], 1.45);
    const u = norm(sub(m.atoms[n].pos, m.atoms[c1].pos));
    sp3From1(u, 0.3).forEach((d) => m.from(c1, 'H', d, 1.09));
    return m; }
};

const SMILES = {
  ethanol: 'CCO', butane: 'CCCC', isobutane: 'CC(C)C', but1ene: 'C=CCC', but2ene: 'CC=CC',
  cis2butene: ['CC=CC', { cis: [1] }], trans2butene: 'CC=CC', dimethylether: 'COC', acetone: 'CC(=O)C',
  methane: 'C', chfclbr: 'C(F)(Cl)Br', bromobutane: 'CC(Br)CC', lacticacid: 'CC(O)C(=O)O', alanine: 'CC(N)C(=O)O',
  glyceraldehyde: 'OCC(O)C=O', methanol: 'CO', aceticacid: 'CC(=O)O', ethylene: 'C=C',
  formaldehyde: 'C=O', propane: 'CCC'
};

function fromEngine(key) {
  const spec = SMILES[key];
  const smi = Array.isArray(spec) ? spec[0] : spec;
  const opts = Array.isArray(spec) ? spec[1] : {};
  const mol = ISO.parseSmiles(smi);
  if (mol.error) throw new Error(key + ': ' + mol.error);
  let model = ISO.embed3d(mol, opts);
  const st = ISO.stereo(mol);
  if (st.chiralCenters.length) {
    const rs = ISO.assignRS(model, model.coords, st.chiralCenters);
    if (rs[st.chiralCenters[0]] !== 'R') model = ISO.embed3d(mol, Object.assign({}, opts, { mirror: true }));
    const check = ISO.assignRS(model, model.coords, st.chiralCenters);
    if (check[st.chiralCenters[0]] !== 'R') throw new Error(key + ': could not build the R form');
  }
  const atoms = model.atoms.map((a, i) => ({ el: a.el, pos: model.coords[i].slice() }));
  const bonds = model.bonds.map((b) => [b.a, b.b, b.o]);
  return { atoms, bonds };
}

const out = {};
for (const key of mod.VIEWER_MOLECULE_KEYS) {
  const row = mod.viewerMoleculePayload(key);
  const keep = { name: row.name, desc: row.desc };
  if (row.draw2d) keep.draw2d = row.draw2d;
  let atoms, bonds;
  if (key === 'fe2o3') {
    atoms = row.atoms; bonds = row.bonds; // ionic solid: formula-unit cartoon stays
  } else {
    const m = HAND[key] ? HAND[key]() : fromEngine(key);
    if (!HAND[key]) MI.snapBondLengths(m, (MI.reference(key) || {}).len);
    ({ atoms, bonds } = MI.toViewer(m));
  }
  out[key] = Object.assign(keep, { atoms, bonds });
  if (row.chiral) out[key].chiral = true;
}

const src = fs.readFileSync(OUT, 'utf8');
const start = src.indexOf('const COORDS = Object.freeze(');
const end = src.indexOf('});\n', start) + 4;
const next = src.slice(0, start) + 'const COORDS = Object.freeze(' + JSON.stringify(out) + ');\n' + src.slice(end);
if (process.argv.includes('--check')) {
  if (next !== src) { console.error('viewer-molecule-coords.mjs is out of date: run node tools/build-molecule-geometry.mjs'); process.exit(1); }
  console.log('molecule geometry up to date');
} else {
  fs.writeFileSync(OUT, next);
  console.log('wrote', Object.keys(out).length, 'molecules →', path.relative(ROOT, OUT));
}
