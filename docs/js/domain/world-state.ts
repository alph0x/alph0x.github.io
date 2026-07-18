/**
 * @fileoverview World state factory — typed, structured game state.
 *
 * SRP: Creates the single source of truth for all game systems.
 *      Organised by domain concern so each system receives only what it needs.
 */

import type { Wall } from '../core.js';
import { Player } from './player.js';
import type { Pet } from './pet.js';

export type { Wall };

export interface Interactable {
  mesh: unknown;
  type: string;
  panelId?: string;
  name: string;
  label?: string;
}

export interface WorldState {
  player: Player;
  pet: {
    mesh: unknown;
    model: Pet | null;
  };
  room: {
    walls: Wall[];
    interactables: Interactable[];
    playerSpawn: { x: number; z: number };
    luluSpawn: { x: number; z: number };
  };
  input: {
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
  };
  ui: {
    isPanelOpen: boolean;
  };
}

export interface WorldStateConfig {
  playerSpawn: number[];
  playerHeight: number;
}

export function createWorldState({ playerSpawn, playerHeight }: WorldStateConfig): WorldState {
  return {
    player: new Player({ position: { x: playerSpawn[0], y: playerHeight, z: playerSpawn[1] } }),
    pet: { mesh: null, model: null },
    room: {
      walls: [],
      interactables: [],
      playerSpawn: { x: playerSpawn[0], z: playerSpawn[1] },
      luluSpawn: { x: playerSpawn[0], z: playerSpawn[1] },
    },
    input: {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
    },
    ui: {
      isPanelOpen: false,
    },
  };
}
