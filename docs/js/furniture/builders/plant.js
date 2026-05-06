import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeCylinder, makeCone } from '../../primitives.js';

function buildPlant(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const pot = makeStd({ color: 0x5a3a20, roughness: 0.9, metalness: 0.0 });
  const leaf = makeStd({ color: 0x1a5a2a, roughness: 0.8, metalness: 0.0 });
  g.add(makeCylinder(pot, [0.15, 0.12, 0.25, 8], [0, 0.125, 0]));
  for (let i = 0; i < 7; i++) {
    const l = makeCone(leaf, [0.08, 0.3, 6], [(Math.random() - 0.5) * 0.15, 0.35, (Math.random() - 0.5) * 0.15]);
    l.rotation.x = (Math.random() - 0.5) * 0.5; l.rotation.z = (Math.random() - 0.5) * 0.5;
    g.add(l);
  }
  return g;
}
register('plant', buildPlant);
