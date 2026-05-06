import * as THREE from 'three';
import { CFG } from '../core.js';

export function createSceneAndCamera() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x15151a);
  scene.fog = new THREE.FogExp2(0x15151a, 0.012);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, CFG.playerHeight, 0);

  return { scene, camera };
}

export function createWebGLRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x15151a);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(0.5);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);
  return renderer;
}
