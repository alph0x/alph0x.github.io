/**
 * @fileoverview Window builder — registered as furniture for editor placement.
 * Offsets the frame from wall centerline to interior surface so it is visible.
 * Includes cityscape backdrop with parallax support.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeRoundedBox, makeBox } from '../../primitives.js';
import { buildCityscape } from '../../level/cityscape.js';
import { getInteriorOffset } from './wall-offset.js';

function buildWindow(cfg) {
  const wrapper = new THREE.Group();
  wrapper.position.set(...cfg.position);
  wrapper.rotation.y = cfg.rotation || 0;

  const winW = 1.8;
  const winH = 1.2;
  const frameMat = makeStd({ color: 0x1a1a1e, roughness: 0.6, metalness: 0.1 });
  const sillMat = makeStd({ color: 0x23232b, roughness: 0.5, metalness: 0.1 });
  const glassMat = makeStd({
    color: 0x88aacc,
    transparent: true,
    opacity: 0.25,
    roughness: 0.1,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });
  const muntinMat = makeStd({ color: 0x1a1a1e, roughness: 0.6, metalness: 0.1 });

  const frame = new THREE.Group();
  // top + bottom (sill) frame
  frame.add(makeRoundedBox(frameMat, [winW + 0.15, 0.08, 0.12], [0, winH / 2, 0], 0.015, 2));
  frame.add(makeRoundedBox(sillMat, [winW + 0.15, 0.08, 0.14], [0, -winH / 2, 0], 0.015, 2));
  // sides
  frame.add(makeRoundedBox(frameMat, [0.08, winH, 0.12], [-winW / 2, 0, 0], 0.015, 2));
  frame.add(makeRoundedBox(frameMat, [0.08, winH, 0.12], [winW / 2, 0, 0], 0.015, 2));
  // glass panes
  frame.add(makeBox(glassMat, [winW, winH, 0.015], [0, 0, 0]));
  // muntins
  frame.add(makeBox(muntinMat, [winW, 0.03, 0.04], [0, 0, 0.01]));
  frame.add(makeBox(muntinMat, [0.03, winH, 0.04], [0, 0, 0.01]));

  // emissive moonlight wash on the glass
  const glowMat = makeStd({ color: 0x6688aa, emissive: 0x6688aa, emissiveIntensity: 0.35, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  frame.add(makeBox(glowMat, [winW - 0.05, winH - 0.05, 0.005], [0, 0, 0.008]));

  // spot light shining inward
  const winSpot = new THREE.SpotLight(0x6688aa, 1.2, 8, Math.PI / 4, 0.6, 1);
  winSpot.position.set(0, 0.5, 0.3);
  winSpot.target.position.set(0, 0, 3);
  winSpot.castShadow = true;
  winSpot.shadow.mapSize.width = 256;
  winSpot.shadow.mapSize.height = 256;
  frame.add(winSpot);
  frame.add(winSpot.target);

  const off = getInteriorOffset(cfg.position[0], cfg.position[2], 0.12);
  frame.position.set(off.x, 0, off.z);
  wrapper.add(frame);

  // Cityscape backdrop — positioned "outside" the window, opposite to interior offset
  const city = buildCityscape({ position: [0, 0, 0] });
  city.position.set(-off.x * 4, -cfg.position[1], -off.z * 4);
  city.userData._parallax = true;
  city.userData._parallaxFactor = 0.03;
  wrapper.add(city);

  return { mesh: wrapper };
}

register('window', buildWindow);
