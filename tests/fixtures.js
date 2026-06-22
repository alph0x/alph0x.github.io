/**
 * @fileoverview Test fixtures — decoupled from DEFAULT_SEED so tests remain
 * stable even when the runtime layout changes.
 */

import { serializeLayout } from '../docs/js/seed.js';

export const MOCK_OUTLINE = [
  [-2.25, -1.75],
  [2.25, -1.75],
  [2.25, 1.75],
  [-2.25, 1.75],
];

export const MOCK_PLACED = [
  { type: 'bed', config: { position: [-1.1, 0, -0.95], rotation: 6.283 } },
  { type: 'nightstand', config: { position: [-1.85, 0, 0.05] } },
  { type: 'desk', config: { position: [1.2, 0, -1.15], rotation: 6.284 } },
  { type: 'macBook', config: { position: [1.05, 0.82, -1.4], rotation: 6.545 } },
  { type: 'tv', config: { position: [1.35, 1.4, 1.65], rotation: 3.142 } },
  { type: 'miniSchnauzer', config: { position: [-0.7, 0.89, -0.9], rotation: 5.34 } },
  { type: 'rug', config: { position: [0.5, 0.01, 0.5] } },
  { type: 'poster', config: { position: [-2.15, 1.6, -0.7], text: 'GAME\\nON', color: 0x7c3aed } },
  { type: 'poster', config: { position: [2.15, 1.6, -0.5], text: 'GG\\nWP', color: 0xec4899 } },
  { type: 'fairyLights', config: { position: [1.3, 2.2, -0.8] } },
  { type: 'ceilingLamp', config: { position: [0, 2.7, 0], color: 0xf5f5f4, intensity: 2.0, distance: 8 } },
  { type: 'ceilingLamp', config: { position: [1.3, 2.7, -0.7], color: 0xbfdbfe, intensity: 1.2, distance: 6 } },
];

export const MOCK_MAT = {
  floor: '#1c1917',
  wall: '#44403c',
  ceiling: '#1c1917',
};

export function buildMockSeed() {
  return serializeLayout({
    outline: MOCK_OUTLINE,
    placed: MOCK_PLACED,
    playerSpawn: { x: 0.5, z: 0.5 },
    luluSpawn: { x: -0.9, z: -0.65 },
    mat: MOCK_MAT,
  });
}

export const MOCK_SEED = buildMockSeed();
