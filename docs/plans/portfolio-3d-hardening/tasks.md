# Tasks — Portfolio 3D Hardening

## Point 1 — UI quick wins

- [ ] Remove HP/MP blocks from `#hud` in `docs/index.html`.
- [ ] Remove unused `.hud-bar`, `.hud-bar-inner`, `.hud-yellow`, `.hud-cyan` CSS if no longer needed.
- [ ] Change loading text from `LOADING SAVE FILE...` to `LOADING...`.
- [ ] Add `Esc` key listener in `InteractionSystem` to close panels.
- [ ] Add `click-outside-to-close` for `.info-panel` (ignore clicks inside panel and on interactables).
- [ ] Add `:focus-visible` styles for buttons, inputs, and panel-close.
- [ ] Add `@media (prefers-reduced-motion: reduce)` to disable CRT scanlines/panel scale transitions.
- [ ] Add tests for panel close behavior.
- [ ] Done signal: HP/MP gone, loading says `LOADING...`, panels close with Esc/outside/close button, focus visible.

## Point 2 — AGENTS.md refresh

- [ ] Read existing `AGENTS.md` and `CONTEXT.md`.
- [ ] Write a one-page `AGENTS.md` with:
  - Project one-liner.
  - Key file map.
  - Commands every agent must run.
  - Clean Architecture / ponytail conventions.
  - Decision-log rule.
- [ ] Done signal: new agent can onboard in ≤2 min.

## Point 3 — Ponytail cleanup

- [ ] Delete `docs/js/renderer/post-processing.js` and `psx-pass.js` if no imports.
- [ ] Delete `docs/js/level/decorations/*` and remove call sites.
- [ ] Delete legacy builders: `kitchen.js`, `bathroom.js`, `fridge.js`, `mirror.js`, `sofa.js`.
- [ ] Delete `docs/js/furniture/contract.js` if still unused.
- [ ] Remove `M.concrete`, `texConcrete`, and `makeTexture` export from `assets/index.js`.
- [ ] Remove dead state fields from `core.js`/`domain/world-state.js`.
- [ ] Delete orphan `test-calc-dims.mjs`.
- [ ] Inline or delete trivial wrappers:
  - `EditorErrorHandler` → inline `window.addEventListener` + `getElementById`.
  - `EditorSceneSetup` → plain function if it only delegates.
  - `UndoManager` → inline arrays in `FurnitureManager`.
- [ ] Remove redundant `setup-canvas-mock.js` imports from test files.
- [ ] Update tests that referenced deleted files.
- [ ] Done signal: no `unused` warnings from typecheck/coverage; tests green.

## Point 4 — TypeScript toolchain

- [ ] Add `typescript`, `vite`, `@types/three` as dev dependencies.
- [ ] Create `tsconfig.json` with strict but pragmatic settings.
- [ ] Update `package.json` scripts: `typecheck`, `build`, keep `test`.
- [ ] Add GitHub Actions `typecheck` job.
- [ ] Done signal: `npm run typecheck` passes on current JS (allowJs first) or first TS files.

## Point 5 — TypeScript: full migration

- [ ] Convert `core.js`, `seed.js`, `domain/*.js`, `furniture/contract.js` to `.ts`.
- [ ] Convert `app.js`, `game.js`, `primitives.js` to `.ts`.
- [ ] Convert `renderer/*.js`, `systems/**/*.js`, `level/**/*.js`, `furniture/builders/*.js`, `editor-modules/*.js`, `editor-utils.js`, `editor.js` to `.ts`.
- [ ] Convert tests to `.ts` or keep `.test.js` with JSDoc types.
- [ ] Remove `allowJs` from `tsconfig.json` once all source files are `.ts`.
- [ ] Done signal: zero `.js` files under `docs/js/` except bundled output, `npm run typecheck` green.

## Point 6 — Shared room geometry

- [ ] Extract shared `buildWallsFromOutline(outline, openings)` to `docs/js/level/room-geometry.ts` (or `editor-modules/shared/`).
- [ ] Make `level/index.ts` and `editor-modules/room-builder.ts` import it.
- [ ] Ensure openings (door/window) are computed the same way in both.
- [ ] Done signal: same visual output, fewer lines, both test suites pass.

## Point 7 — Visual fidelity: infrastructure

