/**
 * @fileoverview Player movement use-case — pure logic, no Three.js.
 *
 * SRP: Given a Player, input flags, camera forward direction, and walls,
 *      computes the next position and movement state.
 *      All functions are deterministic and testable without mocks.
 */

import { CFG, computeMovementVector, resolveMove } from '../core.js';
import type { Player } from '../domain/player.js';
import type { Wall } from '../core.js';

export function updatePlayerMovement(
  player: Player,
  input: { moveForward: boolean; moveBackward: boolean; moveLeft: boolean; moveRight: boolean },
  cameraForward: { x: number; z: number },
  walls: Wall[],
  delta: number
): void {
  const isDiagonal = (input.moveForward && (input.moveLeft || input.moveRight)) ||
                     (input.moveBackward && (input.moveLeft || input.moveRight));
  const speed = isDiagonal ? CFG.runSpeed * 0.85 : CFG.speed;

  const moveDir = computeMovementVector(
    input.moveForward,
    input.moveBackward,
    input.moveLeft,
    input.moveRight,
    { x: cameraForward.x, y: 0, z: cameraForward.z }
  );
  const dx = moveDir.x * speed * delta;
  const dz = moveDir.z * speed * delta;

  resolveMove(player.position, dx, dz, walls);
  player.isMoving = (dx !== 0 || dz !== 0);
}
