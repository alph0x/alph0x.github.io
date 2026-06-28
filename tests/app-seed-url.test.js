/**
 * @fileoverview Tests for URL seed loading helper.
 */

import { describe, it, expect } from 'vitest';
import { applySeedFromUrl, serializeLayout } from '../docs/js/seed.js';
import { DEFAULT_SEED } from '../docs/js/core.js';

describe('applySeedFromUrl', () => {
  it('returns false when no seed query param is present', () => {
    const target = {};
    expect(applySeedFromUrl('', target)).toBe(false);
    expect(applySeedFromUrl('?foo=bar', target)).toBe(false);
  });

  it('returns true and applies a valid base64 seed from the query string', () => {
    const seed = serializeLayout({
      outline: [[-1, -1], [1, -1], [1, 1], [-1, 1]],
      placed: [{ type: 'bed', config: { type: 'bed', position: [0, 0, 0] } }],
      playerSpawn: { x: 0.5, z: 0.5 },
      luluSpawn: { x: -0.5, z: -0.5 },
      mat: { floor: '#ff0000', wall: '#00ff00', ceiling: '#0000ff' },
    });

    const target = {};
    expect(applySeedFromUrl(`?seed=${encodeURIComponent(seed)}`, target)).toBe(true);
    expect(target.outline).toEqual([[-1, -1], [1, -1], [1, 1], [-1, 1]]);
    expect(target.mat).toEqual({ floor: '#ff0000', wall: '#00ff00', ceiling: '#0000ff' });
  });

  it('returns false and leaves target unchanged for an invalid seed', () => {
    const target = { untouched: true };
    expect(applySeedFromUrl('?seed=not-valid-base64!!!', target)).toBe(false);
    expect(target.untouched).toBe(true);
  });

  it('applies DEFAULT_SEED through the URL helper', () => {
    const target = {};
    expect(applySeedFromUrl(`?seed=${encodeURIComponent(DEFAULT_SEED)}`, target)).toBe(true);
    expect(Array.isArray(target.outline)).toBe(true);
    expect(Array.isArray(target.furniture)).toBe(true);
  });
});
