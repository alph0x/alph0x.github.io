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

export function initGame() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  if (isMobile) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
    return null;
  }

  const { scene, camera, renderer, composer } = createRenderer();
  const controls = new PointerLockControls(camera, document.body);

  // Spawn camera at playerSpawn from seed (fallback to center)
  const spawn = ROOM_LAYOUT.playerSpawn || [0, 0];
  camera.position.set(spawn[0], CFG.playerHeight, spawn[1]);

  const state = {
    moveForward: false, moveBackward: false, moveLeft: false, moveRight: false,
    velocity: new THREE.Vector3(), direction: new THREE.Vector3(),
    prevTime: performance.now(), walls: [], interactables: [], implants: [], particles: [],
    isPanelOpen: false, currentRoom: 'HUB',
  };

  const game = new Game({ renderer, scene, camera, controls, state, composer });
  game.init();
  game.start();
  window.closePanels = () => game.closePanels();
  return game;
}
