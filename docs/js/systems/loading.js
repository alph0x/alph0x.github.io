/**
 * @fileoverview Loading screen + start screen wiring.
 */

export class LoadingSystem {
  constructor({ controls }) {
    this.controls = controls;
  }

  start() {
    const loadBar = document.getElementById('loading-bar-fill');
    let loadProg = 0;
    const loadInt = setInterval(() => {
      loadProg += 15;
      loadBar.style.width = loadProg + '%';
      if (loadProg >= 100) {
        clearInterval(loadInt);
        setTimeout(() => {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('start-screen').style.display = 'flex';
        }, 300);
      }
    }, 100);

    document.getElementById('start-btn').addEventListener('click', () => {
      document.getElementById('start-screen').style.display = 'none';
      this.controls.lock();
    });
    this.controls.addEventListener('unlock', () => {
      const panelOpen = document.querySelectorAll('.info-panel.active').length > 0;
      if (!panelOpen) document.getElementById('start-screen').style.display = 'flex';
    });
    this.controls.addEventListener('lock', () => {
      document.getElementById('start-screen').style.display = 'none';
    });
  }
}
