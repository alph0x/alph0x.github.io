import * as THREE from 'three';
import { register } from '../registry.js';
import { COLORS } from '../../core.js';
import { makeStd, texWood } from '../../assets/index.js';
import { makeBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

// Open-front shelf: frame + visible books on the +z face (P-14; the old slab hid
// its books inside the solid box). Deterministic sizes — stable room reads.
function buildBookshelf(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const wood = makeStd({ map: texWood, color: 0x5a3a2a, roughness: 0.85 });
  const woodDark = makeStd({ map: texWood, color: 0x3d2b2b, roughness: 0.9 });
  const spines = [COLORS.fabricSage, COLORS.nightIndigo, COLORS.duskAmber, COLORS.plasterCream, COLORS.woodHoney]
    .map((color) => makeStd({ color }));

  // Frame: back panel, sides, top/bottom (interior 0.74 wide, 0.22 deep)
  g.add(makeBox(woodDark, [0.8, 1.8, 0.03], [0, 0.9, -0.11]));
  for (const sx of [-0.385, 0.385]) g.add(makeBox(wood, [0.03, 1.8, 0.25], [sx, 0.9, 0]));
  g.add(makeBox(wood, [0.8, 0.04, 0.25], [0, 1.78, 0]));
  g.add(makeBox(wood, [0.8, 0.06, 0.25], [0, 0.03, 0]));

  // Shelves with books proud of the front face
  for (let s = 0; s < 4; s++) {
    const sy = 0.3 + s * 0.42;
    g.add(makeBox(wood, [0.74, 0.03, 0.22], [0, sy, 0]));
    const n = 5 + (s % 3);
    let bx = -0.32;
    for (let b = 0; b < n; b++) {
      const bw = 0.035 + ((b * 7 + s * 3) % 4) * 0.008;
      const bh = 0.24 + ((b * 5 + s) % 3) * 0.035;
      const book = makeBox(spines[(b + s) % spines.length], [bw, bh, 0.17], [bx + bw / 2, sy + 0.015 + bh / 2, 0.015]);
      if ((b + s) % 5 === 4) book.rotation.z = -0.08; // one leaner per shelf
      g.add(book);
      bx += bw + 0.012;
    }
  }
  return { mesh: g };
}
register('bookshelf', buildBookshelf);
