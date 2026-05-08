import * as THREE from 'three';
import { M } from '../assets/index.js';
import { makeBox, makeLight } from '../primitives.js';

export function buildWindow(cfg) {
  const group = new THREE.Group();
  const winW = 1.8, winH = 1.2;
  const winMat = new THREE.MeshStandardMaterial({ color: 0x080810, flatShading: true, roughness: 1, metalness: 0 });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), winMat);
  win.position.set(...cfg.position); group.add(win);
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1e });
  group.add(makeBox(frameMat, [winW + 0.15, 0.08, 0.12], [cfg.position[0], cfg.position[1] + winH/2, cfg.position[2]]));
  group.add(makeBox(frameMat, [winW + 0.15, 0.08, 0.12], [cfg.position[0], cfg.position[1] - winH/2, cfg.position[2]]));
  group.add(makeBox(frameMat, [0.08, winH, 0.12], [cfg.position[0] - winW/2, cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [0.08, winH, 0.12], [cfg.position[0] + winW/2, cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [winW + 0.15, 0.03, 0.06], [cfg.position[0], cfg.position[1], cfg.position[2]]));
  group.add(makeBox(frameMat, [0.03, winH, 0.06], [cfg.position[0], cfg.position[1], cfg.position[2]]));

  const winSpot = new THREE.SpotLight(0x6688aa, 1.2, 8, Math.PI / 4, 0.6, 1);
  winSpot.position.set(cfg.position[0], cfg.position[1] + 0.5, cfg.position[2] + 0.3);
  winSpot.target.position.set(cfg.position[0], 0, cfg.position[2] + 3);
  winSpot.castShadow = true;
  winSpot.shadow.mapSize.width = 256;
  winSpot.shadow.mapSize.height = 256;
  group.add(winSpot);
  group.add(winSpot.target);
  return group;
}
