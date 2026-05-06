/**
 * @fileoverview Fairy lights builder — registered as furniture for editor selectability.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { COLORS } from '../../core.js';
import { makeLight } from '../../primitives.js';

function buildFairyLights(cfg) {
  const group = new THREE.Group();
  const colors = [COLORS.magenta, COLORS.cyan, COLORS.accent, COLORS.green];
  const pos = cfg.position;
  for (let i = 0; i < 10; i++) {
    const color = colors[i % colors.length];
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 6, 6),
      new THREE.MeshBasicMaterial({ color })
    );
    bulb.position.set(pos[0] - 0.8 + i * 0.18, pos[1], pos[2] + 0.05);
    group.add(bulb);
    if (i % 3 === 0) {
      group.add(makeLight(color, 0.08, 1.2, [pos[0] - 0.8 + i * 0.18, pos[1], pos[2] + 0.05]));
    }
  }
  return group;
}

register('fairyLights', buildFairyLights);
