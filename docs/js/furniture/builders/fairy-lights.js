/**
 * @fileoverview Fairy lights builder — registered as furniture for editor selectability.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { COLORS } from '../../core.js';
import { makeStd } from '../../assets/index.js';
import { makeSphere, makeLight } from '../../primitives.js';
function buildFairyLights(cfg) {
  const group = new THREE.Group();
  const pos = cfg.position;
  const count = 10;
  const startX = pos[0] - 0.8;
  const endX = pos[0] + 0.82;

  // gentle sagging wire curve
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(startX, pos[1], pos[2] + 0.05),
    new THREE.Vector3(pos[0] - 0.4, pos[1] - 0.08, pos[2] + 0.05),
    new THREE.Vector3(pos[0], pos[1] - 0.12, pos[2] + 0.05),
    new THREE.Vector3(pos[0] + 0.4, pos[1] - 0.08, pos[2] + 0.05),
    new THREE.Vector3(endX, pos[1], pos[2] + 0.05),
  ]);
  const wireGeo = new THREE.TubeGeometry(curve, 16, 0.004, 6, false);
  const wireMat = makeStd({ color: 0x1a1a1e, roughness: 0.7, metalness: 0.1 });
  group.add(new THREE.Mesh(wireGeo, wireMat));

  const bulbMat = makeStd({ color: COLORS.warm, emissive: COLORS.orange, emissiveIntensity: 1.2, roughness: 0.2 });

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const p = curve.getPoint(t);
    const bulb = makeSphere(bulbMat, [0.015], [p.x, p.y, p.z], 8);
    group.add(bulb);
    if (i % 3 === 0) {
      group.add(makeLight(COLORS.warm, 0.08, 1.2, [p.x, p.y, p.z]));
    }
  }
  return { mesh: group };
}

register('fairyLights', buildFairyLights);
