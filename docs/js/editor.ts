/**
 * @fileoverview Room Layout Editor entrypoint.
 * Pure bootstrap: imports the app, injects config, exposes debug API for tests.
 */

import * as THREE from 'three';
import './furniture/index.js';
import { EDITOR_CONFIG } from './editor-modules/editor-config.js';
import { EditorApp } from './editor-modules/editor-app.js';
import type { EditorState } from './editor-modules/state.js';
import type { FurnitureManager } from './editor-modules/furniture-manager.js';

const app = new EditorApp(EDITOR_CONFIG);
app.init();

// ── Debug API (kept for test compatibility) ─────────────────────

window.__editorState = app.state as EditorState;
window.__editorSelectItem = (id: number) => app.furnitureManager.select(id);
window.__editorProject = (x: number, z: number) => {
  if (!app.cameraSystem.camera) return { x: 0, y: 0 };
  const v = new THREE.Vector3(x, 0, z);
  v.project(app.cameraSystem.camera);
  const rect = app.renderer.domElement.getBoundingClientRect();
  return {
    x: ((v.x + 1) / 2) * rect.width + rect.left,
    y: ((-v.y + 1) / 2) * rect.height + rect.top,
  };
};
window.__furnitureManager = app.furnitureManager as FurnitureManager;
window.__scene = app.scene;
if (!app.cameraSystem.camera) throw new Error('Editor camera not initialized');
window.__camera = app.cameraSystem.camera;

declare global {
  interface Window {
    __editorState: EditorState;
    __editorSelectItem: (id: number) => void;
    __editorProject: (x: number, z: number) => { x: number; y: number };
    __furnitureManager: FurnitureManager;
    __scene: THREE.Scene;
    __camera: THREE.Camera;
  }
}
