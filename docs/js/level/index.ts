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
  scene.add(floor);

  const ceilingGeo = new THREE.ShapeGeometry(shape);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.ceiling), flatShading: true, roughness: 1, metalness: 0 });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

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

  // Walls using shared builder
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
    scene.add(edge.mesh);
  }

  return { edges };
}

export function buildLevel(scene: THREE.Scene, worldState: WorldState): void {
  buildPolygonRoom(scene, worldState);
  setupLighting(scene, worldState);

  // Furniture
  for (const f of ROOM_LAYOUT.furniture || []) {
    const entry = (FurnitureRegistry as any).get(f.type);
    if (!entry) continue;
    const result = entry.builder(f);
    const mesh = extractMeshFromResult(result);
    if (!mesh) continue;
    mesh.position.set(f.position[0], f.position[1], f.position[2]);
    mesh.rotation.y = f.rotation ?? 0;
    scene.add(mesh);
    worldState.room.interactables.push({ mesh, type: f.type, panelId: f.panelId });
  }

  // Pet
  const pet = new Pet(worldState.room.luluSpawn.x, worldState.room.luluSpawn.z);
  worldState.pet.model = pet;
  worldState.pet.mesh = pet.mesh;
  scene.add(pet.mesh);
}
