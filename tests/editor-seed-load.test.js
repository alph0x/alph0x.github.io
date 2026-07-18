/**
 * @fileoverview Integration test: full editor init + seed load.
 * Verifies that DEFAULT_SEED creates furniture meshes and updates the DOM.
 */


import { describe, it, expect, vi } from 'vitest';

import { buildEditorDOM } from './helpers/editor-dom.js';

vi.mock('three', async () => {
  const { mockThreeModule } = await import('./helpers/mock-three.js');
  return mockThreeModule(await vi.importActual('three'));
});

describe('Editor seed load integration', () => {
  it('loads DEFAULT_SEED without errors and updates the DOM', async () => {
    buildEditorDOM();

    await import('../docs/js/editor.js');

    const errorDisplay = document.getElementById('error-display');
    expect(errorDisplay.style.display).not.toBe('block');
    expect(errorDisplay.textContent).toBe('');

    // Color inputs should reflect seed materials
    expect(document.getElementById('colorFloor').value).toBe('#1c1917');
    expect(document.getElementById('colorWall').value).toBe('#44403c');
    expect(document.getElementById('colorCeiling').value).toBe('#1c1917');

    // Placed list should show items, not "None"
    const placedList = document.getElementById('placedList');
    expect(placedList.innerHTML).not.toContain('None');
    expect(placedList.innerHTML).toContain('bed');
    expect(placedList.innerHTML).toContain('nightstand');
  });
});
