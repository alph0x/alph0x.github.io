/**
 * @fileoverview World state factory — typed, structured game state.
 *
 * SRP: Creates the single source of truth for all game systems.
 *      Organised by domain concern so each system receives only what it needs.
 */

import { Player } from './player.js';

/**
 * @param {Object} cfg
 * @param {number[]} cfg.playerSpawn — [x, z]
 * @param {number} cfg.playerHeight
 * @returns {WorldState}
 */
export function createWorldState({ playerSpawn, playerHeight }) {
  return {
    // Domain entities
    player: new Player({ position: { x: playerSpawn[0], y: playerHeight, z: playerSpawn[1] } }),
    pet: { mesh: null, model: null },

    // Room / world data
    room: {
      walls: [],
      interactables: [],
    },

    // Input state (mutable flags set by InputSystem)
    input: {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
    },

    // UI state
    ui: {
      isPanelOpen: false,
    },
  };
}
