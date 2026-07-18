import * as THREE from 'three';
import type { WorldState } from '../../domain/world-state.js';
import { updateDust } from './dust.js';
import { updateFlickerLights } from './flicker.js';
import { updatePet } from './pet.js';
import { updateParallax } from './parallax.js';

interface AnimationSystemConfig {
  scene: THREE.Scene;
  worldState: WorldState;
  camera: THREE.Camera;
}

export class AnimationSystem {
  private scene: THREE.Scene;
  private worldState: WorldState;
  private camera: THREE.Camera;

  constructor({ scene, worldState, camera }: AnimationSystemConfig) {
    this.scene = scene;
    this.worldState = worldState;
    this.camera = camera;
  }

  update(delta: number, time: number): void {
    const { pet } = this.worldState;
    updateFlickerLights(time);
    updateDust(time);
    updatePet(time, pet, this.camera);
    updateParallax(this.camera);
  }
}