- [ ] Add `makeRoundedBox` to `primitives.ts` using `RoundedBoxGeometry` from `three/addons`.
- [ ] Upgrade `makeCylinder`/`makeSphere` to accept segment count param with a higher default (16+) while keeping PSX-friendly fallback.
- [ ] Add `makeExtrudedShape` helper for complex 2D profiles.
- [ ] Create deterministic pixel-art texture library: wood grain, fabric weave, brushed metal, matte plastic, screen glow, concrete.
- [ ] Switch `MeshLambertMaterial` structures to `MeshStandardMaterial` with conservative roughness/metalness.
- [ ] Add a visual regression test helper: compare AABB + seed round-trip for rebuilt builders.
- [ ] Done signal: new primitives and textures exist, tests pass, no randomness.

## Point 8 — Visual fidelity: core furniture

- [ ] Rebuild `bed.js`: rounded mattress, headboard with thickness, pillow shapes, blanket drape suggestion.
- [ ] Rebuild `desk.js`: tabletop with edge thickness, tapered legs, drawer block, LED strip glow.
- [ ] Rebuild `nightstand.js`, `tv.js`, `macbook.js`, `gaming-pc.js`, `monitor.js` with rounded boxes and material variation.
- [ ] Ensure each rebuilt builder preserves AABB and seed round-trip.
- [ ] Update tests that assert on geometry counts or materials.
- [ ] Done signal: core furniture looks materially better, tests green.

## Point 9 — Visual fidelity: fixtures

- [ ] Rebuild `ceiling-lamp.js` with shade, bulb emissive, and cord.
- [ ] Rebuild `door.js` and `window.js` with frames, panes, and handles.
- [ ] Rebuild `poster.js` and `fairy-lights.js` with better materials.
- [ ] Done signal: fixtures look detailed and tests pass.

## Point 10 — Visual fidelity: Lulú

- [ ] Rebuild `mini-schnauzer.js` using rounded/extruded shapes: body ellipse, legs as tapered cylinders, head as rounded box, ears as flattened cones.
- [ ] Keep head group structure for existing animation system.
- [ ] Preserve AABB and pet animation tests.
- [ ] Done signal: Lulú is recognizable and no longer boxy; animations still work.

## Point 11 — Visual fidelity: room shell

- [ ] Rebuild walls/floor/ceiling materials with pixel-art textures and subtle trim/baseboards.
- [ ] Add floor planks or tile grid via UV mapping or texture.
- [ ] Add ceiling vent or light fixture details.
- [ ] Done signal: room shell looks cohesive with new furniture.

## Point 12 — Career Skyline window view

- [ ] Replace generic `cityscape.js` buildings with stylized skyline representing Alfredo's career.
- [ ] Map companies/roles/skills to building shapes/colors/emissive accents (e.g., GeoPagos = fintech tower, Rappi = delivery hub).
- [ ] Add depth layers: background towers, midground neon signs, foreground flying drones/cars.
- [ ] Keep parallax behavior and seed compatibility.
- [ ] Add tests for skyline generation determinism.
- [ ] Done signal: window view is personalized, parallax works, tests pass.

## Point 13 — Rendering quality + real loading

- [ ] Raise default render quality: `pixelRatio` 1.0 on capable devices, `PCFSoftShadowMap`, better material settings.
- [ ] Replace `Math.random()` in `textures.ts` with seeded or static values.
- [ ] Track actual readiness: renderer created, builders registered, level built.
- [ ] Replace `setInterval` fake progress with real milestones.
- [ ] Allow skipping the loading animation on click/space.
- [ ] Render model-viewer on demand instead of continuously.
- [ ] Done signal: visuals look sharper, loading completes when world is ready, can be skipped.

## Point 14 — Shareable seeds

- [ ] In `app.ts`, read `?seed=` on boot and call `deserializeSeed`.
- [ ] In editor, add "Save slot" / "Load slot" UI backed by `localStorage`.
- [ ] Add "Copy shareable link" button that builds `?seed=...` URL with base64.
- [ ] Add tests for round-trip and URL loading.
- [ ] Done signal: user can share a link that recreates the room; editor persists 3+ slots.

## Point 15 — Mobile touch FPS controls

- [ ] Replace static resume fallback with on-screen virtual joystick for move.
- [ ] Add touch look: drag right side of screen to rotate camera.
- [ ] Add interact/fire button for touch.
- [ ] Degrade to static resume only if PointerLock/WebGL fails.
- [ ] Add tests for touch-controls module.
- [ ] Done signal: mobile user can walk, look, and interact.

## Point 16 — Portfolio Tour

- [ ] Add "Take a tour" button to start screen.
- [ ] Define tour stops with camera positions and target objects.
- [ ] Animate camera along a smooth path between stops.
- [ ] Open relevant info panel at each stop.
- [ ] Allow skip/exit with `Esc` or click.
- [ ] Add tests for tour path and stop logic.
- [ ] Done signal: tour runs end-to-end and can be skipped.

