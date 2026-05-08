import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makePlane } from '../../primitives.js';

function buildMirror(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const frameMat = makeStd({ color: 0x3a3a45 });
  g.add(makeBox(frameMat, [0.7, 0.9, 0.04], [0, 0, 0]));
  g.add(makePlane(makeStd({ color: 0x8899aa }), [0.6, 0.8], [0, 0, 0.03]));
  return { mesh: g };
}
register('mirror', buildMirror);
