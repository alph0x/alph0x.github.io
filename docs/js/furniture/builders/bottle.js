import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';

function buildBottle(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const bottleMat = makeStd({ color: cfg.color || 0x557733, transparent: true, opacity: 0.7 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.12, 8), bottleMat));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8), makeStd({ color: 0x888899 })));
  g.children[1].position.y = 0.075;
  return { mesh: g };
}
register('bottle', buildBottle);
