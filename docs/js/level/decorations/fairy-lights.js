import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { makeLight } from '../../primitives.js';

export function placeFairyLights(scene, cfg) {
  const colors = [COLORS.magenta, COLORS.cyan, COLORS.accent, COLORS.green];
  for (let i = 0; i < 10; i++) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
    bulb.position.set(cfg.position[0] - 0.8 + (i * 0.18), cfg.position[1], cfg.position[2] + 0.05);
    scene.add(bulb);
    if (i % 3 === 0) scene.add(makeLight(colors[i % colors.length], 0.08, 1.2, [cfg.position[0] - 0.8 + (i * 0.18), cfg.position[1], cfg.position[2] + 0.05]));
  }
}
