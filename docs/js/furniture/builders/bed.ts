import * as THREE from 'three';
import { register } from '../registry.js';
import { M, makeStd, texFabric, texWood } from '../../assets/index.js';
import { makeBox, makeCylinder, makeRoundedBox } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildBed(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = cfg.rotation ?? 0;

  const wood = makeStd({ map: texWood, color: 0x5a3a2a, roughness: 0.85 });
  const woodDark = makeStd({ map: texWood, color: 0x3d2b2b, roughness: 0.9 });
  const fabricLight = makeStd({ map: texFabric, color: 0xddddcc, roughness: 0.95 });
  const fabricWhite = makeStd({ map: texFabric, color: 0xf5f5f0, roughness: 0.9 });
  const blanket = makeStd({ map: texFabric, color: 0x2a4a6a, roughness: 1.0 });

  // tapered legs
  for (const lx of [-0.9, 0.9]) {
    for (const lz of [-0.6, 0.6]) {
      g.add(makeCylinder(woodDark, [0.05, 0.03, 0.2], [lx, 0.1, lz], 8));
    }
  }

  // base frame with edge trim
  g.add(makeBox(wood, [2.0, 0.12, 1.4], [0, 0.21, 0]));
  g.add(makeBox(woodDark, [1.9, 0.03, 1.3], [0, 0.27, 0]));

  // rounded mattress
  g.add(makeRoundedBox(fabricLight, [1.9, 0.25, 1.3], [0, 0.4, 0], 0.06, 2));

  // pillows
  g.add(makeRoundedBox(fabricWhite, [0.45, 0.12, 0.7], [-0.5, 0.6, -0.25], 0.04, 2));
  g.add(makeRoundedBox(fabricWhite, [0.45, 0.12, 0.7], [-0.5, 0.6, 0.25], 0.04, 2));

  // blanket draped over lower half
  g.add(makeRoundedBox(blanket, [1.5, 0.15, 1.32], [0.15, 0.6, 0], 0.04, 2));
  // blanket overhang at foot
  g.add(makeRoundedBox(blanket, [1.5, 0.35, 0.08], [0.15, 0.45, 0.68], 0.03, 2));
  // blanket side drape suggestions
  g.add(makeRoundedBox(blanket, [0.06, 0.22, 0.7], [0.9, 0.42, 0.15], 0.03, 2));

  // thick headboard with subtle padded inset
  g.add(makeRoundedBox(wood, [0.12, 1.0, 1.4], [-0.95, 0.7, 0], 0.04, 2));
  g.add(makeRoundedBox(M.wood, [0.04, 0.85, 1.2], [-0.88, 0.7, 0], 0.02, 2));

  return { mesh: g };
}
register('bed', buildBed);
