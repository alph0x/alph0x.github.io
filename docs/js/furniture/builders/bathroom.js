import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makePlane, makeLight } from '../../primitives.js';

function buildBathroom(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const white = makeStd({ color: 0xe8e8e8 });
  const ceramic = makeStd({ color: 0xd0d0d8 });
  const chrome = makeStd({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
  g.add(makeBox(white, [0.35, 0.35, 0.18], [0, 0.55, -0.2]));
  g.add(makeBox(ceramic, [0.3, 0.35, 0.38], [0, 0.4, 0.05]));
  g.add(makeBox(ceramic, [0.32, 0.04, 0.4], [0, 0.6, 0.05]));
  g.add(makeBox(white, [0.5, 0.75, 0.35], [0.5, 0.375, 0.3]));
  g.add(makeBox(ceramic, [0.55, 0.06, 0.42], [0.5, 0.78, 0.3]));
  g.add(makeBox(chrome, [0.04, 0.15, 0.04], [0.5, 0.9, 0.15]));
  g.add(makeBox(white, [0.5, 0.55, 0.03], [0.5, 1.15, 0.55]));
  // Mirror with reflective surface
  g.add(makePlane(
    new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 0.9, roughness: 0.05, flatShading: true }),
    [0.42, 0.47], [0.5, 1.15, 0.57]
  ));
  g.add(makeLight(0xffffff, 0.5, 4, [0.5, 1.4, 0.4]));
  return { mesh: g };
}
register('bathroom', buildBathroom);
