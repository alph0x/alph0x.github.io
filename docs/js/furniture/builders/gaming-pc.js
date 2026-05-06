import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { M, makeStd } from '../../assets/index.js';
import { makeBox, makeLight } from '../../primitives.js';

function buildGamingPC(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const caseMat = makeStd({ color: 0x1c1c1f, roughness: 0.3, metalness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.4 });
  g.add(makeBox(caseMat, [0.55, 1.1, 0.5], [0, 0.55, 0]));
  g.add(makeBox(glassMat, [0.02, 0.95, 0.4], [0.28, 0.55, 0]));
  for (let i = 0; i < 5; i++) {
    const ledColor = i % 2 === 0 ? COLORS.accent : COLORS.cyan;
    g.add(makeBox(new THREE.MeshStandardMaterial({ color: ledColor, emissive: ledColor, emissiveIntensity: 1.5, roughness: 0.2 }), [0.01, 0.12, 0.35], [0.3, 0.2 + i * 0.18, 0]));
  }
  g.add(makeBox(M.glowPurple, [0.52, 0.02, 0.01], [0, 0.15, 0.26]));
  g.add(makeBox(M.glowCyan, [0.52, 0.02, 0.01], [0, 0.95, 0.26]));
  for (const lx of [-0.2, 0.2]) for (const lz of [-0.2, 0.2]) g.add(makeBox(caseMat, [0.04, 0.04, 0.04], [lx, 0.02, lz]));
  g.add(makeLight(COLORS.accent, 0.8, 4, [0.3, 0.5, 0]));
  return g;
}
register('gamingPC', buildGamingPC);
