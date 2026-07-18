/**
 * @fileoverview OutlineEditor — visual handles for polygonal room outline.
 * Manages vertex spheres, edge cubes, line segments, and drag interactions.
 */

import * as THREE from 'three';
import { getClosestEdgePoint, getCurrentOpenings } from '../primitives.js';
import { isSelfIntersecting } from '../editor-utils.js';
import { pointerNDC } from '../systems/input-utils.js';
import { EditorState, type MatConfig } from './state.js';
import type { EDITOR_CONFIG } from './editor-config.js';

type OutlineEditorConfig = Pick<typeof EDITOR_CONFIG, 'colors' | 'geometry'>;

interface RoomBuilderLike {
  rebuild(outline: number[][], materials: MatConfig, openings?: unknown[]): void;
}

interface HandleUserData {
  isEdge?: boolean;
  isVertex?: boolean;
  index?: number;
  isAxisParallel?: boolean;
}

type CurrentOpeningsPlaced = Parameters<typeof getCurrentOpenings>[0];

// EditorState types dragTarget/dragEdgeVerts too narrowly for string/pair usage.
interface StateCompat extends Omit<EditorState, 'dragTarget' | 'dragEdgeVerts'> {
  dragTarget: string | null;
  dragEdgeVerts: [[number, number], [number, number]] | null;
}

export class OutlineEditor {
  private _group: THREE.Group;
  private _state: EditorState;
  private _roomBuilder: RoomBuilderLike;
  private _config: OutlineEditorConfig;
  private _getCamera: () => THREE.Camera;
  private _snap: (v: number) => number;
  private _onRebuild?: () => void;

  /**
   * @param outlineGroup — scene group for handles
   * @param state — editor state
   * @param roomBuilder — room builder exposing rebuild()
   * @param config — editor config (colors + geometry)
   * @param camera — camera or accessor returning camera
   * @param snap — snap function
   */
  constructor(
    outlineGroup: THREE.Group,
    state: EditorState,
    roomBuilder: RoomBuilderLike,
    config: OutlineEditorConfig,
    camera: THREE.Camera | (() => THREE.Camera),
    snap: (v: number) => number
  ) {
    this._group = outlineGroup;
    this._state = state;
    this._roomBuilder = roomBuilder;
    this._config = config;
    this._getCamera = typeof camera === 'function' ? camera : () => camera;
    this._snap = snap;
  }

  /** Rebuild all visual handles from current outline. */
  rebuild(): void {
    this._group.clear();
    const outline = this._state.outline;

    this._group.add(this._createEdgeLines(outline));
    this._createEdgeHandles(outline).forEach((m) => this._group.add(m));
    this._createVertexHandles(outline).forEach((m) => this._group.add(m));

    this._group.visible = this._state.activeTool === 'outline';
    if (this._onRebuild) this._onRebuild();
  }

  /** Update visibility based on active tool. */
  syncVisibility(): void {
    this._group.visible = this._state.activeTool === 'outline';
  }

  /** Handle pointer down when in outline mode. Returns true if handled. */
  onPointerDown(e: PointerEvent, intersectFloorFn: (e: PointerEvent) => THREE.Vector3 | null): boolean {
    const eIndex = this._intersectEdge(e);
    if (eIndex !== null) {
      const pt = intersectFloorFn(e);
      if (pt) this._state.dragOffset.set(pt.x, 0, pt.z);
      this._beginEdgeDrag(eIndex, e);
      return true;
    }
    const vIndex = this._intersectVertex(e);
    if (vIndex !== null) {
      this._beginVertexDrag(vIndex);
      return true;
    }
    const pt = intersectFloorFn(e);
    if (pt) {
      const edge = getClosestEdgePoint(pt, this._state.outline as [number, number][]);
      if (edge) {
        this._addVertex(edge.index, [this._snap(edge.point[0]), this._snap(edge.point[1])]);
        return true;
      }
    }
    return false;
  }

  /** Handle pointer move during outline drag. */
  onPointerMove(pt: THREE.Vector3): void {
    if (!pt) return;

    const s = this._state as unknown as StateCompat;
    switch (s.dragTarget) {
      case 'edge':
        this._moveDragEdge(pt);
        break;
      case 'vertex':
        this._moveDragVertex(pt);
        break;
    }
  }

  /** Handle key delete when in outline mode. */
  onDeleteKey(): void {
    if (this._state.outline.length > 3) {
      this._state.outline.pop();
      this._roomBuilder.rebuild(this._state.outline, this._state.mat, getCurrentOpenings(this._state.placed as unknown as CurrentOpeningsPlaced));
      this.rebuild();
    }
  }

