/**
 * @fileoverview AlphGPT context — 1Hz snapshot of room state for the assistant.
 * Replaces the old window global; consumers import getAlphGPTContext().
 */

import type { WorldState } from '../domain/world-state.js';

import type { AlphGPTContext } from './alphgpt.js';

let current: AlphGPTContext | null = null;

export function getAlphGPTContext(): AlphGPTContext | undefined {
  return current ?? undefined;
}

export class AlphGPTContextProvider {
  private accum = 1;
  private furnitureNames: string[] | null = null;

  constructor(private worldState: WorldState) {}

  update(delta: number, tourActive: boolean): void {
    this.accum += delta;
    if (this.accum < 1) return;
    this.accum = 0;

    const { player, room, input } = this.worldState;
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay: AlphGPTContext['timeOfDay'] =
      hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    const luluNearby = Math.hypot(player.position.x - room.luluSpawn.x, player.position.z - room.luluSpawn.z) < 1.2;
    const isMoving =
      input.moveForward || input.moveBackward || input.moveLeft || input.moveRight || player.isMoving;

    if (!this.furnitureNames) {
      this.furnitureNames = room.interactables
        .filter((i) => i.type !== 'playerSpawn' && i.type !== 'luluSpawn')
        .map((i) => i.name || i.type);
    }

    current = {
      timeOfDay,
      localTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      furnitureNames: this.furnitureNames,
      luluNearby,
      isMoving,
      tourActive,
    };
  }
}
