import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildHeadset(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = cfg.rotation ?? 0;

  const bandMat = makeStd({ color: 0x1c1c1f });
  const padMat = makeStd({ color: 0x2a2a2e });
  const accentMat = new THREE.MeshBasicMaterial({ color: COLORS.accent });
  g.add(makeBox(bandMat, [0.18, 0.04, 0.14], [0, 0.08, 0]));
  g.add(makeBox(padMat, [0.04, 0.08, 0.08], [-0.1, 0.04, 0]));
  g.add(makeBox(padMat, [0.04, 0.08, 0.08], [0.1, 0.04, 0]));
  g.add(makeBox(accentMat, [0.02, 0.04, 0.04], [-0.12, 0.04, 0]));
  g.add(makeBox(accentMat, [0.02, 0.04, 0.04], [0.12, 0.04, 0]));
  g.add(makeBox(bandMat, [0.01, 0.01, 0.06], [0.1, 0.0, 0.06]));
  return { mesh: g };
}
register('headset', buildHeadset);
