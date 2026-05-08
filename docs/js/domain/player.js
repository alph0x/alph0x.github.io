/**
 * @fileoverview Player domain model — pure data, no Three.js.
 *
 * SRP: Represents the game-state of the player (position, height, movement).
 *      Knows nothing about rendering, cameras, or input devices.
 */

export class Player {
  /**
   * @param {Object} cfg
   * @param {{x:number,y:number,z:number}} cfg.position
   * @param {number} [cfg.height=1.7] — eye height above ground
   */
  constructor({ position, height = 1.7 } = {}) {
    this.position = { x: position?.x ?? 0, y: position?.y ?? height, z: position?.z ?? 0 };
    this.height = height;
    this.isMoving = false;
  }
}
