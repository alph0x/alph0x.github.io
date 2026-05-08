/**
 * @fileoverview Player movement use-case — pure logic, no Three.js.
 *
 * SRP: Given a Player, input flags, camera forward direction, and walls,
 *      computes the next position and movement state.
 *      All functions are deterministic and testable without mocks.
 */

import { CFG, computeMovementVector, resolveMove } from '../core.js';

/**
 * Main entry. Mutates `player.position` and `player.isMoving`.
 *
 * @param {Player} player
 * @param {{moveForward:boolean,moveBackward:boolean,moveLeft:boolean,moveRight:boolean}} input
 * @param {{x:number,z:number}} cameraForward — normalized forward vector on XZ plane
 * @param {Array<{minX:number,maxX:number,minZ:number,maxZ:number}>} walls
 * @param {number} delta — time step in seconds
 */
export function updatePlayerMovement(player, input, cameraForward, walls, delta) {
  const isDiagonal = (input.moveForward && (input.moveLeft || input.moveRight)) ||
                     (input.moveBackward && (input.moveLeft || input.moveRight));
  const speed = isDiagonal ? CFG.runSpeed * 0.85 : CFG.speed;

  const moveDir = computeMovementVector(
    input.moveForward,
    input.moveBackward,
    input.moveLeft,
    input.moveRight,
    cameraForward
  );

  const dx = moveDir.x * speed * delta;
  const dz = moveDir.z * speed * delta;

  resolveMove(player.position, dx, dz, walls);
  player.isMoving = (dx !== 0 || dz !== 0);
}
