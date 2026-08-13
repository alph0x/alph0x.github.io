/**
 * @fileoverview PBR texture sets — vendored CC0 albedo/normal/roughness loader.
 */

import * as THREE from 'three';

interface PbrSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

const FILES: Record<string, string> = {
  'wood-floor': 'wood_floor_deck',
  plaster: 'plastered_wall',
  fabric: 'fabric_leather_02',
  metal: 'metal_plate',
};

export function loadPbrSet(name: keyof typeof FILES, repeatX = 1, repeatY = 1): PbrSet {
  const prefix = FILES[name];
  const loader = new THREE.TextureLoader();
  const load = (map: string, srgb: boolean): THREE.Texture => {
    const tex = loader.load(`/assets/tex/${name}/${prefix}_${map}_1k.jpg`);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  return {
    map: load('diff', true),
    normalMap: load('nor_gl', false),
    roughnessMap: load('rough', false),
  };
}
