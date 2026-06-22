/**
 * @fileoverview EditorApp — orchestrates all editor subsystems.
 * Clean Architecture: outer-layer entrypoint wires inner modules; this class
 * sits in the Interface Adapters layer, delegating to Use Cases (managers).
 */

import * as THREE from 'three';
import { FurnitureRegistry } from '../furniture/registry.js';
import { DEFAULT_SEED } from '../core.js';
import { serializeLayout, deserializeSeed } from '../seed.js';

import {
  snap as editorSnap,
  getClosestEdgePoint,
  isSelfIntersecting,
  getCurrentOpenings,
  calculateRoomDimensions,
  countAxisParallel,
  formatExportOutput,
} from '../editor-utils.js';
import { EditorState } from './state.js';
import { RoomBuilder } from './room-builder.js';
import { FurnitureManager } from './furniture-manager.js';
import { OutlineEditor } from './outline-editor.js';
import { PreviewManager } from './preview-manager.js';
import { SpawnManager } from './spawn-manager.js';
import { InteractionManager } from './interaction-manager.js';
import { UndoManager } from './undo-manager.js';
import { EditorCameraSystem } from './camera-system.js';
import { EditorSceneSetup } from './scene-setup.js';
import { EditorUIManager } from './ui-manager.js';
import { EditorErrorHandler } from './error-handler.js';
import { getEditorDomRefs } from './dom-refs.js';

export class EditorApp {
  constructor(config) {
    this.config = config;
    this.state = new EditorState();
  }

  init() {
    try {
      this._domRefs = getEditorDomRefs();
      const container = this._domRefs['canvas-wrap'];

      this._setupRenderer(container);
      const { floorPlane, roomGroup, spawnGroup, outlineGroup, decorGroup } = this._setupScene();
      this.decorGroup = decorGroup;
      this._setupCamera(container);
      this._setupManagers(floorPlane, roomGroup, spawnGroup, outlineGroup);
      this._setupUI(outlineGroup);
      this.guideGroup = this._sceneSetup.createGuideGroup();
      this._setupInteraction(floorPlane);
      this._setupEvents();
      this._updateDimensions();
      this.loadSeedIntoEditor(DEFAULT_SEED);
      this._startLoop();
    } catch (e) {
      if (this.errorHandler) this.errorHandler.showError(e);
      else console.error(e);
    }
  }

  // ── Setup stages ──────────────────────────────────────────────

