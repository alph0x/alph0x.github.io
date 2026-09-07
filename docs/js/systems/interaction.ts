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

  // Cached DOM refs — resolved lazily, never re-queried per frame.
  private _promptEl: HTMLElement | null = null;
  private _crosshairEl: HTMLElement | null = null;
  private _panelEls = new Map<string, HTMLElement | null>();
  private _activePanel: HTMLElement | null = null;
  private _panelOpener: HTMLElement | null = null;
  private _restoreStartScreen = false;

  // Cached interactable mesh list — rebuilt only when the source array changes.
  private _meshCache: THREE.Object3D[] = [];
  private _actionable: ThreeInteractable[] = [];
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
    document.addEventListener('keydown', (event) => this._handleDialogKeydown(event));
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

  // Only furniture that actually does something (has a panel) may raycast —
  // the rest never shows the "[E]" prompt nor swallows the E key.
  private _actionableInteractables(interactables: ThreeInteractable[]): ThreeInteractable[] {
    if (this._meshCacheSrc !== interactables || this._meshCacheLen !== interactables.length) {
      this._actionable = interactables.filter((i) => !!i.panelId);
      this._meshCache = this._actionable.map((i) => i.mesh);
      this._meshCacheSrc = interactables;
      this._meshCacheLen = interactables.length;
    }
    return this._actionable;
  }

  private _interactableMeshes(interactables: ThreeInteractable[]): THREE.Object3D[] {
    this._actionableInteractables(interactables);
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
    const interactables = this._actionableInteractables(room.interactables as ThreeInteractable[]);
    const hits = this.raycaster.intersectObjects(this._interactableMeshes(interactables), true);
    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = this._findInteractable(interactables, hits[0].object);
      if (!obj) return;
      if (obj.panelId === 'panel-alphgpt') {
        this._startTerminalZoom(obj.panelId, obj.mesh);
      } else if (obj.panelId) {
        this.openPanel(obj.panelId);
      }
    }
  }

  private _setPanelVisibility(panel: HTMLElement, isOpen: boolean): void {
    panel.hidden = !isOpen;
    panel.setAttribute('aria-hidden', String(!isOpen));
    panel.classList.toggle('active', isOpen);
    if (!isOpen) panel.classList.remove('terminal-mode');
  }

  private _focusableElements(panel: HTMLElement): HTMLElement[] {
    return Array.from(panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  private _focusPanel(panel: HTMLElement): void {
    const initialFocus = panel.querySelector<HTMLElement>('.panel-close') ?? this._focusableElements(panel)[0];
    initialFocus?.focus();
  }

  private _handleDialogKeydown(event: KeyboardEvent): void {
    const panel = this._activePanel;
    if (!this.worldState.ui.isPanelOpen || !panel || panel.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.closePanels();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusables = this._focusableElements(panel);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && (activeElement === first || !panel.contains(activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openPanel(id: string, opener?: HTMLElement | null): void {
    const panel = this._panel(id);
    if (!panel) return;
    const { ui } = this.worldState;
    ui.isPanelOpen = true;
    document.querySelectorAll<HTMLElement>('.info-panel').forEach((item) => this._setPanelVisibility(item, item === panel));
    this._activePanel = panel;
    const active = opener ?? document.activeElement;
    this._panelOpener = active instanceof HTMLElement ? active : null;
    const startScreen = document.getElementById('start-screen') as HTMLElement | null;
    this._restoreStartScreen = !!startScreen && startScreen.style.display !== 'none';
    if (this._restoreStartScreen) {
      if (startScreen) startScreen.style.display = 'none';
    }
    // unlock AFTER the panel is active: loading.ts re-shows the start screen
    // on unlock when no panel is open.
    this.controls.unlock();
    const crosshair = this._crosshair();
    if (crosshair) crosshair.style.display = 'none';
    this._focusPanel(panel);
  }

  // Lean in to the actual laptop: eyes stop just in front of the screen,
  // gaze resting on the display center — as if sitting down to use it.
  private _computeTerminalView(mesh: THREE.Object3D): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const fwd = new THREE.Vector3(Math.sin(mesh.rotation.y), 0, Math.cos(mesh.rotation.y));
    const look = center.clone().addScaledVector(fwd, -0.05); // lid sits at the back
    look.y = box.min.y + (box.max.y - box.min.y) * 0.7; // screen center, not keyboard
    const pos = look.clone().addScaledVector(fwd, 0.38);
    pos.y = look.y + 0.06;
    return { pos, look };
  }

  private _startTerminalZoom(panelId: string, mesh: THREE.Object3D): void {
    if (this._terminalZoom?.active) return;
    this._terminalOriginalPos = this.camera.position.clone();
    this._terminalOriginalQuat = this.camera.quaternion.clone();

    const { pos, look } = this._computeTerminalView(mesh);
    // Cameras look down -Z, so Object3D.lookAt (which faces +Z) would leave
    // the view rotated 180° — aim with the same YXZ convention as the FPS
    // controls instead.
    const dir = look.clone().sub(pos);
    const yaw = Math.atan2(-dir.x, -dir.z);
    const pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
    const toQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

    this._terminalZoom = {
      active: true,
      fromPos: this.camera.position.clone(),
      toPos: pos,
      fromQuat: this.camera.quaternion.clone(),
      toQuat,
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
    document.querySelectorAll<HTMLElement>('.info-panel').forEach((panel) => this._setPanelVisibility(panel, false));
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

    const opener = this._panelOpener;
    const restoreStartScreen = this._restoreStartScreen;
    this._activePanel = null;
    this._panelOpener = null;
    this._restoreStartScreen = false;

    if (restoreStartScreen) {
      const startScreen = document.getElementById('start-screen') as HTMLElement | null;
      if (startScreen) startScreen.style.display = 'flex';
    } else {
      this.controls.lock();
    }
    if (opener?.isConnected) opener.focus();
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
    const interactables = this._actionableInteractables(room.interactables as ThreeInteractable[]);
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