  private _userData(obj: THREE.Object3D): HandleUserData {
    return obj.userData as HandleUserData;
  }

  // ── Internal geometry builders ──────────────────────────────────

  private _createEdgeLines(outline: number[][]): THREE.LineSegments {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < outline.length; i++) {
      const p1 = outline[i];
      const p2 = outline[(i + 1) % outline.length];
      points.push(new THREE.Vector3(p1[0], 0.02, p1[1]));
      points.push(new THREE.Vector3(p2[0], 0.02, p2[1]));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: this._config.colors.edgeLine,
      transparent: true,
      opacity: this._config.colors.outlineOpacity,
    });
    return new THREE.LineSegments(geo, mat);
  }

  private _createEdgeHandles(outline: number[][]): THREE.Mesh[] {
    const size = this._config.geometry.edgeHandleSize;
    const geo = new THREE.BoxGeometry(size, size, size);
    const axisParallelColor = 0x10b981; // green
    const nonParallelColor = this._config.colors.edgeHandle; // cyan default
    const meshes: THREE.Mesh[] = [];
    for (let i = 0; i < outline.length; i++) {
      const p1 = outline[i];
      const p2 = outline[(i + 1) % outline.length];
      const isParallel = this._isAxisParallel(p1, p2);
      const mat = new THREE.MeshBasicMaterial({ color: isParallel ? axisParallelColor : nonParallelColor });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((p1[0] + p2[0]) / 2, 0.05, (p1[1] + p2[1]) / 2);
      mesh.userData = { isEdge: true, index: i, isAxisParallel: isParallel } as HandleUserData;
      meshes.push(mesh);
    }
    return meshes;
  }

  private _createVertexHandles(outline: number[][]): THREE.Mesh[] {
    const geo = new THREE.SphereGeometry(this._config.geometry.vertexRadius, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: this._config.colors.vertex });
    const meshes: THREE.Mesh[] = [];
    for (let i = 0; i < outline.length; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.set(outline[i][0], 0.05, outline[i][1]);
      mesh.userData = { isVertex: true, index: i } as HandleUserData;
      meshes.push(mesh);
    }
    return meshes;
  }

  // ── Interaction helpers ─────────────────────────────────────────

  private _intersectEdge(e: PointerEvent): number | null {
    const obj = this._intersectHandle(e);
    return obj?.userData.isEdge ? (obj.userData.index as number) : null;
  }

  private _intersectVertex(e: PointerEvent): number | null {
    const obj = this._intersectHandle(e);
    return obj?.userData.isVertex ? (obj.userData.index as number) : null;
  }

  private _intersectHandle(e: PointerEvent): THREE.Object3D | null {
    const ndc = pointerNDC(e, e.target as HTMLElement);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    const hits = this._state.raycaster.intersectObjects(this._group.children, true);
    for (const hit of hits) {
      const data = hit.object.userData as HandleUserData;
      if (data.isEdge || data.isVertex) return hit.object;
    }
    return null;
  }

  private _addVertex(edgeIndex: number, point: number[]): void {
    this._state.outline.splice(edgeIndex + 1, 0, point);
    this._roomBuilder.rebuild(this._state.outline, this._state.mat, getCurrentOpenings(this._state.placed as unknown as CurrentOpeningsPlaced));
    this.rebuild();
  }

  private _updateVertex(index: number, x: number, z: number): void {
    const newOutline = [...this._state.outline];
    newOutline[index] = [x, z];
    if (isSelfIntersecting(newOutline as [number, number][])) return;
    this._state.outline = newOutline;
    this._roomBuilder.rebuild(this._state.outline, this._state.mat, getCurrentOpenings(this._state.placed as unknown as CurrentOpeningsPlaced));
    this.rebuild();
  }

  // ── Drag operations ─────────────────────────────────────────────

  private _beginEdgeDrag(index: number, e: PointerEvent): void {
    const s = this._state as unknown as StateCompat;
    s.isDragging = true;
    s.dragTarget = 'edge';
    s.dragEdgeIndex = index;
    const i = index;
    const j = (i + 1) % this._state.outline.length;
    s.dragEdgeVerts = [
      [this._state.outline[i][0], this._state.outline[i][1]],
      [this._state.outline[j][0], this._state.outline[j][1]],
    ];
    this.rebuild();
    this._highlightEdge(index);
  }

  private _highlightEdge(index: number): void {
    const edges = this._group.children.filter((c) => this._userData(c).isEdge);
    const edge = edges[index] as THREE.Mesh | undefined;
    if (edge) (edge.material as THREE.MeshBasicMaterial).color.setHex(this._config.colors.edgeHandleSelected);
  }

  /** Count how many edges are axis-parallel (horizontal or vertical). */
  countAxisParallel(): number {
    const edges = this._group.children.filter((c) => this._userData(c).isEdge);
    return edges.filter((e) => this._userData(e).isAxisParallel).length;
  }

  private _isAxisParallel(p1: number[], p2: number[], epsilon = 0.01): boolean {
    return Math.abs(p1[0] - p2[0]) < epsilon || Math.abs(p1[1] - p2[1]) < epsilon;
  }

  private _beginVertexDrag(index: number): void {
    const s = this._state as unknown as StateCompat;
    s.isDragging = true;
    s.dragTarget = 'vertex';
    s.dragVertexIndex = index;
    this.rebuild();
    this._highlightVertex(index);
  }

  private _highlightVertex(index: number): void {
    const verts = this._group.children.filter((c) => this._userData(c).isVertex);
    const vert = verts[index] as THREE.Mesh | undefined;
    if (vert) (vert.material as THREE.MeshBasicMaterial).color.setHex(this._config.colors.vertexSelected);
  }

  /** Update visual handle positions in-place without full rebuild. */
  private _updateVisualHandles(): void {
    const outline = this._state.outline;

    // Update line segments
    const lines = this._group.children.find((c) => c instanceof THREE.LineSegments);
    if (lines && lines.geometry.attributes.position) {
      const positions = lines.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < outline.length; i++) {
        const p1 = outline[i];
        const p2 = outline[(i + 1) % outline.length];
        positions[i * 6] = p1[0];
        positions[i * 6 + 1] = 0.02;
        positions[i * 6 + 2] = p1[1];
        positions[i * 6 + 3] = p2[0];
        positions[i * 6 + 4] = 0.02;
        positions[i * 6 + 5] = p2[1];
      }
      lines.geometry.attributes.position.needsUpdate = true;
    }

    // Update edge handles
    const edges = this._group.children.filter((c) => this._userData(c).isEdge);
    for (const edge of edges) {
      const idx = this._userData(edge).index as number;
      const p1 = outline[idx];
      const p2 = outline[(idx + 1) % outline.length];
      edge.position.set((p1[0] + p2[0]) / 2, 0.05, (p1[1] + p2[1]) / 2);
    }

    // Update vertex handles
    const verts = this._group.children.filter((c) => this._userData(c).isVertex);
    for (const vert of verts) {
      const idx = this._userData(vert).index as number;
      vert.position.set(outline[idx][0], 0.05, outline[idx][1]);
    }
  }

  /** Rebuild room geometry and handles. Call on drag end. */
  onDragEnd(): void {
    this._roomBuilder.rebuild(this._state.outline, this._state.mat, getCurrentOpenings(this._state.placed as unknown as CurrentOpeningsPlaced));
    this.rebuild();
  }

  private _moveDragEdge(pt: THREE.Vector3): void {
    const s = this._state as unknown as StateCompat;
    if (s.dragEdgeIndex === null || !s.dragEdgeVerts) return;
    const i = s.dragEdgeIndex;
    const j = (i + 1) % this._state.outline.length;
    let dx = pt.x - this._state.dragOffset.x;
    let dz = pt.z - this._state.dragOffset.z;

    // Axis-lock: horizontal edges move only in Z, vertical edges only in X
    const v0 = s.dragEdgeVerts[0];
    const v1 = s.dragEdgeVerts[1];
    const epsilon = 0.01;
    if (Math.abs(v0[0] - v1[0]) < epsilon) {
      // Vertical edge (same X) → lock to X-only movement
      dz = 0;
    } else if (Math.abs(v0[1] - v1[1]) < epsilon) {
      // Horizontal edge (same Z) → lock to Z-only movement
      dx = 0;
    }

    const newOutline = [...this._state.outline];
    newOutline[i] = [this._snap(v0[0] + dx), this._snap(v0[1] + dz)];
    newOutline[j] = [this._snap(v1[0] + dx), this._snap(v1[1] + dz)];
    if (isSelfIntersecting(newOutline as [number, number][])) return;
    this._state.outline = newOutline;
    this._updateVisualHandles();
    this._highlightEdge(i);
  }

  private _moveDragVertex(pt: THREE.Vector3): void {
    const s = this._state as unknown as StateCompat;
    if (s.dragVertexIndex === null) return;
    const idx = s.dragVertexIndex;
    const newOutline = [...this._state.outline];
    newOutline[idx] = [this._snap(pt.x), this._snap(pt.z)];
    if (isSelfIntersecting(newOutline as [number, number][])) return;
    this._state.outline = newOutline;
    this._updateVisualHandles();
    this._highlightVertex(idx);
  }
}
