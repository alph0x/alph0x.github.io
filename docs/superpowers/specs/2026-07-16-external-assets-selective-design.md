# External Selective Assets — Design Spec

> Scope: add a Tackle 3.0 point P-26 to the existing `portfolio-3d-hardening` plan. Implements Option A: replace only two procedural builders with external GLB models.

## Goal

Replace the two highest-impact procedural assets — Lulú (the mini-schnauzer) and the MacBook — with lightweight, free, CC0-compatible GLB models, while preserving the existing procedural fallback, the animation system, the PWA offline guarantee, and the test suite.

## Problem

Lulú and the MacBook are built from Three.js primitives. Lulú in particular is hard to read as a dog: a cube body, tapered cones for ears, and spheres for eyes. The MacBook reads as a laptop but has chunky proportions and no real screen detail. External low-poly models would improve silhouette and material separation at a low bundle cost.

## Context

- `docs/js/furniture/builders/mini-schnauzer.ts` builds Lulú from primitives; names `body`, `head`, `tail`, `earL`, `earR`, `eyebrowL`, `eyebrowR` are consumed by the pet animation system.
- `docs/js/furniture/builders/macbook.ts` builds a clamshell laptop; the `lidGroup` is the only animated/posed part, and `panelId`, `label`, `room` are used by the interaction system.
- `docs/js/furniture/registry.ts` maps furniture types to builder functions returning `{ mesh: THREE.Mesh | THREE.Group }` plus extra metadata.
- `docs/sw.js` precaches the app shell and opportunistically caches same-origin assets; external-origin CDN assets are not cached.
- `docs/js/systems/loading.ts` currently shows a fake progress bar. GLB loading is async, so the loading screen needs to wait for real asset readiness.
- All existing tests rely on deterministic, headless-friendly builders (happy-dom). GLB loading is file/network dependent and must be mocked or isolated behind a loader abstraction.

## Non-goals

- Do not convert every piece of furniture to GLB. Only Lulú and MacBook.
- Do not add external textures, audio, HDRI, or fonts as part of this point.
- Do not depend on third-party CDN assets. All external assets are vendored in the repo under `docs/assets/models/` so the PWA stays offline and deterministic.
- Do not change the PSX low-poly visual style. Models must remain low-poly and fit the existing room scale.
- Do not add a backend or asset pipeline.

## Proposed solution

### 1. Asset acquisition

Source two CC0/low-poly models from reputable free collections (e.g., Quaternius, Kenney, Sketchfab CC0, OpenGameArt). Selected models must:
- Be GLB/GLTF format (single self-contained file).
- Be under 200 KB each (preferably <100 KB).
- Have a permissive license (CC0 or CC-BY) with attribution tracked in `docs/assets/models/ATTRIBUTION.md`.
- Be low-poly (<2k triangles each).
- Fit the existing 1-unit ≈ 1-meter scale without extreme rescaling.

### 2. Loader abstraction

Introduce a tiny loader module `docs/js/assets/loader.ts` that:
- Wraps `THREE.GLTFLoader`.
- Loads from a root-relative path (`/assets/models/<name>.glb`).
- Returns a `Promise<THREE.Group>` and handles errors by rejecting.
- Can be mocked in tests by accepting an optional `fetch`-like `loadFile` injection or by exporting a synchronous `createMockGlb` helper.

### 3. Builder integration

Change `mini-schnauzer.ts` and `macbook.ts` from pure builders to **loader builders**:
- Export a `buildMiniSchnauzer(config)` that returns the procedural group synchronously (fallback, unchanged).
- Export a `loadMiniSchnauzer(config)` that returns `Promise<BuilderResult>` by loading the GLB, rescaling/posing it, and mapping animation-critical names to the imported scene graph.
- The registry keeps using the synchronous builder for the editor and test paths where the external asset is not loaded.
- The game boot path (`docs/js/game.ts` or a level builder) awaits the async loaders before showing the start screen.

### 4. Animation compatibility

For Lulú, the loaded GLB must expose named nodes or bones that the pet animator can drive. Two strategies:
- **Preferred:** rename or map the GLB nodes to the existing names (`body`, `head`, `tail`, `earL`, `earR`). This preserves `application/pet-animator.ts` without changes.
- **Fallback:** if the GLB has an armature, retarget the animation by reading the bones through the armature and applying rotations to the nearest named nodes.

For the MacBook, the GLB lid is likely a static mesh; the builder can simply pose it at `rotation.x = -Math.PI / 2 - 0.55` and add the screen glow plane as a child of the lid mesh.

### 5. PWA / Service Worker

- Add the two GLB paths to `SHELL_ASSETS` in `docs/sw.js` so they are precached.
- Bump `CACHE_NAME` to `alph0x-portfolio-v2` so the new shell is installed cleanly.
- Add a test that validates the GLB files are listed in `SHELL_ASSETS`.

