/**
 * @fileoverview Lighting setup — SRP: only light placement and configuration.
 *
 * Time of day: maps local hour to one of three presets. Exposes the preset so
 * the level builder can apply it to furniture emissives after the scene graph
 * is populated.
 */

import * as THREE from 'three';
import { COLORS } from '../core.js';
import { makeLight } from '../primitives.js';

import type { TimeOfDayName } from '../core.js';
export type { TimeOfDayName };


export interface TimeOfDayPreset {
  name: TimeOfDayName;
  ambient: { color: number; intensity: number };
  hemi: { sky: number; ground: number; intensity: number };
  dir: { color: number; intensity: number };
  ceiling: number;
  desk: number;
  term: number;
  tv: number;
  bed: number;
  cityLight: { color: number; intensity: number };
  corner: number;
  windowGlow: { color: number; intensity: number; spotIntensity: number };
  cityEmissiveMultiplier: number;
  pcLedMultiplier: number;
}

// ponytail: three hand-tuned presets, no sun-path simulation.
const PRESETS: Record<TimeOfDayName, TimeOfDayPreset> = {
  morning: {
    name: 'morning',
    ambient: { color: 0xffd6a0, intensity: 2.2 },
    hemi: { sky: 0xffcaa0, ground: 0x605060, intensity: 1.8 },
    dir: { color: 0xfff0d0, intensity: 1.8 },
    ceiling: 2.2,
    desk: 1.6,
    term: 0.7,
    tv: 1.0,
    bed: 0.4,
    cityLight: { color: 0x88aadd, intensity: 0.8 },
    corner: 0.5,
    windowGlow: { color: 0xffaa77, intensity: 0.25, spotIntensity: 0.8 },
    cityEmissiveMultiplier: 0.8,
    pcLedMultiplier: 1.0,
  },
  afternoon: {
    name: 'afternoon',
    ambient: { color: 0xffffff, intensity: 3.0 },
    hemi: { sky: 0x90a0c0, ground: 0x505070, intensity: 2.0 },
    dir: { color: 0xc0d0f0, intensity: 2.0 },
    ceiling: 2.5,
    desk: 1.8,
    term: 0.8,
    tv: 1.2,
    bed: 0.5,
    cityLight: { color: 0x6688aa, intensity: 1.0 },
    corner: 0.6,
    windowGlow: { color: 0x6688aa, intensity: 0.35, spotIntensity: 1.2 },
    cityEmissiveMultiplier: 1.0,
    pcLedMultiplier: 1.0,
  },
  night: {
    name: 'night',
    ambient: { color: 0x1a2233, intensity: 0.4 },
    hemi: { sky: 0x202a40, ground: 0x101018, intensity: 0.3 },
    dir: { color: 0x405070, intensity: 0.4 },
    ceiling: 1.0,
    desk: 1.2,
    term: 0.8,
    tv: 1.0,
    bed: 0.15,
    cityLight: { color: 0x3344aa, intensity: 0.8 },
    corner: 0.2,
    windowGlow: { color: 0x3344aa, intensity: 0.4, spotIntensity: 1.0 },
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

  scene.add(new THREE.AmbientLight(preset.ambient.color, preset.ambient.intensity));
  scene.add(new THREE.HemisphereLight(preset.hemi.sky, preset.hemi.ground, preset.hemi.intensity));

  const dir = new THREE.DirectionalLight(preset.dir.color, preset.dir.intensity);
  dir.position.set(2, 4, 3);
  scene.add(dir);

  const ceilMain = new THREE.PointLight(0xffedd5, preset.ceiling, 6, 1);
  ceilMain.position.set(0, 2.6, 0);
  scene.add(ceilMain);

  const deskLamp = new THREE.PointLight(0xf5f5f4, preset.desk, 4, 1);
  deskLamp.position.set(1.4, 1.5, -0.9);
  scene.add(deskLamp);

  const termLight = new THREE.PointLight(COLORS.cyan, preset.term, 3, 1);
  termLight.position.set(1.2, 1.2, -0.8);
  scene.add(termLight);

  const tvLight = new THREE.PointLight(COLORS.accent, preset.tv, 4, 1);
  tvLight.position.set(2.0, 1.4, 0);
  scene.add(tvLight);
  tvLight.userData = { flicker: true, baseIntensity: preset.tv, flickerSpeed: 8, flickerPhase: 0 };

  const bedLight = new THREE.PointLight(0xffedd5, preset.bed, 3, 1);
  bedLight.position.set(-1.6, 1.8, -0.5);
  scene.add(bedLight);

  const cityLight = new THREE.PointLight(preset.cityLight.color, preset.cityLight.intensity, 6, 1);
  cityLight.position.set(0, 1.2, -2);
  scene.add(cityLight);

  scene.add(makeLight(COLORS.accent, preset.corner, 4, [-2.2, 2.2, 0]));

  return preset;
}
