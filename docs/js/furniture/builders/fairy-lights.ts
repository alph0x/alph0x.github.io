/**
 * @fileoverview Fairy lights builder — registered as furniture for editor selectability.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { COLORS } from '../../core.js';
import { makeStd, texMetal } from '../../assets/index.js';
import { makeSphere, makeLight } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildFairyLights(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const group = new THREE.Group();
  const [x, y, z] = cfg.position;
  const count = 10;
  const startX = x - 0.8;
  const endX = x + 0.82;

  // deterministic organic sag via sine harmonics
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const px = startX + (endX - startX) * t;
    const sag = 0.14 * Math.sin(Math.PI * t) + 0.04 * Math.sin(Math.PI * 2 * t);
    const pz = z + 0.05 + 0.03 * Math.sin(Math.PI * 3 * t);
    points.push(new THREE.Vector3(px, y - sag, pz));
  }
  const curve = new THREE.CatmullRomCurve3(points);

  const wireMat = makeStd({ map: texMetal, color: 0x1a1a1e, roughness: 0.6, metalness: 0.3 });
  const wireGeo = new THREE.TubeGeometry(curve, 24, 0.004, 6, false);
  group.add(new THREE.Mesh(wireGeo, wireMat));

  const bulbMat = makeStd({
    color: COLORS.warm,
    emissive: COLORS.orange,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const p = curve.getPoint(t);
    const bulb = makeSphere(bulbMat, [0.018], [p.x, p.y, p.z], 10);
    group.add(bulb);
    if (i % 3 === 0) {
      group.add(makeLight(COLORS.warm, 0.08, 1.2, [p.x, p.y, p.z]));
    }
  }

  return { mesh: group };
}

register('fairyLights', buildFairyLights);
