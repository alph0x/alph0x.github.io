import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makePlane, makeLight } from '../../primitives.js';

function buildBathroom(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const white = makeStd({ color: 0x3a3a45, roughness: 0.4, metalness: 0.1 });
  const ceramic = makeStd({ color: 0x4a4a55, roughness: 0.2, metalness: 0.1 });
  g.add(makeBox(white, [0.35, 0.35, 0.18], [0, 0.55, -0.2]));
  g.add(makeBox(ceramic, [0.3, 0.35, 0.38], [0, 0.4, 0.05]));
  g.add(makeBox(makeStd({ color: 0x4a4a55, roughness: 0.3, metalness: 0.1 }), [0.32, 0.04, 0.4], [0, 0.6, 0.05]));
  g.add(makeBox(white, [0.5, 0.75, 0.35], [0.5, 0.375, 0.3]));
  g.add(makeBox(ceramic, [0.55, 0.06, 0.42], [0.5, 0.78, 0.3]));
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x888899 }), [0.04, 0.15, 0.04], [0.5, 0.9, 0.15]));
  g.add(makeBox(white, [0.5, 0.55, 0.03], [0.5, 1.15, 0.55]));
  g.add(makePlane(makeStd({ color: 0x8888aa, roughness: 0.1, metalness: 0.9 }), [0.42, 0.47], [0.5, 1.15, 0.57]));
  g.add(makeLight(0xffffff, 0.5, 4, [0.5, 1.4, 0.4]));
  return g;
}
register('bathroom', buildBathroom);
