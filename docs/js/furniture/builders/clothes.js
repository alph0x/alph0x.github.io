import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildClothes(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const clothMat = makeStd({ color: cfg.color || 0x4a3a3a, roughness: 0.95, metalness: 0.0 });
  for (let i = 0; i < 4; i++) {
    const c = makeBox(clothMat, [0.2 + Math.random() * 0.1, 0.02, 0.2 + Math.random() * 0.1], [(Math.random() - 0.5) * 0.15, i * 0.015, (Math.random() - 0.5) * 0.15]);
    c.rotation.y = Math.random() * Math.PI;
    g.add(c);
  }
  return g;
}
register('clothes', buildClothes);
