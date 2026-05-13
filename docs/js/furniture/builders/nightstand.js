import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildNightstand(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position);
  const woodMat = makeStd({ color: 0x5a3a2a });
  const handleMat = makeStd({ color: 0x888899 });
  g.add(makeBox(woodMat, [0.5, 0.5, 0.4], [0, 0.25, 0]));
  g.add(makeBox(woodMat, [0.52, 0.04, 0.42], [0, 0.5, 0]));
  g.add(makeBox(handleMat, [0.08, 0.02, 0.02], [0.15, 0.35, 0.21]));
  return { mesh: g };
}
register('nightstand', buildNightstand);
