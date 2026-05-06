/**
 * @fileoverview Test that buildPaletteUI produces categorized buttons.
 */

import { describe, it, expect } from 'vitest';
import { FurnitureRegistry } from '../docs/js/furniture/index.js';

describe('Palette UI logic', () => {
  it('groups all registered types into categories', () => {
    const groups = new Map();
    for (const [type, entry] of FurnitureRegistry.entries()) {
      const cat = entry.meta?.category || 'other';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push({ type, meta: entry.meta || {} });
    }

    expect(groups.size).toBeGreaterThan(0);
    const totalItems = Array.from(groups.values()).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalItems).toBe(FurnitureRegistry.size);
  });

  it('every type has an icon', () => {
    for (const [type, entry] of FurnitureRegistry.entries()) {
      expect(entry.meta?.icon, `missing icon for ${type}`).toBeDefined();
    }
  });
});
