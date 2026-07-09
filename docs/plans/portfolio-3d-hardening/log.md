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

## 2026-06-27 — TypeScript migration completed

- Resumed migration with parallel batches:
  - **Batch 4** (35 files): all `furniture/builders/*.js` → `.ts`.
  - **Batch 5** (15 files): all `editor-modules/*.js` → `.ts`.
  - **Batch 6** (6 files): `app.js`, `game.js`, `editor.js`, `furniture/index.js`, `furniture/meta.js`, `systems/animation/*.js` → `.ts`.
- Fixed `FurnitureRegistry.BuilderResult` to allow `{ mesh }` plus extra fields (e.g., macbook terminal metadata).
- Refined `EditorAppConfig`, `OutlineEditorConfig`, and `InteractionConfig` to share typed `EditorColors`/`EditorGeometry`.
- Added `Interactable` type to `domain/world-state.ts` and propagated it through `game.ts`.
- Updated `renderer/setup.ts` and `renderer/index.ts` to expose `PerspectiveCamera`.
- Removed `allowJs` from `tsconfig.json`; JS tests remain `.js` and are no longer included in `tsc` typecheck (Vitest still runs them).
- Total: **~87 source files converted**, zero `.js` files under `docs/js/`.
- Verification: `npm run typecheck` green, `npm test -- --run` green (472 tests / 52 files).
- Updated `board.md`: TypeScript migration → 🟢 done; shared room geometry → 🟢 done; rendering quality → 🟢 done.

## 2026-06-27 — Visual fidelity: infrastructure

- `primitives.ts`: added `makeExtrudedShape(points, depth, pos)` for complex 2D profiles.
- `assets/textures.ts`: rewrote as deterministic pixel-art texture library.
  - Replaced remaining `Math.random()` in `texTerminal` and `texWood` with seeded LCG.
  - Added `texFabric`, `texMetal`, `texPlastic`, `texScreenGlow`, `texConcrete`.
  - Added `TEXTURES` map and exported `rng`/`makeTexture` utilities.
  - Avoided Canvas APIs unsupported by happy-dom (`createLinearGradient`, `createRadialGradient`, `arc`) so tests keep running headless.
- `assets/index.ts`: re-exports all new textures.
- `materials.ts` already uses `MeshStandardMaterial` via `makeStd`; no Lambert material remains in source.
- Added visual regression helper `tests/helpers/builder-regression.ts` plus `tests/builder-regression.test.ts` covering bed, desk, nightstand, gamingPC, macBook, tv, monitor, ceilingLamp.
- Verification: `npm run typecheck` green, `npm test -- --run` green (472 tests / 52 files, including new regression tests).
- Updated `board.md`: Visual fidelity: infrastructure → 🟢 done.

## 2026-06-27 — Visual fidelity: core furniture

- Rebuilt 7 core furniture builders with textured PBR materials and rounded/extruded shapes:
  - `bed.ts`: tapered wood legs, fabric mattress/pillows/blanket, padded headboard inset.
  - `nightstand.ts`: tapered legs, metal feet caps, wood body with metal handle.
  - `gaming-pc.ts`: plastic case, metal frame, glass side panel, visible GPU glow via `texScreenGlow`, tapered feet.
  - `desk.ts`: wood tabletop, tapered metal legs, plastic feet, two drawers with metal handles, LED strip.
  - `tv.ts`: rounded plastic frame, metal stand, deterministic `texScreenGlow` screen.
  - `macbook.ts`: metal base/lid, plastic bezel, textured trackpad, `texScreenGlow` display; preserved lid rotation at `-Math.PI / 2 - 0.55`.
  - `monitor.ts`: plastic frame, metal stand, bezel glow strips, `texScreenGlow` panel.
- All builders use the deterministic texture library (`texWood`, `texFabric`, `texMetal`, `texPlastic`, `texScreenGlow`); no `Math.random()` remains in these files.
- Preserved return contracts (`type`, `panelId`, `label`, `room` for tv/macBook).
- Regression tests confirm AABB round-trip stability for all 7 rebuilt items.
- Verification: `npm run typecheck` green, `npm test -- --run` green (472 tests / 52 files).
- Updated `board.md`: Visual fidelity: core furniture → 🟢 done.

## 2026-06-27 — Visual fidelity: fixtures

