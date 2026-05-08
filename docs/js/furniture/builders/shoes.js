import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildShoes(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const shoeMat = makeStd({ color: 0x2a2a30 });
  g.add(makeBox(shoeMat, [0.12, 0.06, 0.25], [-0.08, 0.03, 0]));
  g.add(makeBox(shoeMat, [0.12, 0.06, 0.25], [0.08, 0.03, 0.05]));
  return { mesh: g };
}
register('shoes', buildShoes);
