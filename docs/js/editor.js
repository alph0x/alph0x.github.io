/**
 * @fileoverview Room Layout Editor — visual drag-and-drop level designer.
 * Supports polygonal rooms, stacking (Y height), material colors, and seed export.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FurnitureRegistry } from './furniture/registry.js';
import { CFG, DEFAULT_SEED } from './core.js';
import { serializeLayout, deserializeSeed } from './seed.js';
import './furniture/index.js';

import {
  snap as editorSnap,
  getClosestEdgePoint,
  isSelfIntersecting,
} from './editor-utils.js';
import { EditorState } from './editor-modules/state.js';
import { RoomBuilder } from './editor-modules/room-builder.js';
import { FurnitureManager } from './editor-modules/furniture-manager.js';
import { OutlineEditor } from './editor-modules/outline-editor.js';
import { PreviewManager } from './editor-modules/preview-manager.js';
import { SpawnManager } from './editor-modules/spawn-manager.js';
import { InteractionManager } from './editor-modules/interaction-manager.js';

/* error display */ {
  const show = (msg) => {
    const el = document.getElementById('error-display');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = String(msg);
  };
  window.addEventListener('error', (e) => show(`${e.message}  @${e.lineno}:${e.colno}`));
  window.addEventListener('unhandledrejection', (e) => show(`Unhandled rejection: ${e.reason}`));
}

// ── Configuration ───────────────────────────────────────────────

const CONFIG = {
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

// ── Editor State ────────────────────────────────────────────────

const state = new EditorState();

// ── Globals ─────────────────────────────────────────────────────

let scene, camera, renderer, controls, floorPlane;
let roomGroup, spawnGroup, outlineGroup, decorGroup, guideGroup;
let roomBuilder, furnitureManager, outlineEditor, previewManager, spawnManager, interactionManager;

// ── Init ────────────────────────────────────────────────────────

function init() {
  try {
    const container = document.getElementById('canvas-wrap');
    setupMainRenderer(container);
    setupScene();
    roomBuilder = new RoomBuilder(roomGroup, scene, { wallH: CONFIG.wallH, wallT: CONFIG.wallT });
    roomBuilder.rebuild(state.outline, state.mat);
    furnitureManager = new FurnitureManager(scene, state, CONFIG.wallH);
    outlineEditor = new OutlineEditor(
      outlineGroup, state, roomBuilder, CONFIG, () => camera,
      editorSnap, isSelfIntersecting, getClosestEdgePoint,
      () => updateRoomDimensions()
    );
    previewManager = new PreviewManager(CONFIG.preview, document.getElementById('preview-wrap'));
    previewManager.init();
    spawnManager = new SpawnManager(spawnGroup, state, CONFIG);
    spawnManager.rebuild();
    outlineEditor.rebuild();
    buildPaletteUI();
    bindUI();
    createGuideGroup();

    interactionManager = new InteractionManager({
      renderer, camera, state, floorPlane,
      furnitureManager, outlineEditor, spawnManager, roomBuilder,
      config: CONFIG,
      snap: (v) => editorSnap(v, CONFIG.snap),
      onSpawnPlaced: (type) => {
        document.getElementById(type === 'player' ? 'toolPlayer' : 'toolLulu').classList.remove('active');
      },
      onDragMove: (pt) => {
        guideGroup.visible = true;
        for (const child of guideGroup.children) {
          if (child.geometry.attributes.position.array[0] === child.geometry.attributes.position.array[3]) {
            // vertical line
            child.position.x = pt.x;
          } else {
            // horizontal line
            child.position.z = pt.z;
          }
        }
      },
      onDragEnd: () => {
        guideGroup.visible = false;
      },
    });
    interactionManager.attach();
    window.addEventListener('resize', onResize);
    updateRoomDimensions();

    loadSeedIntoEditor(DEFAULT_SEED);
    animate();
  } catch (e) {
    const el = document.getElementById('error-display');
    if (el) { el.style.display = 'block'; el.textContent = `init error: ${e.message}\n${e.stack}`; }
    console.error(e);
  }
}

function setupMainRenderer(container) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0a09);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  setupTopCamera(container);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false;
  controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
  controls.zoomToCursor = true;
}

function setupTopCamera(container) {
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.OrthographicCamera(
    -CONFIG.viewSize * aspect, CONFIG.viewSize * aspect,
    CONFIG.viewSize, -CONFIG.viewSize,
    0.1, 100
  );
  camera.position.set(0, CONFIG.cameraY, 0);
  camera.lookAt(0, 0, 0);
}

function setup3DCamera(container) {
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  camera.position.set(5, 4, 5);
  camera.lookAt(0, 1, 0);
}

