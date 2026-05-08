/**
 * @fileoverview Interaction system — SRP: raycasting, panels, prompts.
 */

import * as THREE from 'three';

export class InteractionSystem {
  constructor({ camera, worldState, controls }) {
    this.camera = camera;
    this.worldState = worldState;
    this.controls = controls;
    this.raycaster = new THREE.Raycaster();
  }

  interact() {
    const { ui, room } = this.worldState;
    if (ui.isPanelOpen) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(room.interactables.map((i) => i.mesh), true);
    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = room.interactables.find((i) => i.mesh === hits[0].object || i.mesh === hits[0].object.parent);
      if (obj) this.openPanel(obj.panelId);
    }
  }

  openPanel(id) {
    const { ui } = this.worldState;
    ui.isPanelOpen = true;
    this.controls.unlock();
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
  }

  closePanels() {
    const { ui } = this.worldState;
    ui.isPanelOpen = false;
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';
    this.controls.lock();
  }

  updatePrompt() {
    const { ui, room } = this.worldState;
    if (ui.isPanelOpen) { document.getElementById('prompt').classList.remove('active'); return; }
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(room.interactables.map((i) => i.mesh), true);
    const prompt = document.getElementById('prompt');
    if (hits.length > 0 && hits[0].distance < 5) {
      prompt.textContent = `[CLICK OR E] ${hits[0].object.userData.label || 'INTERACT'}`;
      prompt.classList.add('active');
    } else {
      prompt.classList.remove('active');
    }
  }
}
