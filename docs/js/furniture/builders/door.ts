/**
 * @fileoverview Door builder — registered as furniture for editor placement.
 * Offsets the door from wall centerline to interior surface so it is visible.
 */

import * as THREE from 'three';
import { ROOM_LAYOUT } from '../../core.js';
import { register } from '../registry.js';
import { makeStd, texMetal, texWood } from '../../assets/index.js';
import { makeRoundedBox, makeCylinder, rootGroup } from '../../primitives.js';
import { getInteriorOffset } from './wall-offset.js';
import type { FurnitureConfig } from '../../seed.js';

function buildDoor(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const [x, y, z] = cfg.position;
  const wrapper = rootGroup(cfg);

  const door = new THREE.Group();

  const frameMat = makeStd({ map: texWood, color: 0x5e4c40, roughness: 0.75 });
  const panelMat = makeStd({ map: texWood, color: 0x6e5a4c, roughness: 0.7 });
  const insetMat = makeStd({ map: texWood, color: 0x4e4036, roughness: 0.8 });
  const metalMat = makeStd({ map: texMetal, color: 0x55514d, roughness: 0.4, metalness: 0.6 });

  for (const material of [frameMat, panelMat, insetMat, metalMat]) material.flatShading = false;

  const doorW = 1.5;
  const doorH = 2.15;
  const frameD = 0.12;

  // outer frame with real depth
  door.add(makeRoundedBox(frameMat, [doorW + 0.12, 0.12, frameD], [0, doorH + 0.06, 0], 0.02, 2));
  door.add(makeRoundedBox(frameMat, [0.12, doorH, frameD], [-doorW / 2 - 0.06, doorH / 2, 0], 0.02, 2));
  door.add(makeRoundedBox(frameMat, [0.12, doorH, frameD], [doorW / 2 + 0.06, doorH / 2, 0], 0.02, 2));

  // main panel
  door.add(makeRoundedBox(panelMat, [doorW, doorH, 0.06], [0, doorH / 2, 0], 0.03, 2));

  // Two recessed fields framed by rails and stiles; the centre rail reads as joinery.
  for (const [cy, height] of [[0.57, 0.76], [1.53, 0.88]]) {
    door.add(makeRoundedBox(insetMat, [1.2, height, 0.012], [0, cy, 0.034], 0.016, 2));
    door.add(makeRoundedBox(panelMat, [1.1, height - 0.1, 0.014], [0, cy, 0.035], 0.015, 2));
    for (const x of [-0.59, 0.59]) {
      door.add(makeRoundedBox(frameMat, [0.025, height, 0.018], [x, cy, 0.038], 0.006, 2));
    }
    for (const y of [cy - height / 2, cy + height / 2]) {
      door.add(makeRoundedBox(frameMat, [1.2, 0.025, 0.018], [0, y, 0.038], 0.006, 2));
    }
  }

  // metal handle lever + backplate
  door.add(makeRoundedBox(metalMat, [0.08, 0.04, 0.015], [0.38, doorH / 2 + 0.05, 0.04], 0.005, 2));
  door.add(makeRoundedBox(metalMat, [0.025, 0.025, 0.06], [0.38, doorH / 2 + 0.05, 0.066], 0.01, 2));

  door.add(makeRoundedBox(metalMat, [0.14, 0.025, 0.025], [0.435, doorH / 2 + 0.05, 0.0875], 0.01, 2));

  // hinges on the frame side
  for (const hy of [0.3, 1.1, 1.9]) {
    door.add(makeCylinder(metalMat, [0.025, 0.025, 0.05], [-doorW / 2 - 0.06, hy, -0.03], 8));
  }

  const off = getInteriorOffset(x, z, 0.15);
  // Saved anchors may sit beyond a wall centreline. Project the inner model
  // onto that wall before applying its stand-off; the saved wrapper stays put.
  let distance = Infinity;
  const offset = new THREE.Vector3(off.x, 0, off.z);
  const outline = ROOM_LAYOUT.outline;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], lengthSq = dx * dx + dz * dz;
    if (lengthSq < 1e-6) continue;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / lengthSq));
    const px = a[0] + t * dx, pz = a[1] + t * dz;
    const candidate = Math.hypot(px - x, pz - z);
    if (candidate < distance) {
      distance = candidate;
      offset.set(px - x + off.x, 0, pz - z + off.z);
    }
  }
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -(cfg.rotation ?? 0));
  door.position.copy(offset);
  door.rotation.y = Math.atan2(off.x, off.z) - (cfg.rotation ?? 0);
  wrapper.add(door);

  return { mesh: wrapper, label: 'Door' };
}

register('door', buildDoor);
