import { createSceneAndCamera } from './setup.js';
import { createWebGLRenderer } from './setup.js';
import { createComposer } from './post-processing.js';

export function createRenderer() {
  const { scene, camera } = createSceneAndCamera();
  const renderer = createWebGLRenderer();
  const composer = createComposer(renderer, scene, camera);
  return { scene, camera, renderer, composer };
}
