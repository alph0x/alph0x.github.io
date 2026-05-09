/**
 * @fileoverview Level builder — composes room, furniture, decorations, lighting.
 */

import * as THREE from 'three';
import { CFG, ROOM_LAYOUT } from '../core.js';
import { FurnitureRegistry } from '../furniture/index.js';
import { placeDecorations } from './decorations/index.js';
import { setupLighting } from './lighting.js';
import { Pet } from '../domain/pet.js';
import { getEdgeOpenings } from '../editor-utils.js';

function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

function buildPolygonRoom(scene, worldState) {
  const outline = ROOM_LAYOUT.outline;
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
    .filter((f) => f.type === 'door' || f.type === 'window')
    .map((f) => ({
      x: f.position[0],
      z: f.position[2],
      width: f.type === 'door' ? 1.6 : 2.0,
      height: f.type === 'door' ? 2.3 : 1.3,
      bottom: f.position[1],
    }));

  // Walls along each edge
  const wallMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.wall), flatShading: true, roughness: 1, metalness: 0 });
  const edges = [];
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

    const edgeOpenings = getEdgeOpenings(openings, p1, p2, wallT);

    if (!edgeOpenings || edgeOpenings.length === 0) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, len), wallMat);
      mesh.position.set(midX, wallH / 2, midZ);
      mesh.rotation.y = angle;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      worldState.room.walls.push({
        minX: box.min.x,
        maxX: box.max.x,
        minZ: box.min.z,
        maxZ: box.max.z,
      });

      edges.push({ p1, p2, midX, midZ, angle, len, mesh });
      continue;
    }

    const group = new THREE.Group();
    group.position.set(midX, 0, midZ);
    group.rotation.y = angle;
    scene.add(group);

    let currentZ = -len / 2;
    for (const o of edgeOpenings) {
      const zLocal = o.t - len / 2;
      const halfW = o.width / 2;
      const startZ = zLocal - halfW;

      // Stub before opening
      if (startZ - currentZ > 0.01) {
        const stubLen = startZ - currentZ;
        const stub = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, stubLen), wallMat);
        stub.position.set(0, wallH / 2, currentZ + stubLen / 2);
        stub.castShadow = true;
        stub.receiveShadow = true;
        group.add(stub);

        const box = new THREE.Box3().setFromObject(stub);
        worldState.room.walls.push({
          minX: box.min.x,
          maxX: box.max.x,
          minZ: box.min.z,
          maxZ: box.max.z,
        });
      }

      // Header above opening
      const top = o.bottom + o.height;
      if (top < wallH - 0.01) {
        const headerH = wallH - top;
        const header = new THREE.Mesh(new THREE.BoxGeometry(wallT, headerH, o.width), wallMat);
        header.position.set(0, top + headerH / 2, zLocal);
        header.castShadow = true;
        header.receiveShadow = true;
        group.add(header);

        const box = new THREE.Box3().setFromObject(header);
        worldState.room.walls.push({
          minX: box.min.x,
          maxX: box.max.x,
          minZ: box.min.z,
          maxZ: box.max.z,
        });
      }

      currentZ = zLocal + halfW;
    }

    // Final stub
    if (len / 2 - currentZ > 0.01) {
      const stubLen = len / 2 - currentZ;
      const stub = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, stubLen), wallMat);
      stub.position.set(0, wallH / 2, currentZ + stubLen / 2);
      stub.castShadow = true;
      stub.receiveShadow = true;
      group.add(stub);

      const box = new THREE.Box3().setFromObject(stub);
      worldState.room.walls.push({
        minX: box.min.x,
        maxX: box.max.x,
        minZ: box.min.z,
        maxZ: box.max.z,
      });
    }

    edges.push({ p1, p2, midX, midZ, angle, len, mesh: group });
  }

  return { edges };
}

export function buildLevel(scene, worldState) {
  buildPolygonRoom(scene, worldState);

  let petSpawned = false;

  for (const item of ROOM_LAYOUT.furniture) {
    const entry = FurnitureRegistry.get(item.type);
    if (!entry?.builder) { console.warn('Unknown furniture type:', item.type); continue; }
    const result = entry.builder(item);
    if (!result || !result.mesh) {
      console.warn('Builder returned invalid result for', item.type);
      continue;
    }

    scene.add(result.mesh);
    if (result.type === 'terminal') worldState.room.interactables.push(result);

    // Track pet for animation
    if (item.type === 'miniSchnauzer') {
      worldState.pet.mesh = result.mesh;
      worldState.pet.model = new Pet({
        position: { x: item.position[0], y: item.position[1], z: item.position[2] },
        rotation: item.rotation || 0,
      });
      petSpawned = true;
    }

    // Collision: extract AABB from placed mesh
    const noCollisionTypes = new Set(['rug', 'ceilingLamp', 'door', 'window']);
    if (!item.noCollision && !noCollisionTypes.has(item.type)) {
      const box = new THREE.Box3().setFromObject(result.mesh);
      const sizeX = box.max.x - box.min.x;
      const sizeZ = box.max.z - box.min.z;
      // Only solid if it has meaningful footprint (exclude thin wall decorations)
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

  // Fallback: spawn pet from dedicated luluSpawn if no furniture item was present
  if (!petSpawned && ROOM_LAYOUT.luluSpawn) {
    const entry = FurnitureRegistry.get('miniSchnauzer');
    if (entry?.builder) {
      const [lx, lz] = ROOM_LAYOUT.luluSpawn;
      const result = entry.builder({ position: [lx, 0, lz], rotation: 0 });
      if (result?.mesh) {
        scene.add(result.mesh);
        worldState.pet.mesh = result.mesh;
        worldState.pet.model = new Pet({
          position: { x: lx, y: 0, z: lz },
          rotation: 0,
        });
      }
    }
  }

  placeDecorations(scene, worldState, ROOM_LAYOUT.decorations);
  setupLighting(scene);
}
