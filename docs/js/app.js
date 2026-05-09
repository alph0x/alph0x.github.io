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

export function initGame() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  try {
    const { scene, camera, renderer } = createRenderer();

    // Spawn camera at playerSpawn from seed (fallback to center)
    const spawn = ROOM_LAYOUT.playerSpawn || [0, 0];
    camera.position.set(spawn[0], CFG.playerHeight, spawn[1]);

    const worldState = createWorldState({ playerSpawn: spawn, playerHeight: CFG.playerHeight });

    let controls;
    let touchControls = null;

    if (isMobile) {
      // Dummy controls — no pointer lock on touch devices
      controls = { isLocked: false, lock: () => {}, unlock: () => {}, addEventListener: () => {}, removeEventListener: () => {} };
    } else {
      controls = new PointerLockControls(camera, document.body);
    }

    const game = new Game({ renderer, scene, camera, controls, worldState, touchControls });
    game.init();

    if (isMobile) {
      touchControls = new TouchControls({ camera, worldState, onInteract: () => game.interact() });
      touchControls.init();
      game.touchControls = touchControls;
      document.getElementById('loading').style.display = 'none';
      document.getElementById('start-screen').style.display = 'none';
    }

    game.start();
    window.closePanels = () => game.closePanels();
    window.__game = game;
    window.__scene = scene;
    window.__camera = camera;
    return game;
  } catch (err) {
    document.getElementById('loading').style.display = 'none';
    const errDiv = document.getElementById('error-display');
    if (errDiv) {
      errDiv.style.display = 'block';
      errDiv.textContent += 'BOOT ERROR: ' + err.message + '\n' + (err.stack || '') + '\n';
    }
    console.error(err);
    throw err;
  }
}
