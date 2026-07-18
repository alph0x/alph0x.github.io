/**
 * @fileoverview PreviewManager — isolated preview viewport for furniture items.
 * Owns its own mini-scene, camera, renderer, and animation loop.
 */

import * as THREE from 'three';
import { FurnitureRegistry } from '../furniture/registry.js';
import { extractMeshFromResult, fitMeshToPreview } from '../primitives.js';
import type { FurnitureConfig } from '../seed.js';

export interface PreviewConfig {
  size: number;
  targetMeshSize: number;
  rotationSpeed: number;
  cameraPos: THREE.Vector3;
  lookAt: THREE.Vector3;
}

export class PreviewManager {
  private _config: PreviewConfig;
  private _container: HTMLElement | null;
  private _scene: THREE.Scene | null = null;
  private _camera: THREE.PerspectiveCamera | null = null;
  private _renderer: THREE.WebGLRenderer | null;
  private _group: THREE.Group | null = null;
  private _mesh: THREE.Mesh | THREE.Group | null = null;
  private _labelEl: HTMLElement | null = null;

  constructor(config: PreviewConfig, container: HTMLElement | null, renderer: THREE.WebGLRenderer | null = null) {
    this._config = config;
    this._container = container;
    this._renderer = renderer;
  }

  init(): void {
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
  show(type: string | null): void {
    this.clear();
    if (!type) return;

    const mesh = this._buildMesh(type);
    if (!mesh || !this._group) return;

    this._mesh = mesh;
    this._group.add(mesh);

    if (this._container) this._container.style.display = 'block';
    if (this._labelEl) this._labelEl.textContent = type;
  }

  /** Hide and clear the preview. */
  clear(): void {
    this._group?.clear();
    this._mesh = null;
    if (this._container) this._container.style.display = 'none';
  }

  /** Rotate and render the preview (call once per frame). */
  tick(): void {
    if (this._mesh) {
      this._mesh.rotation.y += this._config.rotationSpeed;
    }
    if (this._renderer && this._camera && this._scene) {
      this._renderer.render(this._scene, this._camera);
    }
  }

  private _buildMesh(type: string): THREE.Mesh | THREE.Group | null {
    const entry = FurnitureRegistry.get(type);
    const builder = entry?.builder;
    if (!builder) return null;

    const cfg: FurnitureConfig = { type, position: [0, 0, 0], rotation: 0 };
    const result = builder(cfg);
    const mesh = extractMeshFromResult(result);
    if (!mesh) return null;

    fitMeshToPreview(mesh);
    return mesh;
  }
}
