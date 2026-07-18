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
  calculateRoomDimensions,
  countAxisParallel,
  formatExportOutput,
} from '../editor-utils.js';
import { getCurrentOpenings } from '../primitives.js';
import { EditorState, type SeedLayout } from './state.js';
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
import type { SeedData, SerializeLayoutInput } from '../seed.js';
import type { PreviewConfig } from './preview-manager.js';
import type { EDITOR_CONFIG } from './editor-config.js';

type EditorColors = (typeof EDITOR_CONFIG)['colors'];
type EditorGeometry = (typeof EDITOR_CONFIG)['geometry'];

export interface EditorAppConfig {
  snap: number;
  wallH: number;
  wallT: number;
  viewSize: number;
  cameraY: number;
  preview: PreviewConfig;
  colors: EditorColors;
  geometry: EditorGeometry;
}

interface AppDomRefs {
  'canvas-wrap': HTMLElement;
  'preview-wrap': HTMLElement;
  palette: HTMLElement;
  placedList: HTMLElement;
  selectionInfo: HTMLElement;
  toolPlayer: HTMLElement;
  toolLulu: HTMLElement;
  toolOutline: HTMLElement;
  btnResetRect: HTMLElement;
  btnViewMode: HTMLElement;
  btnRotate: HTMLElement;
  btnDelete: HTMLElement;
  btnUndo: HTMLElement;
  btnRedo: HTMLElement;
  btnExport: HTMLElement;
  colorFloor: HTMLInputElement;
  colorFloorText: HTMLInputElement;
  colorWall: HTMLInputElement;
  colorWallText: HTMLInputElement;
  colorCeiling: HTMLInputElement;
  colorCeilingText: HTMLInputElement;
  exportOutput: HTMLElement;
  roomDimensions: HTMLElement;
  roomAxisAligned: HTMLElement;
  'error-display': HTMLElement;
  selX?: HTMLInputElement | null;
  selZ?: HTMLInputElement | null;
  selY?: HTMLInputElement | null;
  selYRange?: HTMLInputElement | null;
  selRot?: HTMLInputElement | null;
  selName?: HTMLInputElement | null;
  btnCopyLink?: HTMLElement | null;
  btnSaveSlot1?: HTMLElement | null;
  btnLoadSlot1?: HTMLElement | null;
  btnSaveSlot2?: HTMLElement | null;
  btnLoadSlot2?: HTMLElement | null;
  btnSaveSlot3?: HTMLElement | null;
  btnLoadSlot3?: HTMLElement | null;
  snapToggle?: HTMLInputElement | null;
  snapSize?: HTMLInputElement | null;
  [key: string]: HTMLElement | null | undefined;
}

interface ControlsLike {
  enabled: boolean;
}

type CurrentOpeningsPlaced = Parameters<typeof getCurrentOpenings>[0];

export class EditorApp {
  config: EditorAppConfig;
  state: EditorState;
  private _domRefs!: AppDomRefs;
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  private _sceneSetup!: EditorSceneSetup;
  cameraSystem!: EditorCameraSystem;
  roomBuilder!: RoomBuilder;
  furnitureManager!: FurnitureManager;
  outlineEditor!: OutlineEditor;
  previewManager!: PreviewManager;
  spawnManager!: SpawnManager;
  interactionManager!: InteractionManager;
  private errorHandler!: EditorErrorHandler;
  uiManager!: EditorUIManager;
  decorGroup!: THREE.Group;
  guideGroup!: THREE.Group;

  constructor(config: EditorAppConfig) {
    this.config = config;
    this.state = new EditorState();
  }

  init(): void {
    try {
      this._domRefs = getEditorDomRefs() as unknown as AppDomRefs;
      const container = this._domRefs['canvas-wrap'];

      this._setupRenderer(container);
      const { floorPlane, roomGroup, spawnGroup, outlineGroup, decorGroup } = this._setupScene();
      this.decorGroup = decorGroup;
      this._setupCamera(container);
      this._setupManagers(floorPlane, roomGroup, spawnGroup, outlineGroup);
      this._setupUI(outlineGroup);
      this._loadSnapSettings();
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

  private _setupRenderer(container: HTMLElement): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // ponytail: ensure container has size before setting renderer size
    const w = container.clientWidth || container.offsetWidth || 800;
    const h = container.clientHeight || container.offsetHeight || 600;
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
  }

  private _setupScene(): {
    floorPlane: THREE.Mesh;
    roomGroup: THREE.Group;
    spawnGroup: THREE.Group;
    outlineGroup: THREE.Group;
    decorGroup: THREE.Group;
  } {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0a09);
    this._sceneSetup = new EditorSceneSetup(this.scene);
    return this._sceneSetup.setup() as {
      floorPlane: THREE.Mesh;
      roomGroup: THREE.Group;
      spawnGroup: THREE.Group;
      outlineGroup: THREE.Group;
      decorGroup: THREE.Group;
    };
  }

