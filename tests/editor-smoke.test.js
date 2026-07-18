/**
 * @fileoverview Smoke test: editor initializes without fatal errors
 * and builds a non-empty categorized palette.
 */


import { describe, it, expect, vi } from 'vitest';

import { buildEditorDOM } from './helpers/editor-dom.js';

// Mock THREE.WebGLRenderer before editor imports it
vi.mock('three', async () => {
  const { mockThreeModule } = await import('./helpers/mock-three.js');
  return mockThreeModule(await vi.importActual('three'));
});

describe('Editor init smoke', () => {
  it('builds categorized palette with all furniture types', async () => {
    buildEditorDOM();

    await import('../docs/js/editor.js');

    const palette = document.getElementById('palette');
    expect(palette.children.length).toBeGreaterThan(0);

    const buttons = palette.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    const errorDisplay = document.getElementById('error-display');
    expect(errorDisplay.style.display).not.toBe('block');
  });
});
