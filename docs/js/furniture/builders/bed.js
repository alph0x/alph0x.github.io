import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeRoundedBox } from '../../primitives.js';

function buildBed(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;

  const wood = makeStd({ color: 0x5a3a2a, roughness: 0.9 });
  const mattress = makeStd({ color: 0xddddcc, roughness: 0.95 });
  const pillow = makeStd({ color: 0xf5f5f0, roughness: 0.9 });
  const blanket = makeStd({ color: 0x2a4a6a, roughness: 1.0 });

  // legs
  for (const lx of [-0.9, 0.9]) for (const lz of [-0.6, 0.6]) g.add(makeBox(wood, [0.06, 0.2, 0.06], [lx, 0.1, lz]));
  // base frame
  g.add(makeBox(wood, [2.0, 0.15, 1.4], [0, 0.2, 0]));
  // rounded mattress
  g.add(makeRoundedBox(mattress, [1.9, 0.25, 1.3], [0, 0.4, 0], 0.06, 2));
  // pillows
  g.add(makeRoundedBox(pillow, [0.45, 0.12, 0.7], [-0.5, 0.6, -0.25], 0.04, 2));
  g.add(makeRoundedBox(pillow, [0.45, 0.12, 0.7], [-0.5, 0.6, 0.25], 0.04, 2));
  // blanket draped over lower half
  g.add(makeRoundedBox(blanket, [1.5, 0.15, 1.32], [0.15, 0.6, 0], 0.04, 2));
  // blanket overhang at foot
  g.add(makeRoundedBox(blanket, [1.5, 0.35, 0.08], [0.15, 0.45, 0.68], 0.03, 2));
  // blanket side drape suggestions
  g.add(makeRoundedBox(blanket, [0.06, 0.22, 0.7], [0.9, 0.42, 0.15], 0.03, 2));
  // thick headboard
  g.add(makeRoundedBox(wood, [0.12, 1.0, 1.4], [-0.95, 0.7, 0], 0.04, 2));

  return { mesh: g };
}
register('bed', buildBed);
