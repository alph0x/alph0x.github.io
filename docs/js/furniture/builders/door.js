/**
 * @fileoverview Door builder — registered as furniture for editor placement.
 * Offsets the door from wall centerline to interior surface so it is visible.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { COLORS } from '../../core.js';
import { makeStd } from '../../assets/index.js';
import { makeRoundedBox, makeBox } from '../../primitives.js';
import { getInteriorOffset } from './wall-offset.js';

function buildDoor(cfg) {
  const wrapper = new THREE.Group();
  wrapper.position.set(...cfg.position);
  wrapper.rotation.y = cfg.rotation || 0;

  const door = new THREE.Group();
  const frameMat = makeStd({ color: 0x3a3a45, roughness: 0.7, metalness: 0.1 });
  const panelMat = makeStd({ color: 0x33333d, roughness: 0.6, metalness: 0.1 });
  const metalMat = makeStd({ color: COLORS.metal, roughness: 0.4, metalness: 0.6 });
  const glowMat = makeStd({ color: COLORS.magenta, emissive: COLORS.magenta, emissiveIntensity: 0.8 });

  // frame
  door.add(makeRoundedBox(frameMat, [1.55, 0.15, 0.12], [0, 2.2, 0], 0.02, 2));
  door.add(makeRoundedBox(frameMat, [0.12, 2.2, 0.12], [-0.715, 1.1, 0], 0.02, 2));
  door.add(makeRoundedBox(frameMat, [0.12, 2.2, 0.12], [0.715, 1.1, 0], 0.02, 2));
  // panel
  door.add(makeRoundedBox(panelMat, [1.31, 2.1, 0.06], [0, 1.1, 0], 0.03, 2));
  // handle lever
  door.add(makeRoundedBox(metalMat, [0.06, 0.03, 0.05], [0.35, 1.0, 0.05], 0.01, 2));
  door.add(makeBox(glowMat, [0.06, 0.02, 0.02], [0.35, 1.0, 0.09]));
  // hinges
  for (const y of [0.3, 1.1, 1.9]) {
    door.add(makeRoundedBox(metalMat, [0.04, 0.06, 0.04], [-0.72, y, -0.04], 0.01, 2));
  }

  const off = getInteriorOffset(cfg.position[0], cfg.position[2], 0.15);
  door.position.set(off.x, 0, off.z);
  wrapper.add(door);

  return { mesh: wrapper };
}

register('door', buildDoor);

