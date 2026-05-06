/**
 * @fileoverview Game orchestrator — wires systems together. No implementation logic.
 */

import * as THREE from 'three';
import { CFG, resolveMove } from './core.js';
import { buildLevel } from './level/index.js';
import { InputSystem } from './systems/input.js';
import { InteractionSystem } from './systems/interaction.js';
import { AnimationSystem } from './systems/animation/index.js';
import { LoadingSystem } from './systems/loading.js';

export class Game {
  constructor({ renderer, scene, camera, controls, state, composer }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.state = state;
    this.composer = composer;
    this.prevTime = performance.now();
    this._boundAnimate = this.animate.bind(this);

    // Subsystems (composition over inheritance)
    this.input = new InputSystem({ game: this });
    this.interaction = new InteractionSystem({ camera, state, controls });
    this.animation = new AnimationSystem({ scene, state, camera });
    this.loading = new LoadingSystem({ controls });
  }

  init() {
    buildLevel(this.scene, this.state);
    this.state.interactables.forEach((i) => {
      i.mesh.traverse((c) => { if (c.isMesh) c.userData = { label: i.label }; });
    });
    this.input.bind();
    this.loading.start();
    window.addEventListener('resize', () => this.onResize());
    document.querySelectorAll('.panel-close').forEach((btn) => {
      btn.addEventListener('click', () => this.closePanels());
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    requestAnimationFrame(this._boundAnimate);
  }

  animate() {
    requestAnimationFrame(this._boundAnimate);
    const time = performance.now();
    const delta = (time - this.prevTime) / 1000;
    this.prevTime = time;

    if (this.controls.isLocked) {
      this._updateMovement(delta);
    }

    this.animation.update(delta, time);
    this.interaction.updatePrompt();
    this.composer.render();
  }

  _updateMovement(delta) {
    const isDiagonal = (this.state.moveForward && (this.state.moveLeft || this.state.moveRight)) ||
                       (this.state.moveBackward && (this.state.moveLeft || this.state.moveRight));
    const speed = isDiagonal ? CFG.runSpeed * 0.85 : CFG.speed;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, this.camera.up).normalize();

    const mx = (this.state.moveRight ? 1 : 0) - (this.state.moveLeft ? 1 : 0);
    const mz = (this.state.moveForward ? 1 : 0) - (this.state.moveBackward ? 1 : 0);
    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, mz);
    moveDir.addScaledVector(right, mx);
    if (moveDir.length() > 0) moveDir.normalize();

    const dx = moveDir.x * speed * delta;
    const dz = moveDir.z * speed * delta;

    resolveMove(this.camera.position, dx, dz, this.state.walls);
  }

  interact() {
    this.interaction.interact();
  }

  closePanels() {
    this.interaction.closePanels();
  }
}
