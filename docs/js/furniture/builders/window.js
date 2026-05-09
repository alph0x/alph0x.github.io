/**
 * @fileoverview Window builder — registered as furniture for editor placement.
 * Offsets the frame from wall centerline to interior surface so it is visible.
 * Includes cityscape backdrop with parallax support.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { buildWindow as makeWindowFrame } from '../../level/window.js';
import { buildCityscape } from '../../level/cityscape.js';
import { getInteriorOffset } from './wall-offset.js';

function buildWindow(cfg) {
  const wrapper = new THREE.Group();
  wrapper.position.set(...cfg.position);
  wrapper.rotation.y = cfg.rotation || 0;

  // Window frame — placed at interior surface
  const frame = makeWindowFrame({ position: [0, 0, 0] });
  const off = getInteriorOffset(cfg.position[0], cfg.position[2], 0.12);
  frame.position.set(off.x, 0, off.z);
  wrapper.add(frame);

  // Cityscape backdrop — positioned "outside" the window, opposite to interior offset
  const city = buildCityscape({ position: [0, 0, 0] });
  city.position.set(-off.x * 4, -cfg.position[1], -off.z * 4);
  city.userData._parallax = true;
  city.userData._parallaxFactor = 0.03;
  wrapper.add(city);

  return { mesh: wrapper };
}

register('window', buildWindow);
