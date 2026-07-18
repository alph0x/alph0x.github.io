/**
 * @fileoverview Interaction system — SRP: raycasting, panels, prompts.
 */

import * as THREE from 'three';
import { enterTerminalMode, exitTerminalMode } from './alphgpt.js';

import type { WorldState, Interactable } from '../domain/world-state.js';
import type { ControlsLike } from '../core.js';

type ThreeInteractable = Interactable & { mesh: THREE.Object3D };


export class InteractionSystem {
  camera: THREE.Camera;
  worldState: WorldState;
  controls: ControlsLike;
  raycaster: THREE.Raycaster;

  private _terminalOriginalPos: THREE.Vector3 | null = null;
  private _terminalOriginalQuat: THREE.Quaternion | null = null;
  private _inTerminalMode = false;
  private _terminalZoom: {
    active: boolean;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromQuat: THREE.Quaternion;
    toQuat: THREE.Quaternion;
    startTime: number;
    duration: number;
    panelId: string;
  } | null = null;
  private readonly _terminalTargetPos = new THREE.Vector3(1.2, 1.35, -0.7);
  private readonly _terminalTargetLookAt = new THREE.Vector3(1.6, 0.9, -1.2);

  constructor({
    camera,
    worldState,
    controls,
  }: {
    camera: THREE.Camera;
    worldState: WorldState;
    controls: ControlsLike;
  }) {
    this.camera = camera;
    this.worldState = worldState;
    this.controls = controls;
    this.raycaster = new THREE.Raycaster();
  }

  interact(): void {
    const { ui, room } = this.worldState;
    if (ui.isPanelOpen || this._terminalZoom?.active) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const interactables = room.interactables as ThreeInteractable[];
    const hits = this.raycaster.intersectObjects(interactables.map((i) => i.mesh), true);
    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = interactables.find(
        (i) => i.mesh === hits[0].object || i.mesh === hits[0].object.parent
      );
      if (!obj) return;
      if (obj.panelId === 'panel-alphgpt') {
        this._startTerminalZoom(obj.panelId);
      } else if (obj.panelId) {
        this.openPanel(obj.panelId);
      }
    }
  }

  openPanel(id: string): void {
    const { ui } = this.worldState;
    ui.isPanelOpen = true;
    this.controls.unlock();
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
  }

  private _startTerminalZoom(panelId: string): void {
    if (this._terminalZoom?.active) return;
    this._terminalOriginalPos = this.camera.position.clone();
    this._terminalOriginalQuat = this.camera.quaternion.clone();

    const dummy = new THREE.Object3D();
    dummy.position.copy(this._terminalTargetPos);
    dummy.lookAt(this._terminalTargetLookAt);

    this._terminalZoom = {
      active: true,
      fromPos: this.camera.position.clone(),
      toPos: this._terminalTargetPos.clone(),
      fromQuat: this.camera.quaternion.clone(),
      toQuat: dummy.quaternion.clone(),
      startTime: performance.now(),
      duration: 800,
      panelId,
    };

    try {
      this.controls.unlock();
    } catch {
      /* pointer lock may not be available */
    }
    this._tickTerminalZoom();
  }

  private _tickTerminalZoom(): void {
    const zoom = this._terminalZoom;
    if (!zoom || !zoom.active) return;

    const now = performance.now();
    const t = Math.min((now - zoom.startTime) / zoom.duration, 1);
    const eased = t * t * (3 - 2 * t);

    this.camera.position.lerpVectors(zoom.fromPos, zoom.toPos, eased);
    this.camera.quaternion.slerpQuaternions(zoom.fromQuat, zoom.toQuat, eased);

    if (t < 1) {
      requestAnimationFrame(() => this._tickTerminalZoom());
      return;
    }

    zoom.active = false;
    this.openPanel(zoom.panelId);
    const panel = document.getElementById(zoom.panelId);
    if (panel) panel.classList.add('terminal-mode');
    enterTerminalMode();
    this._inTerminalMode = true;
    const input = document.getElementById('alphgpt-input') as HTMLElement | null;
    if (input) input.focus();
  }

  closePanels(): void {
    const { ui } = this.worldState;
    ui.isPanelOpen = false;
    document.querySelectorAll('.info-panel').forEach((p) => {
      p.classList.remove('active');
      p.classList.remove('terminal-mode');
    });
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    if (this._terminalZoom?.active) {
      this._terminalZoom.active = false;
    }

    if (this._terminalOriginalPos && this._terminalOriginalQuat) {
      this.camera.position.copy(this._terminalOriginalPos);
      this.camera.quaternion.copy(this._terminalOriginalQuat);
    }
    this._terminalOriginalPos = null;
    this._terminalOriginalQuat = null;

    if (this._inTerminalMode) {
      this._inTerminalMode = false;
      exitTerminalMode();
    }

    this.controls.lock();
  }

  updatePrompt(): void {
    const { ui, room } = this.worldState;
    const prompt = document.getElementById('prompt') as HTMLElement | null;
    if (!prompt) return;

    if (ui.isPanelOpen || this._terminalZoom?.active) {
      prompt.classList.remove('active');
      return;
    }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const interactables = room.interactables as ThreeInteractable[];
    const hits = this.raycaster.intersectObjects(interactables.map((i) => i.mesh), true);

    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = interactables.find(
        (i) => i.mesh === hits[0].object || i.mesh === hits[0].object.parent
      );
      if (obj) {
        prompt.textContent = `[E] ${obj.name || obj.type}`;
        prompt.classList.add('active');
        return;
      }
    }
    prompt.classList.remove('active');
  }
}