- Rebuilt 5 fixture builders with textured PBR materials and more detailed geometry:
  - `ceiling-lamp.ts`: metal rod/cord, socket rings, truncated-cone shade with thickness, emissive bulb, shadow-casting point light.
  - `door.ts`: wood-textured frame with real depth, raised panel with inset detail, metal handle/backplate, hinges.
  - `window.ts`: wood-textured frame with depth, sill, glass pane, muntins, metal latch; retained cityscape/spotlight.
  - `poster.ts`: deterministic canvas texture (rects + text), curved paper plane, wooden frame border.
  - `fairy-lights.ts`: deterministic sine-based organic wire sag, metal wire texture, emissive bulbs, point lights.
- All fixtures use `texWood`, `texMetal`, or deterministic canvas; no `Math.random()` added.
- Preserved return contracts and AABB round-trip stability.
- Verification: `npm run typecheck` green, `npm test -- --run` green (472 tests / 52 files).
- Updated `board.md`: Visual fidelity: fixtures → 🟢 done.

## 2026-06-27 — Visual fidelity: Lulú

- Rebuilt `mini-schnauzer.ts` with more schnauzer-like proportions and materials:
  - Textured coat via `texFabric` (dark/white/light gray).
  - Rounded body with white belly patch and red collar.
  - More rectangular muzzle, bushy beard, nose, eyes, eyebrow tufts.
  - Triangular folded ears, tapered front/back legs with paws.
  - Short docked tail with tip sphere.
- Preserved animation-critical named objects: `body`, `head`, `tail`, `earL`, `earR`.
- Kept existing `eyebrowL` / `eyebrowR` names for test compatibility.
- Pet animation tests (`pet-animation.test.js`, `animation-system.test.js`) still pass.
- Verification: `npm run typecheck` green, `npm test -- --run` green (472 tests / 52 files).
- Updated `board.md`: Visual fidelity: Lulú → 🟢 done.

## 2026-06-27 — Visual fidelity: room shell

- Updated `level/index.ts` room shell:
  - Floor: world-space UVs on `ShapeGeometry` so `texFloor` plank pattern aligns across the room.
  - Added floor perimeter trim along each wall edge.
  - Ceiling: added recessed tile-grid overlay (thin box beams) on top of the textured ceiling.
  - Replaced simple ceiling vent box with a grouped vent housing + horizontal slats using `texMetal`.
- Walls already had baseboard/crown trim via `buildWallsFromOutline`; material uses `texWall`.
- No collision or seed behavior changed.
- Verification: `npm run typecheck` green, `npm test -- --run` green (472 tests / 52 files).
- Updated `board.md`: Visual fidelity: room shell → 🟢 done.

## 2026-06-27 — Career Skyline window view

- Confirmed `docs/js/level/cityscape.ts` already implements the personalized Career Skyline:
  - `CAREER_LANDMARKS`: GeoPagos (fintech), Rappi (delivery), ALPH0X (personal), FullStack (skills), Leadership (mentor).
  - Each landmark maps to a shape, base color, and neon accent color.
  - Three parallax depth layers: background towers, midground career buildings, foreground drones/cars.
  - Deterministic seeded RNG (`makeSeededRng`).
  - `userData._parallax` / `_parallaxFactor` preserved for existing parallax system.
- Added test in `tests/parallax.test.js` verifying career-themed landmark buildings exist in the midground layer.
- Existing determinism test in `tests/parallax.test.js` already validates identical output for identical seeds.
- Verification: `npm run typecheck` green, `npm test -- --run` green (473 tests / 52 files).
- Updated `board.md`: Career Skyline window → 🟢 done.

## 2026-06-27 — Shareable seeds

- Verified existing implementation in `app.ts` already reads `?seed=<base64>` and applies it to `ROOM_LAYOUT` on game boot.
- Extracted URL seed logic into `applySeedFromUrl(search, target)` in `docs/js/seed.ts` so it is testable without booting the full renderer.
- Updated `app.ts` to use `applySeedFromUrl`.
- Verified editor UI already has **Copy Shareable Link** and **Save/Load slots 1-3** buttons wired to `_copyShareableLink`, `_saveSlot`, `_loadSlot` in `docs/js/editor-modules/editor-app.ts`.
- Added tests:
  - `tests/app-seed-url.test.js` — URL helper coverage (no seed, valid seed, invalid seed, DEFAULT_SEED).
  - `tests/editor-behavior.test.js` — btnCopyLink, btnSaveSlot1, btnLoadSlot1, empty-slot behavior.
