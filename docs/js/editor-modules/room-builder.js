/**
 * @fileoverview RoomBuilder — constructs floor, ceiling, walls, and grid for the editor preview.
 * Owns all geometry creation logic. Depends on Three.js but not on DOM or editor state.
 */

import * as THREE from 'three';
import { buildPolygonShape, hexToInt, getEdgeOpenings } from '../editor-utils.js';

export class RoomBuilder {
  /**
   * @param {THREE.Group} roomGroup — parent group for floor/ceiling/walls
   * @param {THREE.Scene} scene — scene to attach grid helper to
   * @param {object} config — { wallH, wallT }
   */
  constructor(roomGroup, scene, config) {
    this._roomGroup = roomGroup;
    this._scene = scene;
    this._config = config;
    this._wallMeshes = [];
    this._gridHelper = null;
  }

  /** Rebuild the entire room from an outline and material colors. */
  rebuild(outline, materials, openings = []) {
    this._roomGroup.clear();
    this._wallMeshes = [];

    const shape = buildPolygonShape(outline);
    this._roomGroup.add(this._createFloor(shape, materials.floor));
    this._roomGroup.add(this._createCeiling(shape, materials.ceiling));
    this._updateGrid(outline);
    this._buildWalls(outline, materials.wall, openings);
  }

  /** Update wall visibility based on camera distance (3D view culling). */
  updateCulling(camera, viewMode) {
    if (viewMode === '3d' && this._wallMeshes.length > 2 && camera) {
      const camPos = camera.position;
      for (const w of this._wallMeshes) {
        w.mesh.visible = true;
      }
      const sorted = [...this._wallMeshes].sort(
        (a, b) => a.mid.distanceToSquared(camPos) - b.mid.distanceToSquared(camPos)
      );
      sorted[0].mesh.visible = false;
      sorted[1].mesh.visible = false;
    } else if (this._wallMeshes.length > 0) {
      for (const w of this._wallMeshes) {
        w.mesh.visible = true;
      }
    }
  }

  /** @returns {THREE.MeshStandardMaterial|null} */
  get wallMaterial() {
    return this._wallMaterial || null;
  }

  // ── Private geometry builders ───────────────────────────────────

  _createFloor(shape, colorHex) {
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshStandardMaterial({ color: hexToInt(colorHex), flatShading: true, roughness: 1, metalness: 0 }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.001;
    mesh.receiveShadow = true;
    return mesh;
  }

  _createCeiling(shape, colorHex) {
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshStandardMaterial({ color: hexToInt(colorHex), flatShading: true, roughness: 1, metalness: 0 }),
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = this._config.wallH;
    return mesh;
  }

  _updateGrid(outline) {
    if (this._gridHelper) {
      this._scene.remove(this._gridHelper);
    }
    const xs = outline.map((v) => v[0]);
    const zs = outline.map((v) => v[1]);
    const maxDim = Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...zs) - Math.min(...zs)
    );
    this._gridHelper = new THREE.GridHelper(
      maxDim * 2,
      Math.round((maxDim * 2) / 0.5),
      0x292524,
      0x1c1917
    );
    this._gridHelper.position.y = 0.002;
    this._scene.add(this._gridHelper);
  }

  _buildWalls(outline, wallColorHex, openings) {
    this._wallMaterial = new THREE.MeshStandardMaterial({ color: hexToInt(wallColorHex), flatShading: true, roughness: 1, metalness: 0 });
    for (let i = 0; i < outline.length; i++) {
      const p1 = outline[i];
      const p2 = outline[(i + 1) % outline.length];
      const edgeOpenings = getEdgeOpenings(openings, p1, p2, this._config.wallT);
      const wallMesh = this._buildWallSegment(p1, p2, this._wallMaterial, edgeOpenings);
      if (wallMesh) {
        this._roomGroup.add(wallMesh);
        this._wallMeshes.push({ mesh: wallMesh, mid: wallMesh.position.clone() });
      }
    }
  }

  _buildWallSegment(p1, p2, material, edgeOpenings) {
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) return null;

    const midX = (p1[0] + p2[0]) / 2;
    const midZ = (p1[1] + p2[1]) / 2;
    const angle = Math.atan2(dx, dz);
    const wallH = this._config.wallH;
    const wallT = this._config.wallT;

    if (!edgeOpenings || edgeOpenings.length === 0) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(wallT, wallH, len),
        material
      );
      mesh.position.set(midX, wallH / 2, midZ);
      mesh.rotation.y = angle;
      return mesh;
    }

    const group = new THREE.Group();
    group.position.set(midX, 0, midZ);
    group.rotation.y = angle;

    // 2D subdivision: collect Z and Y cuts, then emit cells that are NOT inside any opening
    const zCuts = new Set([-len / 2, len / 2]);
    const yCuts = new Set([0, wallH]);
    for (const o of edgeOpenings) {
      const zLocal = o.t - len / 2;
      zCuts.add(zLocal - o.width / 2);
      zCuts.add(zLocal + o.width / 2);
      yCuts.add(o.bottom);
      yCuts.add(o.bottom + o.height);
    }
    const zArr = Array.from(zCuts).sort((a, b) => a - b);
    const yArr = Array.from(yCuts).sort((a, b) => a - b);

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
          const zLocal = o.t - len / 2;
          if (zMid >= zLocal - o.width / 2 && zMid <= zLocal + o.width / 2 &&
              yMid >= o.bottom && yMid <= o.bottom + o.height) {
            insideOpening = true;
            break;
          }
        }

        if (!insideOpening && z2 - z1 > 0.001 && y2 - y1 > 0.001) {
          const stub = new THREE.Mesh(
            new THREE.BoxGeometry(wallT, y2 - y1, z2 - z1),
            material
          );
          stub.position.set(0, (y1 + y2) / 2, (z1 + z2) / 2);
          group.add(stub);
        }
      }
    }

    return group;
  }
}
