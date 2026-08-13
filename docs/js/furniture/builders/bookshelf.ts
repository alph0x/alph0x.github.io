import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texWood } from '../../assets/index.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

// Deterministic book rows: width, height, color, lean — hand-composed so the
// shelf looks arranged, not shuffled. Colors echo the room palette.
const BOOKS: [number, number, number, number][][] = [
  // shelf 0 (bottom): tall references, one leaning
  [
    [0.05, 0.3, 0xa85238, 0], [0.04, 0.28, 0x6a994e, 0], [0.055, 0.32, 0x264653, 0],
    [0.04, 0.27, 0xd9a05b, 0], [0.045, 0.3, 0xc97e63, 0], [0.04, 0.26, 0x8a8071, 0.12],
  ],
  // shelf 1: mixed with a horizontal stack on the right
  [
    [0.045, 0.26, 0x6fa8a0, 0], [0.05, 0.29, 0xb85c40, 0], [0.04, 0.25, 0xefe4cc, 0],
    [0.05, 0.28, 0x5d8a58, 0], [0.045, 0.24, 0x264653, -0.1],
  ],
  // shelf 2: paperbacks, warm run
  [
    [0.04, 0.24, 0xc96f4a, 0], [0.045, 0.26, 0xe9c46a, 0], [0.04, 0.23, 0x6a994e, 0],
    [0.05, 0.27, 0x8a6844, 0], [0.04, 0.25, 0xa8dadc, 0], [0.045, 0.22, 0xc97e63, 0.1],
  ],
  // shelf 3 (top): a small horizontal pile, spine colors muted
  [
    [0.05, 0.25, 0x264653, 0], [0.045, 0.24, 0xd77a61, 0],
  ],
];

function buildBookshelf(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const wood = makeStd({ map: texWood, color: 0x7a5c3e, roughness: 0.8 });
  const woodDark = makeStd({ map: texWood, color: 0x5f4630, roughness: 0.85 });

  const W = 0.8, H = 1.8, D = 0.28;
  // frame: sides, top, bottom, thin back — open front so books are visible
  g.add(makeBox(wood, [0.03, H, D], [-W / 2 + 0.015, H / 2, 0]));
  g.add(makeBox(wood, [0.03, H, D], [W / 2 - 0.015, H / 2, 0]));
  g.add(makeBox(wood, [W, 0.03, D], [0, H - 0.015, 0]));
  g.add(makeBox(wood, [W, 0.05, D], [0, 0.025, 0]));
  g.add(makeBox(woodDark, [W - 0.05, H, 0.02], [0, H / 2, -D / 2 + 0.01]));

  const shelfYs = [0.05, 0.5, 0.95, 1.4];
  for (let s = 0; s < 4; s++) {
    const sy = shelfYs[s];
    if (s > 0) g.add(makeBox(wood, [W - 0.06, 0.025, D - 0.03], [0, sy - 0.0125, 0.01]));
    const row = BOOKS[s];
    let cursor = -W / 2 + 0.08;
    for (const [bw, bh, color, lean] of row) {
      const book = makeBox(makeStd({ color, roughness: 0.85 }), [bw, bh, 0.19], [cursor + bw / 2, sy + bh / 2, 0.02]);
      if (lean !== 0) {
        book.rotation.z = lean;
        book.position.y = sy + (bh * Math.cos(lean)) / 2;
      }
      g.add(book);
      cursor += bw + 0.008 + Math.abs(lean) * 0.1;
    }
    // horizontal stack fills the right end of shelves 1 and 3
    if (s === 1 || s === 3) {
      const stackColors = s === 1 ? [0xe9c46a, 0x6fa8a0, 0xc0553a] : [0xefe4cc, 0xa85238];
      stackColors.forEach((color, i) => {
        g.add(makeBox(makeStd({ color, roughness: 0.85 }), [0.2, 0.035, 0.16], [W / 2 - 0.16, sy + 0.02 + i * 0.038, 0.02]));
      });
    }
  }
  return { mesh: g };
}
register('bookshelf', buildBookshelf);
