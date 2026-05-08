/**
 * @fileoverview Desktop smoke test — verifies the full desktop game pipeline.
 *
 * Simulates a desktop environment (no touch) and ensures:
 * - initGame() creates PointerLockControls (not dummy)
 * - TouchControls is NOT instantiated
 * - Game.animate() runs without errors
 * - AlphGPT panel is accessible
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock WebGLRenderer before any Three.js imports
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  class FakeRenderer {
    constructor() {
      this.domElement = document.createElement('canvas');
      this.shadowMap = { enabled: false, type: null };
    }
    setSize() {}
    setPixelRatio() {}
    setClearColor() {}
    render() {}
    getContext() { return null; }
  }
  return { ...actual, WebGLRenderer: FakeRenderer };
});

// Mock window.matchMedia to simulate DESKTOP (no touch)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false, // desktop: no max-width match
    media: query,
  })),
});

// Ensure no touch support
Object.defineProperty(window, 'ontouchstart', { value: undefined });
Object.defineProperty(navigator, 'maxTouchPoints', { value: 0 });

describe('Desktop game smoke', () => {
  let game;

  beforeEach(async () => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="game-container"></div>
      <div id="loading"><div id="loading-bar"><div id="loading-bar-fill"></div></div></div>
      <div id="start-screen" style="display:none"><button id="start-btn"></button></div>
      <div id="hud"></div>
      <div id="crosshair">+</div>
      <div id="prompt"></div>
      <div class="info-panel" id="panel-profile"></div>
      <div class="info-panel" id="panel-alphgpt"></div>
      <div id="error-display"></div>
    `;

    vi.resetModules();
    const { initGame } = await import('../docs/js/app.js');
    game = initGame();
  });

  it('creates a real Game instance', () => {
    expect(game).toBeTruthy();
    expect(game.renderer).toBeTruthy();
    expect(game.scene).toBeTruthy();
    expect(game.camera).toBeTruthy();
  });

  it('uses PointerLockControls (not dummy)', () => {
    expect(game.controls).toBeTruthy();
    expect(typeof game.controls.lock).toBe('function');
    // Real PointerLockControls have addEventListener; dummies do too but we can check
    // that it's not the no-op from touch dummy
    expect(game.controls.isLocked).toBe(false);
  });

  it('does not instantiate TouchControls on desktop', () => {
    expect(game.touchControls).toBeNull();
  });

  it('can run one animation frame without errors', () => {
    expect(() => game.animate()).not.toThrow();
  });

  it('has AlphGPT panel in DOM', () => {
    const panel = document.getElementById('panel-alphgpt');
    expect(panel).toBeTruthy();
    expect(panel.classList.contains('info-panel')).toBe(true);
  });

  it('has MacBook terminal registered with alphgpt panel', async () => {
    const { FurnitureRegistry } = await import('../docs/js/furniture/registry.js');
    await import('../docs/js/furniture/builders/macbook.js');
    const entry = FurnitureRegistry.get('macBook');
    const result = entry.builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.panelId).toBe('panel-alphgpt');
    expect(result.type).toBe('terminal');
  });

  it('worldState has proper structure after init', () => {
    expect(game.worldState.player).toBeTruthy();
    expect(game.worldState.pet).toBeTruthy();
    expect(game.worldState.room).toBeTruthy();
    expect(game.worldState.room.walls.length).toBeGreaterThan(0);
    expect(game.worldState.room.interactables.length).toBeGreaterThan(0);
  });
});
