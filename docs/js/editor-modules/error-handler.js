/**
 * @fileoverview Global error display for the Room Layout Editor.
 * Listens to window errors and unhandled rejections, rendering them into a DOM element.
 */

export class EditorErrorHandler {
  constructor(displayId = 'error-display') {
    this._displayId = displayId;
  }

  attach() {
    window.addEventListener('error', (e) => this._show(`${e.message}  @${e.lineno}:${e.colno}`));
    window.addEventListener('unhandledrejection', (e) => this._show(`Unhandled rejection: ${e.reason}`));
  }

  showError(err) {
    const msg = err instanceof Error ? `init error: ${err.message}\n${err.stack}` : String(err);
    this._show(msg);
  }

  _show(msg) {
    const el = document.getElementById(this._displayId);
    if (!el) return;
    el.style.display = 'block';
    el.textContent = String(msg);
  }
}
