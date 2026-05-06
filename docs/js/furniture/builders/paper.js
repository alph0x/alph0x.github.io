import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildPaper(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const paperMat = makeStd({ color: 0xddccaa, roughness: 0.9, metalness: 0.0 });
  for (let i = 0; i < (cfg.count || 2); i++) {
    const p = makeBox(paperMat, [0.08 + Math.random() * 0.04, 0.003, 0.1 + Math.random() * 0.04], [(Math.random() - 0.5) * 0.05, i * 0.004, (Math.random() - 0.5) * 0.05]);
    p.rotation.y = Math.random() * Math.PI;
    g.add(p);
  }
  return g;
}
register('paper', buildPaper);
