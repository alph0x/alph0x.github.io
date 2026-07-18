/**
 * @fileoverview Portfolio tour — scripted spectator camera with panel stops.
 */

import * as THREE from 'three';
import type { WorldState } from '../domain/world-state.js';
import type { ControlsLike } from '../core.js';

export interface TourStop {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  panelId: string | null;
}

interface TourInteraction {
  openPanel(id: string): void;
  closePanels(): void;
}

const TOUR_STOPS: TourStop[] = [
  { name: 'bed', position: new THREE.Vector3(-1.6, 1.4, -0.2), target: new THREE.Vector3(-1.1, 0.6, -0.9), panelId: 'panel-profile' },
  { name: 'desk', position: new THREE.Vector3(0.7, 1.4, -0.4), target: new THREE.Vector3(1.2, 0.8, -1.15), panelId: 'panel-profile' },
  { name: 'macbook', position: new THREE.Vector3(1.2, 1.35, -0.7), target: new THREE.Vector3(1.6, 0.9, -1.2), panelId: 'panel-alphgpt' },
  { name: 'window', position: new THREE.Vector3(0, 1.45, -0.9), target: new THREE.Vector3(0, 1.5, -10), panelId: null },
  { name: 'pet', position: new THREE.Vector3(-0.4, 1.25, -0.2), target: new THREE.Vector3(-0.85, 0.9, -0.85), panelId: null },
];

export class TourSystem {
  active = false;
  index = 0;
  phase: 'idle' | 'move' | 'dwell' = 'idle';
  timer = 0;
  moveDuration = 2;
  dwellDuration = 4;
  stops = TOUR_STOPS;

  private fromPos = new THREE.Vector3();
  private toPos = new THREE.Vector3();
  private fromQuat = new THREE.Quaternion();
  private toQuat = new THREE.Quaternion();

  constructor(
    private camera: THREE.Camera,
    private worldState: WorldState,
    private controls: ControlsLike,
    private interaction: TourInteraction
  ) {}

  start(): void {
    if (this.active) return;
    this.active = true;
    this.index = 0;
    this.phase = 'move';
    this.timer = 0;

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';
    const tourSkip = document.getElementById('tour-skip');
    if (tourSkip) tourSkip.style.display = 'block';

    try { this.controls.unlock(); } catch { /* controls may not support unlock */ }

    this._beginStop(this.stops[0]);
  }

  stop(): boolean {
    if (!this.active) return false;
    this.active = false;
    this.phase = 'idle';
    this.timer = 0;
    this.index = 0;

    const tourSkip = document.getElementById('tour-skip');
    if (tourSkip) tourSkip.style.display = 'none';

    if (this.worldState.ui.isPanelOpen) {
      this.interaction.closePanels();
    } else {
      this.worldState.player.position.x = this.camera.position.x;
      this.worldState.player.position.z = this.camera.position.z;
      try { this.controls.lock(); } catch { /* controls may not support lock */ }
    }
    return true;
  }

  update(delta: number): void {
    if (!this.active) return;

    if (this.phase === 'move') {
      this.timer += delta;
      const t = Math.min(this.timer / this.moveDuration, 1);
      const eased = t * t * (3 - 2 * t);
      this.camera.position.lerpVectors(this.fromPos, this.toPos, eased);
      this.camera.quaternion.slerpQuaternions(this.fromQuat, this.toQuat, eased);
      if (t >= 1) {
        const stop = this.stops[this.index];
        if (stop.panelId) {
          this.interaction.openPanel(stop.panelId);
        }
        this.phase = 'dwell';
        this.timer = 0;
      }
    } else if (this.phase === 'dwell') {
      this.timer += delta;
      if (this.timer >= this.dwellDuration) {
        if (this.worldState.ui.isPanelOpen) {
          this.interaction.closePanels();
        }
        this._nextStop();
      }
    }
  }

  private _beginStop(stop: TourStop): void {
    this.fromPos.copy(this.camera.position);
    this.fromQuat.copy(this.camera.quaternion);
    this.toPos.copy(stop.position);

    const dummy = new THREE.Object3D();
    dummy.position.copy(stop.position);
    dummy.lookAt(stop.target);
    this.toQuat.copy(dummy.quaternion);

    this.phase = 'move';
    this.timer = 0;
  }

  private _nextStop(): void {
    this.index += 1;
    if (this.index >= this.stops.length) {
      this.stop();
      return;
    }
    this._beginStop(this.stops[this.index]);
  }
}
