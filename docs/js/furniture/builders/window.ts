/**
 * @fileoverview Window builder — registered as furniture for editor placement.
 * Offsets the frame from wall centerline to interior surface so it is visible.
 * Includes cityscape backdrop with parallax support.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texWood, texMetal, texFabric } from '../../assets/index.js';
import { makeRoundedBox, makeBox, makeCylinder, makeCone, makeSphere, rootGroup, configureShadow } from '../../primitives.js';
import { buildCityscape } from './cityscape.js';
import { getInteriorOffset } from './wall-offset.js';
import type { FurnitureConfig } from '../../seed.js';

function buildWindow(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const wrapper = rootGroup(cfg);

  const winW = 1.8;
  const winH = 1.2;
  const frameD = 0.12;

  const frameMat = makeStd({ map: texWood, color: 0x8a6844, roughness: 0.7 });
  const sillMat = makeStd({ map: texWood, color: 0x9a7650, roughness: 0.65 });
  const muntinMat = makeStd({ map: texWood, color: 0x6b4f33, roughness: 0.75 });
  const metalMat = makeStd({ map: texMetal, color: 0x7a7268, roughness: 0.4, metalness: 0.6 });
  const curtainMat = makeStd({ map: texFabric, color: 0xefe3cc, roughness: 0.9, side: THREE.DoubleSide });
  const glassMat = makeStd({
    color: 0xd8ecf2,
    transparent: true,
    opacity: 0.12,
    roughness: 0.08,
    metalness: 0.1,
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

  // soft warm daylight wash on the glass
  const glowMat = makeStd({
    color: 0xffd9a0,
    emissive: 0xffd9a0,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.1,
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

  // curtain rod + bunched fabric panels framing the opening (interior side)
  const rod = makeCylinder(muntinMat, [0.015, 0.015, winW + 0.5], [0, winH / 2 + 0.14, 0.09], 8);
  rod.rotation.z = Math.PI / 2;
  frame.add(rod);
  frame.add(makeSphere(muntinMat, [0.028], [-(winW / 2 + 0.26), winH / 2 + 0.14, 0.09], 8));
  frame.add(makeSphere(muntinMat, [0.028], [winW / 2 + 0.26, winH / 2 + 0.14, 0.09], 8));
  for (const side of [-1, 1]) {
    // three offset slats per side read as gathered folds, not a flat card
    for (let f = 0; f < 3; f++) {
      const fold = makeRoundedBox(
        curtainMat,
        [0.09, winH + 0.34 - f * 0.03, 0.035],
        [side * (winW / 2 + 0.1 + f * 0.055), -0.02 + f * 0.015, 0.075 + f * 0.028],
        0.015, 2
      );
      fold.rotation.z = side * (0.02 + f * 0.015);
      frame.add(fold);
    }
  }

  // tiny succulent on the sill — the room's second resident
  const potMat = makeStd({ color: 0xb85c40, roughness: 0.8 });
  const leafMat = makeStd({ color: 0x5d8a58, roughness: 0.85 });
  frame.add(makeCylinder(potMat, [0.045, 0.035, 0.07], [winW / 2 - 0.22, -winH / 2 + 0.075, 0.06], 10));
  for (let l = 0; l < 5; l++) {
    const a = (l / 5) * Math.PI * 2;
    const leaf = makeCone(leafMat, [0.018, 0.075], [winW / 2 - 0.22 + Math.cos(a) * 0.018, -winH / 2 + 0.14, 0.06 + Math.sin(a) * 0.018], 6);
    leaf.rotation.x = Math.sin(a) * 0.35;
    leaf.rotation.z = -Math.cos(a) * 0.35;
    frame.add(leaf);
  }

  const off = getInteriorOffset(cfg.position[0], cfg.position[2], 0.12);
  frame.position.set(off.x, 0, off.z);
  wrapper.add(frame);

  // Landscape backdrop "outside" the window. The vertical offset lifts the
  // meadow band (cottages, trees, low clouds) into the window's sight-line —
  // with the raw -cfg.position[1] offset everything scenic sat below the sill.
  const city = buildCityscape({ position: [0, 0, 0] });
  city.position.set(-off.x * 4, 0.95 - cfg.position[1], -off.z * 4);
  city.userData._parallax = true;
  city.userData._parallaxFactor = 0.03;
  wrapper.add(city);

  return { mesh: wrapper, label: 'Window' };
}

register('window', buildWindow);
