
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { updatePet } from '../docs/js/systems/animation/pet.js';
import { Pet } from '../docs/js/domain/pet.js';
import '../docs/js/furniture/builders/mini-schnauzer.js';
import { FurnitureRegistry } from '../docs/js/furniture/registry.js';

function simulate(pet, camera, frames = 200, dt = 16) {
  for (let i = 0; i < frames; i++) {
    updatePet(i * dt, pet, camera);
  }
}

function createPetAndCamera(cameraPos, petPos, petRot = 0) {
  const { builder } = FurnitureRegistry.get('miniSchnauzer');
  const { mesh } = builder({ position: [petPos.x, 0, petPos.z], rotation: petRot });
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
  const model = new Pet({
    position: { x: petPos.x, y: 0, z: petPos.z },
    rotation: petRot,
  });
  return { pet: { mesh, model }, camera };
}

describe('updatePet', () => {
  describe('head look', () => {
    it('keeps head forward when player is directly in front (+X)', () => {
      const { pet, camera } = createPetAndCamera({ x: 2, y: 1, z: 0 }, { x: 0, z: 0 }, 0);
      simulate(pet, camera);
      const head = pet.mesh.getObjectByName('head');
      expect(head.rotation.y).toBeCloseTo(0, 1);
    });

    it('turns head right when player is to the right (+Z)', () => {
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      simulate(pet, camera);
      const head = pet.mesh.getObjectByName('head');
      expect(head.rotation.y).toBeLessThan(-0.45);
      expect(head.rotation.y).toBeGreaterThan(-0.55);
    });

    it('turns head left when player is to the left (-Z)', () => {
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: -2 }, { x: 0, z: 0 }, 0);
      simulate(pet, camera);
      const head = pet.mesh.getObjectByName('head');
      expect(head.rotation.y).toBeGreaterThan(0.45);
      expect(head.rotation.y).toBeLessThan(0.55);
    });

    it('compensates for body rotation (counter-clockwise, Three.js convention)', () => {
      // bodyRotation = -π/2 in Three.js means the pet looks toward +Z.
      // Player at +Z is directly in front → head should stay forward.
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, -Math.PI / 2);
      simulate(pet, camera);
      const head = pet.mesh.getObjectByName('head');
      expect(head.rotation.y).toBeCloseTo(0, 1);
    });
    it('looks forward when body is rotated +90° (looks toward -Z)', () => {
      // bodyRotation = π/2 in Three.js means the pet looks toward -Z.
      // Player at -Z is directly in front → head should stay forward.
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: -2 }, { x: 0, z: 0 }, Math.PI / 2);
      simulate(pet, camera);
      const head = pet.mesh.getObjectByName('head');
      expect(head.rotation.y).toBeCloseTo(0, 1);
    });

    it('turns head right when player is behind-right', () => {
      const { pet, camera } = createPetAndCamera({ x: -2, y: 1, z: -0.1 }, { x: 0, z: 0 }, 0);
      simulate(pet, camera);
      const head = pet.mesh.getObjectByName('head');
      expect(head.rotation.y).toBeLessThan(-0.45);
      expect(head.rotation.y).toBeGreaterThan(-0.55);
    });

    it('turns head left when player is behind-left', () => {
      const { pet, camera } = createPetAndCamera({ x: -2, y: 1, z: 0.1 }, { x: 0, z: 0 }, 0);
      simulate(pet, camera);
      const head = pet.mesh.getObjectByName('head');
      expect(head.rotation.y).toBeGreaterThan(0.45);
      expect(head.rotation.y).toBeLessThan(0.55);
    });
  });

  describe('tail wag', () => {
    it('tail rotation changes over time', () => {
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: 10 }, { x: 0, z: 0 }, 0);
      updatePet(0, pet, camera);
      const tail = pet.mesh.getObjectByName('tail');
      const r0 = tail.rotation.z;
      updatePet(500, pet, camera);
      const r1 = tail.rotation.z;
      expect(r1).not.toBe(r0);
    });
  });

  describe('breathing', () => {
    it('body scale Y oscillates over time', () => {
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: 10 }, { x: 0, z: 0 }, 0);
      updatePet(0, pet, camera);
      const body = pet.mesh.getObjectByName('body');
      const s0 = body.scale.y;
      updatePet(785, pet, camera);
      const s1 = body.scale.y;
      expect(s1).not.toBe(s0);
    });
  });

  describe('sleeping at night', () => {
    it('marks pet as sleeping when time-of-day is night', () => {
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      window.__TIME_OF_DAY_NOW__ = new Date('2026-06-22T23:00:00');
      updatePet(0, pet, camera);
      expect(pet.model.isSleeping).toBe(true);
      delete window.__TIME_OF_DAY_NOW__;
    });

    it('is not sleeping during the afternoon', () => {
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      window.__TIME_OF_DAY_NOW__ = new Date('2026-06-22T14:00:00');
      updatePet(0, pet, camera);
      expect(pet.model.isSleeping).toBe(false);
      delete window.__TIME_OF_DAY_NOW__;
    });

    it('keeps tail still when sleeping', () => {
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      window.__TIME_OF_DAY_NOW__ = new Date('2026-06-22T23:00:00');
      updatePet(0, pet, camera);
      updatePet(500, pet, camera);
      const tail = pet.mesh.getObjectByName('tail');
      expect(tail.rotation.z).toBeCloseTo(0.1, 2);
      expect(tail.rotation.y).toBeCloseTo(0, 2);
      delete window.__TIME_OF_DAY_NOW__;
    });

    it('lowers head when sleeping', () => {
      const { pet, camera } = createPetAndCamera({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      window.__TIME_OF_DAY_NOW__ = new Date('2026-06-22T23:00:00');
      updatePet(0, pet, camera);
      const head = pet.mesh.getObjectByName('head');
      expect(head.rotation.x).toBeLessThan(-0.3);
      delete window.__TIME_OF_DAY_NOW__;
    });
  });

  describe('excited animation', () => {
    it('has perkier ears when player is very close (< 1m)', () => {
      const { pet: petFar, camera: camFar } = createPetAndCamera({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      updatePet(0, petFar, camFar);
      const earFar = petFar.mesh.getObjectByName('earL');
      const rotFar = earFar.rotation.z;

      const { pet: petClose, camera: camClose } = createPetAndCamera({ x: 0, y: 1, z: 0.5 }, { x: 0, z: 0 }, 0);
      updatePet(0, petClose, camClose);
      const earClose = petClose.mesh.getObjectByName('earL');
      const rotClose = earClose.rotation.z;

      expect(rotClose).toBeGreaterThan(rotFar);
    });

    it('tail wags with larger amplitude when excited', () => {
      const { pet: petFar, camera: camFar } = createPetAndCamera({ x: 0, y: 1, z: 2 }, { x: 0, z: 0 }, 0);
      updatePet(100, petFar, camFar);
      const tailFar = petFar.mesh.getObjectByName('tail');
      const rotFar = Math.abs(tailFar.rotation.z - 0.2);

      const { pet: petClose, camera: camClose } = createPetAndCamera({ x: 0, y: 1, z: 0.5 }, { x: 0, z: 0 }, 0);
      updatePet(100, petClose, camClose);
      const tailClose = petClose.mesh.getObjectByName('tail');
      const rotClose = Math.abs(tailClose.rotation.z - 0.2);

      expect(rotClose).toBeGreaterThan(rotFar);
    });
  });
});
