import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texMetal, texWood } from '../../assets/index.js';
import { makeCylinder, makeRoundedBox, makeSphere, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildNightstand(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  const woodMat = makeStd({ map: texWood, color: 0x5a3a2a, roughness: 0.85 });
  const drawerMat = makeStd({ map: texWood, color: 0x6a4a3a, roughness: 0.85 });
  const metalMat = makeStd({ map: texMetal, color: 0x888899, roughness: 0.3, metalness: 0.7 });

  for (const material of [woodMat, drawerMat, metalMat]) material.flatShading = false;

  // tapered legs
  for (const lx of [-0.2, 0.2]) {
    for (const lz of [-0.15, 0.15]) {
      g.add(makeCylinder(woodMat, [0.025, 0.015, 0.15], [lx, 0.075, lz], 8));
    }
  }

  // rounded body
  g.add(makeRoundedBox(woodMat, [0.5, 0.5, 0.4], [0, 0.32, 0], 0.03, 2));
  // top surface overhang
  g.add(makeRoundedBox(woodMat, [0.52, 0.04, 0.42], [0, 0.57, 0], 0.012, 2));
  // drawer front
  g.add(makeRoundedBox(drawerMat, [0.44, 0.18, 0.02], [0, 0.42, 0.21], 0.01, 2));
  // drawer handle
  const handle = makeRoundedBox(metalMat, [0.13, 0.02, 0.02], [0, 0.42, 0.235], 0.008, 2);
  handle.name = 'nightstand-drawer-handle';
  g.add(handle);
  for (const x of [-0.05, 0.05]) {
    g.add(makeRoundedBox(metalMat, [0.015, 0.018, 0.025], [x, 0.42, 0.2225], 0.005, 2));
  }
  // small decorative feet caps
  for (const lx of [-0.2, 0.2]) {
    for (const lz of [-0.15, 0.15]) {
      g.add(makeSphere(metalMat, [0.012], [lx, 0.005, lz], 8));
    }
  }

  return { mesh: g, label: 'Nightstand' };
}
register('nightstand', buildNightstand);
