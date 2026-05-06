/**
 * @fileoverview UndoManager — generic undo/redo stack for editor actions.
 * Actions are plain objects with a `type` and enough data to reverse the operation.
 */

export class UndoManager {
  constructor() {
    this._undoStack = [];
    this._redoStack = [];
  }

  get canUndo() { return this._undoStack.length > 0; }
  get canRedo() { return this._redoStack.length > 0; }

  /** Push a new action onto the undo stack and clear redo. */
  record(action) {
    this._undoStack.push(action);
    this._redoStack = [];
  }

  /** Peek at the top undo action without popping. */
  peekUndo() {
    return this._undoStack.length > 0 ? this._undoStack[this._undoStack.length - 1] : null;
  }

  /** Pop and return the top undo action, pushing it onto redo. */
  popUndo() {
    const action = this._undoStack.pop();
    if (action) this._redoStack.push(action);
    return action;
  }

  /** Pop and return the top redo action, pushing it back onto undo. */
  popRedo() {
    const action = this._redoStack.pop();
    if (action) this._undoStack.push(action);
    return action;
  }

  /** Clear both stacks (e.g. on seed reload). */
  clear() {
    this._undoStack = [];
    this._redoStack = [];
  }
}