### 6. Loading screen

- Replace the fake progress bar in `docs/js/systems/loading.ts` with a real progress tracker: total assets to load, assets loaded, percentage.
- Gate the start screen behind the Lulú + MacBook async load.
- Keep the existing 8-second safety timeout and click/space skip behavior, but the skip simply shows the start screen; if assets are not ready, the game must continue loading them in the background.

### 7. Testing strategy

- **Unit tests:** keep existing procedural-builder tests untouched. They remain fast and deterministic.
- **Loader tests:** add `tests/asset-loader.test.js` that mocks the GLB file with a small Three.js group and verifies the loader returns the parsed group, handles errors, and rescales correctly.
- **Integration tests:** add `tests/external-assets.test.js` that verifies the Lulú/MacBook loaders return the expected metadata (`label`, `panelId`, `room`) and that the loaded groups contain at least the expected root mesh count.
- **SW tests:** update `tests/manifest.test.js` (or create `tests/sw-assets.test.js`) to verify GLB files are in the `SHELL_ASSETS` array.
- **Visual regression:** the GLB-based snapshots will differ, so `test:visual:update` must be run after the implementation is stable. Baseline updates are expected.

## File-level plan

| File | Action | Reason |
|---|---|---|
| `docs/assets/models/lulu.glb` | Create | Vendored external model. |
| `docs/assets/models/macbook.glb` | Create | Vendored external model. |
| `docs/assets/models/ATTRIBUTION.md` | Create | License and source tracking. |
| `docs/js/assets/loader.ts` | Create | GLB loader abstraction + mock helper. |
| `docs/js/furniture/builders/mini-schnauzer.ts` | Modify | Add async loader; keep procedural builder as fallback. |
| `docs/js/furniture/builders/macbook.ts` | Modify | Add async loader; keep procedural builder as fallback. |
| `docs/js/furniture/registry.ts` | Modify | Optionally support async builder entries. |
| `docs/js/level/index.ts` | Modify | Await external asset loaders before instantiating room. |
| `docs/js/systems/loading.ts` | Modify | Replace fake progress with real load tracking. |
| `docs/sw.js` | Modify | Precache GLBs; bump cache version. |
| `tests/asset-loader.test.js` | Create | Loader unit tests. |
| `tests/external-assets.test.js` | Create | Integration tests for Lulú/MacBook loaders. |
| `tests/sw-assets.test.js` | Create | Verify SW precaches GLBs. |

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Model license is not actually CC0 | Only source from known collections; keep attribution file; if in doubt, fall back to procedural. |
| GLB breaks pet animation names | Map names on load; if mapping fails, fall back to procedural. |
| GLB is too large for GitHub Pages | Hard cap at 200 KB per model; compress with gltf-transform if needed. |
| Async loading breaks editor determinism | Editor uses the synchronous procedural builder; only the game uses async GLB. |
| Visual snapshots drift | Re-run `test:visual:update` once after implementation. |
| SW cache misses new assets | Add GLBs to `SHELL_ASSETS` and test it. |

## Acceptance criteria

- `docs/assets/models/lulu.glb` and `docs/assets/models/macbook.glb` exist and are listed in `ATTRIBUTION.md` with license.
- `npm run typecheck` passes.
- `npm test -- --run` passes, including new loader and SW tests.
- The game loads the two GLBs before showing the start screen; the loading screen reflects real progress.
- Lulú and MacBook are visible in the room with the external models.
- The PWA still works offline: GLBs are served from cache.
- `tests/external-assets.test.js` verifies the async loader returns metadata and meshes.
- `tests/sw-assets.test.js` verifies both GLBs are in `SHELL_ASSETS`.
- If the GLB load fails, the game silently falls back to the procedural builder.

## Open questions

- **Q-1 (RESOLVED):** Source from the best CC0/low-poly collections available at implementation time (Quaternius, Kenney, Sketchfab CC0). The selected models will be low-poly, under 200 KB, and license-compatible. Decision made by implementer based on design fit.
- **Q-2 (RESOLVED):** The editor stays procedural. The external GLB is loaded only in the game boot path.
- **Q-3 (RESOLVED):** The loader is generic (`loadGlb(path)` returns `Promise<THREE.Group>`) but minimal — no material pipeline, no animation mixer, no caching layer beyond the browser/SW.

## Alternatives considered

- **Option B — Full asset pipeline:** rejected for P-26 because it multiplies bundle size, SW complexity, and implementation time.
- **Option C — Hybrid with fallback:** partially adopted; the procedural builder remains the fallback, so offline/PWA behavior is preserved.
- **CDN instead of vendoring:** rejected because it breaks offline PWA and introduces availability risk.
