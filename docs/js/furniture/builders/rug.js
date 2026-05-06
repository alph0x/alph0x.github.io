import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';

function buildRug(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const rugMat = makeStd({ color: 0x3a3028, roughness: 0.95, metalness: 0.0 });
  const patternMat = makeStd({ color: 0x5a4a40, roughness: 0.9, metalness: 0.0 });
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.8), rugMat));
  const pattern = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), patternMat);
  pattern.position.set(0, 0.001, 0);
  g.add(pattern);
  g.rotation.x = -Math.PI / 2;
  return g;
}
register('rug', buildRug);
