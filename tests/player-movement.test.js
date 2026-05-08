import { describe, it, expect } from 'vitest';
import { Player } from '../docs/js/domain/player.js';
import { updatePlayerMovement } from '../docs/js/application/player-movement.js';

describe('updatePlayerMovement', () => {
  it('does not move when no input keys are pressed', () => {
    const player = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false };
    const forward = { x: 0, z: -1 };
    const walls = [];

    updatePlayerMovement(player, input, forward, walls, 0.016);

    expect(player.position.x).toBe(0);
    expect(player.position.z).toBe(0);
    expect(player.isMoving).toBe(false);
  });

  it('moves forward along camera direction', () => {
    const player = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const input = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false };
    const forward = { x: 1, z: 0 }; // camera looks along +X
    const walls = [];

    updatePlayerMovement(player, input, forward, walls, 1.0);

    expect(player.position.x).toBeGreaterThan(0);
    expect(player.position.z).toBe(0);
    expect(player.isMoving).toBe(true);
  });

  it('moves backward opposite to camera direction', () => {
    const player = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const input = { moveForward: false, moveBackward: true, moveLeft: false, moveRight: false };
    const forward = { x: 1, z: 0 }; // camera looks along +X
    const walls = [];

    updatePlayerMovement(player, input, forward, walls, 1.0);

    expect(player.position.x).toBeLessThan(0);
    expect(player.position.z).toBe(0);
  });

  it('strafes right relative to camera direction', () => {
    const player = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: true };
    const forward = { x: 1, z: 0 }; // camera looks along +X, so right is +Z
    const walls = [];

    updatePlayerMovement(player, input, forward, walls, 1.0);

    expect(player.position.z).toBeGreaterThan(0);
  });

  it('strafes left relative to camera direction', () => {
    const player = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const input = { moveForward: false, moveBackward: false, moveLeft: true, moveRight: false };
    const forward = { x: 1, z: 0 }; // camera looks along +X, so left is -Z
    const walls = [];

    updatePlayerMovement(player, input, forward, walls, 1.0);

    expect(player.position.z).toBeLessThan(0);
  });

  it('runs faster when moving diagonally', () => {
    const playerStraight = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const playerDiagonal = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const forward = { x: 1, z: 0 };
    const walls = [];

    updatePlayerMovement(playerStraight, { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false }, forward, walls, 1.0);
    updatePlayerMovement(playerDiagonal, { moveForward: true, moveBackward: false, moveLeft: true, moveRight: false }, forward, walls, 1.0);

    const distStraight = Math.abs(playerStraight.position.x);
    const distDiagonal = Math.abs(playerDiagonal.position.x);

    expect(distDiagonal).toBeGreaterThan(distStraight);
  });

  it('isMoving is false when stationary', () => {
    const player = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false };

    updatePlayerMovement(player, input, { x: 0, z: -1 }, [], 0.016);

    expect(player.isMoving).toBe(false);
  });

  it('collision prevents movement into walls', () => {
    const player = new Player({ position: { x: 0, y: 1.7, z: 0 } });
    const input = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false };
    const forward = { x: 1, z: 0 };
    const walls = [{ minX: 2, maxX: 4, minZ: -1, maxZ: 1 }];

    // Move for enough time that we would reach x ~3.5 without collision
    updatePlayerMovement(player, input, forward, walls, 1.0);

    expect(player.position.x).toBeLessThan(2);
  });
});
