import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildBoxStack(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const boxMat = makeStd({ color: 0x6a5040, roughness: 0.9, metalness: 0.0 });
  for (let i = 0; i < 3; i++) {
    const bx = (Math.random() - 0.5) * 0.15;
    const bz = (Math.random() - 0.5) * 0.15;
    g.add(makeBox(boxMat, [0.3 + Math.random() * 0.1, 0.25, 0.25 + Math.random() * 0.08], [bx, 0.125 + i * 0.25, bz]));
  }
  return g;
}
register('boxStack', buildBoxStack);
