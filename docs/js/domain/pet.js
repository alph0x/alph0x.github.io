/**
 * @fileoverview Pet domain model — pure data, no Three.js.
 *
 * SRP: Represents the game-state of Lulú (position, rotations, mood).
 *      Knows nothing about rendering, scenes, or meshes.
 */

export class Pet {
  /**
   * @param {Object} cfg
   * @param {{x:number,y:number,z:number}} cfg.position
   * @param {number} cfg.rotation — body Y rotation in radians
   */
  constructor({ position, rotation = 0 } = {}) {
    this.position = { x: position?.x ?? 0, y: position?.y ?? 0, z: position?.z ?? 0 };
    this.bodyRotation = rotation;

    // Animated state — these are the "outputs" of the animator
    this.headRotation = 0;
    this.tailRotationZ = 0.2;
    this.tailRotationY = 0;
    this.earLRotationZ = -0.2;
    this.earRRotationZ = -0.2;
    this.breathScale = 1;

    // Mood / distance
    this.isExcited = false;
    this.distToPlayer = Infinity;
  }
}
