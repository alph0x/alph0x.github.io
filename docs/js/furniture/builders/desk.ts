import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texMetal, texPlastic } from '../../assets/index.js';
import { loadPbrSet } from '../../assets/pbr.js';
import { makeBox, makeCylinder, makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildDesk(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  const woodSet = loadPbrSet('wood-floor', 1, 1);
  const wood = makeStd({ map: woodSet.map, normalMap: woodSet.normalMap, roughnessMap: woodSet.roughnessMap, roughness: 0.8 });
  const woodDark = makeStd({ color: 0x3a2a20, map: woodSet.map, roughness: 0.85 });
  const metal = makeStd({ map: texMetal, roughness: 0.4, metalness: 0.6 });
  const plastic = makeStd({ map: texPlastic, roughness: 0.6 });
  const led = makeStd({ color: 0xffc98a, emissive: 0xffc98a, emissiveIntensity: 0.45 });

  // tabletop with edge thickness (slim 1.6 × 0.75 — a desk, not a banquet table)
  g.add(makeRoundedBox(wood, [1.6, 0.06, 0.75], [0, 0.8, 0], 0.03, 2));
  g.add(makeBox(woodDark, [1.58, 0.02, 0.73], [0, 0.77, 0]));

  // tapered metal legs with plastic feet
  for (const lx of [-0.72, 0.72]) {
    for (const lz of [-0.3, 0.3]) {
      g.add(makeCylinder(metal, [0.035, 0.02, 0.76], [lx, 0.4, lz], 8));
      g.add(makeRoundedBox(plastic, [0.06, 0.03, 0.06], [lx, 0.015, lz], 0.01, 2));
    }
  }

  // back and front crossbars
  g.add(makeBox(metal, [1.34, 0.03, 0.03], [0, 0.25, -0.3]));
  g.add(makeBox(metal, [1.34, 0.03, 0.03], [0, 0.25, 0.3]));

  // drawer block
  g.add(makeRoundedBox(wood, [0.46, 0.42, 0.68], [0.5, 0.59, 0], 0.03, 2));
  // drawer fronts
  g.add(makeRoundedBox(woodDark, [0.4, 0.16, 0.02], [0.5, 0.65, 0.345], 0.01, 2));
  g.add(makeRoundedBox(woodDark, [0.4, 0.16, 0.02], [0.5, 0.48, 0.345], 0.01, 2));
  // metal handles
  g.add(makeRoundedBox(metal, [0.14, 0.02, 0.02], [0.5, 0.65, 0.36], 0.005, 2));
  g.add(makeRoundedBox(metal, [0.14, 0.02, 0.02], [0.5, 0.48, 0.36], 0.005, 2));

  // warm underglow strip along the back edge
  g.add(makeBox(led, [1.34, 0.008, 0.015], [0, 0.74, -0.35]));

  return { mesh: g, label: 'Desk' };
}
register('desk', buildDesk);
