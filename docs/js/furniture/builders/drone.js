import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildDrone(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const bodyMat = makeStd({ color: 0x4a4a55, roughness: 0.4, metalness: 0.5 });
  g.add(makeBox(bodyMat, [0.15, 0.06, 0.1], [0, 0, 0]));
  for (const lx of [-0.12, 0.12]) {
    const arm = makeBox(bodyMat, [0.04, 0.02, 0.12], [lx, 0, 0]);
    g.add(arm);
    const rotor = makeBox(new THREE.MeshBasicMaterial({ color: 0x1a1a1e }), [0.08, 0.01, 0.01], [lx, 0.04, 0]);
    g.add(rotor);
  }
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: COLORS.cyan }), [0.02, 0.02, 0.02], [0, 0, 0.06]));
  return g;
}
register('drone', buildDrone);
