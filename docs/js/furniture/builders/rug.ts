import * as THREE from 'three';
import { makePlane } from '../../primitives.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import type { FurnitureConfig } from '../../seed.js';

function buildRug(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const rugMat = makeStd({ color: 0x3a3028 });
  const patternMat = makeStd({ color: 0x5a4a40 });
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.8), rugMat));
  const pattern = makePlane(patternMat, [1.5, 0.8], [0, 0, 0]);
  pattern.position.set(0, 0.001, 0);
  g.add(pattern);
  g.rotation.x = -Math.PI / 2;
  return { mesh: g };
}
register('rug', buildRug);
