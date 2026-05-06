import * as THREE from 'three';
import { CFG, COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildCeilingLamp(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);
  const rodMat = makeStd({ color: 0x2a2a30, roughness: 0.4, metalness: 0.6 });
  const housingMat = makeStd({ color: 0x1a1a1e, roughness: 0.6, metalness: 0.3 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: cfg.color || COLORS.warm, emissive: cfg.color || COLORS.warm, emissiveIntensity: 1.0, roughness: 0.2, metalness: 0.0 });
  const rodH = CFG.wallH - cfg.position[1];
  g.add(makeBox(rodMat, [0.04, rodH, 0.04], [0, rodH / 2, 0]));
  g.add(makeBox(housingMat, [0.5, 0.12, 0.5], [0, -0.06, 0]));
  g.add(makeBox(bulbMat, [0.35, 0.04, 0.35], [0, -0.14, 0]));
  const light = new THREE.PointLight(cfg.color || COLORS.warm, cfg.intensity || 4, cfg.distance || 16, 1);
  light.position.set(0, -0.3, 0);
  g.add(light);
  return g;
}
register('ceilingLamp', buildCeilingLamp);
