/**
 * @fileoverview Furniture Registry — OCP: add new items without touching room builder.
 * Stores builder function + optional metadata (category, dimensions, icon).
 */

export const FurnitureRegistry = new Map();

/**
 * @param {string} type
 * @param {Function} builder — (config) => THREE.Mesh | THREE.Group | [mesh, meta]
 * @param {object} [meta] — { category, dimensions, icon }
 */
export function register(type, builder, meta = {}) {
  FurnitureRegistry.set(type, { builder, meta });
}
