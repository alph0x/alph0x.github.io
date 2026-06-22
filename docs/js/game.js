/**
 * @fileoverview Game orchestrator — wires systems together. No implementation logic.
 */

import * as THREE from 'three';
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

    // Portfolio tour state
    this.tour = {
      active: false,
      index: 0,
      phase: 'idle', // 'move' | 'dwell' | 'idle'
      timer: 0,
      moveDuration: 2,
      dwellDuration: 4,
      fromPos: new THREE.Vector3(),
      toPos: new THREE.Vector3(),
      fromQuat: new THREE.Quaternion(),
      toQuat: new THREE.Quaternion(),
      stops: [
        { name: 'bed', position: new THREE.Vector3(-1.6, 1.4, -0.2), target: new THREE.Vector3(-1.1, 0.6, -0.9), panelId: 'panel-profile' },
        { name: 'desk', position: new THREE.Vector3(0.7, 1.4, -0.4), target: new THREE.Vector3(1.2, 0.8, -1.15), panelId: 'panel-profile' },
        { name: 'macbook', position: new THREE.Vector3(1.2, 1.35, -0.7), target: new THREE.Vector3(1.6, 0.9, -1.2), panelId: 'panel-alphgpt' },
        { name: 'window', position: new THREE.Vector3(0, 1.45, -0.9), target: new THREE.Vector3(0, 1.5, -10), panelId: null },
        { name: 'pet', position: new THREE.Vector3(-0.4, 1.25, -0.2), target: new THREE.Vector3(-0.85, 0.9, -0.85), panelId: null },
      ],
    };
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

    const tourBtn = document.getElementById('tour-btn');
    const tourSkip = document.getElementById('tour-skip');
    if (tourBtn) tourBtn.addEventListener('click', () => this.startTour());
    if (tourSkip) tourSkip.addEventListener('click', () => this.skipTour());
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

    const canMove = !this.tour.active && (this.controls.isLocked || (this.touchControls?.isActive ?? false));
    if (canMove) {
      this._updateMovement(delta);
    }

    this.touchControls?.update();

    this.animation.update(delta, time);
    this.audio.update(delta);
    if (this.tour.active) {
      this.updateTour(delta);
    } else {
      this.interaction.updatePrompt();
    }
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

  startTour() {
    const tour = this.tour;
    if (tour.active) return;
    tour.active = true;
    tour.index = 0;
    tour.phase = 'move';
    tour.timer = 0;

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';
    const tourSkip = document.getElementById('tour-skip');
    if (tourSkip) tourSkip.style.display = 'block';

    if (typeof this.controls.unlock === 'function') {
      try { this.controls.unlock(); } catch { /* ignore */ }
    }

    this._beginStop(tour.stops[0]);
  }

  stopTour() {
    const tour = this.tour;
    if (!tour.active) return false;
    tour.active = false;
    tour.phase = 'idle';
    tour.timer = 0;
    tour.index = 0;

    const tourSkip = document.getElementById('tour-skip');
    if (tourSkip) tourSkip.style.display = 'none';

    if (this.worldState.ui.isPanelOpen) {
      this.closePanels();
    } else {
      // Return player to current camera location so gameplay resumes here
      this.worldState.player.position.x = this.camera.position.x;
      this.worldState.player.position.z = this.camera.position.z;
      if (typeof this.controls.lock === 'function') {
        try { this.controls.lock(); } catch { /* ignore */ }
      }
    }
    return true;
  }

  skipTour() {
    return this.stopTour();
  }

  _beginStop(stop) {
    const tour = this.tour;
    tour.fromPos.copy(this.camera.position);
    tour.fromQuat.copy(this.camera.quaternion);
    tour.toPos.copy(stop.position);

    const dummy = new THREE.Object3D();
    dummy.position.copy(stop.position);
    dummy.lookAt(stop.target);
    tour.toQuat.copy(dummy.quaternion);

    tour.phase = 'move';
    tour.timer = 0;
  }

  _nextStop() {
    const tour = this.tour;
    tour.index += 1;
    if (tour.index >= tour.stops.length) {
      this.stopTour();
      return;
    }
    this._beginStop(tour.stops[tour.index]);
  }

  updateTour(delta) {
    const tour = this.tour;
    if (!tour.active) return;

    if (tour.phase === 'move') {
      tour.timer += delta;
      const t = Math.min(tour.timer / tour.moveDuration, 1);
      const eased = t * t * (3 - 2 * t);
      this.camera.position.lerpVectors(tour.fromPos, tour.toPos, eased);
      this.camera.quaternion.slerpQuaternions(tour.fromQuat, tour.toQuat, eased);
      if (t >= 1) {
        const stop = tour.stops[tour.index];
        if (stop.panelId) {
          this.interaction.openPanel(stop.panelId);
        }
        tour.phase = 'dwell';
        tour.timer = 0;
      }
    } else if (tour.phase === 'dwell') {
      tour.timer += delta;
      if (tour.timer >= tour.dwellDuration) {
        if (this.worldState.ui.isPanelOpen) {
          this.closePanels();
        }
        this._nextStop();
      }
    }
  }
}
