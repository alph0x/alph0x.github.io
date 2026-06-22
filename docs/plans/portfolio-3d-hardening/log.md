# Log — Portfolio 3D Hardening

## 2026-06-21 — Plan created

- Ran parallel audits: `CodeAudit`, `UxAudit`, `TestAudit`.
- Synthesized findings into an initial plan.
- User added two extra requirements mid-planning:
  - Include an `AGENTS.md` refresh at repo root.
  - Include AlphGPT robustness/intelligence improvements.
- Status: plan ready, no implementation started.

## 2026-06-21 — Questions answered

All 7 open questions resolved. See `decisions.md`. Plan spec, board, tasks, and questions updated.

Resolutions:
- TypeScript: full migration, staged.
- Playwright E2E: revive with minimal smoke tests.
- Quality: keep PSX style, raise default rendering quality.
- AlphGPT: professional info + game/editor state + fix click bug.
- Seeds: base64 URLs.
- Mobile: replace static fallback with touch FPS controls.
- Renovation plan: manual/out of scope.

## 2026-06-21 — UI quick wins + feature recommendations added

User requested:
- Remove HP/MP bars from HUD (no mechanic uses them).
- Change loading text from `LOADING SAVE FILE...` to `LOADING...`.

These were added as Point 1 — UI quick wins. Additional recommended future features documented in `spec.md`:
- In-game object labels on hover.
- Photo mode.
- Editor cheat-sheet / hotkey overlay.
- Editor grid snap toggle.
- Editor duplicate selected furniture.
- Lightweight PWA offline cache.
- Keyboard shortcut legend.

## 2026-06-21 — Visual fidelity direction set

User wants a disruptive visual upgrade. Selected medium-fidelity stylized direction:
- Stop building furniture as stacked boxes.
- Use `RoundedBoxGeometry`, cylinders, spheres, extrusions.
- Deterministic pixel-art textures + conservative PBR materials.
- Staged rebuild: infrastructure → core furniture → fixtures → Lulú → room shell.

## 2026-06-21 — Scope expanded

Included features 1, 4, 6, 7 and the full ponytail-audit cleanup:
- In-game object labels (feature 1).
- Editor grid snap toggle (feature 4).
- Lightweight PWA (feature 6).
- Keyboard shortcut legend (feature 7).
- Full ponytail cleanup as a dedicated point.
- Visual fidelity overhaul as five staged points.

Plan grew to 20+ points.

## 2026-06-21 — Career Skyline, ALPH0X Drone, and snapshots proposed

User wanted a less generic window view and UI snapshot testing. Proposed:
- Career Skyline window view (personalized cityscape).
- ALPH0X Drone (visual AlphGPT companion).
- UI snapshot testing with Playwright + pixelmatch.

User approved Career Skyline and snapshots, requested other disruptive ideas instead of the drone.

## 2026-06-21 — Disruptive features selected

User did not like additional drone alternatives. Final disruptive features selected:
- Portfolio Tour — scripted spectator mode from start screen.
- Dynamic time of day — lighting adjusts to user's local time.
- Dynamic screen reflections — render targets on MacBook/monitor/TV screens.
- AlphGPT MacBook terminal mode — AlphGPT moves from floating panel to the laptop screen with camera zoom.

ALPH0X Drone explicitly discarded.

Plan finalized at 25 points across Foundation, Cleanup, Core, Product, and Verification phases.

## 2026-06-22 — Foundation checkpoint

- UI quick wins, AGENTS.md refresh, ponytail cleanup, TypeScript toolchain complete and committed.
- TypeScript migration started but paused: mechanical rename of 87 files is straightforward, but resolving ~1,900 strict-mode type errors requires a dedicated session.
- Next: finish migration, then proceed to shared room geometry, rendering quality, and visual fidelity.

## 2026-06-22 — TypeScript migration resumed (staged)

- Re-evaluated migration strategy: instead of bulk-renaming 87 files, staged approach converting highest-import modules first.
- **Batch 1 complete** (6 files): `domain/pet.ts`, `domain/player.ts`, `domain/world-state.ts`, `core.ts`, `seed.ts`, `primitives.ts`.
- **Batch 2 complete** (7 files): `assets/textures.ts`, `assets/materials.ts`, `assets/index.ts`, `furniture/registry.ts`, `editor-utils.ts`, `application/player-movement.ts`, `application/pet-animator.ts`.
- **Batch 3 complete** (15 files): `infrastructure/pet-renderer.ts`, `infrastructure/player-renderer.ts`, `renderer/index.ts`, `renderer/setup.ts`, `systems/loading.ts`, `systems/touch-controls.ts`, `systems/audio.ts`, `systems/input.ts`, `systems/interaction.ts`, `systems/alphgpt.ts`, `level/index.ts`, `level/lighting.ts`, `level/room.ts`, `level/window.ts`, `level/cityscape.ts`.
- **Shared room geometry extracted**: `buildWallsFromOutline()` moved to `level/room-geometry.ts`, used by both `level/index.ts` and `editor-modules/room-builder.js`.
- Total: **28 files converted**, 59 JS files remain.
- All 447 tests pass, `npm run typecheck` green.
- **Paused at user request** before Batch 4 (furniture/builders/ — 35 files).
- Next remaining batches when resumed:
  - Batch 4: furniture/builders/ (35 files)
  - Batch 5: editor-modules/ (15 files)
  - Batch 6: top-level (app.js, game.js, editor.js) + remaining
  - Final: remove `allowJs` from tsconfig, convert tests to .ts

## 2026-06-22 — Rendering quality raised

- `renderer/setup.ts`: adaptive DPR (cap 2), `PCFSoftShadowMap`, `ACESFilmicToneMapping`, `high-performance` on desktop.
- `systems/loading.ts`: real milestone tracking (renderer, builders, level), skip on click/space, fake interval removed.
- All tests pass, typecheck green.

