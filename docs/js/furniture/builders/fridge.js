import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeLight } from '../../primitives.js';

function buildFridge(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const bodyMat = makeStd({ color: 0x5a5a65 });
  g.add(makeBox(bodyMat, [0.6, 1.4, 0.55], [0, 0.7, 0]));
  g.add(makeBox(makeStd({ color: 0x888899 }), [0.04, 0.3, 0.02], [0.2, 1.1, 0.28]));
  g.add(makeBox(makeStd({ color: 0x888899 }), [0.04, 0.3, 0.02], [0.2, 0.5, 0.28]));
  g.add(makeLight(0xffffff, 0.3, 3, [0, 0.5, 0.3]));
  return { mesh: g };
}
register('fridge', buildFridge);
