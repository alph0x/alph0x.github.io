# Agent Operating Procedures

> **Methodology: Tackle 3.0.** One-page onboarding for this repo. Plan-local rules live in `docs/plans/codebase-quality-pass/` (active) and `docs/plans/portfolio-3d-hardening/` (closed).

## Project

Vanilla-JS + Three.js first-person portfolio: a single low-poly gamer room with an editor, seed serialization, a pet (Lulú), procedural audio, and a client-side assistant (AlphGPT).

## Must-run commands

```bash
node scripts/preflight-check.js   # before every mission
npm test -- --run                 # after every change
npm run typecheck                 # after TypeScript changes
```

## Key file map

```
docs/
├── index.html              # Shell, CSS, HUD, panels, CRT overlay
├── editor.html             # Room layout editor
├── model-viewer.html       # Furniture debugger
└── js/
    ├── app.ts              # Entry point (bootstrap renderer + Game)
    ├── game.ts             # Game orchestrator
    ├── core.ts             # Pure domain: collision, movement, DEFAULT_SEED, ROOM_LAYOUT
    ├── seed.ts             # Seed serialization v2 (base64 JSON)
    ├── editor.ts           # Editor logic
    ├── editor-utils.ts     # Pure geometry helpers (testable)
    ├── primitives.ts       # Geometry helpers
    ├── assets/             # Textures + materials
    ├── renderer/           # Three.js bootstrap
    ├── systems/            # input, interaction, loading, audio, animation
    ├── level/              # Room geometry, window, cityscape, lighting
    └── furniture/          # Registry + builders (one file per item)
docs/plans/portfolio-3d-hardening/  # Tackle 3.0 plan
├── README.md               # Index and reading order
├── plan.md                 # Objective, points, acceptance criteria
├── board.md                # Canonical status board
├── points/                 # One self-contained briefing per point
├── log.md                  # Append-only session log
├── decisions.md            # Closed decisions (D-01 …)
├── questions.md            # Open questions
├── reference.md            # Current code state with file:line
├── design-contract.md      # Authoritative API/state/error surface
├── execution-strategy.md   # Waves + quality gate
└── AGENTS.md               # Plan-local workspace contract
tests/                      # Vitest + happy-dom
```

## Conventions

- **Clean Architecture**: domain (`core.ts`, `domain/`) has no framework imports. UI/Three.js live in outer layers.
- **Ponytail**: stdlib/native first, shortest diff, no speculative abstractions.
- **SRP**: one file per reason to change. Keep functions small.
- **Tests**: write the failing test first; never mark done without `npm test -- --run`.
- **No uncommitted drift**: run preflight; document or stash existing changes.
- **Decision log**: every non-obvious choice gets a `Decision: ... / Principle: ... / Trade-off: ...` entry.

## Active plan

See `docs/plans/codebase-quality-pass/` for the current Tackle initiative. Start with `README.md`, then `plan.md`, then `board.md`. The prior initiative `docs/plans/portfolio-3d-hardening/` is closed (26/26, verified 2026-07-18).

## Autonomy

**Autonomy level: L2 (assisted)**

- **L1 (report)** — read-only: status, resume, verification, grounding; never edits source.
- **L2 (assisted)** — default: propose a pre-attack summary and wait for confirmation before changing code; human checks Solo points.
- **L3 (unattended)** — no per-point confirmation, ONLY when ALL hold: upfront plan+execute intent recorded as a `D-xx`; the point is grounded, verified (no HIGH/MEDIUM findings), and inside its declared `Touches`; an independent checker and iteration budget apply; and the point touches no production path — production-path points cap at L2 unless waived by an explicit `D-xx`.

Per-point overrides live in `points/P-0N-*.md` (`Autonomy override`).

## Harness map

| Generic operation | Harness tool / command in this repo | Notes |
|---|---|---|
| Read code at `file:line` | `read` tool, `cat`, LSP hover | `read path:NN` or `read path:NN-MM` |
| Search code | `grep`, `ast_grep`, `lsp` references | Prefer `grep` for text, `ast_grep` for structure, `lsp` for symbol search |
| Run tests / done-signal | `npm test -- --run`, `npm run test:e2e`, `npm run test:visual` | Vitest + happy-dom; Playwright for E2E/visual |
| Run lint / typecheck | `npm run typecheck` (`tsc --noEmit`) | No separate lint script currently |
| Spawn parallel agents | `task` subagent | Use for independent multi-file work |
| Git operations | `git` CLI, GitHub Actions | `node scripts/preflight-check.js` before every mission |

## Damage control

Stuck or off-mission? Stop editing, write `.missions/TURNOVER.md`, run preflight, ask for a fresh session.