- Backward compatibility with `DEFAULT_SEED` preserved.
- Verification: `npm run typecheck` green, `npm test -- --run` green (481 tests / 53 files).
- Updated `board.md`: Shareable seeds → 🟢 done.

## 2026-06-27 — Mobile touch FPS controls

- Confirmed `docs/js/systems/touch-controls.ts` already implements on-screen FPS controls:
  - Left-side virtual joystick → moveForward/Backward/Left/Right.
  - Right-side drag-to-look with pitch clamping.
  - Interact button (`E`) wired to `game.interact()`.
  - DOM cleanup on `destroy()`.
- Confirmed `app.ts` detects mobile and instantiates `TouchControls`, while desktop uses `PointerLockControls`.
- Confirmed `game.ts` allows movement when `touchControls.isActive` and calls `touchControls.update()` each frame.
- Confirmed CSS shows `#touch-controls` in coarse-pointer landscape and keeps `#mobile-resume` as portrait fallback (last-resort degrade).
- Existing `tests/touch-controls.test.js` covers joystick activation, input mapping, look delta, interact, and destroy.
- Verification: `npm run typecheck` green, `npm test -- --run` green (481 tests / 53 files).
- Updated `board.md`: Mobile touch FPS controls → 🟢 done.

## 2026-06-27 — Portfolio Tour

- Confirmed `docs/js/game.ts` already implements the Portfolio Tour:
  - 5 scripted stops (bed → desk → macbook → window → pet) with positions, look targets, and panel IDs.
  - `startTour()` activates tour, hides start screen, shows skip button.
  - `updateTour()` interpolates camera position/rotation with easing, opens relevant info panel at each stop, dwells, then advances.
  - `stopTour()` / `skipTour()` exit tour and return to first-person.
- `index.html` has **TAKE A TOUR** and skip buttons.
- Existing `tests/tour.test.js` covers start, camera movement, panel opening, skip, and end-of-tour behavior.
- Verification: `npm run typecheck` green, `npm test -- --run` green (481 tests / 53 files).
- Updated `board.md`: Portfolio Tour → 🟢 done.

## 2026-06-27 — Dynamic time of day

- Confirmed `docs/js/level/lighting.ts` already implements dynamic time of day:
  - `getTimeOfDayPreset()` maps local hour to `morning` / `afternoon` / `night`.
  - `resolveNow()` reads `window.__TIME_OF_DAY_NOW__` for tests, uses deterministic fallback `2026-06-22T14:00:00` under `navigator.webdriver`, or `new Date()` in production.
  - `applyTimeOfDay()` adjusts window emissives, PC LEDs, cityscape emissives, point lights, and window spot light.
  - `setupLighting()` creates lights with preset intensities.
- Added "Lulú sleeps at night" behavior:
  - `domain/pet.ts`: new `isSleeping` property.
  - `application/pet-animator.ts`: accepts `timeOfDay` (default `afternoon`); when `night`, `isSleeping = true` and breathing slows, tail stops, ears droop, head goes neutral.
  - `infrastructure/pet-renderer.ts`: when sleeping, rotates head down (`rotation.x ≈ -0.45`).
  - `systems/animation/pet.ts`: passes current preset from `getTimeOfDayPreset()`.
- Added tests in `tests/pet-animation.test.js` for `isSleeping`, still tail, lowered head, and non-sleeping in the afternoon.
- Verification: `npm run typecheck` green, `npm test -- --run` green (485 tests / 53 files).
- Updated `board.md`: Dynamic time of day → 🟢 done.

## 2026-07-07 — session N — Tackle 3.0 migration

### Intake (context gathered)
- Requirement: migrate the existing `portfolio-3d-hardening` plan from Tackle 2.1.x to Tackle 3.0.
- Docs read: current `README.md`, `spec.md`, `tasks.md`, `board.md`, `decisions.md`, `questions.md`, `log.md`; Tackle 3.0 skill, templates (`plan.tmpl.md`, `point.tmpl.md`, `todo.tmpl.md`, `reference.tmpl.md`, `board.tmpl.md`, `AGENTS.tmpl.md`, `design-contract.tmpl.md`, `execution-strategy.tmpl.md`, `lint-spec.md`), `migrate.md` guide.
- Codebase: `~/Developer/alph0x.github.io`.

