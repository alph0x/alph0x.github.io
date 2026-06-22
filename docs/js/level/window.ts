import * as THREE from 'three';
import { M } from '../assets/index.js';
import { makeBox, makeLight } from '../primitives.js';

export function buildWindow(cfg: { position: number[] }): THREE.Group {
  const [x, y, z] = cfg.position as [number, number, number];
  const group = new THREE.Group();
  const winW = 1.8, winH = 1.2;
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x88aacc, transparent: true, opacity: 0.25,
    flatShading: true, roughness: 0.1, metalness: 0.3,
    side: THREE.DoubleSide
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), winMat);
  win.position.set(x, y, z); group.add(win);
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1e });
  group.add(makeBox(frameMat, [winW + 0.15, 0.08, 0.12], [x, y + winH/2, z]));
  group.add(makeBox(frameMat, [winW + 0.15, 0.08, 0.12], [x, y - winH/2, z]));
  group.add(makeBox(frameMat, [0.08, winH, 0.12], [x - winW/2, y, z]));
  group.add(makeBox(frameMat, [0.08, winH, 0.12], [x + winW/2, y, z]));
  group.add(makeBox(frameMat, [winW + 0.15, 0.03, 0.06], [x, y, z]));
  group.add(makeBox(frameMat, [0.03, winH, 0.06], [x, y, z]));

  const winSpot = new THREE.SpotLight(0x6688aa, 1.2, 8, Math.PI / 4, 0.6, 1);
  winSpot.position.set(x, y + 0.5, z + 0.3);
  winSpot.target.position.set(x, 0, z + 3);
  winSpot.castShadow = true;
  winSpot.shadow.mapSize.width = 256;
  winSpot.shadow.mapSize.height = 256;
  group.add(winSpot);
  group.add(winSpot.target);
  return group;
}
