import * as THREE from 'three';
import { register } from '../registry.js';
import { M, makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildDesk(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;
  const metal = makeStd({ color: 0x4a4a55 });
  g.add(makeBox(M.wood, [1.8, 0.06, 0.9], [0, 0.8, 0]));
  for (const lx of [-0.8, 0.8]) {
    g.add(makeBox(metal, [0.06, 0.8, 0.06], [lx, 0.4, 0]));
    g.add(makeBox(metal, [0.2, 0.04, 0.4], [lx, 0.02, 0]));
  }
  g.add(makeBox(metal, [1.6, 0.04, 0.04], [0, 0.3, -0.4]));
  g.add(makeBox(M.concrete, [0.5, 0.4, 0.8], [0.5, 0.6, 0]));
  g.add(makeBox(M.glowCyan, [0.15, 0.02, 0.04], [0.5, 0.6, 0.42]));
  g.add(makeBox(makeStd({ color: 0x2a2a30 }), [0.6, 0.03, 0.2], [-0.2, 0.84, 0.15]));
  return { mesh: g };
}
register('desk', buildDesk);
