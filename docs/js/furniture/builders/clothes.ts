import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildClothes(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const clothMat = makeStd({ color: cfg.color || 0x4a3a3a });
  for (let i = 0; i < 4; i++) {
    const c = makeBox(clothMat, [0.2 + Math.random() * 0.1, 0.02, 0.2 + Math.random() * 0.1], [(Math.random() - 0.5) * 0.15, i * 0.015, (Math.random() - 0.5) * 0.15]);
    c.rotation.y = Math.random() * Math.PI;
    g.add(c);
  }
  return { mesh: g };
}
register('clothes', buildClothes);
