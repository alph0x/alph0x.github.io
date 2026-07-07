/**
 * @fileoverview Door builder — registered as furniture for editor placement.
 * Offsets the door from wall centerline to interior surface so it is visible.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texMetal, texWood } from '../../assets/index.js';
import { makeRoundedBox, makeBox, makeCylinder } from '../../primitives.js';
import { getInteriorOffset } from './wall-offset.js';
import type { FurnitureConfig } from '../../seed.js';

function buildDoor(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const [x, y, z] = cfg.position;
  const wrapper = new THREE.Group();
  wrapper.position.set(x, y, z);
  wrapper.rotation.y = cfg.rotation ?? 0;

  const door = new THREE.Group();

  const frameMat = makeStd({ map: texWood, color: 0x4a3a30, roughness: 0.75 });
  const panelMat = makeStd({ map: texWood, color: 0x5c4a3e, roughness: 0.7 });
  const insetMat = makeStd({ map: texWood, color: 0x3e322a, roughness: 0.8 });
  const metalMat = makeStd({ map: texMetal, color: 0x55514d, roughness: 0.4, metalness: 0.6 });

  const doorW = 1.5;
  const doorH = 2.15;
  const frameD = 0.12;

  // outer frame with real depth
  door.add(makeRoundedBox(frameMat, [doorW + 0.12, 0.12, frameD], [0, doorH + 0.06, 0], 0.02, 2));
  door.add(makeRoundedBox(frameMat, [0.12, doorH, frameD], [-doorW / 2 - 0.06, doorH / 2, 0], 0.02, 2));
  door.add(makeRoundedBox(frameMat, [0.12, doorH, frameD], [doorW / 2 + 0.06, doorH / 2, 0], 0.02, 2));

  // main panel
  door.add(makeRoundedBox(panelMat, [doorW, doorH, 0.06], [0, doorH / 2, 0], 0.03, 2));

  // subtle raised-panel border inset
  const insetW = doorW - 0.22;
  const insetH = doorH - 0.22;
  door.add(makeRoundedBox(insetMat, [insetW, insetH, 0.04], [0, doorH / 2, 0.02], 0.02, 2));
  door.add(makeRoundedBox(panelMat, [insetW - 0.08, insetH - 0.08, 0.045], [0, doorH / 2, 0.025], 0.015, 2));

  // metal handle lever + backplate
  door.add(makeRoundedBox(metalMat, [0.08, 0.04, 0.015], [0.38, doorH / 2 + 0.05, 0.04], 0.005, 2));
  door.add(makeBox(metalMat, [0.04, 0.02, 0.08], [0.42, doorH / 2 + 0.06, 0.06]));

  // hinges on the frame side
  for (const hy of [0.3, 1.1, 1.9]) {
    door.add(makeCylinder(metalMat, [0.025, 0.025, 0.05], [-doorW / 2 - 0.06, hy, -0.03], 8));
  }

  const off = getInteriorOffset(x, z, 0.15);
  door.position.set(off.x, 0, off.z);
  wrapper.add(door);

  return { mesh: wrapper, label: 'Door' };
}

register('door', buildDoor);
