# Agent Operating Procedures

One-page onboarding for this repo.

## Project

Vanilla-JS + Three.js first-person portfolio: a single low-poly gamer room with an editor, seed serialization, a pet (Lulú), procedural audio, and a client-side assistant (AlphGPT).

## Must-run commands

```bash
node scripts/preflight-check.js   # before every mission
npm test -- --run                 # after every change
npm run typecheck                 # after TypeScript changes (once Point 4 lands)
```

## Key file map

```
docs/
├── index.html              # Shell, CSS, HUD, panels, CRT overlay
├── editor.html             # Room layout editor
├── model-viewer.html       # Furniture debugger
└── js/
    ├── app.js              # Entry point (bootstrap renderer + Game)
    ├── game.js             # Game orchestrator
    ├── core.js             # Pure domain: collision, movement, DEFAULT_SEED, ROOM_LAYOUT
    ├── seed.js             # Seed serialization v2 (base64 JSON)
    ├── editor.js           # Editor logic
    ├── editor-utils.js     # Pure geometry helpers (testable)
    ├── primitives.js       # Geometry helpers
    ├── assets/             # Textures + materials
    ├── renderer/           # Three.js bootstrap
    ├── systems/            # input, interaction, loading, audio, animation
    ├── level/              # Room geometry, window, cityscape, lighting
    └── furniture/          # Registry + builders (one file per item)
tests/                      # Vitest + happy-dom
```

## Conventions

- **Clean Architecture**: domain (`core.js`, `domain/`) has no framework imports. UI/Three.js live in outer layers.
- **Ponytail**: stdlib/native first, shortest diff, no speculative abstractions.
- **SRP**: one file per reason to change. Keep functions small.
- **Tests**: write the failing test first; never mark done without `npm test -- --run`.
- **No uncommitted drift**: run preflight; document or stash existing changes.
- **Decision log**: every non-obvious choice gets a `Decision: ... / Principle: ... / Trade-off: ...` entry.

## Active plan

See `docs/plans/portfolio-3d-hardening/` for the current Tackle initiative.

## Damage control

Stuck or off-mission? Stop editing, write `.missions/TURNOVER.md`, run preflight, ask for a fresh session.
