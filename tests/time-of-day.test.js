/**
 * @fileoverview Tests for the time-of-day lighting mapping.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { getTimeOfDayPreset, applyTimeOfDay } from '../docs/js/level/lighting.ts';

// ── Preset mapping ────────────────────────────────────────────────

describe('getTimeOfDayPreset', () => {
  it('maps 6-11 to morning', () => {
    for (const h of [6, 9, 11]) {
      expect(getTimeOfDayPreset(h).name).toBe('morning');
    }
  });

  it('maps 12-17 to afternoon', () => {
    for (const h of [12, 15, 17]) {
      expect(getTimeOfDayPreset(h).name).toBe('afternoon');
    }
  });

  it('maps 18-5 to night', () => {
    for (const h of [18, 21, 0, 3, 5]) {
      expect(getTimeOfDayPreset(h).name).toBe('night');
    }
  });

  it('wraps hour numbers modulo 24', () => {
    expect(getTimeOfDayPreset(30).name).toBe('morning'); // 06:00
    expect(getTimeOfDayPreset(-6).name).toBe('night');   // 18:00
  });

  it('accepts Date objects', () => {
    expect(getTimeOfDayPreset(new Date('2026-06-22T08:00:00')).name).toBe('morning');
    expect(getTimeOfDayPreset(new Date('2026-06-22T14:30:00')).name).toBe('afternoon');
    expect(getTimeOfDayPreset(new Date('2026-06-22T02:00:00')).name).toBe('night');
  });
});

// ── Scene application ─────────────────────────────────────────────

describe('applyTimeOfDay', () => {
  it('scales cityscape emissives brighter at night', () => {
    const scene = new THREE.Scene();
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    mesh.userData._emissiveBase = mat.color.getHex();
    scene.add(mesh);

    const night = getTimeOfDayPreset(22);
    applyTimeOfDay(scene, night);

    const expected = new THREE.Color(0xff0000).multiplyScalar(night.cityEmissiveMultiplier);
    expect(mat.color.getHex()).toBe(expected.getHex());
  });

  it('brightens PC LED meshes at night', () => {
    const scene = new THREE.Scene();
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    mesh.userData._pcLed = true;
    scene.add(mesh);

    const night = getTimeOfDayPreset(22);
    applyTimeOfDay(scene, night);

    const expected = new THREE.Color(0x00ff00).multiplyScalar(night.pcLedMultiplier);
    expect(mat.color.getHex()).toBe(expected.getHex());
  });

  it('keeps PC LED meshes at normal intensity during the afternoon', () => {
    const scene = new THREE.Scene();
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    mesh.userData._pcLed = true;
    scene.add(mesh);

    const afternoon = getTimeOfDayPreset(14);
    applyTimeOfDay(scene, afternoon);

    const expected = new THREE.Color(0x00ff00); // multiplier 1.0
    expect(mat.color.getHex()).toBe(expected.getHex());
  });

  it('adjusts window glow mesh emissive and spot light', () => {
    const scene = new THREE.Scene();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x6688aa,
      emissive: 0x6688aa,
      emissiveIntensity: 0.35,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    mesh.userData._windowGlow = true;
    scene.add(mesh);

    const spot = new THREE.SpotLight(0x6688aa, 1.2);
    spot.userData._windowSpot = true;
    scene.add(spot);

    const night = getTimeOfDayPreset(22);
    applyTimeOfDay(scene, night);

    expect(mat.emissive.getHex()).toBe(night.windowGlow.color);
    expect(mat.emissiveIntensity).toBe(night.windowGlow.intensity);
    expect(spot.color.getHex()).toBe(night.windowGlow.color);
    expect(spot.intensity).toBe(night.windowGlow.spotIntensity);
  });
});
