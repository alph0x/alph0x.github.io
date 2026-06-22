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

## 2026-06-22 — Foundation started

- Point 1 complete: removed HP/MP HUD blocks, changed loading text to `LOADING...`, added click-outside-to-close, `:focus-visible`, and `prefers-reduced-motion` support. Added `tests/interaction.test.js` (5 tests). All 451 tests pass.
- Point 2 complete: refreshed `AGENTS.md` to a one-page onboarding brief.
- Moving to Point 3 (Ponytail cleanup).
