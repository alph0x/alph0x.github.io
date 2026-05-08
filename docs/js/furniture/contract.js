/**
 * @fileoverview Furniture builder contract — unified return shape.
 *
 * Every builder MUST return an object with at least:
 *   { mesh: THREE.Mesh | THREE.Group }
 *
 * Optional metadata:
 *   { type, label, panelId, room }
 *
 * This eliminates the 4-branch normalization logic in level/index.js
 * and makes the builder contract explicit and type-safe.
 */

/**
 * Helper to wrap a raw mesh into the unified contract.
 *
 * @param {THREE.Mesh|THREE.Group} mesh
 * @param {Object} [meta]
 * @returns {{mesh:THREE.Object3D}&Object}
 */
export function makeResult(mesh, meta = {}) {
  return { mesh, ...meta };
}
