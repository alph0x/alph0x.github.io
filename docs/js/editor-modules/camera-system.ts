/**
 * @fileoverview Camera and viewport management for the Room Layout Editor.
 * Encapsulates top/3D camera switching, resize handling, and OrbitControls lifecycle.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface CameraConfig {
  viewSize: number;
  cameraY: number;
}

export class EditorCameraSystem {
  private _container: HTMLElement;
  private _config: CameraConfig;
  private _renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera | THREE.PerspectiveCamera | null = null;
  controls: OrbitControls | null = null;
  private _controlsTarget = new THREE.Vector3(0, 0, 0);

  constructor(container: HTMLElement, config: CameraConfig, renderer: THREE.WebGLRenderer) {
    this._container = container;
    this._config = config;
    this._renderer = renderer;
  }

  initializeTop(): void {
    this._setupTopCamera();
    this._attachControls(false);
  }

  setMode(
    mode: '3d' | 'top',
    wallMaterial: THREE.Material | null | undefined,
    onCameraChanged?: (() => void) | null
  ): void {
    if (this.controls) this.controls.dispose();

    if (mode === '3d') {
      this._setup3DCamera();
      this._attachControls(true);
      this._setWallMaterialMode(wallMaterial, '3d');
    } else {
      this._setupTopCamera();
      this._attachControls(false);
      this._setWallMaterialMode(wallMaterial, 'top');
    }

    if (onCameraChanged) onCameraChanged();
  }

  onResize(viewMode: '3d' | 'top'): void {
    if (!this.camera) return;
    const aspect = this._container.clientWidth / this._container.clientHeight;

    if (viewMode === '3d' && this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = aspect;
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = -this._config.viewSize * aspect;
      this.camera.right = this._config.viewSize * aspect;
      this.camera.top = this._config.viewSize;
      this.camera.bottom = -this._config.viewSize;
    }
    this.camera.updateProjectionMatrix();
    this._renderer.setSize(this._container.clientWidth, this._container.clientHeight);
  }

  private _setupTopCamera(): void {
    const aspect = this._container.clientWidth / this._container.clientHeight;
    this.camera = new THREE.OrthographicCamera(
      -this._config.viewSize * aspect,
      this._config.viewSize * aspect,
      this._config.viewSize,
      -this._config.viewSize,
      0.1,
      100
    );
    this.camera.position.set(0, this._config.cameraY, 0);
    this.camera.up.set(0, 0, 1);
    this._controlsTarget.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);
  }

  private _setup3DCamera(): void {
    const aspect = this._container.clientWidth / this._container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    // Open inside the room (raised corner looking across) — the ceiling and
    // wall exteriors hide the interior from any outside start position.
    this.camera.position.set(2.05, 2.45, 1.5);
    this._controlsTarget.set(0, 0.6, 0);
    this.camera.lookAt(this._controlsTarget);
  }

  private _attachControls(enableRotate: boolean): void {
    if (!this.camera) return;
    this.controls = new OrbitControls(this.camera, this._renderer.domElement);
    this.controls.enableRotate = enableRotate;
    if (!enableRotate) {
      this.controls.mouseButtons = {
        LEFT: null as unknown as THREE.MOUSE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      };
      this.controls.zoomToCursor = true;
    }
    this.controls.target.copy(this._controlsTarget);
    this.controls.update();
  }

  private _setWallMaterialMode(mat: THREE.Material | null | undefined, mode: '3d' | 'top'): void {
    if (!mat) return;
    if (mode === '3d') {
      mat.transparent = true;
      mat.opacity = 0.12;
      mat.depthWrite = false;
    } else {
      mat.transparent = false;
      mat.opacity = 1;
      mat.depthWrite = true;
    }
  }
}
