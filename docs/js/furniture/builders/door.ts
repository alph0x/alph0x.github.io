/**
 * @fileoverview Door builder — registered as furniture for editor placement.
 * Offsets the door from wall centerline to interior surface so it is visible.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { register } from '../registry.js';
import { makeStd, texMetal, texWood } from '../../assets/index.js';
import { rootGroup } from '../../primitives.js';
import { getInteriorOffset } from './wall-offset.js';
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

function buildDoor(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const [x, y, z] = cfg.position;
  const wrapper = rootGroup(cfg);

  const door = new THREE.Group();

  const frameMat = makeStd({ map: texWood, color: 0x5e4c40, roughness: 0.75 });
  const panelMat = makeStd({ map: texWood, color: 0x6e5a4c, roughness: 0.7 });
  const insetMat = makeStd({ map: texWood, color: 0x4e4036, roughness: 0.8 });
  const metalMat = makeStd({ map: texMetal, color: 0x55514d, roughness: 0.4, metalness: 0.6 });

  const doorW = 1.5;
  const doorH = 2.15;
  const frameD = 0.12;

  // Outer frame with real depth (merged static)
  door.add(new THREE.Mesh(merge([
    rb(doorW + 0.12, 0.12, frameD, 0.02).translate(0, doorH + 0.06, 0),
    rb(0.12, doorH, frameD, 0.02).translate(-doorW / 2 - 0.06, doorH / 2, 0),
    rb(0.12, doorH, frameD, 0.02).translate(doorW / 2 + 0.06, doorH / 2, 0),
  ]), frameMat));

  // Main panel
  door.add(part(rb(doorW, doorH, 0.06, 0.03), panelMat, 0, doorH / 2, 0));

  // Subtle raised-panel border inset
  const insetW = doorW - 0.22;
  const insetH = doorH - 0.22;
  door.add(part(rb(insetW, insetH, 0.04, 0.02, 2), insetMat, 0, doorH / 2, 0.02));
  door.add(part(rb(insetW - 0.08, insetH - 0.08, 0.045, 0.015, 2), panelMat, 0, doorH / 2, 0.025));

  // Metal: handle lever + backplate + hinges (merged static)
  door.add(new THREE.Mesh(merge([
    rb(0.08, 0.04, 0.015, 0.005, 2).translate(0.38, doorH / 2 + 0.05, 0.04),
    new THREE.BoxGeometry(0.04, 0.02, 0.08).translate(0.42, doorH / 2 + 0.06, 0.06),
    ...[0.3, 1.1, 1.9].map((hy) => new THREE.CylinderGeometry(0.025, 0.025, 0.05, 12).translate(-doorW / 2 - 0.06, hy, -0.03)),
  ]), metalMat));

  const off = getInteriorOffset(x, z, 0.15);
  door.position.set(off.x, 0, off.z);
  wrapper.add(door);

  return { mesh: wrapper, label: 'Door' };
}

register('door', buildDoor);
