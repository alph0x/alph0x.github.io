/**
 * @fileoverview Browser-extension rejections (e.g. MetaMask) must not surface in the
 * in-app error overlay, while app-origin rejections still must.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isThirdPartyRejection, EditorErrorHandler } from '../docs/js/editor-modules/error-handler.js';
import { LoadingSystem } from '../docs/js/systems/loading.js';

function rejectionEvent(reason) {
  const ev = new Event('unhandledrejection', { cancelable: true });
  ev.reason = reason;
  ev.preventDefault = () => {};
  return ev;
}

function browserErrorEvent(error) {
  const ev = new Event('error', { cancelable: true });
  Object.defineProperties(ev, {
    error: { value: error },
    message: { value: error.message },
    filename: { value: 'https://example.test/room.js' },
    lineno: { value: 42 },
  });
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
    document.body.innerHTML = `
      <div id="loading"></div>
      <div id="start-screen"><button type="button" id="start-btn">Enter</button></div>
      <div id="error-display" style="display:none">
        <h2 id="fallback-title"></h2>
        <p id="fallback-message"></p>
        <button type="button" data-fallback-panel="panel-profile">Profile</button>
        <button type="button" data-fallback-panel="panel-work">Work</button>
        <button type="button" data-fallback-panel="panel-contact">Contact</button>
        <button type="button" id="retry-room" hidden>Retry Enter Room</button>
      </div>
      <div class="info-panel" id="panel-profile"><button class="panel-close">Close</button></div>
      <div class="info-panel" id="panel-work"><button class="panel-close">Close</button></div>
      <div class="info-panel" id="panel-contact"><button class="panel-close">Close</button></div>`;
    const html = readFileSync(resolve(__dirname, '../docs/index.html'), 'utf8');
    const match = html.match(/<script>([\s\S]*?getElementById\('error-display'\)[\s\S]*?)<\/script>/);
    expect(match, 'index.html inline error script not found').toBeTruthy();
    (0, eval)(match[1]);
  });

  it('hides extension rejections, but replaces an unknown browser rejection with safe copy', () => {
    window.dispatchEvent(rejectionEvent(new Error('Failed to connect to MetaMask')));
    expect(overlayVisible()).toBe(false);

    const rawMessage = 'UnknownError: browser engine internals at room.js:42';
    window.dispatchEvent(rejectionEvent(new DOMException(rawMessage, 'UnknownError')));
    expect(overlayVisible()).toBe(true);
    expect(document.getElementById('error-display').textContent).not.toContain(rawMessage);
    expect(document.getElementById('fallback-title').textContent).toBe('The 3D room is unavailable');
  });

  it('turns denied pointer lock into a retryable fallback without exposing the browser detail', () => {
    const rawMessage = 'Pointer Lock request denied by browser policy';
    window.dispatchEvent(rejectionEvent(new DOMException(rawMessage, 'NotAllowedError')));

    expect(overlayVisible()).toBe(true);
    expect(document.getElementById('error-display').textContent).not.toContain(rawMessage);
    expect(document.getElementById('retry-room').hidden).toBe(false);
  });

  it('turns WebGL construction and genuine app errors into safe fallback copy', () => {
    const webglMessage = 'WebGLRenderer: Error creating WebGL context.';
    const appMessage = 'Unexpected internal state at render-frame.ts:88';

    window.dispatchEvent(browserErrorEvent(new Error(webglMessage)));
    expect(overlayVisible()).toBe(true);
    expect(document.getElementById('error-display').textContent).not.toContain(webglMessage);

    window.dispatchEvent(browserErrorEvent(new Error(appMessage)));
    expect(document.getElementById('error-display').textContent).not.toContain(appMessage);
    expect(document.getElementById('fallback-message').textContent).toBeTruthy();
  });

  it('retries a denied Pointer Lock request without a reload loop', () => {
    const lock = vi.fn(() => { throw new DOMException('Denied', 'NotAllowedError'); });
    const loading = new LoadingSystem({
      controls: { isLocked: false, lock, unlock: () => {}, addEventListener: () => {}, removeEventListener: () => {} },
    });
    loading.start();

    document.getElementById('start-btn')?.click();
    expect(overlayVisible()).toBe(true);
    document.getElementById('retry-room')?.click();

    expect(lock).toHaveBeenCalledTimes(2);
    expect(overlayVisible()).toBe(true);
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
