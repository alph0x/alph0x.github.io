import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildPaper(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const paperMat = makeStd({ color: 0xddccaa });
  for (let i = 0; i < (cfg.count || 2); i++) {
    const p = makeBox(paperMat, [0.08 + Math.random() * 0.04, 0.003, 0.1 + Math.random() * 0.04], [(Math.random() - 0.5) * 0.05, i * 0.004, (Math.random() - 0.5) * 0.05]);
    p.rotation.y = Math.random() * Math.PI;
    g.add(p);
  }
  return { mesh: g };
}
register('paper', buildPaper);