  private _setupCamera(container: HTMLElement): void {
    this.cameraSystem = new EditorCameraSystem(container, this.config, this.renderer);
    this.cameraSystem.initializeTop();
  }

  private _setupManagers(
    floorPlane: THREE.Mesh,
    roomGroup: THREE.Group,
    spawnGroup: THREE.Group,
    outlineGroup: THREE.Group
  ): void {
    this.roomBuilder = new RoomBuilder(roomGroup, this.scene, {
      wallH: this.config.wallH,
      wallT: this.config.wallT,
    });
    this.roomBuilder.rebuild(
      this.state.outline,
      this.state.mat,
      getCurrentOpenings(this.state.placed as unknown as CurrentOpeningsPlaced)
    );

    const undoManager = new UndoManager();
    this.furnitureManager = new FurnitureManager(this.scene, this.state, this.config.wallH, undoManager);

    this.outlineEditor = new OutlineEditor(
      outlineGroup,
      this.state,
      this.roomBuilder,
      this.config,
      () => this.cameraSystem.camera as THREE.Camera,
      editorSnap
    );

    this.previewManager = new PreviewManager(this.config.preview, this._domRefs['preview-wrap']);
    this.previewManager.init();

    this.spawnManager = new SpawnManager(spawnGroup, this.state, this.config);
    this.spawnManager.rebuild();
    this.outlineEditor.rebuild();
  }

  private _setupUI(outlineGroup: THREE.Group): void {
    this.uiManager = new EditorUIManager({
      state: this.state,
      domRefs: this._domRefs,
      deps: {
        previewManager: this.previewManager,
        outlineGroup,
        furnitureManager: this.furnitureManager,
        getPaletteItems: () => {
          const items: { type: string; meta: Record<string, unknown> }[] = [];
          for (const [type, entry] of FurnitureRegistry.entries()) {
            const meta = entry.meta as unknown as Record<string, unknown>;
            items.push({ type, meta });
          }
          // Structural match for EditorUIManager's PaletteItem[]; meta is runtime-passthrough.
          return items as unknown as { type: string; meta: { category?: string; icon?: string; dimensions?: string } }[];
        },
        onColorChange: (key: string, value: string) => {
          const mat = this.state.mat as unknown as Record<string, string>;
          mat[key] = value;
          this._rebuildRoom();
        },
        onViewModeToggle: () => this._toggleViewMode(),
        onResetRect: () => this._resetRoom(),
        onExport: () => this.exportLayout(),
        onCopyLink: () => this._copyShareableLink(),
        onSaveSlot: (slot: number) => this._saveSlot(slot),
        onLoadSlot: (slot: number) => this._loadSlot(slot),
        onSnapToggle: (enabled: boolean) => this._setSnapEnabled(enabled),
        onSnapSize: (size: number) => this._setSnapSize(size),
      },
    });
    this.uiManager.bindAll();
    this.uiManager.buildPalette();
  }

