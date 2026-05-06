import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildHeadset(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const bandMat = makeStd({ color: 0x1c1c1f, roughness: 0.6, metalness: 0.2 });
  const padMat = makeStd({ color: 0x2a2a2e, roughness: 0.9, metalness: 0.0 });
  const accentMat = new THREE.MeshStandardMaterial({ color: COLORS.accent, emissive: COLORS.accent, emissiveIntensity: 0.6, roughness: 0.3 });
  g.add(makeBox(bandMat, [0.18, 0.04, 0.14], [0, 0.08, 0]));
  g.add(makeBox(padMat, [0.04, 0.08, 0.08], [-0.1, 0.04, 0]));
  g.add(makeBox(padMat, [0.04, 0.08, 0.08], [0.1, 0.04, 0]));
  g.add(makeBox(accentMat, [0.02, 0.04, 0.04], [-0.12, 0.04, 0]));
  g.add(makeBox(accentMat, [0.02, 0.04, 0.04], [0.12, 0.04, 0]));
  g.add(makeBox(bandMat, [0.01, 0.01, 0.06], [0.1, 0.0, 0.06]));
  return g;
}
register('headset', buildHeadset);
