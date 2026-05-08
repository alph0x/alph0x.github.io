import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildDeskChair(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation || 0;
  const frameMat = makeStd({ color: 0x3a3a45 });
  const seatMat = makeStd({ color: 0x4a3a3a });
  g.add(makeBox(frameMat, [0.06, 0.5, 0.06], [0, 0.25, 0]));
  g.add(makeBox(frameMat, [0.4, 0.04, 0.4], [0, 0.02, 0]));
  g.add(makeBox(seatMat, [0.42, 0.06, 0.4], [0, 0.55, 0]));
  g.add(makeBox(seatMat, [0.38, 0.35, 0.04], [0, 0.75, -0.18]));
  return { mesh: g };
}
register('deskChair', buildDeskChair);
