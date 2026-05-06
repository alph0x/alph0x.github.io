import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';

function buildCan(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const canMat = makeStd({ color: cfg.color || 0xcc3333, roughness: 0.3, metalness: 0.7 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), canMat));
  return g;
}
register('can', buildCan);
