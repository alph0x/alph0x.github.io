import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { createPSXPass } from './psx-pass.js';

/** Target resolution for PSX look (1/3 of 1080p). */
const PSX_WIDTH = 640;
const PSX_HEIGHT = 360;

export function createComposer(renderer, scene, camera) {
  // Low-res render target with nearest-neighbour filtering for sharp pixelation
  const renderTarget = new THREE.WebGLRenderTarget(PSX_WIDTH, PSX_HEIGHT, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
  });

  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));

  const psxPass = createPSXPass();
  psxPass.renderToScreen = true;
  composer.addPass(psxPass);

  return composer;
}
