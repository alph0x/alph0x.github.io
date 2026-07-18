import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeCylinder, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildTrash(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const mat = makeStd({ color: 0x333340 });
  g.add(makeCylinder(mat, [0.12, 0.1, 0.25], [0, 0.125, 0], 8));
  g.add(makeBox(makeStd({ color: 0x552222 }), [0.15, 0.08, 0.1], [0.02, 0.22, 0.02]));
  g.add(makeBox(makeStd({ color: 0x335533 }), [0.08, 0.06, 0.12], [-0.02, 0.24, -0.01]));
  return { mesh: g };
}
register('trash', buildTrash);
