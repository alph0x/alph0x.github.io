import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeCone, makeSphere, makeLight } from '../../primitives.js';

function buildFloorLamp(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const metal = makeStd({ color: 0x2a2a30, roughness: 0.4, metalness: 0.6 });
  g.add(makeBox(metal, [0.2, 0.04, 0.2], [0, 0.02, 0]));
  g.add(makeBox(metal, [0.025, 1.6, 0.025], [0, 0.82, 0]));
  g.add(makeCone(makeStd({ color: 0xf59e0b, roughness: 0.6, metalness: 0.1 }), [0.18, 0.22, 8], [0, 1.65, 0]));
  g.add(makeSphere(new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xffedd5, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.0 }), [0.04, 8, 8], [0, 1.55, 0]));
  g.add(makeLight(0xf59e0b, 0.6, 5, [0, 1.55, 0]));
  return g;
}
register('floorLamp', buildFloorLamp);
