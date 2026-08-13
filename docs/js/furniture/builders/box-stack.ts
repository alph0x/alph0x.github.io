import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, rootGroup, seededRng } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildBoxStack(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const boxMat = makeStd({ color: 0x8b5a2b });
  const rng = seededRng(Math.floor((Math.abs(cfg.position[0] ?? 0) + Math.abs(cfg.position[2] ?? 0)) * 1000));
  for (let i = 0; i < 3; i++) {
    const bx = (rng() - 0.5) * 0.15;
    const bz = (rng() - 0.5) * 0.15;
    g.add(makeBox(boxMat, [0.3 + rng() * 0.1, 0.25, 0.25 + rng() * 0.08], [bx, 0.125 + i * 0.25, bz]));
  }
  return { mesh: g };
}
register('boxStack', buildBoxStack);
