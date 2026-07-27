import * as THREE from 'three';
import { COLORS } from '../core.js';
import { texTerminal, texWood } from './textures.js';

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
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
}

// Shared 3-step toon ramp (design-contract §2). Thresholds from the P-01
// daylight board: lifted shadow floor (~40%) so shaded zones never go black.
// Module singleton owned for app lifetime — never disposed.
const gradientMap = new THREE.DataTexture(new Uint8Array([100, 170, 255]), 3, 1, THREE.RedFormat);
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
gradientMap.needsUpdate = true;

export function makeStd({
  color,
  map,
  emissive = 0x000000,
  emissiveIntensity = 1,
  transparent,
  opacity,
  side,
  flatShading,
  normalMap,
}: StdParams): THREE.MeshToonMaterial {
  // ponytail: roughness/metalness/roughnessMap stay accepted via StdParams but
  // are not forwarded — toon has no PBR response; no caller changes needed.
  const params: THREE.MeshToonMaterialParameters = { emissive, emissiveIntensity, gradientMap };
  if (color !== undefined) params.color = color;
  if (map) params.map = map;
  if (transparent !== undefined) params.transparent = transparent;
  if (opacity !== undefined) params.opacity = opacity;
  if (side !== undefined) params.side = side;
  if (normalMap) params.normalMap = normalMap;
  const mat = new THREE.MeshToonMaterial(params);
  // D-15: flatShading defaults OFF (smooth normals — the Ghibli/BOTW look).
  // three r185 dropped flatShading from MeshToonMaterial's declared params, but
  // WebGLPrograms still honors material.flatShading === true for any material
  // type — deliberate per-item opt-in only (contract §3 as superseded).
  if (flatShading) Object.assign(mat, { flatShading: true });
  return mat;
}

export const M: Record<string, THREE.Material> = {
  terminal: new THREE.MeshBasicMaterial({ map: texTerminal }),
  terminalPink: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.ancientAmber }),
  terminalCyan: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.sheikahTeal }),
  terminalGreen: new THREE.MeshBasicMaterial({ map: texTerminal, color: COLORS.sheikahTeal }),
  glowPurple: new THREE.MeshBasicMaterial({ color: COLORS.ancientAmber }),
  glowCyan: new THREE.MeshBasicMaterial({ color: COLORS.sheikahTeal }),
  wood: makeStd({ map: texWood }),
};
