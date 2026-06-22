import type * as THREE from 'three';
import { createSceneAndCamera, createWebGLRenderer } from './setup.js';

export function createRenderer(): {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
} {
  const { scene, camera } = createSceneAndCamera();
  const renderer = createWebGLRenderer();
  return { scene, camera, renderer };
}