function setCameraMode(mode) {
  state.viewMode = mode;
  const container = document.getElementById('canvas-wrap');

  if (mode === '3d') {
    setup3DCamera(container);
    controls.object = camera;
    controls.enableRotate = true;
    const mat = roomBuilder.wallMaterial;
    if (mat) {
      mat.transparent = true;
      mat.opacity = 0.12;
      mat.depthWrite = false;
    }
  } else {
    setupTopCamera(container);
    controls.object = camera;
    controls.enableRotate = false;
    const mat = roomBuilder.wallMaterial;
    if (mat) {
      mat.transparent = false;
      mat.opacity = 1;
      mat.depthWrite = true;
    }
  }
  controls.update();
  roomBuilder.rebuild(state.outline, state.mat);

  const btn = document.getElementById('btnViewMode');
  if (btn) {
    btn.textContent = mode === '3d' ? '⤒ Top View' : '↻ 3D View';
    btn.classList.toggle('active', mode === '3d');
  }
}

function setupScene() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.5);
  dir.position.set(5, 10, 5);
  scene.add(dir);

  floorPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  floorPlane.rotation.x = -Math.PI / 2;
  scene.add(floorPlane);

  roomGroup = new THREE.Group();
  scene.add(roomGroup);
  spawnGroup = new THREE.Group();
  scene.add(spawnGroup);
  outlineGroup = new THREE.Group();
  scene.add(outlineGroup);
  decorGroup = new THREE.Group();
  scene.add(decorGroup);
}

// ── Room Preview ────────────────────────────────────────────────

function buildEditorDecorations() {
  decorGroup.clear();
}

function createGuideGroup() {
  guideGroup = new THREE.Group();
  scene.add(guideGroup);
  const mat = new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.25 });
  const vGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.01, -50),
    new THREE.Vector3(0, 0.01, 50),
  ]);
  const hGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-50, 0.01, 0),
    new THREE.Vector3(50, 0.01, 0),
  ]);
  guideGroup.add(new THREE.Line(vGeo, mat));
  guideGroup.add(new THREE.Line(hGeo, mat));
  guideGroup.visible = false;
}

function updateRoomDimensions() {
  const outline = state.outline;
  const xs = outline.map((v) => v[0]);
  const zs = outline.map((v) => v[1]);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...zs) - Math.min(...zs);

  const dimEl = document.getElementById('roomDimensions');
  if (dimEl) dimEl.textContent = `${width.toFixed(2)} × ${depth.toFixed(2)} m`;

  const totalEdges = outline.length;
  const parallel = outlineEditor ? outlineEditor.countAxisParallel() : totalEdges;
  const axisEl = document.getElementById('roomAxisAligned');
  if (axisEl) {
    axisEl.textContent = `${parallel} / ${totalEdges} walls`;
    axisEl.style.color = parallel === totalEdges ? '#10b981' : '#f59e0b';
  }
}

// ── UI Bindings ─────────────────────────────────────────────────

function bindUI() {
  bindToolToggle('toolOutline', 'outline', () => {
    outlineGroup.visible = true;
  });

  document.getElementById('btnResetRect').addEventListener('click', () => {
    state.outline = [[-2.25, -1.75], [2.25, -1.75], [2.25, 1.75], [-2.25, 1.75]];
    roomBuilder.rebuild(state.outline, state.mat);
    outlineEditor.rebuild();
    updateRoomDimensions();
  });

  document.getElementById('btnViewMode').addEventListener('click', () => {
    setCameraMode(state.viewMode === '3d' ? 'top' : '3d');
  });

  bindColorInputs();
  bindToolToggle('toolPlayer', 'player');
  bindToolToggle('toolLulu', 'lulu');

  document.getElementById('btnRotate').addEventListener('click', () => furnitureManager.rotateSelected(45));
  document.getElementById('btnDelete').addEventListener('click', () => furnitureManager.deleteSelected());

  bindPositionControls();
  bindYControls();
  bindRotationControl();
  document.getElementById('btnUndo').addEventListener('click', () => furnitureManager.undo());
  document.getElementById('btnExport').addEventListener('click', exportLayout);
}

function bindToolToggle(btnId, toolName, onToggle) {
  const btn = document.getElementById(btnId);
  btn.addEventListener('click', () => {
    const wasActive = state.activeTool === toolName;
    deactivateAllTools();
    if (!wasActive) {
      state.activeTool = toolName;
      btn.classList.add('active');
      if (onToggle) onToggle();
    }
  });
}

function deactivateAllTools() {
  state.activeTool = null;
  document.querySelectorAll('.palette button').forEach((b) => b.classList.remove('active'));
  document.getElementById('toolPlayer').classList.remove('active');
  document.getElementById('toolLulu').classList.remove('active');
  document.getElementById('toolOutline').classList.remove('active');
  outlineGroup.visible = false;
  previewManager.clear();
}

function bindColorInputs() {
  function bindOne(id, textId, key) {
    const picker = document.getElementById(id);
    const text = document.getElementById(textId);
    picker.addEventListener('input', (e) => {
      state.mat[key] = e.target.value;
      text.value = e.target.value;
      roomBuilder.rebuild(state.outline, state.mat);
    });
    text.addEventListener('change', (e) => {
      state.mat[key] = e.target.value;
      picker.value = e.target.value;
      roomBuilder.rebuild(state.outline, state.mat);
    });
  }
  bindOne('colorFloor', 'colorFloorText', 'floor');
  bindOne('colorWall', 'colorWallText', 'wall');
  bindOne('colorCeiling', 'colorCeilingText', 'ceiling');
}

