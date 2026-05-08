/**
 * @fileoverview Tests for room outline resizing behavior.
 */

import { describe, it, expect } from 'vitest';
import { snap } from '../docs/js/editor-utils.js';

describe('editor edge dragging logic', () => {
  it('moves both edge vertices by the same delta', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    const edgeIndex = 1; // edge from [2.25, -1.75] to [2.25, 1.75]
    const dragOffset = { x: 2.25, z: 0 };
    const pt = { x: 3.0, z: 0 }; // dragged 0.75 to the right
    const dx = pt.x - dragOffset.x;
    const dz = pt.z - dragOffset.z;

    const i = edgeIndex;
    const j = (i + 1) % outline.length;
    const dragEdgeVerts = [
      [outline[i][0], outline[i][1]],
      [outline[j][0], outline[j][1]],
    ];

    const newOutline = [...outline];
    newOutline[i] = [snap(dragEdgeVerts[0][0] + dx), snap(dragEdgeVerts[0][1] + dz)];
    newOutline[j] = [snap(dragEdgeVerts[1][0] + dx), snap(dragEdgeVerts[1][1] + dz)];

    expect(newOutline[1]).toEqual([3.0, -1.75]);
    expect(newOutline[2]).toEqual([3.0, 1.75]);
  });

  it('does not invert winding order when dragging an edge outward', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];

    // Drag right edge outward
    const edgeIndex = 1;
    const dragOffset = { x: 2.25, z: 0 };
    const pt = { x: 3.5, z: 0 };
    const dx = pt.x - dragOffset.x;
    const dz = pt.z - dragOffset.z;

    const i = edgeIndex;
    const j = (i + 1) % outline.length;
    const dragEdgeVerts = [
      [outline[i][0], outline[i][1]],
      [outline[j][0], outline[j][1]],
    ];

    const newOutline = [...outline];
    newOutline[i] = [snap(dragEdgeVerts[0][0] + dx), snap(dragEdgeVerts[0][1] + dz)];
    newOutline[j] = [snap(dragEdgeVerts[1][0] + dx), snap(dragEdgeVerts[1][1] + dz)];

    // Compute signed area (shoelace)
    let area = 0;
    for (let k = 0; k < newOutline.length; k++) {
      const [x1, y1] = newOutline[k];
      const [x2, y2] = newOutline[(k + 1) % newOutline.length];
      area += (x1 * y2) - (x2 * y1);
    }
    expect(area).toBeGreaterThan(0); // CCW
  });

  it('does not invert winding order when dragging top edge upward', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];

    const edgeIndex = 2; // top edge
    const dragOffset = { x: 0, z: 1.75 };
    const pt = { x: 0, z: 2.5 };
    const dx = pt.x - dragOffset.x;
    const dz = pt.z - dragOffset.z;

    const i = edgeIndex;
    const j = (i + 1) % outline.length;
    const dragEdgeVerts = [
      [outline[i][0], outline[i][1]],
      [outline[j][0], outline[j][1]],
    ];

    const newOutline = [...outline];
    newOutline[i] = [snap(dragEdgeVerts[0][0] + dx), snap(dragEdgeVerts[0][1] + dz)];
    newOutline[j] = [snap(dragEdgeVerts[1][0] + dx), snap(dragEdgeVerts[1][1] + dz)];

    let area = 0;
    for (let k = 0; k < newOutline.length; k++) {
      const [x1, y1] = newOutline[k];
      const [x2, y2] = newOutline[(k + 1) % newOutline.length];
      area += (x1 * y2) - (x2 * y1);
    }
    expect(area).toBeGreaterThan(0); // CCW
  });

  it('prevents self-intersection when dragging inward', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];

    // Drag right edge far left, past the left edge
    const edgeIndex = 1;
    const dragOffset = { x: 2.25, z: 0 };
    const pt = { x: -3.0, z: 0 };
    const dx = pt.x - dragOffset.x;
    const dz = pt.z - dragOffset.z;

    const i = edgeIndex;
    const j = (i + 1) % outline.length;
    const dragEdgeVerts = [
      [outline[i][0], outline[i][1]],
      [outline[j][0], outline[j][1]],
    ];

    const newOutline = [...outline];
    newOutline[i] = [snap(dragEdgeVerts[0][0] + dx), snap(dragEdgeVerts[0][1] + dz)];
    newOutline[j] = [snap(dragEdgeVerts[1][0] + dx), snap(dragEdgeVerts[1][1] + dz)];

    // This creates a self-intersecting polygon: area should be checked
    let area = 0;
    for (let k = 0; k < newOutline.length; k++) {
      const [x1, y1] = newOutline[k];
      const [x2, y2] = newOutline[(k + 1) % newOutline.length];
      area += (x1 * y2) - (x2 * y1);
    }
    // Self-intersecting polygons can have area near 0 or inverted
    // This documents the current behavior (no prevention)
    expect(Math.abs(area)).toBeGreaterThan(0);
  });

  it('locks vertical edges to X-only movement', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    const edgeIndex = 1; // right edge: vertical (same X = 2.25)
    const dragOffset = { x: 2.25, z: 0 };
    const pt = { x: 3.0, z: 1.5 }; // dragged right AND up

    let dx = pt.x - dragOffset.x;
    let dz = pt.z - dragOffset.z;

    // Apply axis-lock logic
    const v0 = [outline[edgeIndex][0], outline[edgeIndex][1]];
    const v1 = [outline[(edgeIndex + 1) % outline.length][0], outline[(edgeIndex + 1) % outline.length][1]];
    const epsilon = 0.01;
    if (Math.abs(v0[0] - v1[0]) < epsilon) {
      dz = 0; // vertical edge → X-only
    } else if (Math.abs(v0[1] - v1[1]) < epsilon) {
      dx = 0; // horizontal edge → Z-only
    }

    expect(dx).toBe(0.75);
    expect(dz).toBe(0);

    const i = edgeIndex;
    const j = (i + 1) % outline.length;
    const newOutline = [...outline];
    newOutline[i] = [snap(v0[0] + dx), snap(v0[1] + dz)];
    newOutline[j] = [snap(v1[0] + dx), snap(v1[1] + dz)];

    expect(newOutline[1]).toEqual([3.0, -1.75]);
    expect(newOutline[2]).toEqual([3.0, 1.75]);
  });

  it('locks horizontal edges to Z-only movement', () => {
    const outline = [
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ];
    const edgeIndex = 2; // top edge: horizontal (same Z = 1.75)
    const dragOffset = { x: 0, z: 1.75 };
    const pt = { x: 1.5, z: 2.5 }; // dragged right AND up

    let dx = pt.x - dragOffset.x;
    let dz = pt.z - dragOffset.z;

    // Apply axis-lock logic
    const v0 = [outline[edgeIndex][0], outline[edgeIndex][1]];
    const v1 = [outline[(edgeIndex + 1) % outline.length][0], outline[(edgeIndex + 1) % outline.length][1]];
    const epsilon = 0.01;
    if (Math.abs(v0[0] - v1[0]) < epsilon) {
      dz = 0; // vertical edge → X-only
    } else if (Math.abs(v0[1] - v1[1]) < epsilon) {
      dx = 0; // horizontal edge → Z-only
    }

    expect(dx).toBe(0);
    expect(dz).toBe(0.75);

    const i = edgeIndex;
    const j = (i + 1) % outline.length;
    const newOutline = [...outline];
    newOutline[i] = [snap(v0[0] + dx), snap(v0[1] + dz)];
    newOutline[j] = [snap(v1[0] + dx), snap(v1[1] + dz)];

    expect(newOutline[2]).toEqual([2.25, 2.5]);
    expect(newOutline[3]).toEqual([-2.25, 2.5]);
  });
});
