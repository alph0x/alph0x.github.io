/**
 * @fileoverview Camera and viewport management for the Room Layout Editor.
 * Encapsulates top/3D camera switching, resize handling, and OrbitControls lifecycle.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class EditorCameraSystem {
  constructor(container, config, renderer) {
    this._container = container;
    this._config = config;
    this._renderer = renderer;
    this.camera = null;
    this.controls = null;
  }

  initializeTop() {
    this._setupTopCamera();
    this._attachControls(false);
  }

  setMode(mode, wallMaterial, onCameraChanged) {
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

  onResize(viewMode) {
    const aspect = this._container.clientWidth / this._container.clientHeight;

    if (viewMode === '3d') {
      this.camera.aspect = aspect;
    } else {
      this.camera.left = -this._config.viewSize * aspect;
      this.camera.right = this._config.viewSize * aspect;
      this.camera.top = this._config.viewSize;
      this.camera.bottom = -this._config.viewSize;
    }
    this.camera.updateProjectionMatrix();
    this._renderer.setSize(this._container.clientWidth, this._container.clientHeight);
  }

  _setupTopCamera() {
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
    this.camera.lookAt(0, 0, 0);
  }

  _setup3DCamera() {
    const aspect = this._container.clientWidth / this._container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.set(5, 4, 5);
    this.camera.lookAt(0, 1, 0);
  }

  _attachControls(enableRotate) {
    this.controls = new OrbitControls(this.camera, this._renderer.domElement);
    this.controls.enableRotate = enableRotate;
    if (!enableRotate) {
      this.controls.mouseButtons = {
        LEFT: null,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      };
      this.controls.zoomToCursor = true;
    }
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  _setWallMaterialMode(mat, mode) {
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
