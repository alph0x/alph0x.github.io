import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) {
    shape.lineTo(outline[i][0], outline[i][1]);
  }
  shape.closePath();

  const floorGeo = new THREE.ShapeGeometry(shape);
  const floorMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.floor), flatShading: true, roughness: 1, metalness: 0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor as any);

  const ceilingGeo = new THREE.ShapeGeometry(shape);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.ceiling), flatShading: true, roughness: 1, metalness: 0 });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  ceiling.receiveShadow = true;
  scene.add(ceiling as any);

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

  const wallMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.wall), flatShading: true, roughness: 1, metalness: 0 });
  const edges = buildWallsFromOutline({
    outline,
    wallH,
    wallT,
    material: wallMat,
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
