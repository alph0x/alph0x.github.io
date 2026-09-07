import * as THREE from 'three';
import { CFG, COLORS } from '../../core.js';
import { register } from '../registry.js';
import { makeStd, texMetal } from '../../assets/index.js';
import { makeCylinder, makeSphere, rootGroup } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildCeilingLamp(cfg: FurnitureConfig): { mesh: THREE.Group; label: string } {
  const [x, y, z] = cfg.position;
  const g = rootGroup(cfg);

  const color = cfg.color || COLORS.warm;
  const intensity = cfg.intensity || 4;
  const distance = cfg.distance || 16;
  const rodH = Math.max(0, CFG.wallH - y);

  const rodMat = makeStd({ map: texMetal, color: 0x6b5f52, roughness: 0.4, metalness: 0.6 });
  const shadeMat = makeStd({ map: texMetal, color: 0x7a6f60, roughness: 0.5, metalness: 0.4, flatShading: false });
  const bulbMat = makeStd({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.2 });

  rodMat.flatShading = shadeMat.flatShading = bulbMat.flatShading = false;

  // cord / metal rod from ceiling
  if (rodH > 0) g.add(makeCylinder(rodMat, [0.015, 0.015, rodH], [0, rodH / 2, 0], 24));

  // small ceiling cup and socket ring
  g.add(makeCylinder(shadeMat, [0.035, 0.035, 0.04], [0, -0.02, 0], 12));
  g.add(makeCylinder(shadeMat, [0.04, 0.04, 0.02], [0, -0.05, 0], 12));

  // truncated-cone shade with solid thickness
  const profile = [[.12, -.09], [.30, -.306], [.30, -.31], [.295, -.31], [.115, -.094], [.12, -.09]];
  const shade = new THREE.Mesh(new THREE.LatheGeometry(profile.slice().reverse().map(([r, h]) => new THREE.Vector2(r, h)), 48), shadeMat);
  shade.castShadow = shade.receiveShadow = true;
  g.add(shade);
  g.add(makeCylinder(rodMat, [.012, .012, .034], [0, -.077, 0], 16));
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    const arm = makeCylinder(rodMat, [.0025, .0025, .12], [.06 * Math.cos(a), -.092, .06 * Math.sin(a)], 8);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    g.add(arm);
  }

  g.add(makeCylinder(rodMat, [.018, .018, .168], [0, -.172, 0], 16));

  // emissive bulb hanging inside
  g.add(makeSphere(bulbMat, [0.07], [0, -0.32, 0], 16));

  // warm downward light (shadowless — the rig's key spot owns the shadows)
  const light = new THREE.PointLight(color, intensity, distance, 1);
  light.position.set(0, -0.38, 0);
  g.add(light);

  return { mesh: g, label: 'Ceiling Lamp' };
}

register('ceilingLamp', buildCeilingLamp);
