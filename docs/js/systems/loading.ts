/**
 * @fileoverview Loading screen + start screen wiring.
 */

import type { ControlsLike } from '../core.js';

export type PointerLockLike = ControlsLike;

export class LoadingSystem {
  controls: PointerLockLike;
  private _loadInt: number | null = null;
  private _resolved = false;

  constructor({ controls }: { controls: PointerLockLike }) {
    this.controls = controls;
  }

  /** Start the loading screen and track real asset load progress. */
  start(promises: Promise<unknown>[] = []): void {
    const loadBar = document.getElementById('loading-bar-fill') as HTMLElement | null;
    const total = Math.max(1, promises.length);
    let settled = 0;

    const updateBar = () => {
      settled++;
      const pct = Math.min(100, Math.round((settled / total) * 100));
      if (loadBar) loadBar.style.width = pct + '%';
      if (pct >= 100 && !this._resolved) {
        this._resolved = true;
        setTimeout(() => this._showStart(), 300);
      }
    };

    for (const p of promises) {
      p.then(updateBar, updateBar);
    }

    // Safety timeout: if something silently fails, don't hang forever
    setTimeout(() => {
      if (!this._resolved) {
        this._resolved = true;
        this._showStart();
      }
    }, 8000);

    this._bindStartBtn();
  }

  private _showStart(): void {
    (document.getElementById('loading') as HTMLElement).style.display = 'none';
    (document.getElementById('start-screen') as HTMLElement).style.display = 'flex';
  }

  private _bindStartBtn(): void {
    (document.getElementById('start-btn') as HTMLElement).addEventListener('click', () => {
      (document.getElementById('start-screen') as HTMLElement).style.display = 'none';
      if (typeof this.controls.lock === 'function') {
        try {
          this.controls.lock();
        } catch {
          /* lock may throw if not ready */
        }
      }
    });

    if (typeof this.controls.addEventListener === 'function') {
      this.controls.addEventListener('unlock', () => {
        const panelOpen = document.querySelectorAll('.info-panel.active').length > 0;
        if (!panelOpen) (document.getElementById('start-screen') as HTMLElement).style.display = 'flex';
      });
      this.controls.addEventListener('lock', () => {
        (document.getElementById('start-screen') as HTMLElement).style.display = 'none';
      });
    }
  }
}
