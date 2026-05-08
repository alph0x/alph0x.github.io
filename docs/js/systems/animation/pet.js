/**
 * @fileoverview Pet animation adapter — thin glue between domain/application and infrastructure.
 *
 * SRP: Orchestrates pet animation for this frame.
 *      Delegates ALL logic to application/pet-animator.js (pure)
 *      and ALL rendering to infrastructure/pet-renderer.js (Three.js).
 */

import { updatePetAnimation } from '../../application/pet-animator.js';
import { syncPetToThreeJS } from '../../infrastructure/pet-renderer.js';

/**
 * @param {number} time — elapsed time in milliseconds (from performance.now)
 * @param {{mesh:THREE.Group,model:import('../../domain/pet.js').Pet}} pet
 * @param {THREE.Camera} camera
 */
export function updatePet(time, pet, camera) {
  if (!pet?.model || !pet?.mesh || !camera) return;

  const timeS = time * 0.001;
  updatePetAnimation(pet.model, camera.position, timeS);
  syncPetToThreeJS(pet.model, pet.mesh, camera.position);
}
