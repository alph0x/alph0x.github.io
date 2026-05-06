/**
 * @fileoverview Tests for game state factory.
 *
 * Decision: Verify state object shape and immutability conventions.
 * Rationale (SRP): The state module has one job: create a consistent
 * initial state object. Tests guard against accidental structural drift.
 */

import { describe, it, expect } from 'vitest';
import { createGameState } from '../docs/js/core.js';

describe('createGameState', () => {
  it('returns an object with all expected keys', () => {
    const s = createGameState();
    expect(s).toHaveProperty('moveForward');
    expect(s).toHaveProperty('moveBackward');
    expect(s).toHaveProperty('moveLeft');
    expect(s).toHaveProperty('moveRight');
    expect(s).toHaveProperty('velocity');
    expect(s).toHaveProperty('direction');
    expect(s).toHaveProperty('prevTime');
    expect(s).toHaveProperty('walls');
    expect(s).toHaveProperty('interactables');
    expect(s).toHaveProperty('implants');
    expect(s).toHaveProperty('particles');
    expect(s).toHaveProperty('isPanelOpen');
    expect(s).toHaveProperty('currentRoom');
  });

  it('initializes movement flags to false', () => {
    const s = createGameState();
    expect(s.moveForward).toBe(false);
    expect(s.moveBackward).toBe(false);
    expect(s.moveLeft).toBe(false);
    expect(s.moveRight).toBe(false);
  });

  it('initializes collections as empty arrays', () => {
    const s = createGameState();
    expect(s.walls).toEqual([]);
    expect(s.interactables).toEqual([]);
    expect(s.implants).toEqual([]);
    expect(s.particles).toEqual([]);
  });

  it('initializes scalar values correctly', () => {
    const s = createGameState();
    expect(s.prevTime).toBe(0);
    expect(s.isPanelOpen).toBe(false);
    expect(s.currentRoom).toBe('HUB');
  });
});
