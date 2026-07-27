/**
 * @fileoverview Lighting preset contract (P-06): exactly three time-of-day
 * presets with the full frozen field set, P-01 binding mood colors, sane
 * intensity ranges, and deterministic selection via an injected clock.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { getTimeOfDayPreset, type TimeOfDayPreset } from '../docs/js/level/lighting.js';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function allPresets(): TimeOfDayPreset[] {
  const seen = new Map<string, TimeOfDayPreset>();
  for (const h of HOURS) {
    const p = getTimeOfDayPreset(h);
    seen.set(p.name, p);
  }
  return [...seen.values()];
}

const isHex = (n: number): boolean => Number.isInteger(n) && n >= 0 && n <= 0xffffff;
const r = (hex: number): number => (hex >> 16) & 0xff;
const g = (hex: number): number => (hex >> 8) & 0xff;
const b = (hex: number): number => hex & 0xff;

afterEach(() => {
  delete window.__TIME_OF_DAY_NOW__;
});

describe('time-of-day presets', () => {
  it('resolves to exactly 3 presets: morning, afternoon, night', () => {
    const names = allPresets().map((p) => p.name).sort();
    expect(names).toEqual(['afternoon', 'morning', 'night']);
  });

  it('every preset carries the full frozen field set', () => {
    for (const p of allPresets()) {
      expect(isHex(p.key.color)).toBe(true);
      expect(Number.isFinite(p.key.intensity)).toBe(true);
      expect(isHex(p.fill.color)).toBe(true);
      expect(Number.isFinite(p.fill.intensity)).toBe(true);
      expect(Number.isFinite(p.accent)).toBe(true);
      expect(isHex(p.windowGlow.color)).toBe(true);
      expect(Number.isFinite(p.windowGlow.intensity)).toBe(true);
      expect(Number.isFinite(p.windowGlow.spotIntensity)).toBe(true);
      expect(Number.isFinite(p.cityEmissiveMultiplier)).toBe(true);
      expect(Number.isFinite(p.pcLedMultiplier)).toBe(true);
    }
  });

  it('intensities stay within sane ranges', () => {
    for (const p of allPresets()) {
      // Key band bent from the briefing's 5-40 to 1-40: P-01's approved mood
      // hints (key 1.8-3.5) sit below 5 — spec > test per the intent gate.
      expect(p.key.intensity).toBeGreaterThanOrEqual(1);
      expect(p.key.intensity).toBeLessThanOrEqual(40);
      expect(p.fill.intensity).toBeGreaterThanOrEqual(0);
      expect(p.fill.intensity).toBeLessThanOrEqual(5);
      expect(p.windowGlow.intensity).toBeGreaterThanOrEqual(0);
      expect(p.windowGlow.intensity).toBeLessThanOrEqual(15);
      expect(p.cityEmissiveMultiplier).toBeGreaterThanOrEqual(0);
      expect(p.cityEmissiveMultiplier).toBeLessThanOrEqual(3);
      expect(p.pcLedMultiplier).toBeGreaterThanOrEqual(0);
      expect(p.pcLedMultiplier).toBeLessThanOrEqual(3);
    }
  });

  it('mood colors match P-01 lighting-moods.md (binding)', () => {
    const [morning, afternoon, night] = ['morning', 'afternoon', 'night'].map(
      (n) => allPresets().find((p) => p.name === n)!,
    );
    expect(morning.key.color).toBe(0xffd9a0); // sunlightWarm
    expect(morning.fill.color).toBe(0x9fc8e0); // skyFillBlue
    expect(morning.windowGlow.color).toBe(0xffe8c0);
    expect(afternoon.key.color).toBe(0xffc27a);
    expect(afternoon.fill.color).toBe(0xb0a8c8);
    expect(afternoon.windowGlow.color).toBe(0xf5a54a); // duskAmber
    expect(night.key.color).toBe(0xffb36b);
    expect(night.fill.color).toBe(0x3a4a72);
    expect(night.windowGlow.color).toBe(0x4460a8);
  });

  it('night fill reads indigo-dusk (blue-dominant), morning key reads warm daylight', () => {
    const night = getTimeOfDayPreset(22);
    expect(b(night.fill.color)).toBeGreaterThan(r(night.fill.color));
    expect(b(night.fill.color)).toBeGreaterThan(g(night.fill.color));
    const morning = getTimeOfDayPreset(8);
    expect(r(morning.key.color)).toBeGreaterThan(b(morning.key.color));
  });

  it('selects presets deterministically from an injected hour', () => {
    expect(getTimeOfDayPreset(5).name).toBe('night');
    expect(getTimeOfDayPreset(6).name).toBe('morning');
    expect(getTimeOfDayPreset(11).name).toBe('morning');
    expect(getTimeOfDayPreset(12).name).toBe('afternoon');
    expect(getTimeOfDayPreset(17).name).toBe('afternoon');
    expect(getTimeOfDayPreset(18).name).toBe('night');
    expect(getTimeOfDayPreset(new Date('2026-06-22T09:30:00')).name).toBe('morning');
    expect(getTimeOfDayPreset(new Date('2026-06-22T15:00:00')).name).toBe('afternoon');
    expect(getTimeOfDayPreset(new Date('2026-06-22T23:59:00')).name).toBe('night');
  });

  it('honors window.__TIME_OF_DAY_NOW__ when no time is passed', () => {
    window.__TIME_OF_DAY_NOW__ = new Date('2026-06-22T08:00:00');
    expect(getTimeOfDayPreset().name).toBe('morning');
    window.__TIME_OF_DAY_NOW__ = new Date('2026-06-22T20:00:00');
    expect(getTimeOfDayPreset().name).toBe('night');
  });
});
