import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildShoes(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = cfg.rotation ?? 0;
  const shoeMat = makeStd({ color: 0x2a2a30 });
  const soleMat = makeStd({ color: 0xdddddd });
  for (const [sx, sz] of [[-0.08, 0], [0.08, 0.05]]) {
    // Sole
    g.add(makeBox(soleMat, [0.12, 0.015, 0.25], [sx, 0.0075, sz]));
    // Upper
    g.add(makeBox(shoeMat, [0.12, 0.05, 0.25], [sx, 0.04, sz]));
    // Toe taper (slightly smaller front)
    g.add(makeBox(shoeMat, [0.11, 0.04, 0.08], [sx, 0.035, sz - 0.12]));
  }
  return { mesh: g };
}
register('shoes', buildShoes);
