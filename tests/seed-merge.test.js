/**
 * @fileoverview Tests for seed decoration→furniture merge and collision layout.
 */

import { describe, it, expect } from 'vitest';
import { deserializeSeed, serializeLayout } from '../docs/js/seed.js';

describe('deserializeSeed merges legacy decorations into furniture', () => {
  it('places poster and fairyLights into furniture array', () => {
    const seed = JSON.stringify({
      v: 2,
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      f: [{ t: 'bed', p: [0, 0, 0] }],
      dec: [
        { t: 'poster', p: [0, 1, 0], text: 'HI', color: 0xff0000 },
        { t: 'fairyLights', p: [1, 2, 1] },
      ],
    });
    const result = deserializeSeed(seed);
    const poster = result.furniture.find((f) => f.type === 'poster');
    const lights = result.furniture.find((f) => f.type === 'fairyLights');
    expect(poster).toBeDefined();
    expect(poster.text).toBe('HI');
    expect(poster.color).toBe(0xff0000);
    expect(lights).toBeDefined();
  });

  it('preserves furniture-only seeds without decorations', () => {
    const seed = JSON.stringify({
      v: 2,
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      f: [{ t: 'bed', p: [0, 0, 0] }],
    });
    const result = deserializeSeed(seed);
    expect(result.furniture.some((f) => f.type === 'poster')).toBe(false);
  });
});

describe('serializeLayout places poster/fairyLights into dec array', () => {
  it('separates decorations from furniture in output', () => {
    const seed = serializeLayout({
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      placed: [
        { type: 'bed', config: { position: [0, 0, 0] } },
        { type: 'poster', config: { position: [0, 1, 0], text: 'HI', color: 0xff0000 } },
        { type: 'fairyLights', config: { position: [1, 2, 1] } },
      ],
      playerSpawn: { x: 0, z: 0 },
      luluSpawn: { x: 0, z: 0 },
      decorations: [],
    });
    const parsed = JSON.parse(atob(seed));
    expect(parsed.f).toHaveLength(1);
    expect(parsed.dec).toHaveLength(2);
    expect(parsed.dec[0].text).toBe('HI');
    expect(parsed.dec[0].color).toBe(0xff0000);
  });
});