  _setupRenderer(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0a09);
    this._sceneSetup = new EditorSceneSetup(this.scene);
    return this._sceneSetup.setup();
  }

  _setupCamera(container) {
    this.cameraSystem = new EditorCameraSystem(container, this.config, this.renderer);
    this.cameraSystem.initializeTop();
  }

  _setupManagers(floorPlane, roomGroup, spawnGroup, outlineGroup) {
    this.roomBuilder = new RoomBuilder(roomGroup, this.scene, {
      wallH: this.config.wallH,
      wallT: this.config.wallT,
    });
    this.roomBuilder.rebuild(this.state.outline, this.state.mat, getCurrentOpenings(this.state.placed));

    const undoManager = new UndoManager();
    this.furnitureManager = new FurnitureManager(this.scene, this.state, this.config.wallH, undoManager);

    this.outlineEditor = new OutlineEditor(
      outlineGroup, this.state, this.roomBuilder, this.config,
      () => this.cameraSystem.camera,
      editorSnap, isSelfIntersecting, getClosestEdgePoint
    );

    this.previewManager = new PreviewManager(this.config.preview, this._domRefs['preview-wrap']);
    this.previewManager.init();

    this.spawnManager = new SpawnManager(spawnGroup, this.state, this.config);
    this.spawnManager.rebuild();
    this.outlineEditor.rebuild();
  }

  _setupUI(outlineGroup) {
    this.uiManager = new EditorUIManager({
      state: this.state,
      domRefs: this._domRefs,
      deps: {
        previewManager: this.previewManager,
        outlineGroup,
        furnitureManager: this.furnitureManager,
        getPaletteItems: () => {
          const items = [];
          for (const [type, entry] of FurnitureRegistry.entries()) {
            items.push({ type, meta: entry.meta || {} });
          }
          return items;
        },
        onColorChange: (key, value) => {
          this.state.mat[key] = value;
          this._rebuildRoom();
        },
        onViewModeToggle: () => this._toggleViewMode(),
        onResetRect: () => this._resetRoom(),
        onExport: () => this.exportLayout(),
        onCopyLink: () => this._copyShareableLink(),
        onSaveSlot: (slot) => this._saveSlot(slot),
        onLoadSlot: (slot) => this._loadSlot(slot),
        onSnapToggle: (enabled) => this._setSnapEnabled(enabled),
        onSnapSize: (size) => this._setSnapSize(size),
      },
    });
    this.uiManager.bindAll();
    this.uiManager.buildPalette();
  }

  _setupInteraction(floorPlane) {
    this.interactionManager = new InteractionManager({
      renderer: this.renderer,
      camera: () => this.cameraSystem.camera,
      state: this.state,
      floorPlane,
      furnitureManager: this.furnitureManager,
      outlineEditor: this.outlineEditor,
      spawnManager: this.spawnManager,
      roomBuilder: this.roomBuilder,
      config: this.config,
      snap: (v) => editorSnap(v, this.config.snap),
      controls: () => this.cameraSystem.controls,
      onSpawnPlaced: (type) => {
        this._domRefs[type === 'player' ? 'toolPlayer' : 'toolLulu'].classList.remove('active');
      },
      onFurniturePlaced: () => this.uiManager.deactivateAllTools(),
      onDragMove: (pt) => this._updateGuidePosition(pt),
      onDragEnd: () => {
        this.guideGroup.visible = false;
      },
    });
    this.interactionManager.attach();
  }

  _setupEvents() {
    window.addEventListener('resize', () => this.cameraSystem.onResize(this.state.viewMode));
    this.errorHandler = new EditorErrorHandler();
    this.errorHandler.attach();
  }

  // ── Actions ───────────────────────────────────────────────────

  _rebuildRoom() {
    this.roomBuilder.rebuild(this.state.outline, this.state.mat, getCurrentOpenings(this.state.placed));
  }

  _toggleViewMode() {
    const newMode = this.state.viewMode === '3d' ? 'top' : '3d';
    this.cameraSystem.setMode(newMode, this.roomBuilder.wallMaterial, () => {
      this._rebuildRoom();
    });
    this.state.viewMode = newMode;
    this.uiManager.setViewModeButton(newMode);
  }

  _resetRoom() {
    this.state.outline = [[-2.25, -1.75], [2.25, -1.75], [2.25, 1.75], [-2.25, 1.75]];
    this._rebuildRoom();
    this.outlineEditor.rebuild();
    this._updateDimensions();
  }

  _updateDimensions() {
    const dims = calculateRoomDimensions(this.state.outline);
    this.uiManager.updateDimensions({
      width: dims.width,
      depth: dims.depth,
      totalEdges: dims.totalEdges,
      parallel: countAxisParallel(this.state.outline),
    });
  }

  _updateGuidePosition(pt) {
    this.guideGroup.visible = true;
    for (const child of this.guideGroup.children) {
      const pos = child.geometry.attributes.position.array;
      if (pos[0] === pos[3]) {
        child.position.x = pt.x;
      } else {
        child.position.z = pt.z;
      }
    }
  }

  // ── Seed / Export ─────────────────────────────────────────────

  loadSeedIntoEditor(seedStr) {
    try {
      this.furnitureManager.clearAll();
      const layout = deserializeSeed(seedStr);
      this.state.loadFromSeed(layout);
      this.uiManager.updateColorInputs(this.state.mat);
      this.furnitureManager.loadFromSeed(layout);
      this._rebuildRoom();
      this.spawnManager.rebuild();
      this.outlineEditor.rebuild();
      this.decorGroup.clear();
    } catch (e) {
      this.errorHandler.showError(e);
      console.error(e);
    }
  }

  exportLayout() {
    const seed = serializeLayout({
      outline: this.state.outline,
      placed: this.state.placed,
      playerSpawn: this.state.playerSpawn,
      luluSpawn: this.state.luluSpawn,
      mat: this.state.mat,
    });
    this._domRefs.exportOutput.value = formatExportOutput(seed);
  }

  _copyShareableLink() {
    const seed = serializeLayout({
      outline: this.state.outline,
      placed: this.state.placed,
      playerSpawn: this.state.playerSpawn,
      luluSpawn: this.state.luluSpawn,
      mat: this.state.mat,
    });
    const url = `${window.location.origin}${window.location.pathname}?seed=${encodeURIComponent(seed)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    this._domRefs.exportOutput.value = `Link copied to clipboard!\n${url}`;
  }

  _saveSlot(slot) {
    const seed = serializeLayout({
      outline: this.state.outline,
      placed: this.state.placed,
      playerSpawn: this.state.playerSpawn,
      luluSpawn: this.state.luluSpawn,
      mat: this.state.mat,
    });
    localStorage.setItem(`editor-slot-${slot}`, seed);
    this._domRefs.exportOutput.value = `Saved to slot ${slot}`;
  }

  _loadSlot(slot) {
    const seed = localStorage.getItem(`editor-slot-${slot}`);
    if (seed) {
      this.loadSeedIntoEditor(seed);
      this._domRefs.exportOutput.value = `Loaded from slot ${slot}`;
    } else {
      this._domRefs.exportOutput.value = `Slot ${slot} is empty`;
    }
  }

  _setSnapEnabled(enabled) {
    this.state.snapEnabled = enabled;
    localStorage.setItem('editor-snap-enabled', String(enabled));
  }

  _setSnapSize(size) {
    this.state.snapSize = size;
    localStorage.setItem('editor-snap-size', String(size));
  }

  // ── Loop ──────────────────────────────────────────────────────

  _startLoop() {
    this._animate();
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.cameraSystem.controls.update();
    if (this.state.viewMode === '3d') {
      this.roomBuilder.updateCulling(this.cameraSystem.camera, this.state.viewMode);
    }
    this.renderer.render(this.scene, this.cameraSystem.camera);
    this.previewManager.tick();
  }
}
