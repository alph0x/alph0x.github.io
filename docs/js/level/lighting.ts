/**
 * @fileoverview Lighting rig — HDRI IBL (wired in renderer) + warm key + cool
 * window fill + RGB accents. Practicals are emissive materials; bloom does the glow.
 *
 * Time of day: maps local hour to one of three presets. Exposes the preset so
 * the level builder can apply it to furniture emissives after the scene graph
 * is populated.
 */

import * as THREE from 'three';
import { COLORS } from '../core.js';
import { registerFlickerLight } from '../systems/animation/flicker.js';

import type { TimeOfDayName } from '../core.js';
export type { TimeOfDayName };

export interface TimeOfDayPreset {
  name: TimeOfDayName;
  /** Warm key spot from the ceiling lamp. */
  key: { color: number; intensity: number };
  /** Cool dusk fill from the window direction. */
  fill: { color: number; intensity: number };
  /** Shared intensity for the small RGB accent points. */
  accent: number;
  /** TV wall-wash flicker intensity. */
  tv: number;
  windowGlow: { color: number; intensity: number; spotIntensity: number };
  cityEmissiveMultiplier: number;
  pcLedMultiplier: number;
}

// ponytail: three hand-tuned presets, no sun-path simulation.
const PRESETS: Record<TimeOfDayName, TimeOfDayPreset> = {
  morning: {
    name: 'morning',
    key: { color: 0xffd6a0, intensity: 30 },
    fill: { color: 0x7fa0d0, intensity: 0.9 },
    accent: 1.4,
    tv: 1.0,
    windowGlow: { color: 0xffaa77, intensity: 0.25, spotIntensity: 1.2 },
    cityEmissiveMultiplier: 0.8,
    pcLedMultiplier: 1.0,
  },
  afternoon: {
    name: 'afternoon',
    key: { color: 0xffc890, intensity: 36 },
    fill: { color: 0x8aa8d8, intensity: 1.1 },
    accent: 1.6,
    tv: 1.2,
    windowGlow: { color: 0x6688aa, intensity: 0.35, spotIntensity: 1.6 },
    cityEmissiveMultiplier: 1.0,
    pcLedMultiplier: 1.0,
  },
  night: {
    name: 'night',
    key: { color: 0xffa860, intensity: 14 },
    fill: { color: 0x405d94, intensity: 0.35 },
    accent: 1.2,
    tv: 1.0,
    windowGlow: { color: 0x3344aa, intensity: 0.4, spotIntensity: 1.4 },
    cityEmissiveMultiplier: 1.5,
    pcLedMultiplier: 1.2,
  },
};

declare global {
  interface Window {
    __TIME_OF_DAY_NOW__?: Date;
  }
}

function resolveNow(): Date {
  if (typeof window !== 'undefined' && window.__TIME_OF_DAY_NOW__) {
    return window.__TIME_OF_DAY_NOW__;
  }
  // Deterministic fallback for Playwright / visual snapshots.
  if (typeof navigator !== 'undefined' && navigator.webdriver) {
    return new Date('2026-06-22T14:00:00');
  }
  return new Date();
}

export function getTimeOfDayPreset(time?: Date | number): TimeOfDayPreset {
  let hour: number;
  if (time === undefined) {
    hour = resolveNow().getHours();
  } else if (typeof time === 'number') {
    hour = ((time % 24) + 24) % 24;
  } else {
    hour = time.getHours();
  }

  if (hour >= 6 && hour < 12) return PRESETS.morning;
  if (hour >= 12 && hour < 18) return PRESETS.afternoon;
  return PRESETS.night;
}

function isMesh(o: THREE.Object3D): o is THREE.Mesh {
  return (o as THREE.Mesh).isMesh === true;
}

function isPointLight(o: THREE.Object3D): o is THREE.PointLight {
  return (o as THREE.PointLight).isPointLight === true;
}

function isSpotLight(o: THREE.Object3D): o is THREE.SpotLight {
  return (o as THREE.SpotLight).isSpotLight === true;
}

export function applyTimeOfDay(scene: THREE.Object3D, preset: TimeOfDayPreset): void {
  scene.traverse((obj) => {
    if (isMesh(obj)) {
      const mat = obj.material as THREE.Material;

      if (obj.userData._windowGlow && 'emissive' in mat && 'emissiveIntensity' in mat) {
        const std = mat as THREE.MeshStandardMaterial;
        std.emissive.setHex(preset.windowGlow.color);
        std.color.setHex(preset.windowGlow.color);
        std.emissiveIntensity = preset.windowGlow.intensity;
      }

      if (obj.userData._pcLed && 'color' in mat) {
        const basic = mat as THREE.MeshBasicMaterial;
        if (obj.userData._pcLedBase === undefined) {
          obj.userData._pcLedBase = basic.color.getHex();
        }
        basic.color.setHex(obj.userData._pcLedBase as number).multiplyScalar(preset.pcLedMultiplier);
      }

      if (obj.userData._emissiveBase !== undefined && 'color' in mat) {
        const basic = mat as THREE.MeshBasicMaterial;
        basic.color.setHex(obj.userData._emissiveBase as number).multiplyScalar(preset.cityEmissiveMultiplier);
      }
    }

    if (isSpotLight(obj) && obj.userData._windowSpot) {
      obj.color.setHex(preset.windowGlow.color);
      obj.intensity = preset.windowGlow.spotIntensity;
    }

    if (isPointLight(obj) && obj.userData._pcLight && typeof obj.userData.baseIntensity === 'number') {
      obj.intensity = obj.userData.baseIntensity * preset.pcLedMultiplier;
    }
  });
}

export function setupLighting(scene: THREE.Scene, options?: { now?: Date }): TimeOfDayPreset {
  const preset = getTimeOfDayPreset(options?.now);

  // Warm key from the ceiling-lamp position — shadow caster #1 (of 2; the
  // window spot in furniture is #2). Everything else is shadowless.
  const key = new THREE.SpotLight(preset.key.color, preset.key.intensity, 12, 1.05, 0.55, 1.6);
  key.position.set(0, 2.55, 0);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.001;
  scene.add(key, key.target);

  // Cool dusk fill from the window direction (shadowless; the window spot
  // adds the local shaft and is caster #2).
  const fill = new THREE.DirectionalLight(preset.fill.color, preset.fill.intensity);
  fill.position.set(0, 1.8, -4);
  scene.add(fill, fill.target);

  // RGB accents — small, shadowless local glow.
  const deskGlow = new THREE.PointLight(COLORS.cyan, preset.accent, 3.5, 1.8);
  deskGlow.position.set(1.4, 1.2, -0.9);
  scene.add(deskGlow);

  const cornerGlow = new THREE.PointLight(COLORS.magenta, preset.accent * 0.7, 4, 1.8);
  cornerGlow.position.set(-2.0, 1.6, 1.0);
  scene.add(cornerGlow);

  // TV wall-wash with the existing flicker system.
  const tvLight = new THREE.PointLight(COLORS.accent, preset.tv, 4, 1.8);
  tvLight.position.set(2.0, 1.4, 0);
  tvLight.userData = { flicker: true, baseIntensity: preset.tv, flickerSpeed: 8, flickerPhase: 0 };
  registerFlickerLight(tvLight);
  scene.add(tvLight);

  return preset;
}
