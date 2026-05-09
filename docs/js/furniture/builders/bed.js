import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildBed(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const wood = makeStd({ color: 0x5a3a2a });
  const mattress = makeStd({ color: 0xddddcc });
  const pillow = makeStd({ color: 0xf5f5f0 });
  const blanket = makeStd({ color: 0x2a4a6a });
  for (const lx of [-0.9, 0.9]) for (const lz of [-0.6, 0.6]) g.add(makeBox(wood, [0.06, 0.2, 0.06], [lx, 0.1, lz]));
  g.add(makeBox(wood, [2.0, 0.15, 1.4], [0, 0.2, 0]));
  g.add(makeBox(mattress, [1.9, 0.25, 1.3], [0, 0.4, 0]));
  g.add(makeBox(pillow, [0.45, 0.12, 0.7], [-0.5, 0.6, -0.25]));
  g.add(makeBox(pillow, [0.45, 0.12, 0.7], [-0.5, 0.6, 0.25]));
  g.add(makeBox(blanket, [1.5, 0.15, 1.32], [0.15, 0.6, 0]));
  g.add(makeBox(blanket, [1.5, 0.35, 0.08], [0.15, 0.45, 0.68]));
  g.add(makeBox(wood, [0.1, 1.0, 1.4], [-0.95, 0.7, 0]));
  return { mesh: g };
}
register('bed', buildBed);