### Did
- Migrated plan structure to Tackle 3.0:
  - Created `plan.md` from `spec.md` with point decomposition, dependency graph, and acceptance criteria.
  - Created `points/` with 25 self-contained point briefings (P-01 … P-25).
  - Created `todo.md` with planning-readiness checklist.
  - Created `reference.md` with anchored `file:line` citations for current code state.
  - Updated `README.md` to v3.0 index format.
  - Updated `board.md` to v3.0 format (Point/What/Briefing/Depends on/Status).
  - Updated `questions.md` to v3.0 format with resolved Q-01 … Q-07.
  - Added `D-21` migration decision to `decisions.md`.
  - Created `design-contract.md` (minimal) and `execution-strategy.md` (minimal).
  - Created plan-local `docs/plans/portfolio-3d-hardening/AGENTS.md` inheriting from root.
  - Updated root `AGENTS.md` with Tackle 3.0 methodology stamp, autonomy level, and harness map.
  - Sealed acceptance criteria of done points P-01 … P-17 with `SEALED: D-21`.
- Removed obsolete `spec.md` and `tasks.md` after their content was migrated.
- Ran `npm test -- --run` and `npm run typecheck` to verify the workspace is still green.

**Evidence** — `npm run typecheck`
```
> alph0x-portfolio@1.0.0 typecheck
> tsc --noEmit
```
exit: 0

**Evidence** — `npm test -- --run`
```
Test Files  53 passed (53)
Tests  485 passed (485)
```
exit: 0

**Evidence** — Tackle lint-spec
```
lint: 8/8 checks passed
```
exit: 0

### Decisions
- D-21: migrate the plan to Tackle 3.0. Full entry in `decisions.md`.

### Blockers / open questions
- None. All historical questions resolved; no new blockers introduced by migration.

### Next
- Resume execution with the next ready point from `board.md` (P-18, P-20, P-21, P-22, or P-23 are the most independent remaining points).
- Run `/tackle-verify` before starting the next wave.

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-17 are 🟢 and sealed. Foundation, Cleanup, Core, Visual, and several Product points are complete.
- In flight: none (planning-only migration session).
- Blocked on: nothing.
- Resume from: pick the next ready point from `board.md` and execute its done-signal.


## 2026-07-07 — session 8 — P-24 UI snapshot testing

### Intake (context gathered)
- Requirement: implement P-24 — visual regressions caught in CI with deterministic screenshots.
- Docs read: `points/P-24-ui-snapshot-testing.md`, `playwright.config.cjs`, `tests/visual/snapshots.spec.cjs`, `.github/workflows/ci.yml`, `package.json`.
- Scope hints: Playwright + visual spec + baselines already existed, but index test was flaky (captured loading screen) and CI ran on Linux while baselines were macOS.

### Did
- Fixed `tests/visual/snapshots.spec.cjs` to wait for `#start-screen` visibility before screenshotting index.html.
- Added room-view snapshot with a fixed seed URL and hidden HUD overlays.
- Generated new baseline `room-chromium-darwin.png`.
- Switched CI `visual` job from `ubuntu-latest` to `macos-latest` so platform-specific baselines match.
- Verified `npm run test:visual` passes locally (4/4).
- Marked P-24 🟢 done in `board.md`.

**Evidence** — `npm run typecheck`
```
> tsc --noEmit
```
exit: 0

**Evidence** — `npm test -- --run`
```
Test Files  55 passed (55)
Tests  499 passed (499)
```
exit: 0

**Evidence** — `npm run test:visual`
```
Running 4 tests using 1 worker
4 passed
```
exit: 0

### Decisions
- macOS CI for visual snapshots: can't generate Linux baselines from macOS, and matching the baseline platform is simpler than cross-platform rendering normalization.

### Blockers / open questions
- None.

### Next
- P-25 Test consolidation + E2E smoke (last point).

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-24 are 🟢.
- In flight: none.
- Blocked on: nothing.
- Resume from: P-25 Test consolidation + E2E smoke.


## 2026-07-07 — session 7 — P-19 AlphGPT MacBook terminal mode + state-aware answers

### Intake (context gathered)
- Requirement: implement P-19 — AlphGPT feels like a real laptop terminal; click bug fixed; state-aware answers work.
- Docs read: `points/P-19-alphgpt-terminal-mode.md`, `docs/js/systems/alphgpt.ts`, `docs/js/systems/interaction.ts`, `docs/js/game.ts`, `docs/index.html`, `tests/alphgpt.test.js`.
- Scope hints: terminal zoom and panel already existed; state awareness was missing.

