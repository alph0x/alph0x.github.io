import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, rootGroup, seededRng } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildBookStack(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const colors = [0x8b5a2b, 0x2e4d38, 0x5c3a5a, 0x8b4513];
  const rng = seededRng(Math.floor((Math.abs(cfg.position[0] ?? 0) + Math.abs(cfg.position[2] ?? 0)) * 1000));
  for (let i = 0; i < (cfg.count || 3); i++) {
    const bw = 0.15 + rng() * 0.05;
    const bh = 0.03 + rng() * 0.02;
    const bl = 0.2 + rng() * 0.05;
    const book = makeBox(makeStd({ color: colors[i % colors.length] }), [bw, bh, bl], [(rng() - 0.5) * 0.02, i * 0.035, (rng() - 0.5) * 0.02]);
    book.rotation.y = (rng() - 0.5) * 0.1;
    g.add(book);
  }
  return { mesh: g };
}
register('bookStack', buildBookStack);
