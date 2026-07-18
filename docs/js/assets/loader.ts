import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Load a GLB from a root-relative path. Returns the parsed scene group. */
export function loadGlb(path: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  const { promise, resolve, reject } = Promise.withResolvers<THREE.Group>();
  loader.load(path, (gltf) => resolve(gltf.scene), undefined, reject);
  return promise;
}

/** Test environments (webdriver) skip external model fetches. */
export function shouldLoadExternalModels(): boolean {
  return typeof navigator === 'undefined' || navigator.webdriver !== true;
}
