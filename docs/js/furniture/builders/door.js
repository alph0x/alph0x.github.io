/**
 * @fileoverview Door builder — registered as furniture for editor placement.
 * Offsets the door from wall centerline to interior surface so it is visible.
 */

import * as THREE from 'three';
import { register } from '../registry.js';
import { buildClosedDoor } from '../../level/room.js';
import { getInteriorOffset } from './_wall-offset.js';

function buildDoor(cfg) {
  const wrapper = new THREE.Group();
  wrapper.position.set(...cfg.position);
  wrapper.rotation.y = cfg.rotation || 0;

  const door = buildClosedDoor(0, 0, 0);
  const off = getInteriorOffset(cfg.position[0], cfg.position[2], 0.15);
  door.position.set(off.x, 0, off.z);
  wrapper.add(door);

  return { mesh: wrapper };
}

register('door', buildDoor);
