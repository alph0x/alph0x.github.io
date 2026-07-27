import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { register } from '../registry.js';
import { M, makeStd, texMetal, texWood } from '../../assets/index.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

// Deduped rounded box (RoundedBoxGeometry is non-indexed — mergeVertices
// re-indexes it, keeping vertex counts near old indexed builds).
const rb = (w: number, h: number, d: number, r: number, seg = 3): THREE.BufferGeometry =>
  mergeVertices(new RoundedBoxGeometry(w, h, d, seg, r));

/** Normalize indexing, merge, re-index (P-15 pattern — no new abstractions). */
const merge = (geos: THREE.BufferGeometry[]): THREE.BufferGeometry =>
  mergeVertices(mergeGeometries(geos.map((p) => (p.index ? p.toNonIndexed() : p))));

function part(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function buildNightstand(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  const woodMat = makeStd({ map: texWood, color: 0x5a3a2a, roughness: 0.85 });
  const drawerMat = makeStd({ map: texWood, color: 0x6a4a3a, roughness: 0.85 });
  const metalMat = makeStd({ map: texMetal, color: 0x888899, roughness: 0.3, metalness: 0.7 });

  // Tapered legs (merged static)
  g.add(new THREE.Mesh(merge(
    [-0.2, 0.2].flatMap((lx) =>
      [-0.15, 0.15].map((lz) => new THREE.CylinderGeometry(0.025, 0.015, 0.15, 12).translate(lx, 0.075, lz)),
    ),
  ), woodMat));

  // Rounded body
  g.add(part(rb(0.5, 0.5, 0.4, 0.03), woodMat, 0, 0.32, 0));
  // Top surface overhang
  g.add(makeBox(M.wood, [0.52, 0.04, 0.42], [0, 0.57, 0]));
  // Drawer front
  g.add(part(rb(0.44, 0.18, 0.02, 0.01, 2), drawerMat, 0, 0.42, 0.21));
  // Drawer handle
  g.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 12), metalMat, 0.12, 0.42, 0.23));

  // Small decorative feet caps (merged static)
  g.add(new THREE.Mesh(merge(
    [-0.2, 0.2].flatMap((lx) =>
      [-0.15, 0.15].map((lz) => new THREE.SphereGeometry(0.012, 12, 8).translate(lx, 0.005, lz)),
    ),
  ), metalMat));

  return { mesh: g, label: 'Nightstand' };
}
register('nightstand', buildNightstand);
