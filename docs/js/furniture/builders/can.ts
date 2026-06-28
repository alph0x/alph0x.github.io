import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import type { FurnitureConfig } from '../../seed.js';

function buildCan(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = cfg.rotation ?? 0;
  const canMat = makeStd({ color: cfg.color || 0xcc3333 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), canMat));
  return { mesh: g };
}
register('can', buildCan);
