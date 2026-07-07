import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { texWall, texFloor, texCeiling, texMetal, texConcrete } from '../assets/textures.js';
import { makeBox, makeCylinder } from '../primitives.js';

import { CFG, ROOM_LAYOUT } from '../core.js';
import { FurnitureRegistry } from '../furniture/index.js';
import { setupLighting, applyTimeOfDay } from './lighting.js';
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

  // Floor — ShapeGeometry with world-space UVs so plank texture aligns across the room
  const floorTex = texFloor.clone();
  floorTex.wrapS = THREE.RepeatWrapping; floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(roomW / 2, roomD / 2);
  const floorGeo = new THREE.ShapeGeometry(shape);
  const posAttr = floorGeo.attributes.position;
  const uvAttr = floorGeo.attributes.uv;
  for (let i = 0; i < posAttr.count; i++) {
    const ux = (posAttr.getX(i) - minX) / roomW;
    const uy = (posAttr.getY(i) - minZ) / roomD;
    uvAttr.setXY(i, ux * floorTex.repeat.x, uy * floorTex.repeat.y);
  }
  floorGeo.attributes.uv.needsUpdate = true;
  const floorMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.floor), map: floorTex, flatShading: true, roughness: 1, metalness: 0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor as any);

  // Floor perimeter trim
  const trimColor = 0x292524;
  const floorTrimMat = new THREE.MeshStandardMaterial({ color: trimColor, flatShading: true, roughness: 0.9, metalness: 0 });
  for (let i = 0; i < outline.length; i++) {
    const p1 = outline[i];
    const p2 = outline[(i + 1) % outline.length];
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) continue;
    const midX = (p1[0] + p2[0]) / 2;
    const midZ = (p1[1] + p2[1]) / 2;
    const angle = Math.atan2(dx, dz);
    const trim = makeBox(floorTrimMat, [wallT + 0.04, 0.04, len + 0.04], [midX, 0.02, midZ]);
    trim.rotation.y = angle;
    scene.add(trim as any);
  }

  // Ceiling — thin box with tiled texture and a recessed grid overlay
  const ceilingTex = texCeiling.clone();
  ceilingTex.wrapS = THREE.RepeatWrapping; ceilingTex.wrapT = THREE.RepeatWrapping;
  ceilingTex.repeat.set(roomW / 2, roomD / 2);
  const ceilingGeo = new THREE.BoxGeometry(roomW + wallT, 0.02, roomD + wallT);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.ceiling), map: ceilingTex, flatShading: true, roughness: 1, metalness: 0 });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.position.y = wallH - 0.01;
  ceiling.receiveShadow = true;
  scene.add(ceiling as any);

  const gridMat = new THREE.MeshStandardMaterial({ color: 0x252525, flatShading: true, roughness: 0.95 });
  const tileW = 0.9;
  const tileD = 0.9;
  const cols = Math.max(1, Math.floor(roomW / tileW));
  const rows = Math.max(1, Math.floor(roomD / tileD));
  for (let c = 1; c < cols; c++) {
    const x = minX + c * tileW;
    scene.add(makeBox(gridMat, [0.02, 0.015, roomD + wallT], [x, wallH - 0.005, (minZ + maxZ) / 2]) as any);
  }
  for (let r = 1; r < rows; r++) {
    const z = minZ + r * tileD;
    scene.add(makeBox(gridMat, [roomW + wallT, 0.015, 0.02], [(minX + maxX) / 2, wallH - 0.005, z]) as any);
  }

  // Ceiling vent with slats (offset if a ceiling lamp already occupies the centre)
  const hasCeilingLamp = (ROOM_LAYOUT.furniture || []).some((f: any) => f.type === 'ceilingLamp');
  const ventX = (minX + maxX) / 2 + (hasCeilingLamp ? 0.6 : 0);
  const ventZ = (minZ + maxZ) / 2;
  const ventMat = new THREE.MeshStandardMaterial({ map: texMetal, color: 0x222226, flatShading: true, roughness: 0.6, metalness: 0.4 });
  const ventGroup = new THREE.Group();
  ventGroup.position.set(ventX, wallH - 0.03, ventZ);
  ventGroup.add(makeBox(ventMat, [0.5, 0.04, 0.5], [0, 0, 0]));
  for (let i = -2; i <= 2; i++) {
    ventGroup.add(makeBox(new THREE.MeshStandardMaterial({ color: 0x111114, flatShading: true }), [0.42, 0.01, 0.03], [0, -0.02, i * 0.09]));
  }
  scene.add(ventGroup as any);

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
  const preset = setupLighting(scene);


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
    const label = typeof result.label === 'string' ? result.label : undefined;
    worldState.room.interactables.push({ mesh: mesh as any, type: f.type, panelId: f.panelId, name: f.name ?? label ?? f.type });
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
  applyTimeOfDay(scene, preset);

  // Pet
  const ls = (ROOM_LAYOUT as any).luluSpawn || (ROOM_LAYOUT as any).ls || [0, 0];
  const luluPos = worldState.room.luluSpawn || { x: ls[0], z: ls[1] };
  const pet = new (Pet as any)({ position: { x: luluPos.x, y: 0, z: luluPos.z } });
  worldState.pet.model = pet;
  worldState.pet.mesh = petMesh || new THREE.Group();
  if (petMesh) scene.add(petMesh);
}
