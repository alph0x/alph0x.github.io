/**
 * @fileoverview RoomBuilder — constructs floor, ceiling, walls, and grid for the editor preview.
 * Owns all geometry creation logic. Depends on Three.js but not on DOM or editor state.
 */

import * as THREE from 'three';
import { buildPolygonShape, hexToInt } from '../editor-utils.js';

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
  rebuild(outline, materials) {
    this._roomGroup.clear();
    this._wallMeshes = [];

    const shape = buildPolygonShape(outline);
    this._roomGroup.add(this._createFloor(shape, materials.floor));
    this._roomGroup.add(this._createCeiling(shape, materials.ceiling));
    this._updateGrid(outline);
    this._buildWalls(outline, materials.wall);
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
      new THREE.MeshStandardMaterial({ color: hexToInt(colorHex), roughness: 0.9 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.001;
    mesh.receiveShadow = true;
    return mesh;
  }

  _createCeiling(shape, colorHex) {
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshStandardMaterial({ color: hexToInt(colorHex), roughness: 0.9 })
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

  _buildWalls(outline, wallColorHex) {
    this._wallMaterial = new THREE.MeshStandardMaterial({ color: hexToInt(wallColorHex) });
    for (let i = 0; i < outline.length; i++) {
      const wallMesh = this._buildWallSegment(
        outline[i],
        outline[(i + 1) % outline.length],
        this._wallMaterial
      );
      if (wallMesh) {
        this._roomGroup.add(wallMesh);
        this._wallMeshes.push({ mesh: wallMesh, mid: wallMesh.position.clone() });
      }
    }
  }

  _buildWallSegment(p1, p2, material) {
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) return null;

    const midX = (p1[0] + p2[0]) / 2;
    const midZ = (p1[1] + p2[1]) / 2;
    const angle = Math.atan2(dx, dz);

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(this._config.wallT, this._config.wallH, len),
      material
    );
    mesh.position.set(midX, this._config.wallH / 2, midZ);
    mesh.rotation.y = angle;
    return mesh;
  }
}
