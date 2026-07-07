import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Game } from '../docs/js/game.js';

function createWorldState() {
  return {
    player: {
      position: new THREE.Vector3(0, 1.6, 0),
      velocity: new THREE.Vector3(),
      height: 1.6,
      radius: 0.2,
      speed: 3,
      isMoving: false,
      onGround: true,
    },
    input: {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
    },
    room: {
      walls: [],
      interactables: [],
    },
    ui: {
      isPanelOpen: false,
    },
    lulu: {
      mesh: null,
      head: null,
      tail: null,
      state: 'idle',
      lastUpdate: 0,
    },
  };
}

function createMockRenderer() {
  return {
    domElement: document.createElement('canvas'),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    render: vi.fn(),
    setRenderTarget: vi.fn(),
    getRenderTarget: vi.fn(() => null),
    capabilities: { maxTextureSize: 4096 },
  };
}

describe('Screen reflections', () => {
  let scene;
  let screenMesh;
  let game;

  beforeEach(() => {
    scene = new THREE.Scene();
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    screenMesh.name = 'screen';
    scene.add(screenMesh);

    const renderer = createMockRenderer();
    const camera = new THREE.PerspectiveCamera();
    const controls = { isLocked: false, lock: vi.fn(), unlock: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const worldState = createWorldState();
    game = new Game({ renderer, scene, camera, controls, worldState, touchControls: null });
  });

  it('finds screen meshes and creates reflection targets', () => {
    game._initScreenReflections();
    expect(game._screenReflect.targets.length).toBe(1);
    expect(game._screenReflect.lowEnd).toBe(false);
    const target = game._screenReflect.targets[0];
    expect(target.mesh).toBe(screenMesh);
    expect(target.rt).toBeInstanceOf(THREE.WebGLRenderTarget);
    const newMat = screenMesh.material;
    expect(newMat.map).toBe(target.rt.texture);
  });

  it('updates reflections without crashing', () => {
    game._initScreenReflections();
    expect(() => game._updateScreenReflections()).not.toThrow();
  });

  it('skips rendering when low-end flag is set', () => {
    game._initScreenReflections();
    game._screenReflect.lowEnd = true;
    expect(() => game._updateScreenReflections()).not.toThrow();
  });
});
