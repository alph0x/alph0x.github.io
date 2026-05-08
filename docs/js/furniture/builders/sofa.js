import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildSofa(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const mat = makeStd({ color: 0x4a3a3a });
  const accent = makeStd({ color: 0x2a2a35 });
  const cushion = makeStd({ color: 0x5a4a4a });
  for (const lx of [-0.8, 0.8]) for (const lz of [-0.35, 0.35]) g.add(makeBox(accent, [0.06, 0.15, 0.06], [lx, 0.075, lz]));
  g.add(makeBox(mat, [1.8, 0.25, 0.8], [0, 0.25, 0]));
  for (let i = -1; i <= 1; i++) g.add(makeBox(cushion, [0.5, 0.15, 0.75], [i * 0.55, 0.45, 0]));
  for (let i = -1; i <= 1; i++) g.add(makeBox(mat, [0.55, 0.45, 0.12], [i * 0.55, 0.6, -0.34]));
  for (const lx of [-0.9, 0.9]) g.add(makeBox(accent, [0.15, 0.45, 0.8], [lx, 0.35, 0]));
  return { mesh: g };
}
register('sofa', buildSofa);
