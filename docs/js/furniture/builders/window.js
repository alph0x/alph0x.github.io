/**
 * @fileoverview Window builder — registered as furniture for editor placement.
 * Includes cityscape backdrop with parallax support.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { buildWindow as makeWindowFrame } from '../../level/window.js';
import { buildCityscape } from '../../level/cityscape.js';

function buildWindow(cfg) {
  const group = new THREE.Group();
  group.position.set(...cfg.position);
  group.rotation.y = cfg.rotation || 0;

  // Window frame
  const frame = makeWindowFrame({ position: [0, 0, 0] });
  group.add(frame);

  // Cityscape backdrop — positioned "outside" the window
  const city = buildCityscape({ position: [0, 0, 0] });
  city.position.set(0, 0, -8);
  city.userData._parallax = true;
  city.userData._parallaxFactor = 0.03;
  group.add(city);

  return group;
}

register('window', buildWindow);
