import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texMetal, texPlastic, texWood } from '../../assets/index.js';
import { makeBox, makeCylinder, makeRoundedBox, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildDesk(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const g = rootGroup(cfg);

  const wood = makeStd({ map: texWood, roughness: 0.8 });
  const woodDark = makeStd({ color: 0x3a2a20, map: texWood, roughness: 0.85 });
  const metal = makeStd({ map: texMetal, roughness: 0.4, metalness: 0.6 });
  const plastic = makeStd({ map: texPlastic, roughness: 0.6 });
  const led = makeStd({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.8 });

  // tabletop with edge thickness
  g.add(makeRoundedBox(wood, [1.8, 0.06, 0.9], [0, 0.8, 0], 0.03, 2));
  g.add(makeBox(woodDark, [1.78, 0.02, 0.88], [0, 0.77, 0]));

  // tapered metal legs with plastic feet
  for (const lx of [-0.8, 0.8]) {
    for (const lz of [-0.35, 0.35]) {
      g.add(makeCylinder(metal, [0.035, 0.02, 0.76], [lx, 0.4, lz], 8));
      g.add(makeRoundedBox(plastic, [0.06, 0.03, 0.06], [lx, 0.015, lz], 0.01, 2));
    }
  }

  // back and front crossbars
  g.add(makeBox(metal, [1.5, 0.03, 0.03], [0, 0.25, -0.35]));
  g.add(makeBox(metal, [1.5, 0.03, 0.03], [0, 0.25, 0.35]));

  // drawer block
  g.add(makeRoundedBox(wood, [0.5, 0.42, 0.82], [0.55, 0.59, 0], 0.03, 2));
  // drawer fronts
  g.add(makeRoundedBox(woodDark, [0.44, 0.16, 0.02], [0.55, 0.65, 0.415], 0.01, 2));
  g.add(makeRoundedBox(woodDark, [0.44, 0.16, 0.02], [0.55, 0.48, 0.415], 0.01, 2));
  // metal handles
  g.add(makeRoundedBox(metal, [0.14, 0.02, 0.02], [0.55, 0.65, 0.43], 0.005, 2));
  g.add(makeRoundedBox(metal, [0.14, 0.02, 0.02], [0.55, 0.48, 0.43], 0.005, 2));

  // LED strip glow under back edge
  g.add(makeBox(led, [1.5, 0.01, 0.02], [0, 0.74, -0.42]));
  // keyboard mat
  g.add(makeRoundedBox(plastic, [0.6, 0.02, 0.22], [-0.2, 0.84, 0.15], 0.01, 2));

  return { mesh: g, label: 'Desk' };
}
register('desk', buildDesk);
