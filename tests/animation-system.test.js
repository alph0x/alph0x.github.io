/**
 * @fileoverview Tests for AnimationSystem orchestrator.
 * Verifies that the orchestrator wires all animation subsystems together
 * and delegates update calls without errors.
 */

import { describe, it, expect, vi } from 'vitest';
import { AnimationSystem } from '../docs/js/systems/animation/index.js';
import { Pet } from '../docs/js/domain/pet.js';

describe('AnimationSystem', () => {
  it('constructs with scene, worldState, and camera', () => {
    const scene = {};
    const worldState = {};
    const camera = { position: { x: 0, y: 0, z: 0 } };
    const sys = new AnimationSystem({ scene, worldState, camera });
    expect(sys.scene).toBe(scene);
    expect(sys.worldState).toBe(worldState);
    expect(sys.camera).toBe(camera);
  });

  it('update delegates to all subsystems without throwing', () => {
    // Minimal mocks that satisfy the traversed subsystems
    const scene = {
      traverse: vi.fn((cb) => {
        // Simulate a flicker light
        cb({ isPointLight: true, userData: { flicker: true, baseIntensity: 1, flickerSpeed: 1, flickerPhase: 0 }, intensity: 1 });
        // Simulate a parallax object
        cb({ userData: { _parallax: true, _parallaxFactor: 0.03 }, position: { x: 0, z: 0 }, parent: { position: { x: 0, z: 0 } } });
      }),
    };
    const worldState = {
      effects: { implants: [], particles: [] },
      pet: { mesh: null, model: null },
    };
    const camera = { position: { x: 1, y: 1.7, z: 1 } };
    const sys = new AnimationSystem({ scene, worldState, camera });

    expect(() => sys.update(0.016, 1000)).not.toThrow();
    expect(() => sys.update(0.016, 2000)).not.toThrow();
  });

  it('update handles pet animation when pet is present', () => {
    // Minimal pet mock with named children
    const head = { rotation: { y: 0, set: vi.fn() }, name: 'head', getObjectByName: vi.fn(() => null), getWorldPosition: vi.fn((v) => v.set(0.22, 0.12, 0)), lookAt: vi.fn(), rotateY: vi.fn() };
    const body = { scale: { set: vi.fn() }, name: 'body' };
    const tail = { rotation: { z: 0, y: 0 }, name: 'tail' };
    const mesh = {
      position: { x: 0, z: 0 },
      rotation: { y: 0 },
      scale: { x: 1, y: 1, z: 1 },
      getObjectByName: (n) => {
        if (n === 'head') return head;
        if (n === 'body') return body;
        if (n === 'tail') return tail;
        return null;
      },
    };
    const model = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
    const worldState = {
      effects: { implants: [], particles: [] },
      pet: { mesh, model },
    };
    const scene = { traverse: vi.fn() };
    const camera = { position: { x: 2, y: 1.7, z: 0, clone: vi.fn(() => ({ x: 2, y: 1.7, z: 0 })) } };
    const sys = new AnimationSystem({ scene, worldState, camera });

    expect(() => sys.update(0.016, 1000)).not.toThrow();
  });
});
