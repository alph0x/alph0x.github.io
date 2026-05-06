import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeCylinder } from '../../primitives.js';

function buildTrash(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const mat = makeStd({ color: 0x333340, roughness: 0.7, metalness: 0.2 });
  g.add(makeCylinder(mat, [0.12, 0.1, 0.25, 8], [0, 0.125, 0]));
  g.add(makeBox(makeStd({ color: 0x552222, roughness: 0.8, metalness: 0.0 }), [0.15, 0.08, 0.1], [0.02, 0.22, 0.02]));
  g.add(makeBox(makeStd({ color: 0x335533, roughness: 0.8, metalness: 0.0 }), [0.08, 0.06, 0.12], [-0.02, 0.24, -0.01]));
  return g;
}
register('trash', buildTrash);
