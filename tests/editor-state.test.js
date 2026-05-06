/**
 * @fileoverview Tests for EditorState encapsulation.
 */

import { describe, it, expect } from 'vitest';
import { EditorState } from '../docs/js/editor-modules/state.js';

describe('EditorState', () => {
  it('initializes with default outline', () => {
    const s = new EditorState();
    expect(s.outline).toEqual([
      [-2.25, -1.75],
      [2.25, -1.75],
      [2.25, 1.75],
      [-2.25, 1.75],
    ]);
  });

  it('initializes with empty placed items', () => {
    const s = new EditorState();
    expect(s.placed).toEqual([]);
    expect(s.placedCount).toBe(0);
  });

  it('initializes with null selectedId', () => {
    const s = new EditorState();
    expect(s.selectedId).toBeNull();
  });

  it('initializes in top view mode', () => {
    const s = new EditorState();
    expect(s.viewMode).toBe('top');
  });

  it('mutates outline via setter', () => {
    const s = new EditorState();
    s.outline = [[0, 0], [1, 0], [1, 1], [0, 1]];
    expect(s.outline).toEqual([[0, 0], [1, 0], [1, 1], [0, 1]]);
  });

  it('mutates single vertex via setOutlineVertex', () => {
    const s = new EditorState();
    s.setOutlineVertex(0, [0, 0]);
    expect(s.outline[0]).toEqual([0, 0]);
    expect(s.outline[1]).toEqual([2.25, -1.75]);
  });

  it('adds and finds placed items', () => {
    const s = new EditorState();
    s.addPlaced({ id: 1, type: 'bed', config: {} });
    expect(s.placedCount).toBe(1);
    expect(s.findPlaced(1)).toEqual({ id: 1, type: 'bed', config: {} });
    expect(s.findPlaced(99)).toBeUndefined();
  });

  it('removes placed items by id', () => {
    const s = new EditorState();
    s.addPlaced({ id: 1, type: 'bed' });
    s.addPlaced({ id: 2, type: 'desk' });
    s.removePlaced(1);
    expect(s.placedCount).toBe(1);
    expect(s.findPlaced(1)).toBeUndefined();
    expect(s.findPlaced(2)).toBeDefined();
  });

  it('updates placed config via updater callback', () => {
    const s = new EditorState();
    s.addPlaced({ id: 1, type: 'bed', config: { rotation: 0 } });
    s.updatePlacedConfig(1, (item) => {
      item.config.rotation = 1.5;
    });
    expect(s.findPlaced(1).config.rotation).toBe(1.5);
  });

  it('serializes to seed payload', () => {
    const s = new EditorState();
    s.addPlaced({ id: 1, type: 'bed', config: {} });
    const payload = s.toSeedPayload();
    expect(payload.outline).toEqual(s.outline);
    expect(payload.placed).toHaveLength(1);
    expect(payload.mat).toEqual({ floor: '#1c1917', wall: '#44403c', ceiling: '#1c1917' });
  });

  it('loads from seed layout', () => {
    const s = new EditorState();
    s.addPlaced({ id: 1, type: 'bed' });
    s.selectedId = 1;

    s.loadFromSeed({
      outline: [[0, 0], [1, 0], [1, 1], [0, 1]],
      playerSpawn: [0.5, 0.5],
      luluSpawn: [0.1, 0.1],
      mat: { floor: '#fff', wall: '#000', ceiling: '#ccc' },
    });

    expect(s.outline).toEqual([[0, 0], [1, 0], [1, 1], [0, 1]]);
    expect(s.placed).toEqual([]);
    expect(s.selectedId).toBeNull();
    expect(s.playerSpawn).toEqual({ x: 0.5, z: 0.5 });
    expect(s.luluSpawn).toEqual({ x: 0.1, z: 0.1 });
    expect(s.mat).toEqual({ floor: '#fff', wall: '#000', ceiling: '#ccc' });
  });
});
