/**
 * @fileoverview Tests for normalizeRotation edge cases.
 */

import { describe, it, expect } from 'vitest';
import { normalizeRotation } from '../docs/js/editor-utils.js';

describe('normalizeRotation', () => {
  it('keeps positive angles within [0, 2π)', () => {
    expect(normalizeRotation(1)).toBeCloseTo(1, 5);
    expect(normalizeRotation(3)).toBeCloseTo(3, 5);
    expect(normalizeRotation(6)).toBeCloseTo(6, 5);
  });

  it('wraps angles >= 2π back into range', () => {
    const twoPi = Math.PI * 2;
    expect(normalizeRotation(twoPi)).toBeCloseTo(0, 5);
    expect(normalizeRotation(twoPi + 1)).toBeCloseTo(1, 5);
    expect(normalizeRotation(twoPi * 3 + 0.5)).toBeCloseTo(0.5, 5);
  });

  it('wraps negative angles into [0, 2π)', () => {
    const twoPi = Math.PI * 2;
    expect(normalizeRotation(-1)).toBeCloseTo(twoPi - 1, 5);
    expect(normalizeRotation(-twoPi)).toBeCloseTo(0, 5);
    expect(normalizeRotation(-twoPi - 1)).toBeCloseTo(twoPi - 1, 5);
  });

  it('handles zero', () => {
    expect(normalizeRotation(0)).toBe(0);
  });

  it('handles very large angles', () => {
    const twoPi = Math.PI * 2;
    expect(normalizeRotation(1000)).toBeCloseTo(1000 % twoPi, 5);
  });
});