function bindPositionControls() {
  const xInput = document.getElementById('selX');
  const zInput = document.getElementById('selZ');
  if (xInput) xInput.addEventListener('change', (e) => furnitureManager.setX(e.target.value));
  if (zInput) zInput.addEventListener('change', (e) => furnitureManager.setZ(e.target.value));
}

function bindYControls() {
  const yNum = document.getElementById('selY');
  const yRange = document.getElementById('selYRange');
  function syncY(v) {
    furnitureManager.setY(v);
    yNum.value = v;
    yRange.value = v;
  }
  yNum.addEventListener('input', (e) => syncY(e.target.value));
  yRange.addEventListener('input', (e) => syncY(e.target.value));
}

function bindRotationControl() {
  const rotInput = document.getElementById('selRot');
  rotInput.addEventListener('change', (e) => furnitureManager.setRotation(e.target.value));
}

function buildPaletteUI() {
  const palette = document.getElementById('palette');
  palette.innerHTML = '';

  // Group by category
  const groups = new Map();
  for (const [type, entry] of FurnitureRegistry.entries()) {
    const cat = entry.meta?.category || 'other';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push({ type, meta: entry.meta || {} });
  }

  const catOrder = ['furniture', 'decor', 'lights', 'electronics', 'other'];
  for (const cat of catOrder) {
    if (!groups.has(cat)) continue;
    const items = groups.get(cat).sort((a, b) => a.type.localeCompare(b.type));

    const catDiv = document.createElement('div');
    catDiv.className = 'palette-category';
    catDiv.innerHTML = `<h3>${cat}</h3>`;

    const grid = document.createElement('div');
    grid.className = 'palette';

    for (const { type, meta } of items) {
      const btn = document.createElement('button');
      btn.innerHTML = `<span class="icon">${meta.icon || '📦'}</span><span>${type}</span>`;
      btn.title = meta.dimensions ? `${type} — ${meta.dimensions}` : type;
      btn.addEventListener('click', () => {
        const wasActive = state.activeTool === `place:${type}`;
        deactivateAllTools();
        if (!wasActive) {
          state.activeTool = `place:${type}`;
          btn.classList.add('active');
          previewManager.show(type);
        }
      });
      grid.appendChild(btn);
    }

    catDiv.appendChild(grid);
    palette.appendChild(catDiv);
  }
}

// ── Seed Loading ────────────────────────────────────────────────

function loadSeedIntoEditor(seedStr) {
  try {
    furnitureManager.clearAll();

    const layout = deserializeSeed(seedStr);
    state.loadFromSeed(layout);

    // Update color inputs
    document.getElementById('colorFloor').value = state.mat.floor;
    document.getElementById('colorFloorText').value = state.mat.floor;
    document.getElementById('colorWall').value = state.mat.wall;
    document.getElementById('colorWallText').value = state.mat.wall;
    document.getElementById('colorCeiling').value = state.mat.ceiling;
    document.getElementById('colorCeilingText').value = state.mat.ceiling;

    furnitureManager.loadFromSeed(layout);

    // Rebuild visuals
    roomBuilder.rebuild(state.outline, state.mat);
    spawnManager.rebuild();
    outlineEditor.rebuild();
    buildEditorDecorations();
  } catch (e) {
    const el = document.getElementById('error-display');
    if (el) { el.style.display = 'block'; el.textContent = `loadSeed error: ${e.message}\n${e.stack}`; }
    console.error(e);
  }
}

function exportLayout() {
  const seed = serializeLayout({
    outline: state.outline,
    placed: state.placed,
    playerSpawn: state.playerSpawn,
    luluSpawn: state.luluSpawn,
    decorations: [],
    mat: state.mat,
  });

  const output = [
    `// ── Seed (copy this into core.js as DEFAULT_SEED) ─────────────`,
    `export const DEFAULT_SEED = '${seed}';`,
    ``,
    `// ── Or load dynamically ────────────────────────────────────────`,
    `import { deserializeSeed } from './seed.js';`,
    `export const ROOM_LAYOUT = deserializeSeed(DEFAULT_SEED);`,
  ].join('\n');

  document.getElementById('exportOutput').value = output;
}

window.__editorSelectItem = (id) => {
  furnitureManager.select(id);
};

// ── Loop ────────────────────────────────────────────────────────

function onResize() {
  const container = document.getElementById('canvas-wrap');
  const aspect = container.clientWidth / container.clientHeight;

  if (state.viewMode === '3d') {
    camera.aspect = aspect;
  } else {
    camera.left = -CONFIG.viewSize * aspect;
    camera.right = CONFIG.viewSize * aspect;
    camera.top = CONFIG.viewSize;
    camera.bottom = -CONFIG.viewSize;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (state.viewMode === '3d') {
    roomBuilder.updateCulling(camera, state.viewMode);
  }
  renderer.render(scene, camera);
  previewManager.tick();
}

// Start
init();
