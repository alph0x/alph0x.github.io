/**
 * @fileoverview Level builder — composes room, furniture, decorations, lighting.
 */

import * as THREE from 'three';
import { CFG, ROOM_LAYOUT } from '../core.js';
import { FurnitureRegistry } from '../furniture/index.js';
import { buildClosedDoor } from './room.js';
import { buildWindow } from './window.js';
import { buildCityscape } from './cityscape.js';
import { placeDecorations } from './decorations/index.js';
import { setupLighting } from './lighting.js';

function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

function buildPolygonRoom(scene, state) {
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
  const floorMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.floor), roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceilingGeo = new THREE.ShapeGeometry(shape);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.ceiling), roughness: 0.9 });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // Walls along each edge
  const wallMat = new THREE.MeshStandardMaterial({ color: hexToInt(mat.wall) });
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

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, len), wallMat);
    mesh.position.set(midX, wallH / 2, midZ);
    mesh.rotation.y = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Collision bounds from rotated box
    const box = new THREE.Box3().setFromObject(mesh);
    state.walls.push({
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z,
    });

    edges.push({ p1, p2, midX, midZ, angle, len, mesh });
  }

  // Find north-most edge (lowest z midpoint) for window
  // Find south-most edge (highest z midpoint) for door
  let northEdge = null, southEdge = null;
  let northZ = Infinity, southZ = -Infinity;
  for (const e of edges) {
    if (e.midZ < northZ) { northZ = e.midZ; northEdge = e; }
    if (e.midZ > southZ) { southZ = e.midZ; southEdge = e; }
  }

  // Window on north edge
  if (northEdge) {
    const winPos = [northEdge.midX, 1.5, northEdge.midZ];
    scene.add(buildWindow({ position: winPos }));
    scene.add(buildCityscape({ position: winPos }));
  }

  // Door on south edge
  if (southEdge) {
    const door = buildClosedDoor(southEdge.midX, southEdge.midZ, 0);
    door.rotation.y = southEdge.angle;
    scene.add(door);
    const doorBox = new THREE.Box3().setFromObject(door);
    state.walls.push({
      minX: doorBox.min.x,
      maxX: doorBox.max.x,
      minZ: doorBox.min.z,
      maxZ: doorBox.max.z,
    });
  }

  return { edges };
}

export function buildLevel(scene, state) {
  buildPolygonRoom(scene, state);

  for (const item of ROOM_LAYOUT.furniture) {
    const entry = FurnitureRegistry.get(item.type);
    if (!entry?.builder) { console.warn('Unknown furniture type:', item.type); continue; }
    const result = entry.builder(item);
    const results = Array.isArray(result) ? result : [result];
    for (const r of results) {
      let mesh = null;
      if (r && r.mesh) {
        scene.add(r.mesh);
        mesh = r.mesh;
        if (r.type === 'terminal') state.interactables.push(r);
      } else if (r && r.isGroup) {
        scene.add(r);
        mesh = r;
      } else if (r instanceof THREE.Mesh || r instanceof THREE.Group) {
        scene.add(r);
        mesh = r;
      }

      // Track pet for animation
      if (item.type === 'miniSchnauzer' && mesh) {
        state.pet = mesh;
      }

      // Collision: extract AABB from placed mesh
      const noCollisionTypes = new Set(['rug', 'ceilingLamp']);
      if (mesh && !item.noCollision && !noCollisionTypes.has(item.type)) {
        const box = new THREE.Box3().setFromObject(mesh);
        const sizeX = box.max.x - box.min.x;
        const sizeZ = box.max.z - box.min.z;
        // Only solid if it has meaningful footprint (exclude thin wall decorations)
        if (sizeX > 0.05 && sizeZ > 0.05) {
          state.walls.push({
            minX: box.min.x,
            maxX: box.max.x,
            minZ: box.min.z,
            maxZ: box.max.z,
          });
        }
      }
    }
  }

  placeDecorations(scene, state, ROOM_LAYOUT.decorations);
  setupLighting(scene);
}
