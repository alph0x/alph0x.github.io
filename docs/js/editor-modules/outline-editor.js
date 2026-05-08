/**
 * @fileoverview OutlineEditor — visual handles for polygonal room outline.
 * Manages vertex spheres, edge cubes, line segments, and drag interactions.
 */

import * as THREE from 'three';

export class OutlineEditor {
  /**
   * @param {THREE.Group} outlineGroup — scene group for handles
   * @param {EditorState} state
   * @param {RoomBuilder} roomBuilder
   * @param {object} config — editor CONFIG object (colors + geometry)
   * @param {THREE.Camera} camera
   * @param {Function} snap — snap function
   * @param {Function} isSelfIntersecting — polygon validation
   * @param {Function} getClosestEdgePoint — edge projection utility
   */
  constructor(outlineGroup, state, roomBuilder, config, camera, snap, isSelfIntersecting, getClosestEdgePoint) {
    this._group = outlineGroup;
    this._state = state;
    this._roomBuilder = roomBuilder;
    this._config = config;
    this._getCamera = typeof camera === 'function' ? camera : () => camera;
    this._snap = snap;
    this._isSelfIntersecting = isSelfIntersecting;
    this._getClosestEdgePoint = getClosestEdgePoint;
  }

  /** Rebuild all visual handles from current outline. */
  rebuild() {
    this._group.clear();
    const outline = this._state.outline;

    this._group.add(this._createEdgeLines(outline));
    this._createEdgeHandles(outline).forEach((m) => this._group.add(m));
    this._createVertexHandles(outline).forEach((m) => this._group.add(m));

    this._group.visible = this._state.activeTool === 'outline';
    if (this._onRebuild) this._onRebuild();
  }

  /** Update visibility based on active tool. */
  syncVisibility() {
    this._group.visible = this._state.activeTool === 'outline';
  }

