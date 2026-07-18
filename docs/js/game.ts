/**
 * @fileoverview Game orchestrator — wires systems together. No implementation logic.
 */

import type { ControlsLike } from './core.js';
import * as THREE from 'three';
import { buildLevel } from './level/index.js';
import { InputSystem } from './systems/input.js';
import { InteractionSystem } from './systems/interaction.js';
import { AnimationSystem } from './systems/animation/index.js';
import { LoadingSystem } from './systems/loading.js';
import { AudioSystem } from './systems/audio.js';
import { TourSystem } from './systems/tour.js';
import { ScreenReflections } from './systems/screen-reflections.js';
import { AlphGPTContextProvider } from './systems/alphgpt-context.js';
import { updatePlayerMovement } from './application/player-movement.js';
import { extractCameraForwardXZ, syncPlayerToCamera } from './infrastructure/player-renderer.js';
import type { WorldState, Interactable } from './domain/world-state.js';
import type { TouchControls } from './systems/touch-controls.js';

interface GameConfig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: ControlsLike;
  worldState: WorldState;
  touchControls: TouchControls | null;
}

function isMesh(obj: THREE.Object3D): obj is THREE.Mesh {
  return (obj as THREE.Mesh).isMesh === true;
}

export class Game {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: ControlsLike;
  worldState: WorldState;
  touchControls: TouchControls | null;
  input: InputSystem;
  interaction: InteractionSystem;
  animation: AnimationSystem;
  loading: LoadingSystem;
  audio: AudioSystem;
  tour: TourSystem;
  reflections: ScreenReflections;
  prevTime: number;
  private _boundAnimate: () => void;
  private alphgptContext: AlphGPTContextProvider;

  constructor({ renderer, scene, camera, controls, worldState, touchControls }: GameConfig) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.worldState = worldState;
    this.touchControls = touchControls;
    this.prevTime = performance.now();
    this._boundAnimate = this.animate.bind(this);

    this.input = new InputSystem({ game: this });
    this.interaction = new InteractionSystem({ camera, worldState, controls });
    this.animation = new AnimationSystem({ scene, worldState, camera });
    this.loading = new LoadingSystem({ controls });
    this.audio = new AudioSystem();
    this.tour = new TourSystem(camera, worldState, controls, this.interaction);
    this.reflections = new ScreenReflections(scene, renderer);
    this.alphgptContext = new AlphGPTContextProvider(worldState);
  }

  init() {
    const buildPromise = buildLevel(this.scene, this.worldState);
    this.loading.start([buildPromise]);
    buildPromise.then(() => {
      this.worldState.room.interactables.forEach((i: Interactable) => {
        (i.mesh as THREE.Object3D).traverse((c) => { if (isMesh(c)) c.userData = { label: i.label }; });
      });
      window.addEventListener('resize', () => this.onResize());
      document.querySelectorAll('.panel-close').forEach((btn) => {
        btn.addEventListener('click', () => this.closePanels());
      });
      document.addEventListener('click', (e) => {
        if (!this.worldState.ui.isPanelOpen) return;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (target.closest('.info-panel')) return;
        if (target.tagName === 'CANVAS') return;
        this.closePanels();
      });

      const tourBtn = document.getElementById('tour-btn');
      const tourSkip = document.getElementById('tour-skip');
      if (tourBtn) tourBtn.addEventListener('click', () => this.startTour());
      if (tourSkip) tourSkip.addEventListener('click', () => this.stopTour());

      this.reflections.init();
    });
    this.input.bind();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
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
      this.tour.update(delta);
    } else {
      this.interaction.updatePrompt(delta);
    }
    this.alphgptContext.update(delta, this.tour.active);
    this.reflections.update();
    this.renderer.render(this.scene, this.camera);
  }

  _updateMovement(delta: number) {
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
    this.tour.start();
  }

  stopTour() {
    return this.tour.stop();
  }
}
