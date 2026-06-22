# Spec — Portfolio 3D Hardening

## Context

The project is a vanilla-JS + Three.js first-person portfolio: a single low-poly gamer room with an editor, seed serialization, a pet (Lulú), procedural audio, and a client-side assistant (AlphGPT). Tests pass (305/305) but the codebase has accumulated dead code, duplicated geometry logic, non-deterministic procedural assets, and an inactive E2E suite.

## Sources

- `AGENTS.md` — existing agent operating procedures.
- `CONTEXT.md` — architecture log and recent changes.
- `PENDING.md` — completed work up to 2026-05-08.
- `RENOVATION_PLAN.md` — visual/room-size renovation ideas.
- `Technical-Review.md` — older portfolio review with future considerations.
- Audit reports from `CodeAudit`, `UxAudit`, `TestAudit` sub-agents.

## In scope

1. **UI quick wins**
   - Remove HP/MP bars from the HUD (no game mechanic uses them).
   - Change loading text from `LOADING SAVE FILE...` to `LOADING...`.
   - Add `Esc` to close info panels.
   - Add visible `:focus-visible` styles for keyboard navigation.
   - Add `prefers-reduced-motion` support for CRT/panel animations.
   - Add click-outside-to-close for info panels.

2. **AGENTS.md refresh**
   - One-page agent brief at repo root.
   - Must include: project summary, conventions, key commands, file map, and decision-log rules.

3. **Ponytail cleanup**
   - Delete unused `docs/js/renderer/post-processing.js` and `psx-pass.js`.
   - Delete `docs/js/level/decorations/*` legacy system.
   - Delete legacy furniture builders: `kitchen.js`, `bathroom.js`, `fridge.js`, `mirror.js`, `sofa.js`.
   - Delete `docs/js/furniture/contract.js`.
   - Remove unused `M.concrete`, `texConcrete`, and `makeTexture` export from barrel.
   - Remove dead state fields (`velocity`, `direction`, `implants`, `currentRoom`, `meta.prevTime`).
   - Delete orphan `test-calc-dims.mjs`.
   - Inline trivial wrappers: `EditorErrorHandler`, `EditorSceneSetup` if it only delegates, `UndoManager` arrays.
   - Drop unused barrel exports from `assets/index.js`.

4. **TypeScript migration**
   - Add `typescript`, `vite`, `@types/three` as dev dependencies.
   - Convert **every** `docs/js/` file to `.ts`. Staged in multiple points; no file left as plain JS.
   - Keep tests passing; add a `typecheck` CI job.

5. **Shared room geometry**
   - Deduplicate wall/opening subdivision between `level/index.js` and `editor-modules/room-builder.js`.
   - Extract shared `buildWallsFromOutline(outline, openings)` to a single module.

6. **Visual fidelity overhaul — medium quality**
   - Keep the stylized low-poly identity but stop building furniture as stacked boxes.
   - Upgrade `primitives.js`: add `makeRoundedBox`, richer `makeCylinder`/`makeSphere`, and an extrusion helper.
   - Replace procedural noise textures with deterministic pixel-art-style textures: wood grain, fabric weave, brushed metal, matte plastic, screen glow.
   - Switch structures from `MeshLambertMaterial` to `MeshStandardMaterial` with conservative roughness/metalness for soft specular highlights.
   - Stage furniture rebuilds:
     - Stage A: infrastructure + shared materials.
     - Stage B: core furniture (bed, desk, nightstand, TV, macbook, gaming-pc, monitor).
     - Stage C: room fixtures (ceiling-lamp, door, window, posters, fairy-lights).
     - Stage D: Lulú (mini-schnauzer) with more organic shapes.
     - Stage E: room shell (walls, floor, ceiling) with better materials and trim.
   - Add visual regression guard: each rebuilt builder must keep its AABB and seed round-trip.

7. **Runtime quality & performance**
   - Replace `Math.random()` in procedural textures with seeded RNG or static patterns.
   - Keep the PSX visual style as the default/only aesthetic; optimize it so the existing models render at much higher quality.
   - Increase default render quality (pixel ratio, shadow map, material fidelity) while preserving the low-poly look.
   - Implement real asset readiness signal for the loading screen.
   - Make rendering resize-safe (camera aspect, renderer sizing).
   - Render model-viewer on demand instead of continuously.

8. **Career Skyline window view**
   - Replace the generic cityscape outside the window with a stylized skyline where buildings represent Alfredo's career milestones, companies, and skills.
   - Each building can have a subtle color/emissive signature linked to a resume section.
   - Keep it deterministic and seed-compatible.
   - Add parallax as today, but with more depth layers (neon signs, flying cars/drones, atmospheric fog).

9. **Shareable room seeds**
   - Seeds in URLs stay base64-encoded (compact and backward-compatible).
   - On game load, read `?seed=<base64>` from URL and deserialize it.
   - In editor, add "Save slot" / "Load slot" using `localStorage`.
   - Add "Copy shareable link" button that writes a URL with the current base64 seed.
   - Maintain backward compatibility with existing `DEFAULT_SEED`.

10. **Mobile touch FPS controls**
    - Improve the mobile experience with on-screen touch controls for move + look.
    - Keep the static resume fallback only as a last-resort degrade.

