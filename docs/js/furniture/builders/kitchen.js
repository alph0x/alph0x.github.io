import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildKitchen(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const cabinet = makeStd({ color: 0x5a4a3a });
  const counter = makeStd({ color: 0x3a3a38 });
  const handle = makeStd({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
  g.add(makeBox(cabinet, [0.7, 1.7, 0.7], [0, 0.85, 0]));
  g.add(makeBox(makeStd({ color: 0x4a3a2a }), [0.65, 1.5, 0.05], [0, 0.85, 0.36]));
  g.add(makeBox(handle, [0.03, 0.3, 0.03], [0.22, 1.1, 0.4]));
  g.add(makeBox(counter, [1.4, 0.85, 0.6], [1.1, 0.425, 0]));
  for (let i = 0; i < 3; i++) {
    g.add(makeBox(cabinet, [0.4, 0.7, 0.04], [0.55 + i * 0.45, 0.5, 0.32]));
    g.add(makeBox(handle, [0.06, 0.02, 0.02], [0.65 + i * 0.45, 0.65, 0.35]));
  }
  g.add(makeBox(cabinet, [1.5, 0.04, 0.65], [1.1, 0.88, 0]));
  g.add(makeBox(counter, [1.4, 0.6, 0.35], [1.1, 1.7, -0.05]));
  for (let i = 0; i < 2; i++) g.add(makeBox(cabinet, [0.6, 0.5, 0.04], [0.7 + i * 0.7, 1.7, 0.14]));

  // Oven with glowing interior
  const ovenMat = makeStd({ color: 0x1a1a1e });
  const ovenGlass = new THREE.MeshStandardMaterial({ color: 0x080810, flatShading: true, roughness: 0.2, metalness: 0.5 });
  g.add(makeBox(ovenMat, [0.45, 0.28, 0.32], [1.1, 1.2, 0.05]));
  g.add(makeBox(ovenGlass, [0.38, 0.2, 0.02], [1.1, 1.2, 0.22]));
  // Oven knobs
  for (let i = 0; i < 3; i++) {
    g.add(makeBox(handle, [0.04, 0.04, 0.02], [0.95 + i * 0.1, 1.42, 0.22]));
  }

  // Stove burners with emissive heat
  const burnerMat = makeStd({ color: 0x111111, emissive: 0xff4400, emissiveIntensity: 0.6 });
  g.add(makeBox(burnerMat, [0.5, 0.04, 0.5], [0.4, 0.9, 0]));
  g.add(makeBox(burnerMat, [0.08, 0.02, 0.08], [0.4, 0.93, 0]));
  return { mesh: g };
}
register('kitchen', buildKitchen);
