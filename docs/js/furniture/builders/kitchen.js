import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildKitchen(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const mat = makeStd({ color: 0x3a3a45 });
  const counter = makeStd({ color: 0x2a2a30 });
  const handle = makeStd({ color: 0x888899 });
  g.add(makeBox(mat, [0.7, 1.7, 0.7], [0, 0.85, 0]));
  g.add(makeBox(makeStd({ color: 0x252528 }), [0.65, 1.5, 0.05], [0, 0.85, 0.36]));
  g.add(makeBox(handle, [0.03, 0.3, 0.03], [0.22, 1.1, 0.4]));
  g.add(makeBox(counter, [1.4, 0.85, 0.6], [1.1, 0.425, 0]));
  for (let i = 0; i < 3; i++) {
    g.add(makeBox(mat, [0.4, 0.7, 0.04], [0.55 + i * 0.45, 0.5, 0.32]));
    g.add(makeBox(handle, [0.06, 0.02, 0.02], [0.65 + i * 0.45, 0.65, 0.35]));
  }
  g.add(makeBox(mat, [1.5, 0.04, 0.65], [1.1, 0.88, 0]));
  g.add(makeBox(counter, [1.4, 0.6, 0.35], [1.1, 1.7, -0.05]));
  for (let i = 0; i < 2; i++) g.add(makeBox(mat, [0.6, 0.5, 0.04], [0.7 + i * 0.7, 1.7, 0.14]));
  g.add(makeBox(makeStd({ color: 0x111114 }), [0.45, 0.28, 0.32], [1.1, 1.2, 0.05]));
  g.add(makeBox(makeStd({ color: 0x1a1a1e }), [0.38, 0.2, 0.02], [1.1, 1.2, 0.22]));
  g.add(makeBox(makeStd({ color: 0x111111 }), [0.5, 0.04, 0.5], [0.4, 0.9, 0]));
  g.add(makeBox(makeStd({ color: 0x222222 }), [0.08, 0.02, 0.08], [0.4, 0.93, 0]));
  return { mesh: g };
}
register('kitchen', buildKitchen);
