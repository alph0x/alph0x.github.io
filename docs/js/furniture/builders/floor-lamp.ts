import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeCone, makeSphere, makeLight } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildFloorLamp(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);

  const metal = makeStd({ color: 0x2a2a30 });
  g.add(makeBox(metal, [0.2, 0.04, 0.2], [0, 0.02, 0]));
  g.add(makeBox(metal, [0.025, 1.6, 0.025], [0, 0.82, 0]));
  const shade = makeCone(makeStd({ color: 0xf59e0b }), [0.18, 0.22], [0, 1.65, 0]);
  shade.rotation.x = Math.PI; // point downward like a real lampshade
  g.add(shade);
  g.add(makeSphere(new THREE.MeshBasicMaterial({ color: 0xffedd5 }), [0.04], [0, 1.52, 0]));
  g.add(makeLight(0xf59e0b, 0.6, 5, [0, 1.55, 0]));
  return { mesh: g };
}
register('floorLamp', buildFloorLamp);