  private _setupInteraction(floorPlane: THREE.Mesh): void {
    this.interactionManager = new InteractionManager({
      renderer: this.renderer,
      camera: () => this.cameraSystem.camera as THREE.Camera,
      state: this.state,
      floorPlane,
      furnitureManager: this.furnitureManager,
      outlineEditor: this.outlineEditor,
      spawnManager: this.spawnManager,
      roomBuilder: this.roomBuilder,
      config: this.config,
      snap: (v) => (this.state.snapEnabled ? editorSnap(v, this.state.snapSize) : v),
      controls: () => this.cameraSystem.controls as unknown as ControlsLike,
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

  private _setupEvents(): void {
    window.addEventListener('resize', () => this.cameraSystem.onResize(this.state.viewMode));
    // ponytail: ResizeObserver ensures canvas fills container even when CSS flex resolves late
    const container = this._domRefs['canvas-wrap'];
    if (container && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.renderer.setSize(width, height);
            this.cameraSystem.onResize(this.state.viewMode);
          }
        }
      });
      ro.observe(container);
    }
    this.errorHandler = new EditorErrorHandler();
    this.errorHandler.attach();
  }

  // ── Actions ───────────────────────────────────────────────────

  private _rebuildRoom(): void {
    this.roomBuilder.rebuild(
      this.state.outline,
      this.state.mat,
      getCurrentOpenings(this.state.placed as unknown as CurrentOpeningsPlaced)
    );
  }

  private _toggleViewMode(): void {
    const newMode = this.state.viewMode === '3d' ? 'top' : '3d';
    this.cameraSystem.setMode(newMode, this.roomBuilder.wallMaterial, () => {
      this._rebuildRoom();
    });
    this.state.viewMode = newMode;
    this.uiManager.setViewModeButton(newMode);
  }

  private _resetRoom(): void {
    this.state.outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    this._rebuildRoom();
    this.outlineEditor.rebuild();
    this._updateDimensions();
  }

  private _updateDimensions(): void {
    const outline = this.state.outline as [number, number][];
    const dims = calculateRoomDimensions(outline);
    this.uiManager.updateDimensions({
      width: dims.width,
      depth: dims.depth,
      totalEdges: dims.totalEdges,
      parallel: countAxisParallel(outline),
    });
  }

  private _updateGuidePosition(pt: THREE.Vector3): void {
    this.guideGroup.visible = true;
    for (const child of this.guideGroup.children) {
      const line = child as THREE.Line;
      const pos = line.geometry.attributes.position.array as Float32Array;
      if (pos[0] === pos[3]) {
        child.position.x = pt.x;
      } else {
        child.position.z = pt.z;
      }
    }
  }

  // ── Seed / Export ─────────────────────────────────────────────

  loadSeedIntoEditor(seedStr: string): void {
    try {
      this.furnitureManager.clearAll();
      const layout = deserializeSeed(seedStr);
      this.state.loadFromSeed(layout as unknown as SeedLayout);
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

  exportLayout(): void {
    const output = this._domRefs.exportOutput as HTMLInputElement | HTMLTextAreaElement;
    output.value = formatExportOutput(this._serializeCurrent());
  }

  private _serializeCurrent(): string {
    return serializeLayout({
      outline: this.state.outline,
      placed: this.state.placed,
      playerSpawn: this.state.playerSpawn,
      luluSpawn: this.state.luluSpawn,
      mat: this.state.mat,
    } as SerializeLayoutInput);
  }

  private _copyShareableLink(): void {
    const seed = this._serializeCurrent();
    const url = `${window.location.origin}${window.location.pathname}?seed=${encodeURIComponent(seed)}`;
    navigator.clipboard.writeText(url).catch(() => {
      // Ignore clipboard failures.
    });
    const output = this._domRefs.exportOutput as HTMLInputElement | HTMLTextAreaElement;
    output.value = `Link copied to clipboard!\n${url}`;
  }

  private _saveSlot(slot: string | number): void {
    const seed = this._serializeCurrent();
    localStorage.setItem(`editor-slot-${slot}`, seed);
    const output = this._domRefs.exportOutput as HTMLInputElement | HTMLTextAreaElement;
    output.value = `Saved to slot ${slot}`;
  }

  private _loadSlot(slot: string | number): void {
    const seed = localStorage.getItem(`editor-slot-${slot}`);
    if (seed) {
      this.loadSeedIntoEditor(seed);
      const output = this._domRefs.exportOutput as HTMLInputElement | HTMLTextAreaElement;
      output.value = `Loaded from slot ${slot}`;
    } else {
      const output = this._domRefs.exportOutput as HTMLInputElement | HTMLTextAreaElement;
      output.value = `Slot ${slot} is empty`;
    }
  }

  private _setSnapEnabled(enabled: boolean): void {
    this.state.snapEnabled = enabled;
    localStorage.setItem('editor-snap-enabled', String(enabled));
  }

  private _setSnapSize(size: number): void {
    this.state.snapSize = size;
    this.config.snap = size;
    localStorage.setItem('editor-snap-size', String(size));
  }

  private _loadSnapSettings(): void {
    const enabledRaw = localStorage.getItem('editor-snap-enabled');
    const sizeRaw = localStorage.getItem('editor-snap-size');
    if (enabledRaw !== null) {
      const enabled = enabledRaw === 'true';
      this.state.snapEnabled = enabled;
      if (this._domRefs.snapToggle) this._domRefs.snapToggle.checked = enabled;
    }
    if (sizeRaw !== null) {
      const size = parseFloat(sizeRaw);
      if (!isNaN(size) && size > 0) {
        this.state.snapSize = size;
        this.config.snap = size;
        if (this._domRefs.snapSize) this._domRefs.snapSize.value = String(size);
      }
    }
  }

  // ── Loop ──────────────────────────────────────────────────────

  private _startLoop(): void {
    this._animate();
  }

  private _animate(): void {
    requestAnimationFrame(() => this._animate());
    this.cameraSystem.controls?.update();
    if (this.state.viewMode === '3d') {
      this.roomBuilder.updateCulling(this.cameraSystem.camera as THREE.Camera, this.state.viewMode);
    }
    this.renderer.render(this.scene, this.cameraSystem.camera as THREE.Camera);
    this.previewManager.tick();
  }
}
