import { updateParticles } from './particles.js';
import { updateImplants } from './implants.js';
import { updateFlickerLights } from './flicker.js';
import { updatePet } from './pet.js';
import { updateParallax } from './parallax.js';

export class AnimationSystem {
  constructor({ scene, state, camera }) {
    this.scene = scene;
    this.state = state;
    this.state.camera = camera;
  }

  update(delta, time) {
    updateImplants(delta, time, this.state);
    updateParticles(delta, this.state);
    updateFlickerLights(this.scene, time);
    updatePet(time, this.state);
    updateParallax(this.scene, this.state.camera);
  }
}
