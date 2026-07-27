import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { register } from '../registry.js';
import { M, makeStd, texWood } from '../../assets/index.js';
import { COLORS } from '../../core.js';
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

function buildBed(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  const wood = makeStd({ map: texWood, color: 0x5a3a2a, roughness: 0.85 });
  const woodDark = makeStd({ map: texWood, color: 0x3d2b2b, roughness: 0.9 });
  // P-15: photoreal fabric PBR set out (D-15) — BOTW bedding is flat palette color.
  const fabricLight = makeStd({ color: COLORS.plasterCream });
  const fabricWhite = makeStd({ color: COLORS.paperWhite });
  const blanket = makeStd({ color: COLORS.nightIndigo });

  // Tapered legs (merged static)
  g.add(new THREE.Mesh(merge(
    [-0.9, 0.9].flatMap((lx) =>
      [-0.6, 0.6].map((lz) => new THREE.CylinderGeometry(0.05, 0.03, 0.2, 12).translate(lx, 0.1, lz)),
    ),
  ), woodDark));

  // Base frame with edge trim
  g.add(makeBox(wood, [2.0, 0.12, 1.4], [0, 0.21, 0]));
  g.add(makeBox(woodDark, [1.9, 0.03, 1.3], [0, 0.27, 0]));

  // Rounded mattress
  g.add(part(rb(1.9, 0.25, 1.3, 0.06), fabricLight, 0, 0.4, 0));

  // Pillows (merged static)
  g.add(new THREE.Mesh(merge([
    rb(0.45, 0.12, 0.7, 0.04).translate(-0.5, 0.6, -0.25),
    rb(0.45, 0.12, 0.7, 0.04).translate(-0.5, 0.6, 0.25),
  ]), fabricWhite));

  // Blanket: top drape + foot overhang + side drape (merged static)
  g.add(new THREE.Mesh(merge([
    rb(1.5, 0.15, 1.32, 0.04).translate(0.15, 0.6, 0),
    rb(1.5, 0.35, 0.08, 0.03, 2).translate(0.15, 0.45, 0.68),
    rb(0.06, 0.22, 0.7, 0.03, 2).translate(0.9, 0.42, 0.15),
  ]), blanket));

  // Thick headboard with subtle padded inset
  g.add(part(rb(0.12, 1.0, 1.4, 0.04), wood, -0.95, 0.7, 0));
  g.add(part(rb(0.04, 0.85, 1.2, 0.02, 2), M.wood, -0.88, 0.7, 0));

  return { mesh: g, label: 'Bed' };
}
register('bed', buildBed);
