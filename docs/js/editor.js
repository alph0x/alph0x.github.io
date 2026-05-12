/**
 * @fileoverview Room Layout Editor entrypoint.
 * Pure bootstrap: imports the app, injects config, exposes debug API for tests.
 */

import * as THREE from 'three';
import './furniture/index.js';
import { EDITOR_CONFIG } from './editor-modules/editor-config.js';
import { EditorApp } from './editor-modules/editor-app.js';

const app = new EditorApp(EDITOR_CONFIG);
app.init();

// ── Debug API (kept for test compatibility) ─────────────────────

window.__editorState = app.state;
window.__editorSelectItem = (id) => app.furnitureManager.select(id);
window.__editorProject = (x, z) => {
  const v = new THREE.Vector3(x, 0, z);
  v.project(app.cameraSystem.camera);
  const rect = app.renderer.domElement.getBoundingClientRect();
  return {
    x: ((v.x + 1) / 2) * rect.width + rect.left,
    y: ((-v.y + 1) / 2) * rect.height + rect.top,
  };
};
window.__furnitureManager = app.furnitureManager;
window.__scene = app.scene;
window.__camera = app.cameraSystem.camera;
