/**
 * @fileoverview Room primitives — walls, floor, ceiling, sealed door.
 */

import * as THREE from 'three';
import { CFG } from '../core.js';
import { M } from '../assets/index.js';
import { makeBox, makePlane } from '../primitives.js';

export function addWallAt(x: number, y: number, z: number, w: number, d: number, h = CFG.wallH): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.wall!);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function addFloor(x: number, z: number, w: number, d: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.floor!);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0, z);
  mesh.receiveShadow = true;
  return mesh;
}

export function addCeiling(x: number, z: number, w: number, d: number): THREE.Mesh {
  // ponytail: use thin box instead of plane so both faces are visible from any angle
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), M.ceiling!);
  mesh.position.set(x, CFG.wallH - 0.01, z);
  mesh.receiveShadow = true;
  return mesh;
}

export function buildClosedDoor(x: number, z: number, rotY: number): THREE.Group {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = rotY;
  const mat = new THREE.MeshBasicMaterial({ color: 0x3a3a45 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.6 });
  group.add(makeBox(mat, [1.5, 0.15, 0.15], [0, 2.2, 0]));
  group.add(makeBox(mat, [0.15, 2.2, 0.15], [-0.7, 1.1, 0]));
  group.add(makeBox(mat, [0.15, 2.2, 0.15], [0.7, 1.1, 0]));
  group.add(makeBox(mat, [1.3, 2.1, 0.08], [0, 1.1, 0]));
  group.add(makeBox(glowMat, [0.18, 0.08, 0.02], [0.35, 1.0, 0.05]));
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 128, 32);
  ctx.fillStyle = '#ec4899'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.fillText('AFK', 64, 22);
  const tex = new THREE.CanvasTexture(c);
  group.add(makePlane(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.7 }), [0.18, 0.04], [0.35, 1.0, 0.06]));
  return group;
}
