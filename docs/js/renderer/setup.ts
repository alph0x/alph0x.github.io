import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { CFG } from '../core.js';

export function createSceneAndCamera(): { scene: THREE.Scene; camera: THREE.PerspectiveCamera } {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, CFG.playerHeight, 0);

  return { scene, camera };
}

export function createWebGLRenderer(): THREE.WebGLRenderer {
  // ponytail: quality based on device capability, not fixed low
  const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  const dpr = isMobile ? Math.min(window.devicePixelRatio, 2) : Math.min(window.devicePixelRatio, 2);
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: isMobile ? 'low-power' : 'high-performance' });
  renderer.setClearColor(0x1a1a2e);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

// Dusk HDRI → PMREM → scene.environment at low intensity so practicals dominate.
export function setupEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene, intensity = 0.3): void {
  new RGBELoader().load('/assets/env/dusk_1k.hdr', (tex) => {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(tex).texture;
    scene.environmentIntensity = intensity;
    tex.dispose();
    pmrem.dispose();
  });
}
