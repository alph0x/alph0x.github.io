/**
 * @fileoverview Door builder — registered as furniture for editor placement.
 */

import { register } from '../registry.js';
import { buildClosedDoor } from '../../level/room.js';

function buildDoor(cfg) {
  const door = buildClosedDoor(cfg.position[0], cfg.position[1], cfg.position[2], cfg.rotation || 0);
  return door;
}

register('door', buildDoor);
