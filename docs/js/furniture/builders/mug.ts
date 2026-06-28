import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import type { FurnitureConfig } from '../../seed.js';

function buildMug(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const [x, y, z] = cfg.position;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const mugMat = makeStd({ color: 0x887766 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), mugMat));
  // Loop handle using torus
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.015, 0.004, 4, 8, Math.PI),
    mugMat
  );
  handle.position.set(0.035, 0.02, 0);
  handle.rotation.z = Math.PI / 2;
  g.add(handle);
  return { mesh: g };
}
register('mug', buildMug);
