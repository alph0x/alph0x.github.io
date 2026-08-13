import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeCylinder, makeCone, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

// Fixed leaf arrangement — deterministic so the plant doesn't reshuffle every load.
const LEAVES: [number, number, number, number, number][] = [
  // x, z, tiltX, tiltZ, height
  [0.02, 0.01, 0.12, -0.08, 0.42],
  [-0.03, 0.02, -0.1, 0.14, 0.38],
  [0.01, -0.03, 0.06, 0.1, 0.45],
  [-0.02, -0.02, -0.14, -0.06, 0.34],
  [0.04, -0.01, 0.18, -0.12, 0.3],
  [-0.04, 0.03, -0.16, 0.08, 0.28],
  [0.0, 0.0, 0.04, -0.03, 0.48],
];

function buildPlant(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const pot = makeStd({ color: 0xb85c40, roughness: 0.8 });
  const potRim = makeStd({ color: 0xc96f4a, roughness: 0.8 });
  const soil = makeStd({ color: 0x4a3a2c, roughness: 1.0 });
  const leafA = makeStd({ color: 0x4e7a52, roughness: 0.85 });
  const leafB = makeStd({ color: 0x5d8a58, roughness: 0.85 });

  // terracotta pot with rim and soil
  g.add(makeCylinder(pot, [0.13, 0.1, 0.22], [0, 0.11, 0], 12));
  g.add(makeCylinder(potRim, [0.145, 0.145, 0.035], [0, 0.225, 0], 12));
  g.add(makeCylinder(soil, [0.125, 0.125, 0.02], [0, 0.235, 0], 12));

  LEAVES.forEach(([lx, lz, tx, tz, h], i) => {
    const l = makeCone(i % 2 ? leafA : leafB, [0.055, h], [lx, 0.24 + h / 2 - 0.04, lz], 7);
    l.rotation.x = tx;
    l.rotation.z = tz;
    g.add(l);
  });
  return { mesh: g };
}
register('plant', buildPlant);
