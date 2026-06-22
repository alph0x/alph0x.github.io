import { updateFlickerLights } from './flicker.js';
import { updatePet } from './pet.js';
import { updateParallax } from './parallax.js';

export class AnimationSystem {
  constructor({ scene, worldState, camera }) {
    this.scene = scene;
    this.worldState = worldState;
    this.camera = camera;
  }

  update(delta, time) {
    const { pet } = this.worldState;
    updateFlickerLights(this.scene, time);
    updatePet(time, pet, this.camera);
    updateParallax(this.scene, this.camera);
  }
}
