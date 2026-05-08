import { describe, it, expect } from 'vitest';
import { Pet } from '../docs/js/domain/pet.js';
import { updatePetAnimation } from '../docs/js/application/pet-animator.js';

function simulate(pet, playerPos, frames = 200, dt = 0.016) {
  for (let i = 0; i < frames; i++) {
    updatePetAnimation(pet, playerPos, i * dt);
  }
}

describe('updatePetAnimation', () => {
  describe('head look', () => {
    it('keeps head forward when player is directly in front (+X)', () => {
      const pet = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      simulate(pet, { x: 2, y: 1, z: 0 });
      expect(pet.headRotation).toBeCloseTo(0, 1);
    });

    it('turns head right when player is to the right (+Z)', () => {
      const pet = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      simulate(pet, { x: 0, y: 1, z: 2 });
      expect(pet.headRotation).toBeGreaterThan(0.45);
      expect(pet.headRotation).toBeLessThan(0.55);
    });

    it('turns head left when player is to the left (-Z)', () => {
      const pet = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      simulate(pet, { x: 0, y: 1, z: -2 });
      expect(pet.headRotation).toBeLessThan(-0.45);
      expect(pet.headRotation).toBeGreaterThan(-0.55);
    });

    it('compensates for body rotation', () => {
      const pet = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: Math.PI / 2 });
      simulate(pet, { x: 0, y: 1, z: 2 });
      expect(pet.headRotation).toBeCloseTo(0, 1);
    });
  });

  describe('tail wag', () => {
    it('tail rotation changes over time', () => {
      const pet = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      updatePetAnimation(pet, { x: 0, y: 1, z: 10 }, 0);
      const r0 = pet.tailRotationZ;
      updatePetAnimation(pet, { x: 0, y: 1, z: 10 }, 0.5);
      const r1 = pet.tailRotationZ;
      expect(r1).not.toBe(r0);
    });
  });

  describe('breathing', () => {
    it('body scale Y oscillates over time', () => {
      const pet = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      updatePetAnimation(pet, { x: 0, y: 1, z: 10 }, 0);
      const s0 = pet.breathScale;
      updatePetAnimation(pet, { x: 0, y: 1, z: 10 }, 0.785); // ~π/4
      const s1 = pet.breathScale;
      expect(s1).not.toBe(s0);
    });
  });

  describe('excited animation', () => {
    it('has perkier ears when player is very close (< 1m)', () => {
      const petFar = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      updatePetAnimation(petFar, { x: 0, y: 1, z: 2 }, 0);
      const rotFar = petFar.earLRotationZ;

      const petClose = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      updatePetAnimation(petClose, { x: 0, y: 1, z: 0.5 }, 0);
      const rotClose = petClose.earLRotationZ;

      expect(rotClose).toBeGreaterThan(rotFar);
    });

    it('tail wags with larger amplitude when excited', () => {
      const petFar = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      updatePetAnimation(petFar, { x: 0, y: 1, z: 2 }, 0.1);
      const rotFar = Math.abs(petFar.tailRotationZ - 0.2);

      const petClose = new Pet({ position: { x: 0, y: 0, z: 0 }, rotation: 0 });
      updatePetAnimation(petClose, { x: 0, y: 1, z: 0.5 }, 0.1);
      const rotClose = Math.abs(petClose.tailRotationZ - 0.2);

      expect(rotClose).toBeGreaterThan(rotFar);
    });
  });
});
