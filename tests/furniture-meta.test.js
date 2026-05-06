/**
 * @fileoverview Verifies that all registered furniture has metadata.
 */

import { describe, it, expect } from 'vitest';
import { FurnitureRegistry } from '../docs/js/furniture/index.js';

describe('Furniture metadata', () => {
  it('every registered type has category and icon', () => {
    expect(FurnitureRegistry.size).toBeGreaterThan(0);
    for (const [type, entry] of FurnitureRegistry.entries()) {
      expect(entry.meta, `type ${type} missing meta`).toBeDefined();
      expect(entry.meta.category, `type ${type} missing category`).toBeDefined();
      expect(entry.meta.icon, `type ${type} missing icon`).toBeDefined();
      expect(entry.meta.dimensions, `type ${type} missing dimensions`).toBeDefined();
    }
  });
});
