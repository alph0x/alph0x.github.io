/**
 * @fileoverview Default configuration for the Room Layout Editor.
 * Isolated so the orchestrator can receive it via dependency injection.
 */

import * as THREE from 'three';

export const EDITOR_CONFIG = {
  snap: 0.05,
  wallH: 2.8,
  wallT: 0.2,
  viewSize: 6,
  cameraY: 8,
  preview: {
    size: 160,
    targetMeshSize: 1.2,
    rotationSpeed: 0.015,
    cameraPos: new THREE.Vector3(1.5, 1.2, 1.5),
    lookAt: new THREE.Vector3(0, 0.3, 0),
  },
  colors: {
    vertex: 0x7c3aed,
    vertexSelected: 0xec4899,
    edgeHandle: 0x06b6d4,
    edgeHandleSelected: 0xec4899,
    edgeLine: 0x7c3aed,
    outlineOpacity: 0.5,
    playerSpawn: 0x10b981,
    luluSpawn: 0xf59e0b,
  },
  geometry: {
    vertexRadius: 0.08,
    edgeHandleSize: 0.14,
    spawnPlayerRadius: 0.12,
    spawnPlayerHeight: 0.25,
    spawnLuluRadius: 0.08,
    spawnLuluHeight: 0.12,
  },
};
