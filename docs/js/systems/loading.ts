/**
 * @fileoverview Loading screen + start screen wiring.
 */

export interface PointerLockLike {
  lock(): void;
  unlock(): void;
  addEventListener(type: 'unlock' | 'lock', listener: () => void): void;
}

export class LoadingSystem {
  controls: PointerLockLike;

  constructor({ controls }: { controls: PointerLockLike }) {
    this.controls = controls;
  }

  start(): void {
    const loadBar = document.getElementById('loading-bar-fill') as HTMLElement;
    let loadProg = 0;
    const loadInt = setInterval(() => {
      loadProg += 15;
      loadBar.style.width = loadProg + '%';
      if (loadProg >= 100) {
        clearInterval(loadInt);
        setTimeout(() => {
          (document.getElementById('loading') as HTMLElement).style.display = 'none';
          (document.getElementById('start-screen') as HTMLElement).style.display = 'flex';
        }, 300);
      }
    }, 100);

    // Safety timeout: if something silently fails, don't hang forever
    setTimeout(() => {
      if ((document.getElementById('loading') as HTMLElement).style.display !== 'none') {
        clearInterval(loadInt);
        (document.getElementById('loading') as HTMLElement).style.display = 'none';
        (document.getElementById('start-screen') as HTMLElement).style.display = 'flex';
      }
    }, 8000);

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
