/**
 * @fileoverview Tests for RoomBuilder geometry construction.
 */

import './setup-canvas-mock.js';
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RoomBuilder } from '../docs/js/editor-modules/room-builder.js';

describe('RoomBuilder', () => {
  let scene, roomGroup, builder;

  beforeEach(() => {
    scene = new THREE.Scene();
    roomGroup = new THREE.Group();
    scene.add(roomGroup);
    builder = new RoomBuilder(roomGroup, scene, { wallH: 2.8, wallT: 0.2 });
  });

  it('rebuild creates floor and ceiling meshes', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });

    expect(roomGroup.children.length).toBeGreaterThanOrEqual(2);
    const floor = roomGroup.children.find((c) => c.rotation.x === -Math.PI / 2);
    const ceiling = roomGroup.children.find((c) => c.rotation.x === Math.PI / 2);
    expect(floor).toBeDefined();
    expect(ceiling).toBeDefined();
  });

  it('rebuild creates one wall per outline edge', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });

    const walls = roomGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
    expect(walls.length).toBe(4);
  });

  it('rebuild clears previous room geometry', () => {
    const outline1 = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    builder.rebuild(outline1, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });
    const count1 = roomGroup.children.length;

    const outline2 = [
      [-3, -2],
      [3, -2],
      [3, 2],
      [-3, 2],
    ];
    builder.rebuild(outline2, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });
    const count2 = roomGroup.children.length;

    expect(count2).toBe(count1);
  });

  it('exposes wallMaterial after rebuild', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    expect(builder.wallMaterial).toBeNull();
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });
    expect(builder.wallMaterial).toBeInstanceOf(THREE.MeshStandardMaterial);
  });

  it('updateCulling hides two closest walls in 3d mode', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 2, 5); // close to front wall
    camera.lookAt(0, 0, 0);

    builder.updateCulling(camera, '3d');

    const walls = roomGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
    const visibleCount = walls.filter((w) => w.visible).length;
    expect(visibleCount).toBe(2); // 4 walls - 2 hidden
  });

  it('updateCulling shows all walls in top mode', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 2, 5);

    builder.updateCulling(camera, 'top');

    const walls = roomGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
    const visibleCount = walls.filter((w) => w.visible).length;
    expect(visibleCount).toBe(4);
  });

  it('handles degenerate edges gracefully', () => {
    const outline = [
      [-2, -1],
      [-2, -1], // duplicate = zero-length edge
      [2, 1],
      [-2, 1],
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });

    const walls = roomGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
    expect(walls.length).toBe(3); // one edge skipped
  });

  it('splits a wall into stubs and header when an opening is provided', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    const openings = [
      { x: 0, z: -1, width: 1.6, height: 2.3, bottom: 0 }, // door on front wall
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' }, openings);

    // The front wall (edge from [-2,-1] to [2,-1]) should become a Group with multiple BoxGeometry children
    const groups = roomGroup.children.filter((c) => c.type === 'Group');
    expect(groups.length).toBeGreaterThanOrEqual(1);

    const frontWallGroup = groups.find((g) => {
      const children = g.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
      return children.length >= 2; // at least left stub + right stub
    });
    expect(frontWallGroup).toBeDefined();

    const boxes = frontWallGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
    // Should have left stub, right stub, and possibly header
    expect(boxes.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps walls solid when no openings are provided', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' }, []);

    const walls = roomGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
    expect(walls.length).toBe(4);
  });

  it('creates lower fill for window opening', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    const openings = [
      { x: 0, z: -1, width: 1.8, height: 1.2, bottom: 0.9 }, // window on front wall
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' }, openings);

    const groups = roomGroup.children.filter((c) => c.type === 'Group');
    const frontWallGroup = groups.find((g) => g.children.some((c) => c.geometry instanceof THREE.BoxGeometry));
    expect(frontWallGroup).toBeDefined();

    const boxes = frontWallGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
    // Should have: left side, right side, lower fill, and header above window
    expect(boxes.length).toBeGreaterThanOrEqual(3);

    // Verify there is a stub below the window (lower fill: height ~ 0.9)
    const lowerFill = boxes.find((b) => {
      const h = b.geometry.parameters.height;
      return h > 0.8 && h < 1.0;
    });
    expect(lowerFill).toBeDefined();
  });

  it('creates a header above door opening', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    const openings = [
      { x: 0, z: -1, width: 1.6, height: 2.3, bottom: 0 },
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' }, openings);

    const groups = roomGroup.children.filter((c) => c.type === 'Group');
    const frontWallGroup = groups.find((g) => g.children.some((c) => c.geometry instanceof THREE.BoxGeometry));
    const boxes = frontWallGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);

    // Verify there is a header stub (small height above door: ~0.5)
    const header = boxes.find((b) => {
      const h = b.geometry.parameters.height;
      return h > 0.4 && h < 0.6;
    });
    expect(header).toBeDefined();
  });

  it('door opening has side jambs and a header above', () => {
    const outline = [
      [-2, -1],
      [2, -1],
      [2, 1],
      [-2, 1],
    ];
    const openings = [
      { x: 0, z: -1, width: 1.6, height: 2.3, bottom: 0 },
    ];
    builder.rebuild(outline, { floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' }, openings);

    const groups = roomGroup.children.filter((c) => c.type === 'Group');
    const frontWallGroup = groups.find((g) => g.children.some((c) => c.geometry instanceof THREE.BoxGeometry));
    const boxes = frontWallGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);

    // There should be side jambs to the left and right of the door opening
    const leftJamb = boxes.find((b) => {
      const halfDepth = b.geometry.parameters.depth / 2;
      const maxZ = b.position.z + halfDepth;
      return maxZ < -0.7; // left of door opening center
    });
    const rightJamb = boxes.find((b) => {
      const halfDepth = b.geometry.parameters.depth / 2;
      const minZ = b.position.z - halfDepth;
      return minZ > 0.7; // right of door opening center
    });
    expect(leftJamb).toBeDefined();
    expect(rightJamb).toBeDefined();

    // The opening area at ground level should NOT be blocked by a tall stub
    const openingZ = 0; // center of door in local Z
    const groundLevelStubs = boxes.filter((b) => {
      const halfDepth = b.geometry.parameters.depth / 2;
      const minZ = b.position.z - halfDepth;
      const maxZ = b.position.z + halfDepth;
      const h = b.geometry.parameters.height;
      // Stub covers the door opening in Z and is tall enough to block passage
      return minZ < openingZ && maxZ > openingZ && h > 1.5;
    });
    expect(groundLevelStubs.length).toBe(0);
  });
});
