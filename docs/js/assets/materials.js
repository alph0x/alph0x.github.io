import * as THREE from 'three';
import { COLORS } from '../core.js';
import { texWall, texFloor, texCeiling, texTerminal, texConcrete, texWood } from './textures.js';

export function makeStd({ color, map, roughness = 0.8, metalness = 0.1, emissive = 0x000000, emissiveIntensity = 1 }) {
  const params = { roughness, metalness, emissive, emissiveIntensity };
  if (color !== undefined) params.color = color;
  if (map) params.map = map;
  return new THREE.MeshStandardMaterial(params);
}

export const M = {
  wall: makeStd({ map: texWall, roughness: 0.95, metalness: 0.0 }),
  floor: makeStd({ map: texFloor, roughness: 0.85, metalness: 0.05 }),
  ceiling: makeStd({ map: texCeiling, roughness: 0.95, metalness: 0.0 }),
  terminal: new THREE.MeshBasicMaterial({ map: texTerminal }),
  terminalPink: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.magenta }),
  terminalCyan: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.cyan }),
  terminalGreen: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.green }),
  glowPurple: new THREE.MeshBasicMaterial({ color: COLORS.accent }),
  glowPink: new THREE.MeshBasicMaterial({ color: COLORS.magenta }),
  glowCyan: new THREE.MeshBasicMaterial({ color: COLORS.cyan }),
  glowGreen: new THREE.MeshBasicMaterial({ color: COLORS.green }),
  concrete: makeStd({ map: texConcrete, roughness: 0.9, metalness: 0.1 }),
  wood: makeStd({ map: texWood, roughness: 0.6, metalness: 0.0 }),
};
