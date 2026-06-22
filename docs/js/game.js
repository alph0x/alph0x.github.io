/**
 * @fileoverview Game orchestrator — wires systems together. No implementation logic.
 */

import { CFG } from './core.js';
import { buildLevel } from './level/index.js';
import { InputSystem } from './systems/input.js';
import { InteractionSystem } from './systems/interaction.js';
import { AnimationSystem } from './systems/animation/index.js';
import { LoadingSystem } from './systems/loading.js';
import { AudioSystem } from './systems/audio.js';
import { updatePlayerMovement } from './application/player-movement.js';
import { extractCameraForwardXZ, syncPlayerToCamera } from './infrastructure/player-renderer.js';

export class Game {
  constructor({ renderer, scene, camera, controls, worldState, touchControls }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.worldState = worldState;
    this.touchControls = touchControls;
    this.prevTime = performance.now();
    this._boundAnimate = this.animate.bind(this);

    // Subsystems (composition over inheritance)
    this.input = new InputSystem({ game: this });
    this.interaction = new InteractionSystem({ camera, worldState, controls });
    this.animation = new AnimationSystem({ scene, worldState, camera });
    this.loading = new LoadingSystem({ controls });
    this.audio = new AudioSystem();
  }

  init() {
    buildLevel(this.scene, this.worldState);
    this.worldState.room.interactables.forEach((i) => {
      i.mesh.traverse((c) => { if (c.isMesh) c.userData = { label: i.label }; });
    });
    this.input.bind();
    this.loading.start();
    window.addEventListener('resize', () => this.onResize());
    document.querySelectorAll('.panel-close').forEach((btn) => {
      btn.addEventListener('click', () => this.closePanels());
    });
    document.addEventListener('click', (e) => {
      if (!this.worldState.ui.isPanelOpen) return;
      if (e.target.closest('.info-panel')) return;
      if (e.target.tagName === 'CANVAS') return;
      this.closePanels();
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    // No post-processing — render directly
  }

  start() {
    this.audio.startAmbient();
    requestAnimationFrame(this._boundAnimate);
  }

  animate() {
    requestAnimationFrame(this._boundAnimate);
    const time = performance.now();
    const delta = (time - this.prevTime) / 1000;
    this.prevTime = time;

    const canMove = this.controls.isLocked || (this.touchControls?.isActive ?? false);
    if (canMove) {
      this._updateMovement(delta);
    }

    this.touchControls?.update();

    this.animation.update(delta, time);
    this.audio.update(delta);
    this.interaction.updatePrompt();
    this.renderer.render(this.scene, this.camera);
  }

  _updateMovement(delta) {
    const { player, input, room } = this.worldState;
    const cameraForward = extractCameraForwardXZ(this.camera);
    updatePlayerMovement(player, input, cameraForward, room.walls, delta);
    syncPlayerToCamera(player, this.camera);
    this.audio.setMoving(player.isMoving);
  }

  interact() {
    this.interaction.interact();
  }

  closePanels() {
    this.interaction.closePanels();
  }
}