11. **Portfolio Tour — spectator mode**
    - Add a "Take a tour" button on the start screen.
    - Camera follows a scripted path through the room, pausing at key objects.
    - At each stop, the relevant info panel opens automatically.
    - User can skip/exit the tour at any time.
    - Add tests for tour path and stop logic.

12. **Dynamic time of day**
    - Read the user's local time on load.
    - Adjust ambient light, window brightness, and city emissive intensity accordingly (morning / afternoon / night).
    - Add subtle behaviors: Lulú sleeps at late hours, PC LEDs dim, room lights adjust.
    - Keep deterministic fallback for visual snapshots.

13. **Dynamic screen reflections**
    - Use render targets on the MacBook, monitor, and TV screens to reflect the room and player.
    - Reflections update when the player moves or when AlphGPT terminal mode opens.
    - Degrade to static emission on low-end devices.

14. **AlphGPT MacBook terminal mode**
    - Keep client-side, no backend.
    - Remove the floating AlphGPT panel. Instead, AlphGPT lives on the MacBook screen.
    - When the player interacts with the MacBook, the camera smoothly zooms in to the laptop screen, the HUD/crosshair fade out, and the terminal UI appears over/around the 3D screen as if typing on the laptop.
    - Mimic an agent chat that returns professional information about Alfredo.
    - Add context memory for the last N exchanges.
    - Add fuzzy intent matching (synonyms, Levenshtein, prefix scoring).
    - Add intents that read current game/editor state ("what is in the room?", "where is Lulú?", "how do I move?", "how do I rotate furniture?").
    - Fix bug where clicking an interactable does not open the AlphGPT/info panel.
    - Improve fallback: suggest known intents instead of a random quip.
    - Press `Esc` or click the close button to exit terminal mode and return camera to first-person.

15. **In-game object labels**
    - Show furniture name on hover in the prompt instead of generic `[CLICK TO INTERACT]`.
    - Update `InteractionSystem.updatePrompt` to read `userData.label` or item type.
    - Add tests for prompt label behavior.

16. **Editor grid snap toggle**
    - Add a snap-to-grid setting in the editor UI.
    - Apply snap to furniture placement and movement when enabled.
    - Persist snap setting in `localStorage`.
    - Add tests for snap math.

17. **Lightweight PWA**
    - Add `manifest.json`, service worker for static asset caching, and `theme-color`/`icons` meta tags.
    - Keep scope limited to offline shell (no runtime seed sync needed).
    - Add tests where feasible; at minimum validate manifest JSON.

18. **Keyboard shortcut legend**
    - Add an in-game overlay showing controls (WASD, mouse, E, Esc).
    - Bind a key (e.g., `H` or `?`) to show/hide the legend.
    - Add editor hotkey overlay as well.

19. **UI snapshot testing**
    - Add screenshot-based regression tests for key visual states.
    - Use Playwright to capture: loading screen, start screen, default room view, editor default view, model-viewer default view.
    - Store baselines in `tests/__snapshots__/`. Compare new screenshots with `pixelmatch` tolerance.
    - Run snapshots in CI but allow updates via `npm run test:visual:update`.
    - Keep snapshots deterministic by using a fixed seed, deterministic textures, and stable camera angles.

20. **Test consolidation**
    - Revive Playwright E2E with minimal smoke tests (`index.html` and `editor.html` load, no console errors).
    - Configure Vitest coverage (`v8` provider).
    - Merge/deduplicate `pet-animation.test.js` and `pet-animator.test.js`.
    - Remove redundant `setup-canvas-mock.js` imports (already loaded via `vitest.config.js`).
    - Add `npm run typecheck` and coverage/typecheck gates in CI.

## Out of scope

- Multi-room or open-world expansion.
- Backend, authentication, or analytics.
- Full asset pipeline (Blender/GLTF).
- Rewriting the visual style from PSX to photorealistic.
- `RENOVATION_PLAN.md` visual renovation; it stays manual/out of scope because the editor + seeds already cover it.
- ALPH0X Drone (explicitly discarded).

## Acceptance criteria (overall)

- UI quick wins (HUD, loading text, Esc close, focus, reduced motion).
- Ponytail cleanup complete: no unused `docs/js/` files or exports remain.
- `npm test` still passes and CI is green.
- `npm run typecheck` passes.
- Editor can save/load at least 3 local slots and produce a shareable base64 URL.
- AlphGPT opens on MacBook interaction, camera zooms to screen, terminal mode exits cleanly.
- AlphGPT can answer at least 3 state-aware questions correctly.
- Mobile touch controls allow basic move + look.
- In-game hover labels show furniture names.
- Editor has grid snap toggle that persists.
- PWA manifest and service worker are present.
- In-game and editor keyboard legends are accessible.
- Core furniture no longer looks like stacked boxes; AABB and seed round-trip preserved.
- Window view is a personalized Career Skyline instead of a generic city.
- Portfolio Tour runs a scripted path and opens panels at stops.
- Dynamic time of day adjusts lighting based on user's local time.
- Dynamic screen reflections render on MacBook/monitor/TV screens.
- Visual snapshots pass in CI for loading/start/room/editor/model-viewer.
- `AGENTS.md` is readable and useful to a new agent in one pass.
