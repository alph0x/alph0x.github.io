import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { register } from '../registry.js';
import { makeStd, texMetal, texPlastic, texWood } from '../../assets/index.js';
import { COLORS } from '../../core.js';
import { rootGroup } from '../../primitives.js';
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

function buildDesk(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  // Painterly wood (P-15: photoreal PBR set out, D-15) + palette-true accents.
  const wood = makeStd({ map: texWood, color: 0xd8b083 });
  const woodDark = makeStd({ map: texWood, color: 0x7a5a36 });
  const metal = makeStd({ map: texMetal, roughness: 0.4, metalness: 0.6 });
  const plastic = makeStd({ map: texPlastic, roughness: 0.6 });
  const led = makeStd({ color: COLORS.sheikahTeal, emissive: COLORS.sheikahTeal, emissiveIntensity: 0.8 });

  // Tabletop with rounded edge
  g.add(part(rb(1.8, 0.06, 0.9, 0.035), wood, 0, 0.8, 0));

  // Dark wood: under-edge + drawer fronts (merged static)
  g.add(new THREE.Mesh(merge([
    new THREE.BoxGeometry(1.78, 0.02, 0.88).translate(0, 0.77, 0),
    rb(0.44, 0.16, 0.02, 0.01, 2).translate(0.55, 0.65, 0.415),
    rb(0.44, 0.16, 0.02, 0.01, 2).translate(0.55, 0.48, 0.415),
  ]), woodDark));

  // Metal: tapered legs + crossbars + drawer handles (merged static)
  g.add(new THREE.Mesh(merge([
    ...[-0.8, 0.8].flatMap((lx) =>
      [-0.35, 0.35].map((lz) => new THREE.CylinderGeometry(0.035, 0.02, 0.76, 12).translate(lx, 0.4, lz)),
    ),
    new THREE.BoxGeometry(1.5, 0.03, 0.03).translate(0, 0.25, -0.35),
    new THREE.BoxGeometry(1.5, 0.03, 0.03).translate(0, 0.25, 0.35),
    rb(0.14, 0.02, 0.02, 0.005, 2).translate(0.55, 0.65, 0.43),
    rb(0.14, 0.02, 0.02, 0.005, 2).translate(0.55, 0.48, 0.43),
  ]), metal));

  // Plastic feet (merged static)
  g.add(new THREE.Mesh(merge(
    [-0.8, 0.8].flatMap((lx) =>
      [-0.35, 0.35].map((lz) => rb(0.06, 0.03, 0.06, 0.01, 2).translate(lx, 0.015, lz)),
    ),
  ), plastic));

  // Drawer block
  g.add(part(rb(0.5, 0.42, 0.82, 0.03), wood, 0.55, 0.59, 0));

  // LED strip glow under back edge
  g.add(part(new THREE.BoxGeometry(1.5, 0.01, 0.02), led, 0, 0.74, -0.42));

  // Keyboard mat
  g.add(part(rb(0.6, 0.02, 0.22, 0.01, 2), plastic, -0.2, 0.84, 0.15));

  return { mesh: g, label: 'Desk' };
}
register('desk', buildDesk);
