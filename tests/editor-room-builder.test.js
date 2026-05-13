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

  it('updateCulling skips walls with openings (Groups) to avoid floating furniture', () => {
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

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 2, 5); // close to front wall (which has the door)
    camera.lookAt(0, 0, 0);

    builder.updateCulling(camera, '3d');

    const groups = roomGroup.children.filter((c) => c.type === 'Group');
    const frontWallGroup = groups.find((g) => g.children.some((c) => c.isMesh));
    expect(frontWallGroup.visible).toBe(true); // wall with opening stays visible

    const solidWalls = roomGroup.children.filter((c) => c.geometry instanceof THREE.BoxGeometry);
    const hiddenSolid = solidWalls.filter((w) => !w.visible).length;
    expect(hiddenSolid).toBe(2); // two solid walls are still hidden
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

    // The front wall (edge from [-2,-1] to [2,-1]) should become a Group with merged wall geometry
    const groups = roomGroup.children.filter((c) => c.type === 'Group');
    expect(groups.length).toBeGreaterThanOrEqual(1);

    const frontWallGroup = groups.find((g) => g.children.some((c) => c.isMesh));
    expect(frontWallGroup).toBeDefined();

    const wallMesh = frontWallGroup.children.find((c) => c.isMesh);
    expect(wallMesh).toBeDefined();
    expect(wallMesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
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
    const frontWallGroup = groups.find((g) => g.children.some((c) => c.isMesh));
    expect(frontWallGroup).toBeDefined();

    const wallMesh = frontWallGroup.children.find((c) => c.isMesh);
    expect(wallMesh).toBeDefined();
    expect(wallMesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
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
    const frontWallGroup = groups.find((g) => g.children.some((c) => c.isMesh));
    expect(frontWallGroup).toBeDefined();

    const wallMesh = frontWallGroup.children.find((c) => c.isMesh);
    expect(wallMesh).toBeDefined();
    expect(wallMesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
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
    const frontWallGroup = groups.find((g) => g.children.some((c) => c.isMesh));
    expect(frontWallGroup).toBeDefined();

    const wallMesh = frontWallGroup.children.find((c) => c.isMesh);
    expect(wallMesh).toBeDefined();
    expect(wallMesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
  });
});
