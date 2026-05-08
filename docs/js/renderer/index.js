import { createSceneAndCamera } from './setup.js';
import { createWebGLRenderer } from './setup.js';

export function createRenderer() {
  const { scene, camera } = createSceneAndCamera();
  const renderer = createWebGLRenderer();
  return { scene, camera, renderer };
}
