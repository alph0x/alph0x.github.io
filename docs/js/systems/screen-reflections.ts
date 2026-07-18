/**
 * @fileoverview Screen reflections — render-target passes for glossy screens.
 * Skipped entirely on low-end/touch devices; updates every N frames otherwise.
 */

import * as THREE from 'three';

interface ReflectTarget {
  mesh: THREE.Mesh;
  originalMat: THREE.Material;
  rt: THREE.WebGLRenderTarget;
}

const _normal = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _look = new THREE.Vector3();

export class ScreenReflections {
  lowEnd = false;
  frameInterval = 6;

  private targets: ReflectTarget[] = [];
  private frameCounter = 0;
  private reflectCam: THREE.PerspectiveCamera | null = null;

  constructor(
    private scene: THREE.Scene,
    private renderer: THREE.WebGLRenderer
  ) {}

  init(): void {
    const isLowEnd =
      window.matchMedia('(max-width: 768px)').matches ||
      ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    if (isLowEnd) {
      this.lowEnd = true;
      return;
    }

    this.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mat = obj.material;
      if (Array.isArray(mat) || !mat) return;
      if (!(mat instanceof THREE.MeshBasicMaterial)) return;
      if (!mat.map || !(mat.map instanceof THREE.CanvasTexture)) return;
      const rt = new THREE.WebGLRenderTarget(256, 256, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      });
      const rtMat = new THREE.MeshBasicMaterial({ map: rt.texture });
      this.targets.push({ mesh: obj, originalMat: mat, rt });
      obj.material = rtMat;
    });

    if (this.targets.length === 0) return;
    this.reflectCam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  }

  update(): void {
    if (this.lowEnd || this.targets.length === 0 || !this.reflectCam) return;
    this.frameCounter++;
    if (this.frameCounter % this.frameInterval !== 0) return;
    if (!this.renderer.setRenderTarget) return;

    const oldTarget = this.renderer.getRenderTarget ? this.renderer.getRenderTarget() : null;

    for (const target of this.targets) {
      target.mesh.getWorldPosition(_pos);
      target.mesh.getWorldQuaternion(_quat);
      _normal.set(0, 0, 1).applyQuaternion(_quat);
      this.reflectCam.position.copy(_pos).addScaledVector(_normal, 0.1);
      _look.copy(_pos).addScaledVector(_normal, 2);
      this.reflectCam.lookAt(_look);
      this.renderer.setRenderTarget(target.rt);
      this.renderer.render(this.scene, this.reflectCam);
    }

    this.renderer.setRenderTarget(oldTarget);
  }
}
