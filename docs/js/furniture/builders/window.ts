/**
 * @fileoverview Window builder — registered as furniture for editor placement.
 * Offsets the frame from wall centerline to interior surface so it is visible.
 * Includes cityscape backdrop with parallax support.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texWood, texMetal } from '../../assets/index.js';
import { makeRoundedBox, makeBox, makeCylinder, rootGroup, configureShadow } from '../../primitives.js';
import { buildCityscape } from './cityscape.js';
import { getInteriorOffset } from './wall-offset.js';
import type { FurnitureConfig } from '../../seed.js';

function buildWindow(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const wrapper = rootGroup(cfg);

  const winW = 1.8;
  const winH = 1.2;
  const frameD = 0.12;

  const frameMat = makeStd({ map: texWood, color: 0x3a3530, roughness: 0.7 });
  const sillMat = makeStd({ map: texWood, color: 0x4a433c, roughness: 0.65 });
  const muntinMat = makeStd({ map: texWood, color: 0x2e2a26, roughness: 0.75 });
  const metalMat = makeStd({ map: texMetal, color: 0x55514d, roughness: 0.4, metalness: 0.6 });
  const glassMat = makeStd({
    color: 0x88aacc,
    transparent: true,
    opacity: 0.25,
    roughness: 0.1,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });

  const frame = new THREE.Group();

  // top + bottom frame
  frame.add(makeRoundedBox(frameMat, [winW + 0.12, 0.08, frameD], [0, winH / 2, 0], 0.015, 2));
  frame.add(makeRoundedBox(sillMat, [winW + 0.18, 0.08, 0.16], [0, -winH / 2, 0.02], 0.015, 2));

  // sides
  frame.add(makeRoundedBox(frameMat, [0.08, winH, frameD], [-winW / 2, 0, 0], 0.015, 2));
  frame.add(makeRoundedBox(frameMat, [0.08, winH, frameD], [winW / 2, 0, 0], 0.015, 2));

  // glass pane
  frame.add(makeBox(glassMat, [winW, winH, 0.015], [0, 0, 0]));

  // muntins / dividers
  frame.add(makeBox(muntinMat, [winW, 0.03, 0.04], [0, 0, 0.01]));
  frame.add(makeBox(muntinMat, [0.03, winH, 0.04], [0, 0, 0.01]));

  // small latch/handle on the vertical muntin
  frame.add(makeCylinder(metalMat, [0.015, 0.015, 0.04], [0.04, 0.1, 0.03], 8));

  // emissive moonlight wash on the glass
  const glowMat = makeStd({
    color: 0x6688aa,
    emissive: 0x6688aa,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  const glowMesh = makeBox(glowMat, [winW - 0.05, winH - 0.05, 0.005], [0, 0, 0.008]);
  glowMesh.userData._windowGlow = true;
  frame.add(glowMesh);

  // spot light shining inward
  const winSpot = new THREE.SpotLight(0x6688aa, 1.2, 8, Math.PI / 4, 0.6, 1);
  winSpot.position.set(0, 0.5, 0.3);
  winSpot.target.position.set(0, 0, 3);
  configureShadow(winSpot);
  winSpot.userData._windowSpot = true;
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

  return { mesh: wrapper, label: 'Window' };
}

register('window', buildWindow);