### Did
- Added `AlphGPTContext` interface and state-aware intents: `time`, `room`, `lulu`, `moving`.
- `game.ts` now updates `window.__alphgptContext` each frame with time of day, furniture list, Lulú proximity, movement, and tour state.
- `index.html` passes the context to `askAlphGPT` / `processTerminalCommand`.
- Existing terminal zoom + click-guard in `interaction.ts` covers the "click bug" requirement.
- Added 4 tests in `tests/alphgpt.test.js` for dynamic time, room, lulu, and movement responses.
- Marked P-19 🟢 done in `board.md`.

**Evidence** — `npm run typecheck`
```
> tsc --noEmit
```
exit: 0

**Evidence** — `npm test -- --run`
```
Test Files  55 passed (55)
Tests  499 passed (499)
```
exit: 0

### Decisions
- Used a global `window.__alphgptContext` to avoid plumbing UI state through many layers; game writes it, UI reads it. Simplest seam for a UI script embedded in HTML.
- Dynamic responses fall back to static responses when no context is provided, keeping tests backward-compatible.

### Blockers / open questions
- None.

### Next
- P-24 UI snapshot testing (now unblocked).

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-19, P-20, P-21, P-22, P-23 are 🟢.
- In flight: none.
- Blocked on: nothing.
- Resume from: P-24 UI snapshot testing.


## 2026-07-07 — session 6 — P-18 Dynamic screen reflections

