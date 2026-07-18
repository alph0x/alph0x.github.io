import * as THREE from 'three';
import { CFG, COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd, texMetal } from '../../assets/index.js';
import { makeCylinder, makeSphere, rootGroup, configureShadow } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildCeilingLamp(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const [x, y, z] = cfg.position;
  const g = rootGroup(cfg);

  const color = cfg.color || COLORS.warm;
  const intensity = cfg.intensity || 4;
  const distance = cfg.distance || 16;
  const rodH = CFG.wallH - y;

  const rodMat = makeStd({ map: texMetal, color: 0x2a2a30, roughness: 0.4, metalness: 0.6 });
  const shadeMat = makeStd({ map: texMetal, color: 0x25252b, roughness: 0.5, metalness: 0.4 });
  const bulbMat = makeStd({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.2 });

  // cord / metal rod from ceiling
  g.add(makeCylinder(rodMat, [0.015, 0.015, rodH], [0, rodH / 2, 0], 12));

  // small ceiling cup and socket ring
  g.add(makeCylinder(shadeMat, [0.035, 0.035, 0.04], [0, -0.02, 0], 12));
  g.add(makeCylinder(shadeMat, [0.04, 0.04, 0.02], [0, -0.05, 0], 12));

  // truncated-cone shade with solid thickness
  g.add(makeCylinder(shadeMat, [0.12, 0.30, 0.22], [0, -0.20, 0], 24));

  // emissive bulb hanging inside
  g.add(makeSphere(bulbMat, [0.07], [0, -0.32, 0], 16));

  // warm downward light
  const light = new THREE.PointLight(color, intensity, distance, 1);
  light.position.set(0, -0.38, 0);
  configureShadow(light);
  g.add(light);

  return { mesh: g, label: 'Ceiling Lamp' };
}

register('ceilingLamp', buildCeilingLamp);
