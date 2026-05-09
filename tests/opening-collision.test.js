/**
 * @fileoverview Exhaustive tests for wall opening collision geometry.
 *
 * These tests verify that:
 * - Door openings allow player passage (no collision at door center)
 * - Door side-jambs block movement (collision beside door)
 * - Window openings block passage (collision at window center)
 * - Wall AABBs are in world-space, not local/group space
 * - Headers above openings do NOT block 2D movement
 * - Furniture collisions are registered correctly
 */

import './setup-canvas-mock.js';
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildLevel } from '../docs/js/level/index.js';
import { checkCollision } from '../docs/js/core.js';

describe('buildLevel opening collisions', () => {
  function buildAndCheck() {
    const worldState = {
      room: { walls: [], interactables: [] },
      pet: { mesh: null, model: null },
      effects: { implants: [], particles: [] },
      input: {}, ui: {}, meta: {},
    };
    const scene = new THREE.Scene();
    buildLevel(scene, worldState);
    return { worldState, scene };
  }

  it('registers wall AABBs in world space (not centered at origin)', () => {
    const { worldState } = buildAndCheck();
    // At least one wall should be far from origin (front wall at z ~ 1.75)
    const farWalls = worldState.room.walls.filter(
      (w) => Math.abs(w.minZ) > 1.0 || Math.abs(w.maxZ) > 1.0
    );
    expect(farWalls.length).toBeGreaterThan(0);
  });

  it('allows passage through door opening center', () => {
    const { worldState } = buildAndCheck();
    // Door is centered at (0, 0, 1.9) on front wall (z ~ 1.75)
    expect(checkCollision(0, 1.9, worldState.room.walls)).toBe(false);
  });

  it('allows standing slightly inside room in front of door', () => {
    const { worldState } = buildAndCheck();
    // Just inside the room, in front of the door
    expect(checkCollision(0, 1.5, worldState.room.walls)).toBe(false);
  });

  it('blocks movement into door side-jamb (left)', () => {
    const { worldState } = buildAndCheck();
    expect(checkCollision(-1.5, 1.75, worldState.room.walls)).toBe(true);
  });

  it('blocks movement into door side-jamb (right)', () => {
    const { worldState } = buildAndCheck();
    expect(checkCollision(1.5, 1.75, worldState.room.walls)).toBe(true);
  });

  it('blocks passage through window opening', () => {
    const { worldState } = buildAndCheck();
    // Window is centered at (0, 1.5, -1.85) on back wall (z ~ -1.75)
    expect(checkCollision(0, -1.85, worldState.room.walls)).toBe(true);
  });

  it('blocks movement beside window on wall', () => {
    const { worldState } = buildAndCheck();
    expect(checkCollision(-1.5, -1.75, worldState.room.walls)).toBe(true);
  });

  it('blocks movement into solid wall segments', () => {
    const { worldState } = buildAndCheck();
    // Left wall at x ~ -2.25
    expect(checkCollision(-2.25, 0, worldState.room.walls)).toBe(true);
    // Right wall at x ~ 2.25
    expect(checkCollision(2.25, 0, worldState.room.walls)).toBe(true);
  });

  it('does not register door furniture as collision', () => {
    const { worldState } = buildAndCheck();
    // The door mesh itself should not add an extra AABB
    const doorFurnitureAABB = worldState.room.walls.find(
      (w) => w.minX < 0.1 && w.maxX > 0.1 && w.minZ < 2.1 && w.maxZ > 2.1
    );
    expect(doorFurnitureAABB).toBeUndefined();
  });

  it('does not register window furniture as collision', () => {
    const { worldState } = buildAndCheck();
    const windowFurnitureAABB = worldState.room.walls.find(
      (w) => w.minX < 0.1 && w.maxX > 0.1 && w.minZ < -1.6 && w.maxZ > -1.4
    );
    expect(windowFurnitureAABB).toBeUndefined();
  });

  it('registers bed furniture as collision', () => {
    const { worldState } = buildAndCheck();
    const bedAABB = worldState.room.walls.find(
      (w) => w.minX < -1.0 && w.maxX > -1.0 && w.minZ < -0.9 && w.maxZ > -0.9
    );
    expect(bedAABB).toBeDefined();
  });
});