## Point 17 — Dynamic time of day

- [ ] Read user's local time on load.
- [ ] Map time of day to lighting presets (morning/afternoon/night).
- [ ] Adjust ambient light, window brightness, Career Skyline emissives, PC LEDs, and Lulú behavior.
- [ ] Provide deterministic fallback for visual snapshots.
- [ ] Add tests for time-to-preset mapping.
- [ ] Done signal: room lighting changes based on local time; snapshots remain stable.

## Point 18 — Dynamic screen reflections

- [ ] Add render target setup for reflective screens (MacBook, monitor, TV).
- [ ] Render a secondary camera from the screen's perspective to the target.
- [ ] Update reflection texture on player move and AlphGPT terminal open.
- [ ] Degrade to static emissive texture on low-end devices.
- [ ] Add tests for reflection setup and fallback.
- [ ] Done signal: screens reflect room/player; low-end devices show static glow.

## Point 19 — AlphGPT MacBook terminal mode

- [ ] Remove floating `#panel-alphgpt` and AlphGPT panel logic.
- [ ] Mark MacBook as interactable; clicking it triggers terminal mode.
- [ ] Smoothly animate camera to a fixed "laptop screen" view.
- [ ] Hide HUD/crosshair during terminal mode.
- [ ] Render terminal UI over/aligned with the 3D MacBook screen.
- [ ] Add AlphGPT context memory, fuzzy intent matching, state-aware intents.
- [ ] Fix interact click bug so terminal mode opens reliably.
- [ ] Exit terminal mode with `Esc` or close button.
- [ ] Add tests for terminal mode state and intents.
- [ ] Done signal: AlphGPT feels like using the laptop; camera transitions work; tests pass.

## Point 20 — In-game object labels

- [ ] Add `label` / `name` data to every `room.interactables` entry at build time.
- [ ] Update `InteractionSystem.updatePrompt` to show `"[E] <furniture name>"` instead of generic prompt.
- [ ] Use item type as fallback if no custom name.
- [ ] Add tests for prompt label behavior.
- [ ] Done signal: hovering furniture shows its name in the prompt.

## Point 21 — Editor grid snap toggle

- [ ] Add snap UI in `editor.html` (toggle + grid size input).
- [ ] Persist snap setting in `localStorage`.
- [ ] Apply snap to furniture placement and drag movement.
- [ ] Add tests for snap math.
- [ ] Done signal: toggle works, placement aligns to grid when enabled, setting survives reload.

## Point 22 — Lightweight PWA

- [ ] Add `docs/manifest.json` with name, short_name, icons, theme_color, background_color.
- [ ] Add service worker (`docs/sw.js`) caching static assets and fallback to network.
- [ ] Register service worker in `docs/index.html`.
- [ ] Add `apple-touch-icon` and `theme-color` meta tags.
- [ ] Add simple test or validation for manifest JSON.
- [ ] Done signal: Lighthouse PWA audit passes basic checks, offline shell loads.

## Point 23 — Keyboard shortcut legend

- [ ] Add in-game legend overlay toggled by `H` or `?`.
- [ ] Add editor legend overlay toggled by `H` or `?`.
- [ ] List controls: move, look, interact, close panels, editor tools.
- [ ] Ensure legend closes with `Esc` or same key.
- [ ] Add tests for toggle behavior where feasible.
- [ ] Done signal: user can open/close legend in game and editor.

## Point 24 — UI snapshot testing

- [ ] Add Playwright screenshot helper with deterministic camera angles and fixed seed.
- [ ] Capture baselines: loading screen, start screen, default room view, editor default view, model-viewer default view.
- [ ] Use `pixelmatch` for image diff with tolerance.
- [ ] Store baselines in `tests/__snapshots__/`.
- [ ] Add scripts: `test:visual`, `test:visual:update`.
- [ ] Add CI job that runs visual tests on PRs.
- [ ] Done signal: `npm run test:visual` passes with baselines.

## Point 25 — Test consolidation + E2E smoke

- [ ] Add Vitest coverage (`v8`) to `vitest.config.js`.
- [ ] Merge `pet-animation.test.js` and `pet-animator.test.js`.
- [ ] Remove redundant `setup-canvas-mock.js` imports from test files.
- [ ] Revive Playwright E2E with minimal smoke tests:
  - `index.html` loads without console errors.
  - `editor.html` loads without console errors.
- [ ] Add `test:e2e` script and CI job.
- [ ] Add CI coverage gate (e.g., ≥70% on core).
- [ ] Done signal: coverage report generated, duplicates removed, E2E smoke green.
