/**
 * @fileoverview Interaction system — SRP: raycasting, panels, prompts.
 */

import * as THREE from 'three';
import { enterTerminalMode, exitTerminalMode } from './alphgpt.js';

import type { WorldState, Interactable } from '../domain/world-state.js';
import type { ControlsLike } from '../core.js';

type ThreeInteractable = Interactable & { mesh: THREE.Object3D };

const _center = new THREE.Vector2(0, 0); // scratch — avoids a per-frame allocation

/** Prompt raycast interval (seconds). Hide/show stays responsive; only the raycast is throttled. */
const PROMPT_RAYCAST_INTERVAL = 0.1;


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

  // Cached DOM refs — resolved lazily, never re-queried per frame.
  private _promptEl: HTMLElement | null = null;
  private _crosshairEl: HTMLElement | null = null;
  private _panelEls = new Map<string, HTMLElement | null>();

  // Cached interactable mesh list — rebuilt only when the source array changes.
  private _meshCache: THREE.Object3D[] = [];
  private _meshCacheSrc: ThreeInteractable[] | null = null;
  private _meshCacheLen = -1;

  private _promptRaycastAccum = 0;

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

  private _prompt(): HTMLElement | null {
    // ponytail: null is not cached so a late-mounted element is still picked up
    if (!this._promptEl) {
      this._promptEl = document.querySelector<HTMLElement>('#prompt');
    }
    return this._promptEl;
  }

  private _crosshair(): HTMLElement | null {
    if (!this._crosshairEl) {
      this._crosshairEl = document.querySelector<HTMLElement>('#crosshair');
    }
    return this._crosshairEl;
  }

  private _panel(id: string): HTMLElement | null {
    let el = this._panelEls.get(id);
    if (el === undefined) {
      el = document.querySelector<HTMLElement>(`#${id}`);
      this._panelEls.set(id, el);
    }
    return el;
  }

  private _interactableMeshes(interactables: ThreeInteractable[]): THREE.Object3D[] {
    if (this._meshCacheSrc !== interactables || this._meshCacheLen !== interactables.length) {
      this._meshCache = interactables.map((i) => i.mesh);
      this._meshCacheSrc = interactables;
      this._meshCacheLen = interactables.length;
    }
    return this._meshCache;
  }

  // GLB roots nest meshes several levels deep — walk ancestors, not just parent.
  private _findInteractable(interactables: ThreeInteractable[], object: THREE.Object3D): ThreeInteractable | undefined {
    let node: THREE.Object3D | null = object;
    while (node) {
      const hit = interactables.find((i) => i.mesh === node);
      if (hit) return hit;
      node = node.parent;
    }
    return undefined;
  }

  interact(): void {
    const { ui, room } = this.worldState;
    if (ui.isPanelOpen || this._terminalZoom?.active) return;
    this.raycaster.setFromCamera(_center, this.camera);
    const interactables = room.interactables as ThreeInteractable[];
    const hits = this.raycaster.intersectObjects(this._interactableMeshes(interactables), true);
    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = this._findInteractable(interactables, hits[0].object);
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
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const panel = this._panel(id);
    if (panel) panel.classList.add('active');
    // unlock AFTER the panel is active: loading.ts re-shows the start screen
    // on unlock when no panel is open.
    this.controls.unlock();
    const crosshair = this._crosshair();
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
    const panel = this._panel(zoom.panelId);
    if (panel) panel.classList.add('terminal-mode');
    enterTerminalMode();
    this._inTerminalMode = true;
    const input = document.querySelector<HTMLElement>('#alphgpt-input');
    if (input) input.focus();
  }

  closePanels(): void {
    const { ui } = this.worldState;
    ui.isPanelOpen = false;
    document.querySelectorAll('.info-panel').forEach((p) => {
      p.classList.remove('active');
      p.classList.remove('terminal-mode');
    });
    const crosshair = this._crosshair();
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

  updatePrompt(delta?: number): void {
    const { ui, room } = this.worldState;
    const prompt = this._prompt();
    if (!prompt) return;

    // Hide stays frame-responsive (panel open / terminal zoom).
    if (ui.isPanelOpen || this._terminalZoom?.active) {
      prompt.classList.remove('active');
      return;
    }

    // ponytail: 10Hz raycast is indistinguishable for a hover prompt.
    // No delta passed (tests, one-shot calls) → always raycast.
    this._promptRaycastAccum += delta ?? PROMPT_RAYCAST_INTERVAL;
    if (this._promptRaycastAccum < PROMPT_RAYCAST_INTERVAL) return;
    this._promptRaycastAccum = 0;

    this.raycaster.setFromCamera(_center, this.camera);
    const interactables = room.interactables as ThreeInteractable[];
    const hits = this.raycaster.intersectObjects(this._interactableMeshes(interactables), true);

    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = this._findInteractable(interactables, hits[0].object);
      if (obj) {
        prompt.textContent = `[E] ${obj.name || obj.type}`;
        prompt.classList.add('active');
        return;
      }
    }
    prompt.classList.remove('active');
  }
}
