import * as THREE from 'three';
import { COLORS } from '../core.js';
import { texWall, texFloor, texCeiling, texTerminal, texWood } from './textures.js';

interface StdParams {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  flatShading?: boolean;
}

export function makeStd({
  color,
  map,
  emissive = 0x000000,
  emissiveIntensity = 1,
  roughness = 1,
  metalness = 0,
  transparent,
  opacity,
  side,
}: StdParams): THREE.MeshStandardMaterial {
  const params: THREE.MeshStandardMaterialParameters = { flatShading: true, roughness, metalness, emissive, emissiveIntensity };
  if (color !== undefined) params.color = color;
  if (map) params.map = map;
  if (transparent !== undefined) params.transparent = transparent;
  if (opacity !== undefined) params.opacity = opacity;
  if (side !== undefined) params.side = side;
  return new THREE.MeshStandardMaterial(params);
}

export const M: Record<string, THREE.Material> = {
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
  wood: makeStd({ map: texWood }),
};
