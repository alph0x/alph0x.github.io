/**
 * @fileoverview Browser-extension rejections (e.g. MetaMask) must not surface in the
 * in-app error overlay, while app-origin rejections still must.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isThirdPartyRejection, EditorErrorHandler } from '../docs/js/editor-modules/error-handler.js';

function rejectionEvent(reason) {
  const ev = new Event('unhandledrejection', { cancelable: true });
  ev.reason = reason;
  ev.preventDefault = () => {};
  return ev;
}

const overlayVisible = () =>
  document.getElementById('error-display').style.display === 'block';

describe('isThirdPartyRejection predicate', () => {
  it('flags MetaMask-style messages', () => {
    expect(isThirdPartyRejection(new Error('Failed to connect to MetaMask'))).toBe(true);
    expect(isThirdPartyRejection('MetaMask Tx Signature: User denied')).toBe(true);
    expect(isThirdPartyRejection(new Error('ethereum request failed'))).toBe(true);
  });

  it('flags extension stacks', () => {
    const err = new Error('boom');
    err.stack = 'Error: boom\n    at chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/inpage.js:1:1';
    expect(isThirdPartyRejection(err)).toBe(true);
    err.stack = 'Error: boom\n    at moz-extension://abc/content.js:2:2';
    expect(isThirdPartyRejection(err)).toBe(true);
  });

  it('does not flag app errors', () => {
    expect(isThirdPartyRejection(new Error('boom'))).toBe(false);
    expect(isThirdPartyRejection('plain string failure')).toBe(false);
    expect(isThirdPartyRejection(undefined)).toBe(false);
  });
});

describe('game (index.html inline) error handler wiring', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="loading"></div><div id="error-display" style="display:none"></div>';
    const html = readFileSync(resolve(__dirname, '../docs/index.html'), 'utf8');
    const match = html.match(/<script>([\s\S]*?getElementById\('error-display'\)[\s\S]*?)<\/script>/);
    expect(match, 'index.html inline error script not found').toBeTruthy();
    (0, eval)(match[1]);
  });

  it('hides extension rejections, shows app rejections', () => {
    window.dispatchEvent(rejectionEvent(new Error('Failed to connect to MetaMask')));
    expect(overlayVisible()).toBe(false);
    window.dispatchEvent(rejectionEvent(new Error('boom')));
    expect(overlayVisible()).toBe(true);
    expect(document.getElementById('error-display').textContent).toContain('boom');
  });

  it('keeps the existing pointer-lock exception', () => {
    window.dispatchEvent(rejectionEvent(new Error('pointer lock failed')));
    expect(overlayVisible()).toBe(false);
  });
});

// ponytail: runs last — attach() adds a window listener that persists for the rest of the file
describe('editor error handler wiring', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="error-display" style="display:none"></div>';
  });

  it('hides extension rejections, shows app rejections', () => {
    new EditorErrorHandler().attach();
    window.dispatchEvent(rejectionEvent(new Error('Failed to connect to MetaMask')));
    expect(overlayVisible()).toBe(false);
    window.dispatchEvent(rejectionEvent(new Error('boom')));
    expect(overlayVisible()).toBe(true);
  });
});
