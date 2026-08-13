import * as THREE from 'three';
import { rootGroup, makeCylinder } from '../../primitives.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import type { FurnitureConfig } from '../../seed.js';

function buildBottle(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const bottleMat = new THREE.MeshStandardMaterial({ color: cfg.color || 0x557733, transparent: true, opacity: 0.7, flatShading: true, roughness: 1, metalness: 0 });
  g.add(makeCylinder(bottleMat, [0.02, 0.03, 0.12], [0, 0, 0], 8));
  g.add(makeCylinder(makeStd({ color: 0x888899 }), [0.01, 0.01, 0.03], [0, 0.075, 0], 8));
  return { mesh: g };
}
register('bottle', buildBottle);
