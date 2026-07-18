import type * as THREE from 'three';
import { createSceneAndCamera, createWebGLRenderer, setupEnvironment } from './setup.js';

export function createRenderer(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
} {
  const { scene, camera } = createSceneAndCamera();
  const renderer = createWebGLRenderer();
  setupEnvironment(renderer, scene);
  return { scene, camera, renderer };
}
