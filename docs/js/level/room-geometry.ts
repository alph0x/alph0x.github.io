/**
 * @fileoverview Shared room geometry builder used by both game level and editor.
 * Extracts identical wall-building logic from level/index.ts and editor-modules/room-builder.js.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getEdgeOpenings } from '../editor-utils.js';

export interface WallOpening {
  x: number;
  z: number;
  width: number;
  height: number;
  bottom: number;
  t?: number;
}

export interface WallEdge {
  p1: [number, number];
  p2: [number, number];
  midX: number;
  midZ: number;
  angle: number;
  len: number;
  mesh: THREE.Group;
}

export interface BuildWallsOptions {
  outline: [number, number][];
  wallH: number;
  wallT: number;
  material: THREE.MeshStandardMaterial;
  openings?: WallOpening[];
  /** If provided, pushes collision boxes for stubs below this height. */
  collisionHeight?: number;
  /** If provided, pushes collision boxes into this array. */
  collisionWalls?: { minX: number; maxX: number; minZ: number; maxZ: number }[];
}

/** Compute world-space AABB ensuring ancestor matrices are up to date. */
function getWorldAABB(object: THREE.Object3D): THREE.Box3 {
  object.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(object);
}

/**
 * Build wall geometry along a polygon outline, cutting out openings.
 * Returns edge metadata and populates collisionWalls when requested.
 */
export function buildWallsFromOutline(options: BuildWallsOptions): WallEdge[] {
  const { outline, wallH, wallT, material, openings = [], collisionHeight, collisionWalls } = options;
  const edges: WallEdge[] = [];

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

    const group = new THREE.Group();
    group.position.set(midX, 0, midZ);
    group.rotation.y = angle;

    if (!edgeOpenings || edgeOpenings.length === 0) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, len), material);
      mesh.position.set(0, wallH / 2, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      if (collisionWalls) {
        const box = getWorldAABB(mesh);
        collisionWalls.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
      }

      edges.push({ p1, p2, midX, midZ, angle, len, mesh: group });
      continue;
    }

    // 2D subdivision: collect Z and Y cuts, emit cells NOT inside any opening
    const zCuts = new Set([-len / 2, len / 2]);
    const yCuts = new Set([0, wallH]);
    for (const o of edgeOpenings) {
      const zLocal = (o.t ?? 0) - len / 2;
      zCuts.add(zLocal - o.width / 2);
      zCuts.add(zLocal + o.width / 2);
      yCuts.add(o.bottom);
      yCuts.add(o.bottom + o.height);
    }
    const zArr = Array.from(zCuts).sort((a, b) => a - b);
    const yArr = Array.from(yCuts).sort((a, b) => a - b);

    const geometries: THREE.BufferGeometry[] = [];
    for (let zi = 0; zi < zArr.length - 1; zi++) {
      const z1 = zArr[zi];
      const z2 = zArr[zi + 1];
      const zMid = (z1 + z2) / 2;
      for (let yi = 0; yi < yArr.length - 1; yi++) {
        const y1 = yArr[yi];
        const y2 = yArr[yi + 1];
        const yMid = (y1 + y2) / 2;

        let insideOpening = false;
        for (const o of edgeOpenings) {
          const zLocal = (o.t ?? 0) - len / 2;
          if (zMid >= zLocal - o.width / 2 && zMid <= zLocal + o.width / 2 &&
              yMid >= o.bottom && yMid <= o.bottom + o.height) {
            insideOpening = true;
            break;
          }
        }

        if (!insideOpening && z2 - z1 > 0.001 && y2 - y1 > 0.001) {
          const geo = new THREE.BoxGeometry(wallT, y2 - y1, z2 - z1);
          geo.translate(0, (y1 + y2) / 2, (z1 + z2) / 2);
          geometries.push(geo);

          if (collisionWalls && collisionHeight !== undefined && y1 < collisionHeight) {
            const stub = new THREE.Mesh(geo.clone(), material);
            group.add(stub);
            const box = getWorldAABB(stub);
            group.remove(stub);
            stub.geometry.dispose();
            collisionWalls.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
          }
        }
      }
    }

    if (geometries.length > 0) {
      const mergedGeo = mergeGeometries(geometries)!;
      for (const g of geometries) g.dispose();
      const visualMesh = new THREE.Mesh(mergedGeo, material);
      visualMesh.castShadow = true;
      visualMesh.receiveShadow = true;
      group.add(visualMesh);
    }

    edges.push({ p1, p2, midX, midZ, angle, len, mesh: group });
  }

  return edges;
}
