import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeCylinder, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildController(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const bodyMat = makeStd({ color: 0x1c1c1f });
  const btnMat = makeStd({ color: 0x444444 });
  g.add(makeBox(bodyMat, [0.16, 0.04, 0.1], [0, 0.02, 0]));
  g.add(makeBox(bodyMat, [0.04, 0.04, 0.06], [-0.08, 0.02, 0.06]));
  g.add(makeBox(bodyMat, [0.04, 0.04, 0.06], [0.08, 0.02, 0.06]));
  g.add(makeCylinder(btnMat, [0.015, 0.015, 0.02, 8] as unknown as [number, number, number], [-0.04, 0.05, 0]));
  g.add(makeCylinder(btnMat, [0.015, 0.015, 0.02, 8] as unknown as [number, number, number], [0.04, 0.05, -0.02]));
  g.add(makeBox(makeStd({ color: 0xcc3333 }), [0.02, 0.005, 0.02], [0.05, 0.045, 0.02]));
  g.add(makeBox(makeStd({ color: 0x3333cc }), [0.02, 0.005, 0.02], [-0.05, 0.045, 0.02]));
  return { mesh: g };
}
register('controller', buildController);
