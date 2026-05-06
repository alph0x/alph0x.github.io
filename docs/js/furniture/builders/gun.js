import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildGun(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const metalMat = makeStd({ color: 0x2a2a30, roughness: 0.4, metalness: 0.7 });
  g.add(makeBox(metalMat, [0.02, 0.03, 0.15], [0, 0.015, 0]));
  g.add(makeBox(metalMat, [0.015, 0.04, 0.04], [0, 0.02, 0.06]));
  return g;
}
register('gun', buildGun);
