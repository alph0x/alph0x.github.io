/**
 * @fileoverview Loading screen + start screen wiring.
 */

import type { ControlsLike } from '../core.js';

export type PointerLockLike = ControlsLike;

export class LoadingSystem {
  controls: PointerLockLike;
  private _loadInt: number | null = null;
  private _resolved = false;
  private _recruiterPanel: HTMLElement | null = null;
  private _recruiterTrigger: HTMLElement | null = null;

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

    this._bindStartScreen();
    window.retryImmersiveRoom = () => this._attemptPointerLock();
    document.addEventListener('pointerlockerror', () => {
      window.showImmersiveFallback?.(new Error('Pointer Lock was denied'), 'pointer-lock');
    });
  }

  private _showStart(): void {
    (document.getElementById('loading') as HTMLElement).style.display = 'none';
    (document.getElementById('start-screen') as HTMLElement).style.display = 'flex';
  }

  private _bindStartScreen(): void {
    const startScreen = document.getElementById('start-screen') as HTMLElement | null;
    const startButton = document.getElementById('start-btn') as HTMLElement | null;

    startButton?.addEventListener('click', () => this._attemptPointerLock());

    document.querySelectorAll<HTMLElement>('[data-recruiter-panel]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const panelId = trigger.dataset.recruiterPanel;
        const panel = panelId ? document.getElementById(panelId) : null;
        if (!panel || !startScreen) return;

        document.querySelectorAll('.info-panel').forEach((item) => item.classList.remove('active'));
        this._recruiterPanel = panel;
        this._recruiterTrigger = trigger;
        panel.classList.add('active');
        startScreen.style.display = 'none';
        (panel.querySelector('.panel-close') as HTMLElement | null)?.focus();
      });
    });

    document.querySelectorAll<HTMLElement>('.panel-close').forEach((closeButton) => {
      closeButton.addEventListener('click', (event) => {
        if (closeButton.closest('.info-panel') !== this._recruiterPanel) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this._closeRecruiterPanel();
      }, true);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !this._recruiterPanel) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this._closeRecruiterPanel();
    }, true);

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

  private _closeRecruiterPanel(): void {
    this._recruiterPanel?.classList.remove('active');
    this._recruiterPanel?.classList.remove('terminal-mode');
    this._recruiterPanel = null;
    (document.getElementById('start-screen') as HTMLElement | null)?.style.setProperty('display', 'flex');
    this._recruiterTrigger?.focus();
    this._recruiterTrigger = null;
  }

  private _attemptPointerLock(): void {
    const startScreen = document.getElementById('start-screen') as HTMLElement | null;
    if (startScreen) startScreen.style.display = 'none';
    window.clearImmersiveFallback?.();
    if (typeof this.controls.lock !== 'function') return;
    try {
      this.controls.lock();
    } catch (error) {
      window.showImmersiveFallback?.(error, 'pointer-lock');
    }
  }
}
