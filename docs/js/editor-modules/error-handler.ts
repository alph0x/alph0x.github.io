/**
 * @fileoverview Global error display for the Room Layout Editor.
 * Listens to window errors and unhandled rejections, rendering them into a DOM element.
 */

import { getEditorEl } from './dom-refs.js';

/**
 * True for rejections originating from browser extensions (e.g. MetaMask), not app code.
 * Duplicated inline in docs/index.html (plain script tag cannot import).
 */
export function isThirdPartyRejection(reason: unknown): boolean {
  const msg = reason instanceof Error ? `${reason.name} ${reason.message}` : String(reason);
  if (/metamask|ethereum|chrome-extension|moz-extension|\binpage\b/i.test(msg)) return true;
  const stack = (reason as { stack?: unknown } | null | undefined)?.stack;
  return typeof stack === 'string' && /chrome-extension:\/\/|moz-extension:\/\//.test(stack);
}

export class EditorErrorHandler {
  private _displayId: string;

  constructor(displayId: string = 'error-display') {
    this._displayId = displayId;
  }

  attach(): void {
    window.addEventListener('error', (e: ErrorEvent) =>
      this._show(`${e.message}  @${e.lineno}:${e.colno}`)
    );
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      if (isThirdPartyRejection(e.reason)) return;
      this._show(`Unhandled rejection: ${e.reason}`);
    });
  }

  showError(err: unknown): void {
    const msg = err instanceof Error ? `init error: ${err.message}\n${err.stack}` : String(err);
    this._show(msg);
  }

  private _show(msg: string): void {
    const el = getEditorEl(this._displayId);
    if (!el) return;
    el.style.display = 'block';
    el.textContent = String(msg);
  }
}
