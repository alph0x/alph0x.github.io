/**
 * @fileoverview Lighting setup — SRP: only light placement and configuration.
 */

import * as THREE from 'three';
import { COLORS } from '../core.js';
import { makeLight } from '../primitives.js';

export function setupLighting(scene: THREE.Scene): void {
  // PSX: very high ambient so flat-shaded Lambert materials stay visible
  scene.add(new THREE.AmbientLight(0x8080a0, 3.0));
  scene.add(new THREE.HemisphereLight(0x90a0c0, 0x505070, 2.0));

  // Key directional light (moon/window light from above-front)
  const dir = new THREE.DirectionalLight(0xc0d0f0, 2.0);
  dir.position.set(2, 4, 3);
  scene.add(dir);

  // Main ceiling light
  const ceilMain = new THREE.PointLight(0xffedd5, 2.5, 6, 1);
  ceilMain.position.set(0, 2.6, 0); scene.add(ceilMain);

  // Desk area (MacBook)
  const deskLamp = new THREE.PointLight(0xf5f5f4, 1.8, 4, 1);
  deskLamp.position.set(1.4, 1.5, -0.9); scene.add(deskLamp);

  const termLight = new THREE.PointLight(COLORS.cyan, 0.8, 3, 1);
  termLight.position.set(1.2, 1.2, -0.8); scene.add(termLight);

  // Wall-mounted TV glow
  const tvLight = new THREE.PointLight(COLORS.accent, 1.2, 4, 1);
  tvLight.position.set(2.0, 1.4, 0); scene.add(tvLight);
  tvLight.userData = { flicker: true, baseIntensity: 1.2, flickerSpeed: 8, flickerPhase: 0 };

  // Bed area (NW corner)
  const bedLight = new THREE.PointLight(0xffedd5, 0.5, 3, 1);
  bedLight.position.set(-1.6, 1.8, -0.5); scene.add(bedLight);

  // City light through window
  const cityLight = new THREE.PointLight(0x6688aa, 1.0, 6, 1);
  cityLight.position.set(0, 1.2, -2); scene.add(cityLight);

  // Corner accent
  scene.add(makeLight(COLORS.accent, 0.6, 4, [-2.2, 2.2, 0]));
}
