import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildBookshelf(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const mat = makeStd({ color: 0x4a3333 });
  const books = [
    makeStd({ color: 0x552222 }),
    makeStd({ color: 0x225533 }),
    makeStd({ color: 0x223355 }),
    makeStd({ color: 0x554422 }),
  ];
  g.add(makeBox(mat, [0.8, 1.8, 0.25], [0, 0.9, 0]));
  for (let s = 0; s < 4; s++) {
    const sy = 0.3 + s * 0.45;
    g.add(makeBox(mat, [0.75, 0.03, 0.22], [0, sy, 0]));
    for (let b = 0; b < 5 + Math.random() * 4; b++) {
      const bw = 0.04 + Math.random() * 0.04;
      const bh = 0.25 + Math.random() * 0.1;
      g.add(makeBox(books[Math.floor(Math.random() * books.length)], [bw, bh, 0.18], [-0.3 + b * 0.07, sy + bh / 2 + 0.015, 0]));
    }
  }
  return { mesh: g };
}
register('bookshelf', buildBookshelf);
