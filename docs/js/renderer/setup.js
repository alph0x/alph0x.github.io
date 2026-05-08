import * as THREE from 'three';
import { CFG } from '../core.js';

export function createSceneAndCamera() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, CFG.playerHeight, 0);

  return { scene, camera };
}

export function createWebGLRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x1a1a2e);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(0.5);
  renderer.shadowMap.enabled = true;
  // PSX: hard shadows (BasicShadowMap) instead of soft PCF
  renderer.shadowMap.type = THREE.BasicShadowMap;
  // PSX: no HDR tone mapping — flat, limited colour range
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);
  return renderer;
}
