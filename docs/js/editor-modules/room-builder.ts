/**
 * @fileoverview RoomBuilder — constructs floor, ceiling, walls, and grid for the editor preview.
 * Owns all geometry creation logic. Depends on Three.js but not on DOM or editor state.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildPolygonShape } from '../primitives.js';
import { makeStd } from '../assets/materials.js';
import { buildWallsFromOutline, type WallOpening } from '../level/room-geometry.js';
import type { MatConfig } from './state.js';

interface RoomBuilderConfig {
  wallH: number;
  wallT: number;
}

interface WallEntry {
  mesh: THREE.Mesh | THREE.Group;
  mid: THREE.Vector3;
}

export class RoomBuilder {
  private readonly _roomGroup: THREE.Group;
  private readonly _scene: THREE.Scene;
  private readonly _config: RoomBuilderConfig;
  private _wallMeshes: WallEntry[] = [];
  private _gridHelper: THREE.GridHelper | null = null;
  private _wallMaterial: THREE.MeshStandardMaterial | undefined;

  constructor(roomGroup: THREE.Group, scene: THREE.Scene, config: RoomBuilderConfig) {
    this._roomGroup = roomGroup;
    this._scene = scene;
    this._config = config;
  }

  /** Rebuild the entire room from an outline and material colors. */
  rebuild(outline: number[][], materials: MatConfig, openings: WallOpening[] = []): void {
    this._roomGroup.clear();
    this._wallMeshes = [];

    const shape = buildPolygonShape(outline as [number, number][]);
    this._roomGroup.add(this._createFloor(shape, materials.floor));
    this._roomGroup.add(this._createCeiling(shape, materials.ceiling));
    this._updateGrid(outline);
    this._buildWalls(outline as [number, number][], materials.wall, openings);
  }

  /** Update wall visibility based on camera distance (3D view culling). */
  updateCulling(camera: THREE.Camera, viewMode: 'top' | '3d'): void {
    if (viewMode === '3d' && this._wallMeshes.length > 2 && camera) {
      const camPos = camera.position;
      for (const w of this._wallMeshes) {
        w.mesh.visible = true;
      }
      const sorted = [...this._wallMeshes].sort(
        (a, b) => a.mid.distanceToSquared(camPos) - b.mid.distanceToSquared(camPos)
      );
      let hidden = 0;
      for (const w of sorted) {
        if (hidden >= 2) break;
        // Don't hide walls with openings (Groups) because their furniture
        // (doors/windows) would float in mid-air.
        if (w.mesh.type === 'Mesh') {
          w.mesh.visible = false;
          hidden++;
        }
      }
    } else if (this._wallMeshes.length > 0) {
      for (const w of this._wallMeshes) {
        w.mesh.visible = true;
      }
    }
  }

  get wallMaterial(): THREE.MeshStandardMaterial | null {
    return this._wallMaterial ?? null;
  }

  // ── Private geometry builders ───────────────────────────────────

  private _createFloor(shape: THREE.Shape, colorHex: string): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      makeStd({ color: colorHex }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.001;
    mesh.receiveShadow = true;
    return mesh;
  }

  private _createCeiling(shape: THREE.Shape, colorHex: string): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      makeStd({ color: colorHex }),
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = this._config.wallH;
    return mesh;
  }

  private _updateGrid(outline: number[][]): void {
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

  private _buildWalls(outline: [number, number][], wallColorHex: string, openings: WallOpening[]): void {
    this._wallMaterial = makeStd({ color: wallColorHex });
    const edges = buildWallsFromOutline({
      outline,
      wallH: this._config.wallH,
      wallT: this._config.wallT,
      material: this._wallMaterial,
      openings,
    });
    for (const edge of edges) {
      this._roomGroup.add(edge.mesh);
      this._wallMeshes.push({ mesh: edge.mesh, mid: edge.mesh.position.clone() });
    }
  }

  private _buildWallSegment(
    _p1: [number, number],
    _p2: [number, number],
    _material: THREE.Material,
    _edgeOpenings: WallOpening[]
  ): null {
    // ponytail: inlined into shared buildWallsFromOutline
    return null;
  }
}