### Intake (context gathered)
- Requirement: implement P-18 — screens feel like real reflective surfaces; low-end devices fall back to static emissive.
- Docs read: `points/P-18-dynamic-screen-reflections.md`, `docs/js/game.ts`, `docs/js/furniture/builders/{macbook,monitor,tv}.ts`, `docs/js/renderer/setup.ts`.
- Scope hints: `game.ts` already had interfaces and stub methods, but implementation was inconsistent with types (used `sr.rt` that didn't exist) and used an unsafe inline cast.

### Did
- Fixed type mismatch by storing `WebGLRenderTarget` per screen in `ScreenReflectTarget`.
- Replaced unsafe `(mat.map as { isCanvasTexture?: boolean }).isCanvasTexture` with `mat instanceof THREE.MeshBasicMaterial` and `mat.map instanceof THREE.CanvasTexture`.
- Implemented per-screen reflection camera positioned along the screen normal and looking outward.
- Added low-end fallback: skip reflection setup on mobile/touch devices, keeping original emissive `texScreenGlow`.
- Throttled updates to every `frameInterval` (6) frames.
- Added `tests/screen-reflections.test.js` with 3 tests (target creation, update no-crash, low-end skip).
- Marked P-18 🟢 done in `board.md`.

**Evidence** — `npm run typecheck`
```
> tsc --noEmit
```
exit: 0

**Evidence** — `npm test -- --run`
```
Test Files  55 passed (55)
Tests  495 passed (495)
```
exit: 0

### Decisions
- Per-screen RTs over shared RT: gives each screen its own angle, and only 3 small 256x256 targets are created on desktop.
- Low-end detection uses viewport + touch points; no extra API, deterministic.

### Blockers / open questions
- None.

### Next
- P-19 AlphGPT MacBook terminal mode (now unblocked).

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-17, P-18, P-20, P-21, P-22, P-23 are 🟢.
- In flight: none.
- Blocked on: nothing.
- Resume from: P-19 AlphGPT MacBook terminal mode.


## 2026-07-07 — session 5 — P-23 Keyboard shortcut legend

### Intake (context gathered)
- Requirement: implement P-23 — in-game and editor keyboard shortcut legends toggled with H/?.
- Docs read: `points/P-23-keyboard-shortcut-legend.md`, `docs/index.html`, `docs/editor.html`, `docs/js/systems/input.ts`, `docs/js/editor-modules/interaction-manager.ts`, `tests/input-legend.test.js`, `tests/editor-legend.test.js`.
- Scope hints: markup, styles, and toggle logic were already present; point-specific tests exist.

### Did
- Verified existing legend overlays in both HTML files.
- Verified `InputSystem` (game) and `InteractionManager` (editor) toggle `#legend` on `H`/`?`, close on `Esc`, and ignore inputs while typing.
- Ran focused tests: `tests/input-legend.test.js` and `tests/editor-legend.test.js` → 8/8 passed.
- Marked P-23 🟢 done in `board.md`.

**Evidence** — `npm test -- --run tests/input-legend.test.js tests/editor-legend.test.js`
```
Test Files  2 passed (2)
Tests  8 passed (8)
```
exit: 0

**Evidence** — `npm run typecheck`
```
> tsc --noEmit
```
exit: 0

### Decisions
- No code changes: implementation and tests were already in place from prior work. Board/log updated to reflect reality.

### Blockers / open questions
- None.

### Next
- P-18 Dynamic screen reflections (next unblocked product point).

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-17, P-20, P-21, P-22, P-23 are 🟢.
- In flight: none.
- Blocked on: nothing.
- Resume from: P-18 Dynamic screen reflections.


## 2026-07-07 — session 4 — P-21 Editor grid snap toggle

### Intake (context gathered)
- Requirement: implement P-21 — editor placement aligns to a configurable grid when snap is enabled.
- Docs read: `points/P-21-editor-grid-snap-toggle.md`, `docs/js/editor-modules/state.ts`, `editor-app.ts`, `interaction-manager.ts`, `ui-manager.ts`, `editor.html`, `tests/editor-state.test.js`.
- Scope hints: UI already existed; wiring was half-done (callbacks persisted but didn't affect snap math).

### Did
- Added typed `snapEnabled` and `snapSize` accessors to `EditorState`.
- Wired `_setSnapEnabled` / `_setSnapSize` to update `state` and `config.snap`.
- Made `InteractionManager` snap conditional: `(v) => (this.state.snapEnabled ? editorSnap(v, this.state.snapSize) : v)`.
- Added `_loadSnapSettings()` to restore `editor-snap-enabled` / `editor-snap-size` from `localStorage` and sync UI inputs.
- Added 2 tests in `tests/editor-state.test.js` for default/mutated snap settings.
- Marked P-21 🟢 done in `board.md`.

**Evidence** — `npm run typecheck`
```
> tsc --noEmit
```
exit: 0

**Evidence** — `npm test -- --run`
```
Test Files  54 passed (54)
Tests  492 passed (492)
```
exit: 0

### Decisions
- Kept `snap` as a function passed to `InteractionManager` so the manager stays pure/ignorant of state; the closure reads `state.snapEnabled` at drag time.
- Default `snapEnabled: true`, `snapSize: 0.05` to match existing behavior.

### Blockers / open questions
- None.

### Next
- P-23 Keyboard shortcut legend (infrastructure partially present in InteractionManager), or P-18 Dynamic screen reflections.

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-17, P-20, P-21, P-22 are 🟢.
- In flight: none.
- Blocked on: nothing.
- Resume from: pick next ready point (P-23 or P-18).


## 2026-07-07 — session 3 — P-22 Lightweight PWA

### Intake (context gathered)
- Requirement: implement P-22 — lightweight PWA (manifest, service worker, icons, offline shell).
- Docs read: `points/P-22-lightweight-pwa.md`, existing `docs/index.html` already had `manifest` link and SW registration stub.
- Scope hints: keep it native, no frameworks; cache only the static app shell.

### Did
- Generated icon set under `docs/icons/`: 32x32 favicon, 192x192, 512x512, 180x180 Apple touch icon.
- Created `docs/manifest.json` with theme `#0c0a09`, accent `#00ff9d`, `standalone` display.
- Created `docs/sw.js` with Cache-First strategy, root-relative shell asset list, and install/activate/fetch listeners.
- Fixed `docs/index.html` PWA meta tags (removed duplicate `theme-color`, updated icons, added favicon).
- Added `tests/manifest.test.js` validating manifest JSON, required fields, icon files, and SW event listeners.
- Marked P-22 🟢 done in `board.md`.

**Evidence** — `npm run typecheck`
```
> tsc --noEmit
```
exit: 0

**Evidence** — `npm test -- --run`
```
Test Files  54 passed (54)
Tests  490 passed (490)
```
exit: 0

### Decisions
- Used root-relative (`/`) asset paths in `sw.js` because the site deploys at domain root on GitHub Pages; relative paths would risk scope mismatch.
- Kept SW cache minimal (app shell + icons) to avoid stale JS module issues; dynamic assets are cached opportunistically only after first fetch.

### Blockers / open questions
- None.

### Next
- Continue with next ready point: P-21, P-23, or P-24 (P-24 now unblocked since P-22 is done).

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-17, P-20, P-22 are 🟢.
- In flight: none.
- Blocked on: nothing.
- Resume from: pick next ready point (P-21, P-23, or P-24).


## 2026-07-07 — session 2 — P-20 In-game object labels

### Intake (context gathered)
- Requirement: implement P-20 — show furniture name in hover prompt instead of generic text.
- Docs read: `points/P-20-in-game-object-labels.md`, `docs/js/systems/interaction.ts`, `docs/js/level/index.ts`, `docs/js/furniture/builders/*.ts`, `tests/interaction.test.js`.
- Scope hints: interaction prompt already used `obj.name || obj.type`; level only used `f.name ?? f.type`; builders for tv/macbook/terminal already returned `label`, but core builders did not.

### Did
- Added `label` return to 7 core builders: bed, nightstand, desk, mini-schnauzer, ceiling-lamp, door, window.
- Updated `docs/js/level/index.ts` to fall back to `result.label` before `f.type` when building interactables (`name: f.name ?? label ?? f.type`).
- Added two tests in `tests/interaction.test.js`:
  - shows furniture label in prompt on hover.
  - falls back to type in prompt when label is missing.
- Marked P-20 🟢 done in `board.md`.

**Evidence** — `npm run typecheck`
```
> tsc --noEmit
```
exit: 0

**Evidence** — `npm test -- --run`
```
Test Files  53 passed (53)
Tests  487 passed (487)
```
exit: 0

### Decisions
- None new; followed existing D-10 (keep PSX style) and D-21 (Tackle 3.0 migration).

### Blockers / open questions
- None.

### Next
- Continue with next ready point from Wave 1 (P-21, P-22, P-23, or P-18).

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-17 and P-20 are 🟢.
- In flight: none.
- Blocked on: nothing.
- Resume from: pick next ready point (P-21, P-22, P-23, or P-18).


## 2026-07-07 — session 9 — P-25 Test consolidation + E2E smoke

### Intake (context gathered)
- Requirement: implement P-25 — test suite is lean, coverage is tracked, and E2E smoke tests guard the main pages.
- Docs read: `points/P-25-test-consolidation-e2e-smoke.md`, `vitest.config.js`, `package.json`, `tests/e2e/portfolio.spec.cjs`, `tests/e2e/editor.spec.cjs`, `.github/workflows/ci.yml`.
- Scope hints: coverage config existed but lacked thresholds; `test:e2e` ran every Playwright test (including visual) and clashed with Vitest globals; the full suite was too slow for a smoke gate.

### Did
- Removed `globals: true` from `vitest.config.js` to stop the Playwright/Vitest `expect` collision.
- Added missing `beforeEach` import in `tests/alphgpt.test.js` (the only test that relied on globals).
- Split `test:e2e` into a fast smoke subset (`portfolio.spec.cjs` + `editor.spec.cjs`) and a `test:e2e:full` target for the remaining 13 specs.
- Fixed `portfolio.spec.cjs` flakiness by waiting for `#loading` to hide before asserting `#start-screen` is visible.
- Added `test:coverage` script and coverage thresholds in `vitest.config.js` (statements 75%, branches 65%, functions 75%, lines 78%).
- Added CI `coverage` job with artifact upload.
- Verified done-signal passes.

**Evidence** — `npm run test:e2e && npm run typecheck && npm test -- --run && npm run test:coverage`
```
4 passed (E2E smoke)
Test Files 55 passed (55)
Tests 499 passed (499)
Coverage: Stmts 80.15%, Branch 69.5%, Funcs 80.91%, Lines 82.02%
```
exit: 0

### Decisions
- Keep the full E2E suite as `test:e2e:full` (not in CI) because it takes >5 min and needs retries; the smoke gate covers the critical pages.
- Coverage thresholds are set below current metrics to avoid red builds while still preventing unchecked regressions.

### Blockers / open questions
- None.

### Next
- Plan is complete. Run `/tackle-verify` and close the initiative.

### State snapshot (keep current in the newest entry only)
- Done: P-01 … P-25 are 🟢. All Tackle points complete.
- In flight: none.
- Blocked on: nothing.
- Resume from: run `/tackle-verify` or final plan close-out.


