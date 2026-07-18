/**
 * @fileoverview Player domain model — pure data, no Three.js.
 *
 * SRP: Represents the game-state of the player (position, height, movement).
 *      Knows nothing about rendering, cameras, or input devices.
 */

import type { Vec3 } from '../core.js';

export interface PlayerConfig {
  position?: Vec3;
  height?: number;
}

export class Player {
  position: Vec3;
  height: number;
  isMoving: boolean;

  constructor({ position, height = 1.7 }: PlayerConfig = {}) {
    this.position = { x: position?.x ?? 0, y: position?.y ?? height, z: position?.z ?? 0 };
    this.height = height;
    this.isMoving = false;
  }
}
