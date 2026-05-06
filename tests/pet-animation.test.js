import './setup-canvas-mock.js';
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { updatePet } from '../docs/js/systems/animation/pet.js';
import '../docs/js/furniture/builders/mini-schnauzer.js';
import { FurnitureRegistry } from '../docs/js/furniture/registry.js';

function simulate(state, frames = 200, dt = 16) {
  for (let i = 0; i < frames; i++) {
    updatePet(i * dt, state);
  }
}

function createState(cameraPos, petPos, petRot = 0) {
  const { builder } = FurnitureRegistry.get('miniSchnauzer');
  const pet = builder({ position: [petPos.x, 0, petPos.z], rotation: petRot });
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
  return { pet, camera };
}

describe('updatePet', () => {
  describe('head look', () => {
    it('keeps head forward when player is directly in front (+X)', () => {
      const state = createState({ x: 2, y: 1, z: 0 }, { x: 0, z: 0 }, 0);
      simulate(state);
      const head = state.pet.getObjectByName('head');
      expect(head.rotation.y).toBeCloseTo(0, 1);
    });

    it('turns head right when player is to the right (+Z)', () => {
      const state = createState({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      simulate(state);
      const head = state.pet.getObjectByName('head');
      // targetY = atan2(2, 0) = π/2; clamped to π/2 * 0.3 ≈ 0.471
      expect(head.rotation.y).toBeGreaterThan(0.3);
      expect(head.rotation.y).toBeLessThan(0.55);
    });

    it('turns head left when player is to the left (-Z)', () => {
      const state = createState({ x: 0, y: 1, z: -2 }, { x: 0, z: 0 }, 0);
      simulate(state);
      const head = state.pet.getObjectByName('head');
      // targetY = atan2(-2, 0) = -π/2; clamped to -0.471
      expect(head.rotation.y).toBeLessThan(-0.3);
      expect(head.rotation.y).toBeGreaterThan(-0.55);
    });

    it('compensates for body rotation', () => {
      // Pet rotated π/2 so it faces +Z. Player directly in front at +Z.
      const state = createState({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, Math.PI / 2);
      simulate(state);
      const head = state.pet.getObjectByName('head');
      expect(head.rotation.y).toBeCloseTo(0, 1);
    });

    it('returns head to neutral when player moves far away', () => {
      const state = createState({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      // Attract head to the side first
      simulate(state, 100);
      // Move player far away
      state.camera.position.set(0, 1, 10);
      simulate(state, 300);
      const head = state.pet.getObjectByName('head');
      expect(head.rotation.y).toBeCloseTo(0, 1);
    });
  });

  describe('tail wag', () => {
    it('tail rotation changes over time', () => {
      const state = createState({ x: 0, y: 1, z: 10 }, { x: 0, z: 0 }, 0);
      updatePet(0, state);
      const tail = state.pet.getObjectByName('tail');
      const r0 = tail.rotation.z;
      updatePet(500, state);
      const r1 = tail.rotation.z;
      expect(r1).not.toBe(r0);
    });
  });

  describe('breathing', () => {
    it('body scale Y oscillates over time', () => {
      const state = createState({ x: 0, y: 1, z: 10 }, { x: 0, z: 0 }, 0);
      updatePet(0, state);
      const body = state.pet.getObjectByName('body');
      const s0 = body.scale.y;
      updatePet(785, state); // ~π/4 in the sin wave
      const s1 = body.scale.y;
      expect(s1).not.toBe(s0);
    });
  });
});
