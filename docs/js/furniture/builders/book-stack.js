import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildBookStack(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const colors = [0x552222, 0x225533, 0x223355, 0x554422, 0x333355];
  for (let i = 0; i < (cfg.count || 3); i++) {
    const bw = 0.15 + Math.random() * 0.05;
    const bh = 0.03 + Math.random() * 0.02;
    const bl = 0.2 + Math.random() * 0.05;
    const book = makeBox(makeStd({ color: colors[i % colors.length], roughness: 0.85, metalness: 0.0 }), [bw, bh, bl], [(Math.random() - 0.5) * 0.02, i * 0.035, (Math.random() - 0.5) * 0.02]);
    book.rotation.y = (Math.random() - 0.5) * 0.1;
    g.add(book);
  }
  return g;
}
register('bookStack', buildBookStack);
