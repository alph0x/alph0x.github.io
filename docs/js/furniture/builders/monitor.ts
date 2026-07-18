import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd, texMetal, texPlastic, texScreenGlow } from '../../assets/index.js';
import { makeBox, makeLight, makePlane, makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildMonitor(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);

  const frameMat = makeStd({ map: texPlastic, color: 0x1c1c1f, roughness: 0.5, metalness: 0.2 });
  const standMat = makeStd({ map: texMetal, color: 0x151519, roughness: 0.4, metalness: 0.6 });
  const screenMat = new THREE.MeshBasicMaterial({ map: texScreenGlow });
  screenMat.color.multiplyScalar(4); // crosses the 0.85 bloom threshold
  const glowMat = makeStd({ color: COLORS.accent, emissive: COLORS.accent, emissiveIntensity: 1.4 });

  // thin rounded panel
  g.add(makeRoundedBox(frameMat, [1.2, 0.7, 0.04], [0, 0, 0], 0.015, 2));
  // emissive screen
  g.add(makePlane(screenMat, [1.12, 0.62], [0, 0, 0.021]));

  // thin bezel glow strips
  g.add(makeBox(glowMat, [1.15, 0.015, 0.02], [0, 0.345, -0.03]));
  g.add(makeBox(glowMat, [1.15, 0.015, 0.02], [0, -0.345, -0.03]));
  g.add(makeBox(glowMat, [0.015, 0.68, 0.02], [0.57, 0, -0.03]));
  g.add(makeBox(glowMat, [0.015, 0.68, 0.02], [-0.57, 0, -0.03]));

  // stand neck with cable-management notch
  g.add(makeRoundedBox(standMat, [0.08, 0.3, 0.08], [0, -0.5, -0.05], 0.01, 2));
  g.add(makeBox(makeStd({ color: 0x0a0a0c }), [0.03, 0.18, 0.03], [0, -0.5, -0.05]));

  // base
  g.add(makeRoundedBox(standMat, [0.4, 0.02, 0.25], [0, -0.65, -0.05], 0.01, 2));

  // glow
  g.add(makeLight(COLORS.accent, 1.2, 6, [0, 0, 0.3]));
  return { mesh: g };
}
register('monitor', buildMonitor);
