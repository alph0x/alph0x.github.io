/**
 * @fileoverview UI bindings and DOM orchestration for the Room Layout Editor.
 * All DOM interactions live here. No direct Three.js or business logic — only callbacks.
 */

export class EditorUIManager {
  constructor({ state, domRefs, deps }) {
    this._state = state;
    this._dom = domRefs;
    this._deps = deps;
  }

  // ── Public API ──────────────────────────────────────────────────

  bindAll() {
    this._bindOutlineTool();
    this._bindResetRect();
    this._bindViewMode();
    this._bindColorInputs();
    this._bindSpawnTools();
    this._bindTransformControls();
    this._bindUndoRedo();
    this._bindExport();
  }

  deactivateAllTools() {
    this._state.activeTool = null;
    this._dom.palette.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    this._dom.toolPlayer.classList.remove('active');
    this._dom.toolLulu.classList.remove('active');
    this._dom.toolOutline.classList.remove('active');
    this._deps.outlineGroup.visible = false;
    this._deps.previewManager.clear();
  }

  updateDimensions({ width, depth, totalEdges, parallel }) {
    if (this._dom.roomDimensions) {
      this._dom.roomDimensions.textContent = `${width.toFixed(2)} × ${depth.toFixed(2)} m`;
    }
    if (this._dom.roomAxisAligned) {
      this._dom.roomAxisAligned.textContent = `${parallel} / ${totalEdges} walls`;
      this._dom.roomAxisAligned.style.color = parallel === totalEdges ? '#10b981' : '#f59e0b';
    }
  }

  setViewModeButton(mode) {
    const btn = this._dom.btnViewMode;
    btn.textContent = mode === '3d' ? '⤒ Top View' : '↻ 3D View';
    btn.classList.toggle('active', mode === '3d');
  }

  updateColorInputs(mat) {
    this._dom.colorFloor.value = mat.floor;
    this._dom.colorFloorText.value = mat.floor;
    this._dom.colorWall.value = mat.wall;
    this._dom.colorWallText.value = mat.wall;
    this._dom.colorCeiling.value = mat.ceiling;
    this._dom.colorCeilingText.value = mat.ceiling;
  }

  buildPalette() {
    const palette = this._dom.palette;
    palette.innerHTML = '';

    const items = this._deps.getPaletteItems ? this._deps.getPaletteItems() : [];
    const groups = new Map();
    for (const { type, meta } of items) {
      const cat = meta?.category || 'other';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push({ type, meta: meta || {} });
    }

    const catOrder = ['furniture', 'decor', 'lights', 'electronics', 'other'];
    for (const cat of catOrder) {
      if (!groups.has(cat)) continue;
      const catItems = groups.get(cat).sort((a, b) => a.type.localeCompare(b.type));

      const catDiv = document.createElement('div');
      catDiv.className = 'palette-category';
      catDiv.innerHTML = `<h3>${cat}</h3>`;

      const grid = document.createElement('div');
      grid.className = 'palette';

      for (const { type, meta } of catItems) {
        const btn = document.createElement('button');
        btn.innerHTML = `<span class="icon">${meta.icon || '📦'}</span><span>${type}</span>`;
        btn.title = meta.dimensions ? `${type} — ${meta.dimensions}` : type;
        btn.addEventListener('click', () => {
          const wasActive = this._state.activeTool === `place:${type}`;
          this.deactivateAllTools();
          if (!wasActive) {
            this._state.activeTool = `place:${type}`;
            btn.classList.add('active');
            this._deps.previewManager.show(type);
          }
        });
        grid.appendChild(btn);
      }

      catDiv.appendChild(grid);
      palette.appendChild(catDiv);
    }
  }

  // ── Private bindings ────────────────────────────────────────────

  _bindOutlineTool() {
    this._bindToolToggle(this._dom.toolOutline, 'outline', () => {
      this._deps.outlineGroup.visible = true;
    });
  }

  _bindResetRect() {
    this._dom.btnResetRect.addEventListener('click', () => {
      this._deps.onResetRect?.();
    });
  }

  _bindViewMode() {
    this._dom.btnViewMode.addEventListener('click', () => {
      this._deps.onViewModeToggle?.();
    });
  }

  _bindColorInputs() {
    const bindOne = (picker, text, key) => {
      picker.addEventListener('input', (e) => {
        text.value = e.target.value;
        this._deps.onColorChange?.(key, e.target.value);
      });
      text.addEventListener('change', (e) => {
        picker.value = e.target.value;
        this._deps.onColorChange?.(key, e.target.value);
      });
    };
    bindOne(this._dom.colorFloor, this._dom.colorFloorText, 'floor');
    bindOne(this._dom.colorWall, this._dom.colorWallText, 'wall');
    bindOne(this._dom.colorCeiling, this._dom.colorCeilingText, 'ceiling');
  }

  _bindSpawnTools() {
    this._bindToolToggle(this._dom.toolPlayer, 'player');
    this._bindToolToggle(this._dom.toolLulu, 'lulu');
  }

  _bindTransformControls() {
    this._dom.btnRotate.addEventListener('click', () => this._deps.furnitureManager?.rotateSelected(45));
    this._dom.btnDelete.addEventListener('click', () => this._deps.furnitureManager?.deleteSelected());

    if (this._dom.selX) {
      this._dom.selX.addEventListener('change', (e) => this._deps.furnitureManager?.setX(e.target.value));
    }
    if (this._dom.selZ) {
      this._dom.selZ.addEventListener('change', (e) => this._deps.furnitureManager?.setZ(e.target.value));
    }
    if (this._dom.selY && this._dom.selYRange) {
      const syncY = (v) => {
        this._deps.furnitureManager?.setY(v);
        this._dom.selY.value = v;
        this._dom.selYRange.value = v;
      };
      this._dom.selY.addEventListener('input', (e) => syncY(e.target.value));
      this._dom.selYRange.addEventListener('input', (e) => syncY(e.target.value));
    }
    if (this._dom.selRot) {
      this._dom.selRot.addEventListener('change', (e) => this._deps.furnitureManager?.setRotation(e.target.value));
    }
    if (this._dom.selName) {
      this._dom.selName.addEventListener('input', (e) => this._deps.furnitureManager?.setName(e.target.value));
    }
  }

  _bindUndoRedo() {
    this._dom.btnUndo.addEventListener('click', () => this._deps.furnitureManager?.undo());
    this._dom.btnRedo.addEventListener('click', () => this._deps.furnitureManager?.redo());
  }

  _bindExport() {
    this._dom.btnExport.addEventListener('click', () => this._deps.onExport?.());
  }

  _bindToolToggle(btn, toolName, onToggle) {
    btn.addEventListener('click', () => {
      const wasActive = this._state.activeTool === toolName;
      this.deactivateAllTools();
      if (!wasActive) {
        this._state.activeTool = toolName;
        btn.classList.add('active');
        if (onToggle) onToggle();
      }
    });
  }
}
