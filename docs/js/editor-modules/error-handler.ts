/**
 * @fileoverview Global error display for the Room Layout Editor.
 * Listens to window errors and unhandled rejections, rendering them into a DOM element.
 */

export class EditorErrorHandler {
  private _displayId: string;

  constructor(displayId: string = 'error-display') {
    this._displayId = displayId;
  }

  attach(): void {
    window.addEventListener('error', (e: ErrorEvent) =>
      this._show(`${e.message}  @${e.lineno}:${e.colno}`)
    );
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) =>
      this._show(`Unhandled rejection: ${e.reason}`)
    );
  }

  showError(err: unknown): void {
    const msg = err instanceof Error ? `init error: ${err.message}\n${err.stack}` : String(err);
    this._show(msg);
  }

  private _show(msg: string): void {
    const el = document.getElementById(this._displayId);
    if (!el) return;
    el.style.display = 'block';
    el.textContent = String(msg);
  }
}
