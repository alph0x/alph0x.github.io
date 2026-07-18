/**
 * @fileoverview Pet animation adapter — thin glue between domain/application and infrastructure.
 *
 * SRP: Orchestrates pet animation for this frame.
 *      Delegates ALL logic to application/pet-animator.js (pure)
 *      and ALL rendering to infrastructure/pet-renderer.js (Three.js).
 */

import * as THREE from 'three';
import { updatePetAnimation } from '../../application/pet-animator.js';
import { syncPetToThreeJS } from '../../infrastructure/pet-renderer.js';
import { getTimeOfDayPreset } from '../../level/lighting.js';
import type { Pet } from '../../domain/pet.js';

interface PetState {
  mesh: unknown;
  model: Pet | null;
}

export function updatePet(time: number, pet: PetState | null | undefined, camera: THREE.Camera): void {
  if (!pet?.model || !pet?.mesh || !camera) return;

  const timeS = time * 0.001;
  const preset = getTimeOfDayPreset();
  updatePetAnimation(pet.model, camera.position, timeS, preset.name);
  syncPetToThreeJS(pet.model, pet.mesh as THREE.Group, camera.position);
}
