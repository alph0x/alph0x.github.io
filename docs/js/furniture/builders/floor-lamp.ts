import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeCylinder, makeSphere, makeLight, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildFloorLamp(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);

  const metal = makeStd({ color: 0x4a4238, roughness: 0.6, flatShading: false });
  metal.flatShading = false;
  g.add(makeCylinder(metal, [.1, .1, .04], [0, .02, 0], 40));
  g.add(makeCylinder(metal, [.0125, .0125, 1.6], [0, .82, 0], 24));
  const shadeMat = makeStd({ color: 0xf3e5c8, roughness: .85, flatShading: false });
  shadeMat.flatShading = false;
  const profile = [[.078, 1.76], [.18, 1.543], [.18, 1.54], [.176, 1.54], [.074, 1.756], [.078, 1.76]];
  const shade = new THREE.Mesh(new THREE.LatheGeometry(profile.slice().reverse().map(([r, y]) => new THREE.Vector2(r, y)), 48), shadeMat);
  shade.castShadow = shade.receiveShadow = true;
  g.add(shade);
  // A narrow harp joins the stem to the shade's upper rim.
  g.add(makeCylinder(metal, [.006, .006, .14], [0, 1.69, 0], 16));
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    const arm = makeCylinder(metal, [.002, .002, .078], [.039 * Math.cos(a), 1.757, .039 * Math.sin(a)], 8);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    g.add(arm);
  }
  g.add(makeSphere(new THREE.MeshBasicMaterial({ color: 0xffe9c4 }), [0.04], [0, 1.52, 0]));
  g.add(makeLight(0xffd9a8, 0.6, 5, [0, 1.55, 0]));
  return { mesh: g };
}
register('floorLamp', buildFloorLamp);
