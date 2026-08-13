import * as THREE from 'three';
import { rootGroup, makeCylinder } from '../../primitives.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import type { FurnitureConfig } from '../../seed.js';

function buildCan(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const canMat = makeStd({ color: cfg.color || 0xcc3333 });
  g.add(makeCylinder(canMat, [0.03, 0.03, 0.08], [0, 0, 0], 8));
  return { mesh: g };
}
register('can', buildCan);
