/**
 * @fileoverview PreviewManager — isolated preview viewport for furniture items.
 * Owns its own mini-scene, camera, renderer, and animation loop.
 */

import * as THREE from 'three';
import { FurnitureRegistry } from '../furniture/registry.js';
import { extractMeshFromResult, fitMeshToPreview } from '../editor-utils.js';

export class PreviewManager {
  /**
   * @param {object} config — preview settings from editor CONFIG
   * @param {HTMLElement} container — DOM element to append renderer to
   */
  constructor(config, container, renderer = null) {
    this._config = config;
    this._container = container;
    this._scene = null;
    this._camera = null;
    this._renderer = renderer;
    this._group = null;
    this._mesh = null;
    this._labelEl = null;
  }

  init() {
    if (!this._container) return;

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x1c1917);

    const { size, cameraPos, lookAt } = this._config;
    this._camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    this._camera.position.copy(cameraPos);
    this._camera.lookAt(lookAt);

    if (!this._renderer) {
      this._renderer = new THREE.WebGLRenderer({ antialias: true });
      this._renderer.setSize(size, size);
      this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this._container.appendChild(this._renderer.domElement);
    }

    this._scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const d = new THREE.DirectionalLight(0xffffff, 0.8);
    d.position.set(2, 3, 2);
    this._scene.add(d);
    const back = new THREE.DirectionalLight(0xffffff, 0.3);
    back.position.set(-2, 1, -2);
    this._scene.add(back);

    this._group = new THREE.Group();
    this._scene.add(this._group);

    this._labelEl = this._container.querySelector('.preview-label');
  }

  /** Show a preview for the given furniture type. */
  show(type) {
    this.clear();
    if (!type) return;

    const mesh = this._buildMesh(type);
    if (!mesh) return;

    this._mesh = mesh;
    this._group.add(mesh);

    if (this._container) this._container.style.display = 'block';
    if (this._labelEl) this._labelEl.textContent = type;
  }

  /** Hide and clear the preview. */
  clear() {
    this._group?.clear();
    this._mesh = null;
    if (this._container) this._container.style.display = 'none';
  }

  /** Rotate and render the preview (call once per frame). */
  tick() {
    if (this._mesh) {
      this._mesh.rotation.y += this._config.rotationSpeed;
    }
    if (this._renderer && this._camera && this._scene) {
      this._renderer.render(this._scene, this._camera);
    }
  }

  _buildMesh(type) {
    const entry = FurnitureRegistry.get(type);
    const builder = entry?.builder;
    if (!builder) return null;

    const result = builder({ position: [0, 0, 0], rotation: 0, type });
    const mesh = extractMeshFromResult(result);
    if (!mesh) return null;

    fitMeshToPreview(mesh);
    return mesh;
  }
}
