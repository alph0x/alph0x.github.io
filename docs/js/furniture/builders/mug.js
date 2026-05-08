import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildMug(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const mugMat = makeStd({ color: 0x887766 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), mugMat));
  g.add(makeBox(mugMat, [0.015, 0.01, 0.025], [0.035, 0.02, 0]));
  return { mesh: g };
}
register('mug', buildMug);