  /** Handle pointer down when in outline mode. Returns true if handled. */
  onPointerDown(e, intersectFloorFn) {
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
      const edge = this._getClosestEdgePoint(pt, this._state.outline);
      if (edge) this._addVertex(edge.index, [this._snap(edge.point[0]), this._snap(edge.point[1])]);
      return true;
    }
    return false;
  }

  /** Handle pointer move during outline drag. @param {THREE.Vector3} pt */
  onPointerMove(pt) {
    if (!pt) return;

    switch (this._state.dragTarget) {
      case 'edge':
        this._moveDragEdge(pt);
        break;
      case 'vertex':
        this._moveDragVertex(pt);
        break;
    }
  }

  /** Handle key delete when in outline mode. */
  onDeleteKey() {
    if (this._state.outline.length > 3) {
      this._state.outline.pop();
      this._roomBuilder.rebuild(this._state.outline, this._state.mat);
      this.rebuild();
    }
  }

  // ── Internal geometry builders ──────────────────────────────────

  _createEdgeLines(outline) {
    const points = [];
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

  _createEdgeHandles(outline) {
    const size = this._config.geometry.edgeHandleSize;
    const geo = new THREE.BoxGeometry(size, size, size);
    const axisParallelColor = 0x10b981; // green
    const nonParallelColor = this._config.colors.edgeHandle; // cyan default
    const meshes = [];
    for (let i = 0; i < outline.length; i++) {
      const p1 = outline[i];
      const p2 = outline[(i + 1) % outline.length];
      const isParallel = this._isAxisParallel(p1, p2);
      const mat = new THREE.MeshBasicMaterial({ color: isParallel ? axisParallelColor : nonParallelColor });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((p1[0] + p2[0]) / 2, 0.05, (p1[1] + p2[1]) / 2);
      mesh.userData = { isEdge: true, index: i, isAxisParallel: isParallel };
      meshes.push(mesh);
    }
    return meshes;
  }

  _createVertexHandles(outline) {
    const geo = new THREE.SphereGeometry(this._config.geometry.vertexRadius, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: this._config.colors.vertex });
    const meshes = [];
    for (let i = 0; i < outline.length; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.set(outline[i][0], 0.05, outline[i][1]);
      mesh.userData = { isVertex: true, index: i };
      meshes.push(mesh);
    }
    return meshes;
  }

  // ── Interaction helpers ─────────────────────────────────────────

  _intersectEdge(e) {
    const obj = this._intersectHandle(e);
    return obj?.userData.isEdge ? obj.userData.index : null;
  }

  _intersectVertex(e) {
    const obj = this._intersectHandle(e);
    return obj?.userData.isVertex ? obj.userData.index : null;
  }

  _intersectHandle(e) {
    const ndc = this._getNDC(e);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    const hits = this._state.raycaster.intersectObjects(this._group.children, true);
    for (const hit of hits) {
      if (hit.object.userData.isEdge || hit.object.userData.isVertex) return hit.object;
    }
    return null;
  }

  _getNDC(e) {
    const rect = e.target.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  _addVertex(edgeIndex, point) {
    this._state.outline.splice(edgeIndex + 1, 0, point);
    this._roomBuilder.rebuild(this._state.outline, this._state.mat);
    this.rebuild();
  }

  _updateVertex(index, x, z) {
    const newOutline = [...this._state.outline];
    newOutline[index] = [x, z];
    if (this._isSelfIntersecting(newOutline)) return;
    this._state.outline = newOutline;
    this._roomBuilder.rebuild(this._state.outline, this._state.mat);
    this.rebuild();
  }

  // ── Drag operations ─────────────────────────────────────────────

  _beginEdgeDrag(index, e) {
    this._state.isDragging = true;
    this._state.dragTarget = 'edge';
    this._state.dragEdgeIndex = index;
    const i = index;
    const j = (i + 1) % this._state.outline.length;
    this._state.dragEdgeVerts = [
      [this._state.outline[i][0], this._state.outline[i][1]],
      [this._state.outline[j][0], this._state.outline[j][1]],
    ];
    this.rebuild();
    this._highlightEdge(index);
  }

  _highlightEdge(index) {
    const edges = this._group.children.filter((c) => c.userData.isEdge);
    if (edges[index]) edges[index].material.color.setHex(this._config.colors.edgeHandleSelected);
  }

  /** Count how many edges are axis-parallel (horizontal or vertical). */
  countAxisParallel() {
    const edges = this._group.children.filter((c) => c.userData.isEdge);
    return edges.filter((e) => e.userData.isAxisParallel).length;
  }

  _isAxisParallel(p1, p2, epsilon = 0.01) {
    return Math.abs(p1[0] - p2[0]) < epsilon || Math.abs(p1[1] - p2[1]) < epsilon;
  }

  _beginVertexDrag(index) {
    this._state.isDragging = true;
    this._state.dragTarget = 'vertex';
    this._state.dragVertexIndex = index;
    this.rebuild();
    this._highlightVertex(index);
  }

  _highlightVertex(index) {
    const verts = this._group.children.filter((c) => c.userData.isVertex);
    if (verts[index]) verts[index].material.color.setHex(this._config.colors.vertexSelected);
  }

  _moveDragEdge(pt) {
    if (this._state.dragEdgeIndex === null || !this._state.dragEdgeVerts) return;
    const i = this._state.dragEdgeIndex;
    const j = (i + 1) % this._state.outline.length;
    let dx = pt.x - this._state.dragOffset.x;
    let dz = pt.z - this._state.dragOffset.z;

    // Axis-lock: horizontal edges move only in Z, vertical edges only in X
    const v0 = this._state.dragEdgeVerts[0];
    const v1 = this._state.dragEdgeVerts[1];
    const epsilon = 0.01;
    if (Math.abs(v0[0] - v1[0]) < epsilon) {
      // Vertical edge (same X) → lock to X-only movement
      dz = 0;
    } else if (Math.abs(v0[1] - v1[1]) < epsilon) {
      // Horizontal edge (same Z) → lock to Z-only movement
      dx = 0;
    }

    const newOutline = [...this._state.outline];
    newOutline[i] = [this._snap(this._state.dragEdgeVerts[0][0] + dx), this._snap(this._state.dragEdgeVerts[0][1] + dz)];
    newOutline[j] = [this._snap(this._state.dragEdgeVerts[1][0] + dx), this._snap(this._state.dragEdgeVerts[1][1] + dz)];
    if (this._isSelfIntersecting(newOutline)) return;
    this._state.outline = newOutline;
    this._roomBuilder.rebuild(this._state.outline, this._state.mat);
    this.rebuild();
    this._highlightEdge(i);
  }

  _moveDragVertex(pt) {
    if (this._state.dragVertexIndex === null) return;
    this._updateVertex(this._state.dragVertexIndex, this._snap(pt.x), this._snap(pt.z));
  }

  _intersectFloor(e) {
    const ndc = this._getNDC(e);
    this._state.raycaster.setFromCamera(ndc, this._getCamera());
    // Floor plane is not accessible here; caller should provide it.
    // This is a fallback that returns null.
    return null;
  }
}
