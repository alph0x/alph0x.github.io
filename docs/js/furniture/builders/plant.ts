import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeCylinder, rootGroup } from '../../primitives.js';
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

  for (const material of [pot, potRim, leafA, leafB]) material.flatShading = false;
  leafA.side = leafB.side = THREE.DoubleSide;

  // terracotta pot with rim and soil
  g.add(makeCylinder(pot, [0.13, 0.1, 0.22], [0, 0.11, 0], 24));
  g.add(makeCylinder(potRim, [0.145, 0.145, 0.035], [0, 0.225, 0], 24));
  g.add(makeCylinder(soil, [0.125, 0.125, 0.02], [0, 0.235, 0], 24));

  // A folded blade with a curved midrib: broad at the shoulder, fine at the tip.
  LEAVES.forEach(([lx, lz, tx, tz, h], i) => {
    const geo = new THREE.PlaneGeometry(1, 1, 6, 16);
    const positions = geo.attributes.position;
    const angle = i * 2.39996;
    for (let v = 0; v < positions.count; v++) {
      const t = positions.getY(v) + 0.5;
      const across = positions.getX(v) * 2;
      const width = Math.pow(Math.sin(Math.PI * t), 0.8) * 0.06;
      const bend = Math.sin(t * Math.PI * 0.72) * 0.075;
      positions.setXYZ(v, across * width, t * h,
        bend + Math.abs(across) * width * 0.4);
    }
    geo.computeVertexNormals();
    const leaf = new THREE.Mesh(geo, i % 2 ? leafA : leafB);
    leaf.position.set(lx, 0.235, lz);
    leaf.rotation.set(tx, angle, tz);
    leaf.castShadow = leaf.receiveShadow = true;
    g.add(leaf);
  });
  return { mesh: g };
}
register('plant', buildPlant);
