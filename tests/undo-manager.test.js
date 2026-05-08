/**
 * @fileoverview Tests for UndoManager — generic undo/redo stack.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UndoManager } from '../docs/js/editor-modules/undo-manager.js';

describe('UndoManager', () => {
  let um;

  beforeEach(() => {
    um = new UndoManager();
  });

  it('starts empty', () => {
    expect(um.canUndo).toBe(false);
    expect(um.canRedo).toBe(false);
    expect(um.peekUndo()).toBeNull();
  });

  it('records actions and enables undo', () => {
    um.record({ type: 'place', id: 1 });
    expect(um.canUndo).toBe(true);
    expect(um.canRedo).toBe(false);
    expect(um.peekUndo()).toEqual({ type: 'place', id: 1 });
  });

  it('popUndo moves action to redo stack', () => {
    um.record({ type: 'place', id: 1 });
    const action = um.popUndo();
    expect(action).toEqual({ type: 'place', id: 1 });
    expect(um.canUndo).toBe(false);
    expect(um.canRedo).toBe(true);
  });

  it('popRedo moves action back to undo stack', () => {
    um.record({ type: 'place', id: 1 });
    um.popUndo();
    const action = um.popRedo();
    expect(action).toEqual({ type: 'place', id: 1 });
    expect(um.canUndo).toBe(true);
    expect(um.canRedo).toBe(false);
  });

  it('recording clears redo stack', () => {
    um.record({ type: 'place', id: 1 });
    um.popUndo();
    expect(um.canRedo).toBe(true);
    um.record({ type: 'place', id: 2 });
    expect(um.canRedo).toBe(false);
    expect(um.peekUndo()).toEqual({ type: 'place', id: 2 });
  });

  it('supports multiple undo/redo cycles', () => {
    um.record({ type: 'a' });
    um.record({ type: 'b' });
    um.record({ type: 'c' });

    expect(um.popUndo().type).toBe('c');
    expect(um.popUndo().type).toBe('b');
    expect(um.canUndo).toBe(true);
    expect(um.canRedo).toBe(true);

    expect(um.popRedo().type).toBe('b');
    expect(um.popRedo().type).toBe('c');
    expect(um.canUndo).toBe(true);
    expect(um.canRedo).toBe(false);
  });

  it('clear empties both stacks', () => {
    um.record({ type: 'place', id: 1 });
    um.popUndo();
    um.clear();
    expect(um.canUndo).toBe(false);
    expect(um.canRedo).toBe(false);
    expect(um.popUndo()).toBeUndefined();
    expect(um.popRedo()).toBeUndefined();
  });

  it('handles popUndo on empty stack gracefully', () => {
    expect(um.popUndo()).toBeUndefined();
  });

  it('handles popRedo on empty stack gracefully', () => {
    expect(um.popRedo()).toBeUndefined();
  });
});
