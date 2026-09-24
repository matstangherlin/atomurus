/*
 * Molecule viewer (app shell). The ONLY place the shell pulls in Three.js:
 * the dynamic import happens on mount, never at bootstrap. Leaving the route
 * disposes the scene, the renderer and the render loop (viewer-host.js).
 */

import { h } from '../../ui/utilities/dom.js';
import { hashFor } from '../../app/router/router.js';
import { createViewerHost } from '../viewer/viewer-host.js';

/* H₂O: O at the origin, H at 104.5° (Å-ish scene units). */
const WATER = {
  atoms: [
    { el: 'O', pos: [0, 0, 0], r: 0.66, color: 0xd9534f },
    { el: 'H', pos: [0.96, 0, 0], r: 0.4, color: 0xf2efe7 },
    { el: 'H', pos: [-0.24, 0.93, 0], r: 0.4, color: 0xf2efe7 }
  ],
  bonds: [[0, 1], [0, 2]]
};

export function buildMolecule(THREE, scene, mol = WATER) {
  const group = new THREE.Group();
  for (const atom of mol.atoms) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(atom.r, 24, 16), new THREE.MeshStandardMaterial({ color: atom.color, roughness: 0.6 }));
    mesh.position.set(...atom.pos);
    group.add(mesh);
  }
  for (const [a, b] of mol.bonds) {
    const pa = new THREE.Vector3(...mol.atoms[a].pos);
    const pb = new THREE.Vector3(...mol.atoms[b].pos);
    const len = pa.distanceTo(pb);
    const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, len, 12), new THREE.MeshStandardMaterial({ color: 0x9a948a }));
    bond.position.copy(pa.clone().add(pb).multiplyScalar(0.5));
    bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pb.clone().sub(pa).normalize());
    group.add(bond);
  }
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(3, 4, 5);
  scene.add(light);
  return group;
}

export default {
  async mount({ root, scope, services }) {
    const t = services.t;
    const el = h.scoped(scope);
    const stage = el('div', { class: 'app-viewer-stage', 'data-viewer-stage': true });
    root.appendChild(el('section', { class: 'app-page app-viewer' },
      el('div', { class: 'app-page-head' },
        el('h1', { class: 'app-page-title' }, t('mol.title')),
        el('a', { class: 'ui-btn ui-btn-ghost ui-btn-sm', href: hashFor('explore'), 'data-viewer-close': true }, t('mol.close'))),
      stage));

    const host = createViewerHost({
      container: stage,
      lifecycle: services.lifecycle,
      loadThree: () => import(/* @vite-ignore */ services.config.threeModuleUrl)
    });
    scope.add(() => host.unmount());
    services.perf.mark('viewer:start');
    await host.mount((THREE, scene) => {
      const group = buildMolecule(THREE, scene);
      return { tick: () => { group.rotation.y += 0.01; } };
    });
    services.perf.measure('viewer');
    return {};
  }
};
