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

