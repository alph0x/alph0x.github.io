import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, rootGroup, seededRng } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildPaper(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const paperMat = makeStd({ color: 0xf5f5f0 });
  const rng = seededRng(Math.floor((Math.abs(cfg.position[0] ?? 0) + Math.abs(cfg.position[2] ?? 0)) * 1000));
  for (let i = 0; i < (cfg.count || 2); i++) {
    const p = makeBox(paperMat, [0.08 + rng() * 0.04, 0.003, 0.1 + rng() * 0.04], [(rng() - 0.5) * 0.05, i * 0.004, (rng() - 0.5) * 0.05]);
    p.rotation.y = rng() * Math.PI;
    g.add(p);
  }
  return { mesh: g };
}
register('paper', buildPaper);
