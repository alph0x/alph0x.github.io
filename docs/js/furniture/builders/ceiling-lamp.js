import * as THREE from 'three';
import { CFG, COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeCylinder, makeCone, makeSphere } from '../../primitives.js';

function buildCeilingLamp(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);
  const rodH = CFG.wallH - cfg.position[1];

  const rodMat = makeStd({ color: 0x2a2a30, roughness: 0.4, metalness: 0.6 });
  const shadeMat = makeStd({ color: 0x1a1a1e, roughness: 0.6, metalness: 0.2 });
  const bulbMat = makeStd({ color: cfg.color || COLORS.warm, emissive: cfg.color || COLORS.warm, emissiveIntensity: 1.4 });

  // cord from ceiling
  g.add(makeCylinder(rodMat, [0.02, 0.02, rodH], [0, rodH / 2, 0], 8));
  // conical shade, open at bottom
  const shade = makeCone(shadeMat, [0.08, 0.3, 0.22], [0, -0.11, 0], 16);
  shade.geometry.openEnded = true;
  g.add(shade);
  // emissive bulb
  g.add(makeSphere(bulbMat, [0.08], [0, -0.24, 0], 12));

  const light = new THREE.PointLight(cfg.color || COLORS.warm, cfg.intensity || 4, cfg.distance || 16, 1);
  light.position.set(0, -0.3, 0);
  g.add(light);
  return { mesh: g };
}
register('ceilingLamp', buildCeilingLamp);
