import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { M } from '../../assets/index.js';
import { makeBox, makeLight } from '../../primitives.js';

function buildMonitor(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.4, metalness: 0.3 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, emissive: COLORS.accent, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.1 });
  g.add(makeBox(frameMat, [1.2, 0.7, 0.04], [0, 0, 0]));
  g.add(makeBox(screenMat, [1.1, 0.6, 0.02], [0, 0, 0.03]));
  g.add(makeBox(frameMat, [0.08, 0.3, 0.08], [0, -0.5, -0.05]));
  g.add(makeBox(frameMat, [0.4, 0.02, 0.25], [0, -0.65, -0.05]));
  g.add(makeBox(M.glowPurple, [1.15, 0.02, 0.02], [0, 0.35, -0.03]));
  g.add(makeBox(M.glowPurple, [1.15, 0.02, 0.02], [0, -0.35, -0.03]));
  g.add(makeBox(M.glowPurple, [0.02, 0.65, 0.02], [0.57, 0, -0.03]));
  g.add(makeBox(M.glowPurple, [0.02, 0.65, 0.02], [-0.57, 0, -0.03]));
  g.add(makeLight(COLORS.accent, 1.2, 6, [0, 0, 0.3]));
  return g;
}
register('monitor', buildMonitor);
