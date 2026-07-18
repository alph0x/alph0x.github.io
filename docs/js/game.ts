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
import { updatePlayerMovement } from './application/player-movement.js';
import { extractCameraForwardXZ, syncPlayerToCamera } from './infrastructure/player-renderer.js';
import type { WorldState, Interactable } from './domain/world-state.js';
import type { AlphGPTContext } from './systems/alphgpt.js';
import type { TouchControls } from './systems/touch-controls.js';

declare global {
  interface Window {
    __alphgptContext?: AlphGPTContext;
  }
}



interface GameConfig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: ControlsLike;
  worldState: WorldState;
  touchControls: TouchControls | null;
}

interface TourStop {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  panelId: string | null;
}

interface ScreenReflectTarget {
  mesh: THREE.Mesh;
  originalMat: THREE.Material;
  rt: THREE.WebGLRenderTarget;
}

interface ScreenReflectState {
  targets: ScreenReflectTarget[];
  frameInterval: number;
  frameCounter: number;
  reflectCam: THREE.PerspectiveCamera | null;
  lowEnd: boolean;
}

function isMesh(obj: THREE.Object3D): obj is THREE.Mesh {
  // unchecked cast: three.js attaches isMesh at runtime but types it on Mesh only
  return (obj as unknown as THREE.Mesh).isMesh === true;
}

// Scratch objects for the reflection pass — avoids per-update allocations.
const _srNormal = new THREE.Vector3();
const _srPos = new THREE.Vector3();
const _srQuat = new THREE.Quaternion();
const _srLook = new THREE.Vector3();

export class Game {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: ControlsLike;
  worldState: WorldState;
  touchControls: TouchControls | null;

  private prevTime: number;
  private _boundAnimate: () => void;

  private input: InputSystem;
  private interaction: InteractionSystem;
  private animation: AnimationSystem;
  private loading: LoadingSystem;
  private audio: AudioSystem;

  private tour: {
    active: boolean;
    index: number;
    phase: 'idle' | 'move' | 'dwell';
    timer: number;
    moveDuration: number;
    dwellDuration: number;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromQuat: THREE.Quaternion;
    toQuat: THREE.Quaternion;
    stops: TourStop[];
  };

  private _screenReflect: ScreenReflectState;

  constructor({ renderer, scene, camera, controls, worldState, touchControls }: GameConfig) {
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
      phase: 'idle',
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

    // Screen reflection system — ponytail: update screen textures every N frames
    this._screenReflect = {
      targets: [],
      frameInterval: 6,
      frameCounter: 0,
      reflectCam: null,
      lowEnd: false,
    };
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

      this._initScreenReflections();
    });
    this.input.bind();
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
      this.interaction.updatePrompt(delta);
    }
    this._updateAlphGPTContext(delta);
    this._updateScreenReflections();
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


  _beginStop(stop: TourStop) {
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

  updateTour(delta: number) {
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

  // ── Screen Reflections ──────────────────────────────────────────

  private _alphgptContextAccum = 1; // 1 → context populated on the first frame
  private _furnitureNames: string[] | null = null;

  private _updateAlphGPTContext(delta: number): void {
    // ponytail: 1Hz is plenty for a chat context string; skips a per-frame
    // new Date + ICU toLocaleTimeString + filter/map.
    this._alphgptContextAccum += delta;
    if (this._alphgptContextAccum < 1) return;
    this._alphgptContextAccum = 0;

    const { player, room, pet, input } = this.worldState;
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay: AlphGPTContext['timeOfDay'] =
      hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    const px = player.position.x;
    const pz = player.position.z;
    const lx = room.luluSpawn.x;
    const lz = room.luluSpawn.z;
    const luluNearby = Math.hypot(px - lx, pz - lz) < 1.2;

    const isMoving =
      input.moveForward || input.moveBackward || input.moveLeft || input.moveRight || player.isMoving;

    // Room layout is static per build — compute the name list once.
    if (!this._furnitureNames) {
      this._furnitureNames = room.interactables
        .filter((i) => i.type !== 'playerSpawn' && i.type !== 'luluSpawn')
        .map((i) => i.name || i.type);
    }
    const furnitureNames = this._furnitureNames;

    window.__alphgptContext = {
      timeOfDay,
      localTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      furnitureNames,
      luluNearby,
      isMoving,
      tourActive: this.tour.active,
    };
  }

  _initScreenReflections() {
    const sr = this._screenReflect;
    // ponytail: skip expensive reflections on low-end / touch devices
    const isLowEnd =
      window.matchMedia('(max-width: 768px)').matches ||
      ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    if (isLowEnd) {
      sr.lowEnd = true;
      return;
    }

    // Find all screen meshes (MeshBasicMaterial with CanvasTexture map)
    this.scene.traverse((obj) => {
      if (!isMesh(obj)) return;
      const mat = obj.material;
      if (Array.isArray(mat)) return;
      if (!mat) return;
      if (!(mat instanceof THREE.MeshBasicMaterial)) return;
      if (!mat.map || !(mat.map instanceof THREE.CanvasTexture)) return;
      const rt = new THREE.WebGLRenderTarget(256, 256, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      });
      const rtMat = new THREE.MeshBasicMaterial({ map: rt.texture });
      sr.targets.push({ mesh: obj, originalMat: mat, rt });
      obj.material = rtMat;
    });

    if (sr.targets.length === 0) return;
    sr.reflectCam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  }

  _updateScreenReflections() {
    const sr = this._screenReflect;
    if (sr.lowEnd || sr.targets.length === 0 || !sr.reflectCam) return;
    sr.frameCounter++;
    if (sr.frameCounter % sr.frameInterval !== 0) return;
    // Skip if renderer doesn't support render targets (tests/mock)
    if (!this.renderer.setRenderTarget) return;

    const oldTarget = this.renderer.getRenderTarget ? this.renderer.getRenderTarget() : null;
    const normal = _srNormal;
    const pos = _srPos;
    const quat = _srQuat;

    for (const target of sr.targets) {
      target.mesh.getWorldPosition(pos);
      target.mesh.getWorldQuaternion(quat);
      normal.set(0, 0, 1).applyQuaternion(quat);
      sr.reflectCam.position.copy(pos).addScaledVector(normal, 0.1);
      _srLook.copy(pos).addScaledVector(normal, 2);
      sr.reflectCam.lookAt(_srLook);
      this.renderer.setRenderTarget(target.rt);
      this.renderer.render(this.scene, sr.reflectCam);
    }

    this.renderer.setRenderTarget(oldTarget);
  }
}
