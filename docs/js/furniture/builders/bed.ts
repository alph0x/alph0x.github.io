import * as THREE from 'three';
import { register } from '../registry.js';
import { M, makeStd, texWood } from '../../assets/index.js';
import { loadPbrSet } from '../../assets/pbr.js';
import { makeBox, makeCylinder, makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildBed(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  const wood = makeStd({ map: texWood, color: 0x5a3a2a, roughness: 0.85 });
  const woodDark = makeStd({ map: texWood, color: 0x3d2b2b, roughness: 0.9 });
  const fabricSet = loadPbrSet('fabric', 2, 2);
  const fabricLight = makeStd({ map: fabricSet.map, normalMap: fabricSet.normalMap, color: 0xddddcc, roughness: 0.95 });
  const fabricWhite = makeStd({ map: fabricSet.map, color: 0xf5f5f0, roughness: 0.9 });
  const blanket = makeStd({ map: fabricSet.map, color: 0xc97e63, roughness: 1.0 });
  const throwMat = makeStd({ map: fabricSet.map, color: 0xd9a05b, roughness: 1.0 });

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

  // pillows propped against the headboard — kept clear of the blanket's edge
  const pillowL = makeRoundedBox(fabricWhite, [0.45, 0.12, 0.55], [-0.6, 0.6, -0.3], 0.04, 2);
  pillowL.rotation.z = 0.12;
  g.add(pillowL);
  const pillowR = makeRoundedBox(fabricWhite, [0.45, 0.12, 0.55], [-0.6, 0.6, 0.3], 0.04, 2);
  pillowR.rotation.z = 0.12;
  g.add(pillowR);

  // blanket over the foot half only, so the pillows stay visible
  g.add(makeRoundedBox(blanket, [1.15, 0.13, 1.32], [0.375, 0.59, 0], 0.04, 2));
  // folded throw across the foot
  g.add(makeRoundedBox(throwMat, [0.38, 0.05, 1.34], [0.6, 0.68, 0], 0.02, 2));
  // blanket overhang at foot
  g.add(makeRoundedBox(blanket, [1.15, 0.35, 0.08], [0.375, 0.44, 0.68], 0.03, 2));
  // blanket side drape suggestions
  g.add(makeRoundedBox(blanket, [0.06, 0.22, 0.7], [0.9, 0.42, 0.15], 0.03, 2));

  // thick headboard with subtle padded inset
  g.add(makeRoundedBox(wood, [0.12, 1.0, 1.4], [-0.95, 0.7, 0], 0.04, 2));
  g.add(makeRoundedBox(M.wood, [0.04, 0.85, 1.2], [-0.88, 0.7, 0], 0.02, 2));

  return { mesh: g, label: 'Bed' };
}
register('bed', buildBed);
