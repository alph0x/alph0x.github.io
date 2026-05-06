/**
 * @fileoverview Interaction system — SRP: raycasting, panels, prompts.
 */

import * as THREE from 'three';

export class InteractionSystem {
  constructor({ camera, state, controls }) {
    this.camera = camera;
    this.state = state;
    this.controls = controls;
    this.raycaster = new THREE.Raycaster();
  }

  interact() {
    if (this.state.isPanelOpen) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this.state.interactables.map((i) => i.mesh), true);
    if (hits.length > 0 && hits[0].distance < 5) {
      const obj = this.state.interactables.find((i) => i.mesh === hits[0].object || i.mesh === hits[0].object.parent);
      if (obj) this.openPanel(obj.panelId);
    }
  }

  openPanel(id) {
    this.state.isPanelOpen = true;
    this.controls.unlock();
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
  }

  closePanels() {
    this.state.isPanelOpen = false;
    document.querySelectorAll('.info-panel').forEach((p) => p.classList.remove('active'));
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';
    this.controls.lock();
  }

  updatePrompt() {
    if (this.state.isPanelOpen) { document.getElementById('prompt').classList.remove('active'); return; }
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this.state.interactables.map((i) => i.mesh), true);
    const prompt = document.getElementById('prompt');
    if (hits.length > 0 && hits[0].distance < 5) {
      prompt.textContent = `[CLICK OR E] ${hits[0].object.userData.label || 'INTERACT'}`;
      prompt.classList.add('active');
    } else {
      prompt.classList.remove('active');
    }
  }
}
