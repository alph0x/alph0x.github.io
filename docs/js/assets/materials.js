import * as THREE from 'three';
import { COLORS } from '../core.js';
import { texWall, texFloor, texCeiling, texTerminal, texConcrete, texWood } from './textures.js';

/**
 * PSX-style material factory.
 * Uses MeshStandardMaterial with roughness=1 for flat, visible lighting.
 * flatShading creates the faceted low-poly look.
 */
export function makeStd({ color, map, emissive = 0x000000, emissiveIntensity = 1 }) {
  const params = { flatShading: true, roughness: 1, metalness: 0, emissive, emissiveIntensity };
  if (color !== undefined) params.color = color;
  if (map) params.map = map;
  return new THREE.MeshStandardMaterial(params);
}

export const M = {
  wall: makeStd({ map: texWall }),
  floor: makeStd({ map: texFloor }),
  ceiling: makeStd({ map: texCeiling }),
  terminal: new THREE.MeshBasicMaterial({ map: texTerminal }),
  terminalPink: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.magenta }),
  terminalCyan: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.cyan }),
  terminalGreen: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.green }),
  glowPurple: new THREE.MeshBasicMaterial({ color: COLORS.accent }),
  glowPink: new THREE.MeshBasicMaterial({ color: COLORS.magenta }),
  glowCyan: new THREE.MeshBasicMaterial({ color: COLORS.cyan }),
  glowGreen: new THREE.MeshBasicMaterial({ color: COLORS.green }),
  concrete: makeStd({ map: texConcrete }),
  wood: makeStd({ map: texWood }),
};
