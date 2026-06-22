import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { texWall, texFloor, texCeiling } from '../assets/textures.js';
import { makeBox } from '../primitives.js';

import { CFG, ROOM_LAYOUT } from '../core.js';
import { FurnitureRegistry } from '../furniture/index.js';
import { setupLighting } from './lighting.js';
import { Pet } from '../domain/pet.js';
import {
  extractMeshFromResult,
  calculateMeshOpeningDims,
} from '../editor-utils.js';
import { buildWallsFromOutline } from './room-geometry.js';
import type { WorldState } from '../domain/world-state.js';

function hexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function getWorldAABB(object: THREE.Object3D): THREE.Box3 {
  object.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(object);
}

function buildPolygonRoom(scene: THREE.Scene, worldState: WorldState): { edges: unknown[] } {
  const outline = ROOM_LAYOUT.outline as [number, number][];
  const wallH = CFG.wallH;
  const wallT = ROOM_LAYOUT.wallThickness || 0.2;
  const mat = ROOM_LAYOUT.mat || { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' };

  // Floor & Ceiling via ShapeGeometry
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of outline) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const roomW = Math.max(0.01, maxX - minX);
  const roomD = Math.max(0.01, maxZ - minZ);
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) {
    shape.lineTo(outline[i][0], outline[i][1]);
  }
  shape.closePath();

  const floorTex = texFloor.clone();
  floorTex.wrapS = THREE.RepeatWrapping; floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(roomW / 2, roomD / 2);
  const floorGeo = new THREE.ShapeGeometry(shape);
  const floorMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.floor), map: floorTex, flatShading: true, roughness: 1, metalness: 0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor as any);

  const ceilingTex = texCeiling.clone();
  ceilingTex.wrapS = THREE.RepeatWrapping; ceilingTex.wrapT = THREE.RepeatWrapping;
  ceilingTex.repeat.set(roomW / 2, roomD / 2);
  const ceilingGeo = new THREE.ShapeGeometry(shape);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.ceiling), map: ceilingTex, flatShading: true, roughness: 1, metalness: 0 });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  ceiling.receiveShadow = true;
  scene.add(ceiling as any);

  // Simple ceiling vent (offset if a ceiling lamp already occupies the centre)
  const hasCeilingLamp = (ROOM_LAYOUT.furniture || []).some((f: any) => f.type === 'ceilingLamp');
  const ventX = (minX + maxX) / 2 + (hasCeilingLamp ? 0.6 : 0);
  const ventZ = (minZ + maxZ) / 2;
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x1f1f23, flatShading: true, roughness: 0.9, metalness: 0 });
  const vent = makeBox(ventMat, [0.5, 0.05, 0.5], [ventX, wallH - 0.025, ventZ]);
  scene.add(vent as any);

  // Collect openings from furniture layout
  const openings = (ROOM_LAYOUT.furniture || [])
    .filter((f: any) => f.type === 'door' || f.type === 'window')
    .map((f: any) => {
      const entry = (FurnitureRegistry as any).get(f.type);
      const mesh = extractMeshFromResult(entry.builder(f));
      const dims = calculateMeshOpeningDims(mesh!);
      return {
        x: f.position[0],
        z: f.position[2],
        width: (dims as any).width,
        height: (dims as any).height,
        bottom: (dims as any).bottom,
        t: f.position[1] === 0 ? undefined : f.position[1],
      };
    });

  const wallTex = texWall.clone();
  wallTex.wrapS = THREE.RepeatWrapping; wallTex.wrapT = THREE.RepeatWrapping;
  const wallMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.wall), map: wallTex, flatShading: true, roughness: 1, metalness: 0 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x292524, flatShading: true, roughness: 0.9, metalness: 0 });
  const edges = buildWallsFromOutline({
    outline,
    wallH,
    wallT,
    material: wallMat,
    trimMaterial: trimMat,
    openings,
    collisionHeight: 2.0,
    collisionWalls: worldState.room.walls,
  });

  for (const edge of edges) {
    scene.add(edge.mesh as any);
  }

  return { edges };
}

export function buildLevel(scene: THREE.Scene, worldState: WorldState): void {
  (buildPolygonRoom as any)(scene, worldState);
  (setupLighting as any)(scene, worldState);

  // Furniture
  let petMesh: THREE.Group | null = null;
  const noCollisionTypes = new Set(['rug', 'ceilingLamp', 'door', 'window']);
  for (const f of ROOM_LAYOUT.furniture || []) {
    const entry = (FurnitureRegistry as any).get(f.type);
    if (!entry) continue;
    const result = entry.builder(f);
    const mesh = extractMeshFromResult(result);
    if (!mesh) continue;
    (mesh as any).position.set(f.position[0], f.position[1], f.position[2] as any);
    (mesh as any).rotation.y = f.rotation ?? 0;
    scene.add(mesh as any);
    worldState.room.interactables.push({ mesh: mesh as any, type: f.type, panelId: f.panelId });
    if (f.type === 'miniSchnauzer') petMesh = mesh as THREE.Group;

    // Collision: extract AABB from placed mesh
    if (!f.noCollision && !noCollisionTypes.has(f.type)) {
      const box = getWorldAABB(mesh as any);
      const sizeX = box.max.x - box.min.x;
      const sizeZ = box.max.z - box.min.z;
      if (sizeX > 0.05 && sizeZ > 0.05) {
        worldState.room.walls.push({
          minX: box.min.x,
          maxX: box.max.x,
          minZ: box.min.z,
          maxZ: box.max.z,
        });
      }
    }
  }

  // Pet
  const ls = (ROOM_LAYOUT as any).luluSpawn || (ROOM_LAYOUT as any).ls || [0, 0];
  const luluPos = worldState.room.luluSpawn || { x: ls[0], z: ls[1] };
  const pet = new (Pet as any)({ position: { x: luluPos.x, y: 0, z: luluPos.z } });
  worldState.pet.model = pet;
  worldState.pet.mesh = petMesh || new THREE.Group();
  if (petMesh) scene.add(petMesh);
}
