# Decisions — Portfolio 3D Hardening

## D1 — TypeScript build tool

- **Choice:** Vite for dev/build + `tsc --noEmit` for type checking.
- **Rationale:** Vite is native-ESM friendly, fast, and can still output a static `docs/` directory for Vercel. `tsc --noEmit` gives stricter checks without changing the output step.
- **Alternative rejected:** Plain `tsc` compile to `docs/js/` — slower and harder to keep source/output separation clean.

## D2 — UI quick wins

- **Choice:** Remove HP/MP HUD bars and change loading text to `LOADING...` as part of Point 1.
- **Rationale:** These are leftover shooter mechanics that no longer exist. Cleaning them up is a prerequisite before the bigger visual/quality pass.

## D3 — TypeScript depth

- **Choice:** Type every `docs/js/` file. Staged in multiple points; no file left as plain JS.
- **Rationale:** User wants a complete migration, but staged to keep tests green.

## D4 — Ponytail cleanup

- **Choice:** Delete unused files, inline trivial wrappers, and remove dead exports.
- **Rationale:** The audit found concrete dead code and over-engineering. Deleting it now makes the TypeScript migration smaller and the bundle lighter.
- **Files to delete:** `renderer/post-processing.js`, `renderer/psx-pass.js`, `level/decorations/*`, `furniture/builders/{kitchen,bathroom,fridge,mirror,sofa}.js`, `furniture/contract.js`, `test-calc-dims.mjs`.
- **Wrappers to inline:** `EditorErrorHandler`, `EditorSceneSetup` if only delegates, `UndoManager` arrays.

## D5 — Visual fidelity direction

- **Choice:** Medium-fidelity stylized direction. Stop building furniture as stacked boxes; use `RoundedBoxGeometry`, cylinders, spheres, extrusions, and deterministic pixel-art textures. Switch structures to `MeshStandardMaterial` with conservative PBR values.
- **Rationale:** The user wants a disruptive visual upgrade without going photorealistic. Medium fidelity keeps the stylized identity while making objects feel designed rather than blocky. It can be staged furniture-by-furniture.
- **Alternative rejected:** Low-poly only with current primitives — doesn't solve the "stacked boxes" problem. Photorealistic — too much scope and needs external assets.

## D6 — Dead post-processing

- **Choice:** Delete `renderer/post-processing.js` and `psx-pass.js` rather than wire them up.
- **Rationale:** The app renders directly in `game.js`. Re-enabling composer adds complexity for a visual style the current renderer already achieves. If a post-processing pass is needed later, it can be re-added from scratch.
- **Alternative rejected:** Keep files as "maybe later" — proven dead code from the audit.

## D7 — Legacy decorations and builders

- **Choice:** Delete, not archive.
- **Rationale:** They are not referenced by seed, editor, or game. Git history preserves them if needed.
- **Alternative rejected:** Move to `legacy/` folder — still ships and confuses agents.

## D8 — Career Skyline window view

- **Choice:** Replace the generic cityscape with a personalized "Career Skyline" where buildings represent Alfredo's career milestones, companies, and skills.
- **Rationale:** The user wants the window view to be less generic and more personal. A career skyline is unique, reinforces the portfolio narrative, and is fully procedural/seed-compatible.

## D9 — Playwright E2E

- **Choice:** Revive E2E with minimal smoke tests (`index.html` and `editor.html` load without console errors).
- **Rationale:** The user wants the project hardened with tests. A small smoke suite gives real browser coverage without the maintenance burden of the old 15-spec suite.

## D10 — Quality / visual style

- **Choice:** No separate quality presets. Keep the PSX low-poly style as the only aesthetic, but raise the default rendering quality (pixel ratio, shadow map, material fidelity) so the existing models look much better.
- **Rationale:** The user wants the current style, only optimized. Fewer settings means less UI and maintenance.

## D11 — Mobile experience

- **Choice:** Replace the static resume fallback with on-screen touch FPS controls (move + look).
- **Rationale:** The user explicitly wants a better mobile 3D experience. Degrade to static resume only if PointerLock/WebGL fails.

## D12 — Portfolio Tour

- **Choice:** Add a scripted spectator tour accessible from the start screen.
- **Rationale:** Gives first-time visitors a guided narrative experience without requiring them to know controls.

## D13 — Dynamic time of day

- **Choice:** Adjust room lighting based on user's local time, with deterministic fallback for snapshots.
- **Rationale:** Connects the portfolio to the real world and adds subtle life to the room.

## D14 — Dynamic screen reflections

- **Choice:** Use render targets to reflect the room/player on MacBook, monitor, and TV screens.
- **Rationale:** Visually disruptive and sells the "real laptop" feel for AlphGPT. Degrades gracefully on low-end devices.

## D15 — AlphGPT MacBook terminal mode

- **Choice:** Move AlphGPT from floating panel to the MacBook screen; camera zooms in on interaction.
- **Rationale:** The user wants the laptop to feel functional. This ties the assistant to a physical object and improves immersion.

## D16 — Seed URL format

- **Choice:** Base64 only, same as today.
- **Rationale:** Compact, backward-compatible, opaque is fine because the editor gives a visual representation.

## D17 — RENOVATION_PLAN.md

- **Choice:** Leave it manual and out of scope for this initiative.
- **Rationale:** The visual editor + seeds already let the user create new layouts; no need to hardcode more rooms.

## D18 — AGENTS.md

- **Choice:** Rewrite root `AGENTS.md` as a one-page agent brief; keep the original if the user wants, but the root file should be the single source of truth.
- **Rationale:** The current `AGENTS.md` is long and mixes multiple methodologies. A concise brief reduces onboarding friction.

## D19 — Additional features selected

- **Choice:** Include object labels, editor grid snap, lightweight PWA, and keyboard shortcut legends.
- **Rationale:** Low-effort, high-value features that fit the existing architecture without adding backends or major assets.
- **Rejected for now:** Photo mode and editor duplicate — keep as future ideas.

## D20 — ALPH0X Drone

- **Choice:** Discard the drone feature.
- **Rationale:** User explicitly asked to drop it after initial proposal.
