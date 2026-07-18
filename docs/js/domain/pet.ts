/**
 * @fileoverview Pet domain model — pure data, no Three.js.
 *
 * SRP: Represents the game-state of Lulú (position, rotations, mood).
 *      Knows nothing about rendering, scenes, or meshes.
 */

import type { Vec3 } from '../core.js';

export interface PetConfig {
  position?: Vec3;
  rotation?: number;
}

export class Pet {
  position: Vec3;
  bodyRotation: number;
  headRotation: number;
  tailRotationZ: number;
  tailRotationY: number;
  earLRotationZ: number;
  earRRotationZ: number;
  breathScale: number;
  isExcited: boolean;
  isSleeping: boolean;
  distToPlayer: number;

  constructor({ position, rotation = 0 }: PetConfig = {}) {
    this.position = { x: position?.x ?? 0, y: position?.y ?? 0, z: position?.z ?? 0 };
    this.bodyRotation = rotation;

    // Animated state — these are the "outputs" of the animator
    this.headRotation = 0;
    this.tailRotationZ = 0.2;
    this.tailRotationY = 0;
    this.earLRotationZ = -0.2;
    this.earRRotationZ = -0.2;
    this.breathScale = 1;

    // Mood / distance / time-of-day
    this.isExcited = false;
    this.isSleeping = false;
    this.distToPlayer = Infinity;
  }
}
