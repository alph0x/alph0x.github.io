import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildCoffeeTable(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const mat = makeStd({ color: 0x2a2a30 });
  g.add(makeBox(mat, [0.9, 0.05, 0.55], [0, 0.4, 0]));
  for (const lx of [-0.4, 0.4]) for (const lz of [-0.25, 0.25]) g.add(makeBox(mat, [0.03, 0.03, 0.4], [lx, 0.2, lz]));
  g.add(makeBox(makeStd({ color: 0x554433 }), [0.04, 0.04, 0.08], [0.15, 0.47, 0.05]));
  return { mesh: g };
}
register('coffeeTable', buildCoffeeTable);
