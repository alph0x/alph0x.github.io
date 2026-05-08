import { updateParticles } from './particles.js';
import { updateImplants } from './implants.js';
import { updateFlickerLights } from './flicker.js';
import { updatePet } from './pet.js';
import { updateParallax } from './parallax.js';

export class AnimationSystem {
  constructor({ scene, worldState, camera }) {
    this.scene = scene;
    this.worldState = worldState;
    this.camera = camera;
  }

  /** Cache-bust: 2026-05-08T18:48:00 */

  update(delta, time) {
    const { effects, pet } = this.worldState;
    updateImplants(delta, time, effects.implants);
    updateParticles(delta, effects.particles);
    updateFlickerLights(this.scene, time);
    updatePet(time, pet, this.camera);
    updateParallax(this.scene, this.camera);
  }
}
