/**
 * @fileoverview Application entry point — wires renderer, game state, and Game orchestrator.
 *
 * SRP: This file only bootstraps. All logic lives in focused modules.
 */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createRenderer } from './renderer/index.js';
import { Game } from './game.js';
import { ROOM_LAYOUT, CFG } from './core.js';
import { createWorldState } from './domain/world-state.js';
import { TouchControls } from './systems/touch-controls.js';
import { applySeedFromUrl } from './seed.js';

import type { ControlsLike } from './core.js';

declare global {
  interface Window {
    showImmersiveFallback?: (error: unknown, source?: 'boot' | 'pointer-lock' | 'unknown') => void;
    clearImmersiveFallback?: () => void;
    retryImmersiveRoom?: () => void;
  }
}

export async function initGame(): Promise<Game> {
  const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  // ponytail: read ?seed= on boot and override ROOM_LAYOUT
  applySeedFromUrl(window.location.search, ROOM_LAYOUT);

  try {
    const { scene, camera, renderer } = createRenderer();

    const spawn = ROOM_LAYOUT.playerSpawn || [0, 0];
    camera.position.set(spawn[0], CFG.playerHeight, spawn[1]);

    const worldState = createWorldState({ playerSpawn: spawn, playerHeight: CFG.playerHeight });

    let controls: PointerLockControls | ControlsLike;
    let touchControls: TouchControls | null = null;

    if (isMobile) {
      // Dummy controls — no pointer lock on touch devices
      controls = { isLocked: false, lock: () => {}, unlock: () => {}, addEventListener: () => {}, removeEventListener: () => {} };
    } else {
      controls = new PointerLockControls(camera, document.body);
    }

    const game = new Game({ renderer, scene, camera, controls, worldState, touchControls });
    game.init();

    if (isMobile && touchControls === null) {
      touchControls = new TouchControls({ camera, worldState, onInteract: () => game.interact() });
      touchControls.init();
      game.touchControls = touchControls;
      const loading = document.getElementById('loading');
      const startScreen = document.getElementById('start-screen');
      if (loading) loading.style.display = 'none';
      if (startScreen) startScreen.style.display = 'none';
    }

    game.start();
    window.closePanels = () => game.closePanels();
    window.__game = game;
    window.__scene = scene;
    window.__camera = camera;
    return game;
  } catch (err) {
    window.showImmersiveFallback?.(err, 'boot');
    throw err;
  }
}

declare global {
  interface Window {
    closePanels: () => void;
    __game: Game;
    __scene: THREE.Scene;
    __camera: THREE.Camera;
  }
}
