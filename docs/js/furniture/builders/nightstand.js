import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox, makeCylinder, makeRoundedBox } from '../../primitives.js';

function buildNightstand(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);

  const woodMat = makeStd({ color: 0x5a3a2a, roughness: 0.85 });
  const drawerMat = makeStd({ color: 0x6a4a3a, roughness: 0.85 });
  const handleMat = makeStd({ color: 0x888899, roughness: 0.3, metalness: 0.7 });

  // rounded body
  g.add(makeRoundedBox(woodMat, [0.5, 0.5, 0.4], [0, 0.25, 0], 0.03, 2));
  // top surface
  g.add(makeBox(woodMat, [0.52, 0.04, 0.42], [0, 0.5, 0]));
  // drawer front
  g.add(makeRoundedBox(drawerMat, [0.44, 0.18, 0.02], [0, 0.35, 0.21], 0.01, 2));
  // drawer handle
  g.add(makeCylinder(handleMat, [0.015, 0.015, 0.08], [0.12, 0.35, 0.23], 8));

  return { mesh: g };
}
register('nightstand', buildNightstand);
