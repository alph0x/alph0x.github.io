import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildGun(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);

  const metalMat = makeStd({ color: 0x2a2a30 });
  g.add(makeBox(metalMat, [0.02, 0.03, 0.15], [0, 0.015, 0]));
  g.add(makeBox(metalMat, [0.015, 0.04, 0.04], [0, 0.02, 0.06]));
  return { mesh: g };
}
register('gun', buildGun);
