import * as THREE from 'three';
import { CFG, COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildCeilingLamp(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);
  const rodMat = makeStd({ color: 0x2a2a30 });
  const housingMat = makeStd({ color: 0x1a1a1e });
  const bulbMat = new THREE.MeshBasicMaterial({ color: cfg.color || COLORS.warm });
  const rodH = CFG.wallH - cfg.position[1];
  g.add(makeBox(rodMat, [0.04, rodH, 0.04], [0, rodH / 2, 0]));
  g.add(makeBox(housingMat, [0.5, 0.12, 0.5], [0, -0.06, 0]));
  g.add(makeBox(bulbMat, [0.35, 0.04, 0.35], [0, -0.14, 0]));
  const light = new THREE.PointLight(cfg.color || COLORS.warm, cfg.intensity || 4, cfg.distance || 16, 1);
  light.position.set(0, -0.3, 0);
  g.add(light);
  return { mesh: g };
}
register('ceilingLamp', buildCeilingLamp);
