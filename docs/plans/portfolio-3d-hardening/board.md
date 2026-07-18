# Board — Portfolio 3D Hardening

**Canonical status board.** `board.md` is the only file that records point status. Do not duplicate status elsewhere.

| Point | What | Briefing | Depends on | Status |
|---|---|---|---|---|
| **P-01 · UI quick wins** | Clean HUD, loading text, Esc/outside close, focus-visible, reduced motion. | `points/P-01-ui-quick-wins.md` | none | 🟢 done |
| **P-02 · AGENTS.md refresh** | One-page agent brief at repo root. | `points/P-02-agents-refresh.md` | P-01 | 🟢 done |
| **P-03 · Ponytail cleanup** | Delete unused files, dead exports, and inline trivial wrappers. | `points/P-03-ponytail-cleanup.md` | P-02 | 🟢 done |
| **P-04 · TypeScript toolchain** | Add TypeScript, Vite, tsconfig, and a `typecheck` script. | `points/P-04-typescript-toolchain.md` | P-03 | 🟢 done |
| **P-05 · TypeScript: full migration** | Convert every source file under `docs/js/` from `.js` to `.ts`. | `points/P-05-typescript-migration.md` | P-04 | 🟢 done |
| **P-06 · Shared room geometry** | Extract shared wall/opening builder used by game and editor. | `points/P-06-shared-room-geometry.md` | P-05 | 🟢 done |
| **P-07 · Visual fidelity: infrastructure** | Rounded/extruded primitives, deterministic textures, PBR materials. | `points/P-07-visual-fidelity-infrastructure.md` | P-06 | 🟢 done |
| **P-08 · Visual fidelity: core furniture** | Rebuild bed, desk, nightstand, TV, macBook, gaming PC, monitor. | `points/P-08-visual-fidelity-core-furniture.md` | P-07 | 🟢 done |
| **P-09 · Visual fidelity: fixtures** | Rebuild ceiling-lamp, door, window, posters, fairy-lights. | `points/P-09-visual-fidelity-fixtures.md` | P-08 | 🟢 done |
| **P-10 · Visual fidelity: Lulú** | Rebuild mini-schnauzer with organic shapes and keep animations. | `points/P-10-visual-fidelity-lulu.md` | P-09 | 🟢 done |
| **P-11 · Visual fidelity: room shell** | Upgrade walls, floor, ceiling, and trim with textures. | `points/P-11-visual-fidelity-room-shell.md` | P-10 | 🟢 done |
| **P-12 · Career Skyline window** | Replace generic cityscape with personalized career skyline. | `points/P-12-career-skyline-window.md` | P-11 | 🟢 done |
| **P-13 · Rendering quality + loading** | Raise default quality, deterministic textures, real loading. | `points/P-13-rendering-quality-loading.md` | P-06 | 🟢 done |
| **P-14 · Shareable seeds** | Load seed from URL, save/load editor slots, copy link. | `points/P-14-shareable-seeds.md` | P-05, P-13 | 🟢 done |
| **P-15 · Mobile touch FPS controls** | On-screen joystick, drag-to-look, interact button. | `points/P-15-mobile-touch-fps-controls.md` | P-05 | 🟢 done |
| **P-16 · Portfolio Tour** | Scripted spectator tour with stops and panel opening. | `points/P-16-portfolio-tour.md` | P-05, P-13 | 🟢 done |
| **P-17 · Dynamic time of day** | Adjust lighting and Lulú behavior based on local time. | `points/P-17-dynamic-time-of-day.md` | P-12, P-13 | 🟢 done |
| **P-18 · Dynamic screen reflections** | Render targets on MacBook, monitor, and TV screens. | `points/P-18-dynamic-screen-reflections.md` | P-08, P-13 | 🟢 done |
| **P-19 · AlphGPT MacBook terminal mode** | Move AlphGPT to MacBook screen with camera zoom and terminal UI. | `points/P-19-alphgpt-terminal-mode.md` | P-18 | 🟢 done |
| **P-20 · In-game object labels** | Show furniture name in hover prompt. | `points/P-20-in-game-object-labels.md` | P-08 | 🟢 done |
| **P-21 · Editor grid snap toggle** | Snap-to-grid setting with localStorage persistence. | `points/P-21-editor-grid-snap-toggle.md` | P-06 | 🟢 done |
| **P-22 · Lightweight PWA** | Manifest, service worker, icons, offline shell. | `points/P-22-lightweight-pwa.md` | P-01 | 🟢 done |
| **P-23 · Keyboard shortcut legend** | In-game and editor overlays for controls. | `points/P-23-keyboard-shortcut-legend.md` | P-01 | 🟢 done |
| **P-24 · UI snapshot testing** | Playwright screenshot regression for key views. | `points/P-24-ui-snapshot-testing.md` | P-07, P-08, P-13, P-17, P-22 | 🟢 done |
| **P-25 · Test consolidation + E2E smoke** | Coverage, deduplicate tests, revive Playwright smoke. | `points/P-25-test-consolidation-e2e-smoke.md` | P-05, P-24 | 🟢 done |
| **P-26 · External selective assets** | Vendored low-poly GLB models for Lulú and MacBook. | `points/P-26-external-selective-assets.md` | P-08, P-22 | 🟢 done |

### Dependency graph

```
P-01 ──► P-02 ──► P-03 ──► P-04 ──► P-05 ──► P-06 ──► P-13
                                              │
                                              ▼
                                           P-07 ──► P-08 ──► P-09 ──► P-10 ──► P-11 ──► P-12
                                              │                                              │
                                              │                                              ▼
                                              │                                           P-17
                                              │
                                              ├─► P-14
                                              ├─► P-15
                                              ├─► P-16
                                              ├─► P-18 ──► P-19
                                              ├─► P-20
                                              ├─► P-21
                                              ├─► P-22
                                              ├─► P-23
                                              │
                                              ▼
P-17, P-22, P-07, P-08, P-13 ──► P-24 ──► P-25

P-08 ──► P-26
P-22 ──► P-26
```

## Legend

- 🔴 not started
- 🟡 in progress
- ⏸ blocked
- 🟢 done
