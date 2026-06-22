/**
 * @fileoverview Interaction system — SRP: raycasting, panels, prompts.
 */

import * as THREE from 'three';
import type { WorldState } from '../domain/world-state.js';

interface PointerLockLike {
  lock(): void;
  unlock(): void;
}

interface Interactable {
  mesh: THREE.Object3D;
  panelId: string;
}

export class InteractionSystem {
  camera: THREE.Camera;
  worldState: WorldState;
  controls: PointerLockLike;
  raycaster: THREE.Raycaster;

  constructor({
    camera,
    worldState,
    controls,
  }: {
    camera: THREE.Camera;
    worldState: WorldState;
    controls: PointerLockLike;
  }) {
    this.camera = camera;
    this.worldState = worldState;
    this.controls = controls;
    this.raycaster = new THREE.Raycaster();
  }

  interact(): void {
    const { ui, room } = this.worldState;
    if (ui.isPanelOpen) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const interactables = room.interactables as Interactable[];
    const hits = this.raycaster.intersectObjects(interactables.map((i) => i.mesh), true);
    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = interactables.find(
        (i) => i.mesh === hits[0].object || i.mesh === hits[0].object.parent
      );
      if (obj) this.openPanel(obj.panelId);
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

  closePanels(): void {
    const { ui } = this.worldState;
    ui.isPanelOpen = false;
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';
    this.controls.lock();
  }

  updatePrompt(): void {
    const { ui, room } = this.worldState;
    const prompt = document.getElementById('prompt') as HTMLElement | null;
    if (!prompt) return;

    if (ui.isPanelOpen) {
      prompt.classList.remove('active');
      return;
    }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const interactables = room.interactables as Interactable[];
    const hits = this.raycaster.intersectObjects(interactables.map((i) => i.mesh), true);

    if (hits.length > 0 && hits[0].distance < 5) {
      prompt.textContent = `[CLICK OR E] ${hits[0].object.userData.label || 'INTERACT'}`;
      prompt.classList.add('active');
    } else {
      prompt.classList.remove('active');
    }
  }
}
