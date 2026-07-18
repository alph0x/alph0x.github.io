import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeCylinder, makeCone, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildPlant(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const pot = makeStd({ color: 0x5a3a20 });
  const leaf = makeStd({ color: 0x1a5a2a });
  g.add(makeCylinder(pot, [0.15, 0.12, 0.25], [0, 0.125, 0]));
  for (let i = 0; i < 7; i++) {
    const l = makeCone(leaf, [0.08, 0.3], [(Math.random() - 0.5) * 0.15, 0.35, (Math.random() - 0.5) * 0.15]);
    l.rotation.x = (Math.random() - 0.5) * 0.5; l.rotation.z = (Math.random() - 0.5) * 0.5;
    g.add(l);
  }
  return { mesh: g };
}
register('plant', buildPlant);
