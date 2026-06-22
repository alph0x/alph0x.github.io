import * as THREE from 'three';
import { makeBox } from '../primitives.js';

/**
 * Deterministic seeded PRNG.
 * ponytail: simple LCG is enough for visual seed stability.
 */
function makeSeededRng(seed = 0) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CAREER_LANDMARKS = [
  { name: 'GeoPagos', role: 'fintech', color: 0x10b981, accent: 0x06b6d4, shape: 'glass' as const },
  { name: 'Rappi', role: 'delivery', color: 0xf97316, accent: 0xfacc15, shape: 'hub' as const },
  { name: 'ALPH0X', role: 'personal', color: 0x8b5cf6, accent: 0xe879f9, shape: 'creative' as const },
  { name: 'FullStack', role: 'skills', color: 0x0ea5e9, accent: 0x22d3ee, shape: 'spire' as const },
  { name: 'Leadership', role: 'mentor', color: 0xf59e0b, accent: 0xfcd34d, shape: 'twin' as const },
];

function buildLayer(
  rng: () => number,
  factor: number,
  build: (group: THREE.Group, rng: () => number) => void
): THREE.Group {
  const layer = new THREE.Group();
  layer.userData._parallax = true;
  layer.userData._parallaxFactor = factor;
  build(layer, rng);
  return layer;
}


function neonMat(color: number) {
  return new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
}

export function buildCityscape(cfg: { position: number[]; seed?: number }): THREE.Group {
  const [cx, , cz] = cfg.position as [number, number, number];
  const rng = makeSeededRng(cfg.seed ?? 0);
  const cityGroup = new THREE.Group();
  cityGroup.position.set(cx, 0, cz - 10);
  // Mark container so existing shallow parallax tests still find it; factor 0 keeps it static.
  cityGroup.userData._parallax = true;
  cityGroup.userData._parallaxFactor = 0;

  // Background: tall thin towers with subtle emissive windows
  const background = buildLayer(rng, 0.015, (group) => {
    for (let i = 0; i < 14; i++) {
      const bw = 0.8 + rng() * 1.4;
      const bh = 14 + rng() * 22;
      const bd = 0.8 + rng() * 1.4;
      const bx = (rng() - 0.5) * 55;
      const bz = -8 - rng() * 30;
      const hue = 0x1a1a1e + Math.floor(rng() * 8) * 0x020203;
      const tower = makeBox(new THREE.MeshBasicMaterial({ color: hue }), [bw, bh, bd], [bx, bh / 2 - 3, bz]);
      group.add(tower);

      const floors = Math.floor(bh / 2);
      const winsPerFloor = Math.max(1, Math.floor(bw / 0.5));
      for (let f = 0; f < floors; f++) {
        for (let w = 0; w < winsPerFloor; w++) {
          if (rng() > 0.55) continue;
          const winColor = rng() > 0.7 ? 0xfef3c7 : 0x334155;
          const wx = bx - bw / 2 + 0.2 + (w * (bw - 0.4)) / Math.max(1, winsPerFloor - 1);
          const wy = (f * 2) - 3 + 0.8;
          const wmesh = makeBox(new THREE.MeshBasicMaterial({ color: winColor }), [0.18, 0.25, 0.05], [wx, wy, bz + bd / 2 + 0.03]);
          wmesh.userData._emissiveBase = (wmesh.material as THREE.MeshBasicMaterial).color.getHex();
          group.add(wmesh);
        }
      }
    }
  });

  // Midground: career-themed buildings with neon sign planes
  const midground = buildLayer(rng, 0.03, (group) => {
    for (let i = 0; i < CAREER_LANDMARKS.length; i++) {
      const landmark = CAREER_LANDMARKS[i];
      const bx = -20 + i * 10 + (rng() - 0.5) * 2;
      const bz = -12 - rng() * 10;
      let bw = 2.5;
      let bh = 7 + rng() * 6;
      let bd = 2.5;

      if (landmark.shape === 'glass') {
        bw = 3; bd = 3; bh += 2;
      } else if (landmark.shape === 'hub') {
        bw = 4; bd = 3; bh -= 1;
      } else if (landmark.shape === 'creative') {
        bw = 2; bd = 2; bh += 4;
      } else if (landmark.shape === 'spire') {
        bw = 1.6; bd = 1.6; bh += 6;
      } else if (landmark.shape === 'twin') {
        bw = 1.8; bd = 1.8; bh -= 1;
        const twin = makeBox(new THREE.MeshBasicMaterial({ color: landmark.color }), [bw, bh, bd], [bx + 1.2, bh / 2 - 2, bz]);
        group.add(twin);
      }

      const bldg = makeBox(new THREE.MeshBasicMaterial({ color: landmark.color }), [bw, bh, bd], [bx, bh / 2 - 2, bz]);
      group.add(bldg);

      // Neon sign representing company/role
      const signW = bw * 0.8;
      const signH = bh * 0.25;
      const sign = makeBox(neonMat(landmark.accent), [signW, signH, 0.06], [bx, bh / 2 - 1, bz + bd / 2 + 0.05]);
      sign.userData._emissiveBase = (sign.material as THREE.MeshBasicMaterial).color.getHex();
      group.add(sign);

      // Small accent strips
      const stripCount = landmark.shape === 'hub' ? 3 : 2;
      for (let s = 0; s < stripCount; s++) {
        const sy = bh - 2 - s * 1.8;
        if (sy < 0) break;
        const strip = makeBox(new THREE.MeshBasicMaterial({ color: landmark.accent }), [bw + 0.06, 0.12, bd + 0.06], [bx, sy - 2, bz]);
        strip.userData._emissiveBase = (strip.material as THREE.MeshBasicMaterial).color.getHex();
        group.add(strip);
      }
    }
  });

  // Foreground: flying drones/cars with emissive lights
  const foreground = buildLayer(rng, 0.08, (group) => {
    for (let i = 0; i < 8; i++) {
      const fx = (rng() - 0.5) * 50;
      const fy = 2 + rng() * 7;
      const fz = -8 - rng() * 25;
      const isDrone = rng() > 0.5;
      const bodyColor = isDrone ? 0xec4899 : 0x06b6d4;
      const lightColor = isDrone ? 0xf472b6 : 0x67e8f9;

      const body = makeBox(new THREE.MeshBasicMaterial({ color: bodyColor }), [isDrone ? 0.25 : 0.5, isDrone ? 0.12 : 0.12, isDrone ? 0.25 : 0.2], [fx, fy, fz]);
      group.add(body);

      const light = makeBox(new THREE.MeshBasicMaterial({ color: lightColor }), [0.1, 0.04, 0.04], [fx, fy - (isDrone ? 0.08 : 0.06), fz + (isDrone ? 0.14 : 0.11)]);
      group.add(light);
      light.userData._emissiveBase = (light.material as THREE.MeshBasicMaterial).color.getHex();
    }
  });

  cityGroup.add(background, midground, foreground);
  return cityGroup;
}
